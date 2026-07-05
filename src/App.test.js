import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  addDoc,
  onSnapshot,
} from 'firebase/firestore';

// Lucide-react icons for a cleaner UI
import { Sparkle, BookOpen, PenTool, MessageSquare, Clock, X, Volume2, User, Bot } from 'lucide-react';

export default function App() {
  // State for the diary entry text input
  const [diaryEntry, setDiaryEntry] = useState('');
  // State to hold all chat history and diary entries
  const [chatHistory, setChatHistory] = useState([]);
  // State to manage loading status for API calls
  const [isLoading, setIsLoading] = useState(false);
  // State for error handling
  const [error, setError] = useState(null);
  // State to track Firebase authentication readiness
  const [isAuthReady, setIsAuthReady] = useState(false);
  // State for the current user's ID
  const [userId, setUserId] = useState(null);
  // State for custom modal alerts
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  // State to toggle the mobile menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Ref for auto-scrolling the chat messages
  const chatMessagesRef = useRef(null);
  // Refs for Firebase services to prevent re-initialization
  const dbRef = useRef(null);
  const authRef = useRef(null);

  // Default voice configuration for TTS
  const voiceConfig = {
    prebuiltVoiceConfig: {
      voiceName: "Algieba", // A smooth and clear voice
    },
  };

  /**
   * Closes the custom modal alert.
   */
  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalMessage('');
  };

  /**
   * Initializes Firebase services and handles user authentication.
   * This effect runs only once when the component mounts.
   */
  useEffect(() => {
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    if (Object.keys(firebaseConfig).length > 0) {
      try {
        const app = initializeApp(firebaseConfig);
        dbRef.current = getFirestore(app);
        authRef.current = getAuth(app);
      } catch (e) {
        console.error("Error initializing Firebase:", e);
        setError("Failed to initialize the app. Please try again later.");
        return;
      }
    }

    const unsubscribe = onAuthStateChanged(authRef.current, async (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(authRef.current, initialAuthToken);
          } else {
            await signInAnonymously(authRef.current);
          }
        } catch (e) {
          console.error("Firebase Auth Error:", e);
          setError("Authentication failed. Please check your connection.");
        }
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Sets up a real-time listener for the chat history in Firestore.
   * This effect runs when the auth state is ready and the userId is available.
   */
  useEffect(() => {
    if (!dbRef.current || !userId || !isAuthReady) {
      return;
    }

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const memoriesCollection = collection(dbRef.current, `artifacts/${appId}/users/${userId}/chatHistory`);
    const chatQuery = query(memoriesCollection);

    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      const newChatHistory = [];
      snapshot.forEach((doc) => {
        newChatHistory.push({ id: doc.id, ...doc.data() });
      });
      // Sort in memory by timestamp to avoid Firestore index issues
      newChatHistory.sort((a, b) => a.timestamp - b.timestamp);
      setChatHistory(newChatHistory);
    }, (e) => {
      console.error("Error getting real-time chat history:", e);
      setError("Failed to load your chat history. Please try again.");
    });

    return () => unsubscribe();
  }, [userId, isAuthReady]);

  /**
   * Scrolls the chat view to the bottom whenever a new message is added.
   */
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatHistory]);

  /**
   * Submits a new diary entry and triggers an AI response.
   */
  const handleEntrySubmit = async () => {
    if (!diaryEntry.trim()) {
      setModalMessage("Please write something in your diary entry before submitting.");
      setIsModalOpen(true);
      return;
    }

    if (!userId) {
      setModalMessage("User not authenticated. Please wait a moment and try again.");
      setIsModalOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    const memoryDoc = {
      timestamp: Date.now(),
      text: diaryEntry,
      isUser: true,
    };

    try {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const memoriesCollection = collection(dbRef.current, `artifacts/${appId}/users/${userId}/chatHistory`);
      await addDoc(memoriesCollection, memoryDoc);
      
      const newPrompt = `Here is a new diary entry from me: "${diaryEntry}". Based on this and our past conversations, please respond like a supportive, wise friend. Tell me what you think, ask a follow-up question, or help me reflect on what I've written. The entry is about: ${diaryEntry}.`;

      // Call the Gemini API to get an AI response
      const aiResponse = await generateTextResponse(newPrompt);
      const aiResponseDoc = {
        timestamp: Date.now() + 1, // Ensure the AI response appears after the entry
        text: aiResponse,
        isUser: false,
      };

      // Save the AI's response to Firestore
      await addDoc(memoriesCollection, aiResponseDoc);
      
      // Clear the entry field
      setDiaryEntry('');

    } catch (e) {
      console.error("Error with entry submission or AI response:", e);
      setError("Failed to save entry or get a response. Please try again.");
      setModalMessage("Failed to save entry or get a response. Please try again.");
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Generates a summary of past memories using the Gemini API.
   */
  const handleMemoryRecall = async () => {
    if (!userId) {
      setModalMessage("User not authenticated. Please wait a moment and try again.");
      setIsModalOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const allEntriesText = chatHistory
      .filter(m => m.isUser)
      .map(m => `- ${m.text}`)
      .join('\n');
    
    if (allEntriesText.length < 50) {
      setModalMessage("You need to have more diary entries to recall memories from. Keep writing!");
      setIsModalOpen(true);
      setIsLoading(false);
      return;
    }

    const recallPrompt = `Based on the following diary entries, can you act as a memory coach and summarize some key themes, events, or feelings? This is for my personal reflection. Please keep it concise and insightful. Here are my entries:\n\n${allEntriesText}`;
    
    try {
      const summaryResponse = await generateTextResponse(recallPrompt);
      const aiResponseDoc = {
        timestamp: Date.now() + 1,
        text: summaryResponse,
        isUser: false,
        isRecall: true, // Flag for specific recall messages
      };

      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const memoriesCollection = collection(dbRef.current, `artifacts/${appId}/users/${userId}/chatHistory`);
      await addDoc(memoriesCollection, aiResponseDoc);
      
      setModalMessage("Your memories have been recalled and added to the chat!");
      setIsModalOpen(true);
      
    } catch (e) {
      console.error("Error recalling memories:", e);
      setError("Failed to recall memories. Please try again.");
      setModalMessage("Failed to recall memories. Please try again.");
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Calls the Gemini API to generate a text response.
   * @param {string} prompt The user's prompt.
   * @returns {Promise<string>} The AI's response text.
   */
  const generateTextResponse = async (prompt) => {
    let responseText = "I'm sorry, I couldn't generate a response. Please try again.";
    
    const chatMessagesToSend = chatHistory.map(m => ({
      role: m.isUser ? "user" : "model",
      parts: [{ text: m.text }]
    }));
    chatMessagesToSend.push({ role: "user", parts: [{ text: prompt }] });

    const payload = { contents: chatMessagesToSend };
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    let retries = 0;
    while (retries < 3) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`API call failed with status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
          responseText = result.candidates[0].content.parts[0].text;
          break; // Success, exit the retry loop
        } else {
          throw new Error("Invalid API response format");
        }
      } catch (e) {
        console.error(`Attempt ${retries + 1} failed:`, e);
        retries++;
        if (retries < 3) {
          await new Promise(res => setTimeout(res, Math.pow(2, retries) * 1000)); // Exponential backoff
        }
      }
    }
    return responseText;
  };
  
  /**
   * Generates and plays audio for a given text using the TTS API.
   * @param {string} textToSpeak The text to be converted to speech.
   */
  const speakText = async (textToSpeak) => {
    setIsLoading(true);
    
    const payload = {
      contents: [{
        parts: [{ text: textToSpeak }],
      }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: voiceConfig,
        },
      },
      model: "gemini-2.5-flash-preview-tts",
    };

    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`TTS API call failed with status: ${response.status}`);
      }
      
      const result = await response.json();
      const part = result?.candidates?.[0]?.content?.parts?.[0];
      const audioData = part?.inlineData?.data;
      const mimeType = part?.inlineData?.mimeType;

      if (audioData && mimeType && mimeType.startsWith("audio/")) {
        const match = mimeType.match(/rate=(\d+)/);
        const sampleRate = match ? parseInt(match[1], 10) : 16000;
        const pcmData = Uint8Array.from(atob(audioData), c => c.charCodeAt(0)).buffer;
        const pcm16 = new Int16Array(pcmData);

        const wavBlob = pcmToWav(pcm16, sampleRate);
        const audioUrl = URL.createObjectURL(wavBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      } else {
        throw new Error("Invalid TTS API response format or no audio data.");
      }
    } catch (e) {
      console.error("Error generating or playing TTS:", e);
      setModalMessage("Failed to play audio. Please try again.");
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Converts raw PCM audio data to a WAV file blob.
   * @param {Int16Array} pcmData The PCM audio data.
   * @param {number} sampleRate The sample rate of the audio.
   * @returns {Blob} The WAV audio blob.
   */
  const pcmToWav = (pcmData, sampleRate) => {
    const buffer = new ArrayBuffer(44 + pcmData.length * 2);
    const view = new DataView(buffer);

    function writeString(view, offset, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }

    let offset = 0;
    writeString(view, offset, 'RIFF'); offset += 4;
    view.setUint32(offset, 36 + pcmData.length * 2, true); offset += 4;
    writeString(view, offset, 'WAVE'); offset += 4;
    writeString(view, offset, 'fmt '); offset += 4;
    view.setUint32(offset, 16, true); offset += 4;
    view.setUint16(offset, 1, true); offset += 2;
    view.setUint16(offset, 1, true); offset += 2; // channel count
    view.setUint32(offset, sampleRate, true); offset += 4;
    view.setUint32(offset, sampleRate * 2, true); offset += 4; // byte rate
    view.setUint16(offset, 2, true); offset += 2; // block align
    view.setUint16(offset, 16, true); offset += 2; // bits per sample
    writeString(view, offset, 'data'); offset += 4;
    view.setUint32(offset, pcmData.length * 2, true); offset += 4;

    for (let i = 0; i < pcmData.length; i++) {
      view.setInt16(offset, pcmData[i], true);
      offset += 2;
    }

    return new Blob([view], { type: 'audio/wav' });
  };


  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans antialiased">
      {/* Header with Title and Mobile Menu */}
      <header className="flex items-center justify-between p-4 bg-gray-800 shadow-md sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <BookOpen className="text-pink-400" size={28} />
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">Living Diary</h1>
        </div>
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-gray-700 transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu">
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>
        </div>
        {/* Desktop and Mobile Menu */}
        <nav className={`md:flex items-center space-x-4 ${isMenuOpen ? 'flex flex-col absolute top-16 right-4 bg-gray-800 p-4 rounded-lg shadow-xl' : 'hidden'}`}>
          <button
            onClick={handleMemoryRecall}
            disabled={isLoading || chatHistory.filter(m => m.isUser).length < 2}
            className="flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Clock size={20} />
            <span className="font-medium">Recall Memories</span>
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden p-4 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        {/* Diary Writing Panel */}
        <div className="bg-gray-800 rounded-2xl shadow-xl p-6 flex flex-col w-full md:w-1/2 lg:w-1/3 space-y-4">
          <div className="flex items-center space-x-3 text-pink-400">
            <PenTool size={24} />
            <h2 className="text-2xl font-semibold">Write Your Entry</h2>
          </div>
          <textarea
            className="flex-1 bg-gray-700 text-gray-200 p-4 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200 resize-none"
            placeholder="How was your day? What's on your mind? The more you share, the better I can understand you..."
            value={diaryEntry}
            onChange={(e) => setDiaryEntry(e.target.value)}
            rows={10}
          ></textarea>
          <button
            onClick={handleEntrySubmit}
            disabled={isLoading || !diaryEntry.trim()}
            className="flex items-center justify-center space-x-2 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <Sparkle size={20} />
                <span>Submit Entry & Talk</span>
              </>
            )}
          </button>
        </div>

        {/* Chat / Memories Panel */}
        <div className="bg-gray-800 rounded-2xl shadow-xl p-6 flex-1 flex flex-col space-y-4 w-full md:w-1/2 lg:w-2/3">
          <div className="flex items-center space-x-3 text-purple-400">
            <MessageSquare size={24} />
            <h2 className="text-2xl font-semibold">Your Conversations</h2>
          </div>
          {userId && (
            <p className="text-sm text-gray-500 break-words font-mono">
                User ID: {userId}
            </p>
          )}
          <div ref={chatMessagesRef} className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <BookOpen size={48} className="mb-2" />
                <p>Your diary is empty. Start by writing your first entry!</p>
              </div>
            ) : (
              chatHistory.map((memory, index) => (
                <div key={index} className={`flex ${memory.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-md p-4 rounded-2xl shadow-lg transition-all duration-300 ease-in-out ${
                      memory.isUser
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                        : 'bg-gray-700 text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-light text-gray-400">
                          {memory.isUser ? 'You' : (memory.isRecall ? 'Memory Coach' : 'Living Diary AI')}
                        </p>
                        {!memory.isUser && (
                          <button onClick={() => speakText(memory.text)} className="p-1 rounded-full hover:bg-gray-600 transition-colors">
                            <Volume2 size={16} />
                          </button>
                        )}
                    </div>
                    <p className="whitespace-pre-wrap">{memory.text}</p>
                    <p className="text-xs text-gray-400 mt-2 text-right">
                      {new Date(memory.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Custom Modal for Alerts */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 shadow-2xl max-w-sm w-full border border-gray-700 transform transition-all scale-100 animate-fade-in">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-red-400">Error</h3>
              <button onClick={handleModalClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <p className="text-gray-300 text-lg">
              {modalMessage}
            </p>
            <button
              onClick={handleModalClose}
              className="mt-6 w-full py-3 rounded-full bg-red-600 hover:bg-red-700 transition-all duration-300 ease-in-out font-bold shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80 z-50">
          <div className="flex items-center space-x-3 text-pink-400 animate-pulse">
            <Sparkle size={32} />
            <p className="text-xl font-bold">Thinking...</p>
          </div>
        </div>
      )}
    </div>
  );
}
