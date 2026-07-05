from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import json
import re
from threading import Thread
import requests
import logging
import tempfile
import urllib.parse

# --- Cloud & AI Imports ---
import firebase_admin
from firebase_admin import credentials, firestore, storage
from google import genai
from google.genai import types

# --- Load Environment Variables ---
load_dotenv()

# --- Logging Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- API Keys & Cloud Configuration ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
FIREBASE_STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not found in .env file.")

# --- Initialize AI and Firebase Services ---
# Initialize the NEW Google GenAI Client
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

try:
    if os.getenv('GOOGLE_APPLICATION_CREDENTIALS'):
        cred = credentials.ApplicationDefault()
    else:
        cred = credentials.Certificate('serviceAccountKey.json')

    firebase_admin.initialize_app(cred, {
        'storageBucket': FIREBASE_STORAGE_BUCKET
    })
    db = firestore.client()
    bucket = storage.bucket()
    logging.info("Firebase Admin SDK initialized successfully.")
except Exception as e:
    logging.error(f"Firebase Admin SDK initialization error. Check credentials. {e}")
    db = None
    bucket = None

# --- Flask App Setup ---
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# --- Utility Functions ---
def parse_json_from_string(text):
    match = re.search(r'```json\s*([\s\S]*?)\s*```', text)
    if match:
        text = match.group(1)
    text = text.strip().replace("`", "")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        logging.warning(f"Failed to decode JSON from text: {text}")
        return None

def generate_gemini_text(prompt, system_message="You are a helpful assistant."):
    try:
        response = gemini_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_message,
            )
        )
        return response.text.strip()
    except Exception as e:
        logging.error(f"Gemini text generation error: {e}")
        return ""

def transcribe_audio_from_url(audio_url: str) -> str:
    """Downloads audio and transcribes it using the new Gemini SDK."""
    try:
        logging.info(f"Downloading audio from {audio_url}")
        audio_response = requests.get(audio_url)
        audio_response.raise_for_status()
        
        # Save temp file for Gemini to process
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
            temp_audio.write(audio_response.content)
            temp_audio_path = temp_audio.name
            
        # Upload and Transcribe via new Gemini client
        audio_file = gemini_client.files.upload(file=temp_audio_path)
        
        response = gemini_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=["Transcribe this audio file accurately. Return ONLY the transcribed text without any extra formatting, markdown, or comments.", audio_file]
        )
        
        # Cleanup
        os.remove(temp_audio_path)
        gemini_client.files.delete(name=audio_file.name)
        
        logging.info(f"Successfully transcribed audio from {audio_url}")
        return response.text.strip()
    except Exception as e:
        logging.error(f"Failed to transcribe audio via Gemini: {e}", exc_info=True)
        return ""

# --- Worker Functions ---
def process_story_generation(user_id, entries, character_profile, story_context, language):
    """Processes text, audio, and generates Manga-style images using a Fallback API for Hackathon."""
    if not db:
        logging.error("Database connection missing. Aborting story generation.")
        return

    for entry in entries:
        try:
            entry_text = ""
            if entry.get('type') == 'voice' and entry.get('audioUrl'):
                entry_text = transcribe_audio_from_url(entry['audioUrl'])
                if not entry_text: continue
            else:
                entry_text = entry.get('text', '')
            
            script_system = "You are a scriptwriter. Return ONLY a single JSON object with a 'narrative' key."
            script_prompt = f"Based on this diary entry, create a single, short, evocative narrative in English.\nEntry: '{entry_text}'"
            
            response_text = generate_gemini_text(script_prompt, system_message=script_system)
            parsed_result = parse_json_from_string(response_text)

            english_narrative = parsed_result.get("narrative", entry_text) if parsed_result else entry_text

            final_narrative = english_narrative
            if language == 'hindi':
                final_narrative = generate_gemini_text(f"Translate to simple Hindi. Return ONLY the translation: '{english_narrative}'")
            elif language == 'marathi':
                final_narrative = generate_gemini_text(f"Translate to simple Marathi. Return ONLY the translation: '{english_narrative}'")
            elif language == 'hinglish':
                hindi_text = generate_gemini_text(f"Translate to Hindi: '{english_narrative}'")
                final_narrative = generate_gemini_text(f"Transliterate to Latin alphabet. Return ONLY the transliterated text: '{hindi_text}'")

            panel_id = f"{entry['id']}-0"
            
            # --- IMAGE GENERATION (Hackathon Manhwa/Webtoon API) ---
            image_url = ""
            try:
                logging.info(f"Generating manhwa panel for {panel_id}...")
                
                # 1. Base Character Description (Manhwa Protagonist Vibe)
                # Ise tu apne hisaab se customize kar sakta hai
                char_desc = "A stylish young male manhwa protagonist with neat dark hair, sharp eyes, wearing modern casual streetwear, subtle glowing aura"
                
                # 2. The Advanced Manhwa Layout Prompt
                # Force full-color, Solo Leveling/Webtoon digital art aesthetics
                image_prompt = f"A single vertical full-color Korean manhwa webtoon panel. {char_desc}. High-quality digital painting, vibrant colors, dramatic lighting, Solo Leveling art style, epic cinematic composition. Include manhwa style dialogue bubbles. The scene shows: {english_narrative}. Masterpiece webtoon illustration."
                
                # 3. URL Encoding
                encoded_prompt = urllib.parse.quote(image_prompt)
                
                # Keeping the vertical aspect ratio (768x1024) which is perfect for scrolling webtoons
                fallback_api_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=768&height=1024&nologo=true"
                
                image_url = fallback_api_url
                logging.info(f"Using direct image URL for frontend: {image_url}")
                
            except Exception as e:
                logging.error(f"Image generation failed for {panel_id}: {e}")
                image_url = "ERROR_GENERATING_IMAGE"

            # Save the final panel to Firestore
            final_panel = {
                "panelId": panel_id,
                "narrative": final_narrative.strip(),
                "timestamp": entry.get("timestamp"),
                "imageUrl": image_url 
            }
            
            story_doc_ref = db.collection('users').document(user_id).collection('story').document('main_story')
            story_doc_ref.set({'panels': firestore.ArrayUnion([final_panel])}, merge=True)
            logging.info(f"Successfully saved panel {panel_id} to database with Image.")

        except Exception as e:
            logging.error(f"Processing failed for entry {entry['id']}: {str(e)}")

# --- Routes ---
@app.route("/generate_story_panels", methods=["POST"])
def generate_story_panels():
    try:
        data = request.json
        user_id = data.get("userId")
        new_entries = data.get("entries")
        if not new_entries or not user_id:
            return jsonify({"error": "Missing user ID or entries"}), 400

        Thread(target=process_story_generation, args=(
            user_id, new_entries, data.get("character_profile", "A person"), 
            data.get("story_context", ""), data.get("language", "english").lower()
        )).start()

        return jsonify({"message": "Text and Image story generation started."}), 202
    except Exception:
        return jsonify({"error": "Failed to start"}), 500

@app.route("/transcribe", methods=["POST"])
def transcribe():
    try:
        audio_url = request.json.get("audioUrl")
        if not audio_url: return jsonify({"error": "audioUrl missing"}), 400
        transcribed_text = transcribe_audio_from_url(audio_url)
        return jsonify({"text": transcribed_text}) if transcribed_text else (jsonify({"error": "Transcription failed"}), 500)
    except Exception:
        return jsonify({"error": "Internal error"}), 500

@app.route("/ask", methods=["POST"])
def ask():
    try:
        data = request.json
        prompt = data.get("prompt")
        entries = data.get("entries", [])

        if not prompt: return jsonify({"error": "Prompt missing"}), 400

        diary_context_parts = []
        for entry in entries:
            if entry.get('type') == 'voice' and entry.get('audioUrl'):
                text = transcribe_audio_from_url(entry['audioUrl'])
                if text: diary_context_parts.append(f"- Voice entry: '{text}'")
            elif entry.get('text'):
                 diary_context_parts.append(f"- Text entry: '{entry.get('text')}'")
        
        diary_context = "\n".join(diary_context_parts) or "No diary entries available."
        
        system_prompt = f"""You are the user's past self, a warm, empathetic diary assistant.
        - Help the user reflect on their diary entries.
        - NEVER introduce yourself as an AI. Stay in character.
        - Keep responses concise and natural.
        
        --- Relevant Diary Entries ---
        {diary_context}
        """
        
        response_text = generate_gemini_text(prompt, system_message=system_prompt)
        return jsonify({"response": response_text}), 200
    except Exception:
        return jsonify({"error": "Processing failed"}), 500

@app.route("/", methods=["GET"])
def home():
    return "Living Diary Backend is active."

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))