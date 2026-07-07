# 📖 The Living Diary - Your Life, Your Manga

![Project Status](https://img.shields.io/badge/Status-Live-success)
![Frontend](https://img.shields.io/badge/Frontend-React.js-blue)
![Backend](https://img.shields.io/badge/Backend-Node.js-green)
![AI](https://img.shields.io/badge/AI-Gemini_1.5_Pro_%7C_Vertex_AI-orange)
![Deployment](https://img.shields.io/badge/Deployed_on-Firebase_%7C_Render-yellow)

## 🚀 The Vision

We live in an era of cheap dopamine where deep self-reflection is rare. Traditional journaling feels like a chore because it's a static, one-sided interaction—you write, and the page just stares back. **The Living Diary** fixes this. It’s a gamified journaling app that doesn’t just store your entries; it actively reads, remembers, and talks back to you using your own history.

Unlike generic AI bots that offer surface-level advice, the AI inside this app has access to your long-term personal context. If you write, *"I'm scared about my exam tomorrow,"* it scans your past and replies, *"You felt the same way on March 12th, but you faced it and scored an A. You can do it again."* It literally feels like talking to a wiser version of yourself.

## ✨ Key Features

- **🧠 Hyper-Personalized Chat:** Powered by Google Gemini 1.5 Pro and Vector Search, the diary remembers your past entries and uses them to provide data-backed emotional support.
- **🎨 Manga Story Mode:** To kill "journaling fatigue," every daily entry generates a serialized Manga/Manhwa panel using Vertex AI Imagen. Your daily real-life struggles become plot points, turning you into the protagonist of your own graphic novel.
- **🎙️ Ambient Voice Mode:** For days when typing is too much friction, simply turn on Voice Mode. The app passively records your thoughts in the background and auto-drafts a perfectly formatted entry by the evening.

## 🏗️ System Architecture & Tech Stack

- **Frontend:** React.js (Hosted on Firebase)
- **Backend:** Node.js & Express (Hosted on Render)
- **AI Models:** Google Gemini 1.5 Pro (Conversational Memory) & Vertex AI Imagen (Image Generation)
- **Database & Retrieval:** Firebase Firestore & Google Cloud Vector Search

## ⚙️ Local Setup & Installation

Follow these steps to run the project locally on your machine.

### 1. Clone the Repository
```bash
git clone [https://github.com/efx-143/living-diary-h2s.git](https://github.com/efx-143/living-diary-h2s.git)
cd living-diary-h2s

```

### 2. Install Dependencies

```bash
# For Frontend
npm install

# For Backend (if applicable in the same repo)
cd backend
npm install

```

### 3. Environment Variables Setup

Create a `.env` file in the root directory. **Never commit this file to GitHub.** Add the following keys:

```env
REACT_APP_GEMINI_API_KEY=your_google_gemini_api_key_here
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_BACKEND_URL=your_render_backend_url

```

### 4. Run the Application

```bash
npm start

```

## ⚠️ Important Note Regarding Deployment

The backend of this application is deployed on Render's free tier. As a result, the server may spin down after a period of inactivity. When you make your first request (like saving an entry or chatting), it might take **30-50 seconds** for the backend to wake up. Subsequent requests will be instantaneous.

## 🏆 Acknowledgements

Created for the **Google Cloud & Hack2Skill Gen AI Academy Hackathon**.
Built with ❤️ by Sanyam Chavan.

```
