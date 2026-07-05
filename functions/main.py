from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import google.generativeai as genai

# ✅ Load environment variables from .env file
load_dotenv()

# ✅ Debug print to confirm key is loaded
print("GOOGLE_API_KEY:", os.getenv("GOOGLE_API_KEY"))

# ✅ Configure Gemini with your API key
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# ✅ Flask setup
app = Flask(__name__)
CORS(app)

# Optional route to check if backend is running
@app.route("/", methods=["GET"])
def home():
    return "Gemini backend is running!"

# Main route to generate response from Gemini
@app.route("/ask", methods=["POST"])
def ask():
    try:
        prompt = request.json.get("prompt")
        if not prompt:
            return jsonify({"error": "Prompt not provided"}), 400

        model = genai.GenerativeModel(model_name="gemini-2.0-flash")
        response = model.generate_content(prompt)
        return jsonify({"response": response.text})

    except Exception as e:
        print("Gemini error:", str(e))
        return jsonify({"error": str(e)}), 500

# Run the server
if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')

    
