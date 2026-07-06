return <h1>HELLO WORLD</h1>;
import React, { useEffect, useState } from "react";
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, getDoc, query, orderBy } from "firebase/firestore";
import { initAuth, db } from "./services/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"; 
import { v4 as uuidv4 } from 'uuid';
import { syncOfflineEntries } from "./services/sync";
import { getCachedStoryData, cacheStoryData } from './services/imageStore';

// --- App Components ---
import UserNameModal from "./components/UserNameModal";
import StoryView from "./components/StoryView";
import DiaryList from "./components/DiaryList";
import ChatInterface from "./components/ChatInterface";
import Header from "./components/Header";
import SideDrawer from "./components/SideDrawer";
import Settings from "./components/Settings";
import About from "./components/About";
import NewEntryModal from "./components/NewEntryModal";
import AppLockScreen from "./components/AppLockScreen";

// --- New Intro/Tutorial Components ---
import WelcomeIntro from "./components/WelcomeIntro";
import Tutorial from "./components/Tutorial";
import { getPersistentValue, setPersistentValue } from "./services/storage";

export default function App() {
  // --- State Management ---
  const [theme, setThemeState] = useState('dark'); // --- FIX --- Added the missing '=' sign
  const [language, setLanguageState] = useState('english');
  const [userId, setUserId] = useState(null);
  const [userName, setUserNameState] = useState(null);
  const [entries, setEntries] = useState([]);
  const [storyData, setStoryData] = useState({ panels: [], loadingMessage: '' });
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [currentView, setCurrentView] = useState('diary');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [pinHash, setPinHash] = useState(null);
  const [isLocked, setIsLocked] = useState(true); 

  const storage = getStorage();

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    setPersistentValue("theme", newTheme);
  };
  const setLanguage = (newLang) => {
    setLanguageState(newLang);
    setPersistentValue("language", newLang);
  };
  const setUserName = (name) => {
    setUserNameState(name);
    setPersistentValue("userName", name);
  };

  useEffect(() => {
    const loadSettings = async () => {
      const savedTheme = await getPersistentValue("theme") || 'dark';
      const savedLanguage = await getPersistentValue("language") || 'english';
      const savedUserName = await getPersistentValue("userName");
      const hasViewedTutorial = await getPersistentValue("hasViewedTutorial");

      setThemeState(savedTheme);
      setLanguageState(savedLanguage);
      if (savedUserName) setUserNameState(savedUserName);
      if (!hasViewedTutorial) setShowIntro(true);

      const savedPinHash = await getPersistentValue("pinHash");
      if (savedPinHash) {
        setPinHash(savedPinHash);
        setIsLocked(true); 
      } else {
        setIsLocked(false); 
      }
    };
    loadSettings();
    initAuth(setUserId);
  }, []);

  useEffect(() => {
    document.documentElement.className = theme;
    if (theme === 'oled') {
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (!userId) return;

    syncOfflineEntries(userId);

    const entriesColRef = collection(db, `users/${userId}/entries`);
    const unsubEntries = onSnapshot(entriesColRef, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => b.timestamp - a.timestamp);
      setEntries(list);
    });

    const storyDocRef = doc(db, `users/${userId}/story/main_story`);
    const unsubStory = onSnapshot(storyDocRef, async (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const sortedPanels = data.panels.sort((a, b) => a.timestamp - b.timestamp);
            const storyWithPanels = { panels: sortedPanels };
            setStoryData(storyWithPanels);
            await cacheStoryData(storyWithPanels);
        } else {
            const cachedStory = await getCachedStoryData();
            if (cachedStory) setStoryData(cachedStory);
        }
    });
    
    const chatColRef = collection(db, `users/${userId}/chatMessages`);
    const chatQuery = query(chatColRef, orderBy("timestamp", "asc"));
    const unsubChat = onSnapshot(chatQuery, (snap) => {
      const messages = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChatMessages(messages);
    });

    return () => {
      unsubEntries();
      unsubStory();
      unsubChat();
    };
  }, [userId]);

  const handleStartTutorial = () => {
    setShowIntro(false);
    setShowTutorial(true);
  };

  const handleFinishTutorial = () => {
    setShowTutorial(false);
    setPersistentValue("hasViewedTutorial", "true");
  };

  const handleSaveEntry = async (entryData) => {
    const { type, content, imageFile } = entryData;
    
    if (!userId) return;

    if (type === 'voice') {
      const audioBlob = content;
      const uniqueId = uuidv4();
      const storageRef = ref(storage, `users/${userId}/voice-entries/${uniqueId}.webm`);

      try {
        const snapshot = await uploadBytes(storageRef, audioBlob);
        const downloadURL = await getDownloadURL(snapshot.ref);
        const entry = { 
          type: 'voice', 
          audioUrl: downloadURL, 
          timestamp: Date.now(), 
          user: userName 
        };
        await addDoc(collection(db, `users/${userId}/entries`), entry);

      } catch (error) {
        console.error("Error uploading voice entry:", error);
      }
    } else if (type === 'text') {
      let imageUrl = null;
      try {
        if (imageFile) {
          const uniqueId = uuidv4();
          const imageRef = ref(storage, `users/${userId}/entry-images/${uniqueId}.jpg`);
          const snapshot = await uploadBytes(imageRef, imageFile);
          imageUrl = await getDownloadURL(snapshot.ref);
        }

        const entry = { 
          type: 'text', 
          text: content, 
          timestamp: Date.now(), 
          user: userName,
          ...(imageUrl && { imageUrl: imageUrl })
        };
        await addDoc(collection(db, `users/${userId}/entries`), entry);

      } catch (error) {
        console.error("Error saving text entry:", error);
      }
    }
    
    setIsNewEntryModalOpen(false);
  };

  const handleDeleteEntry = async (entryId) => {
    if (window.confirm("Are you sure?")) await deleteDoc(doc(db, `users/${userId}/entries`, entryId));
  };

  const handleUpdateEntry = async (entryToUpdate) => {
    await updateDoc(doc(db, `users/${userId}/entries`, entryToUpdate.id), { text: entryToUpdate.text });
  };
  
  const handleSendMessage = async (promptText) => {
    if (!promptText.trim() || !userId) return;
    setThinking(true);
    
    const userMessage = { sender: 'user', text: promptText, timestamp: Date.now() };
    await addDoc(collection(db, `users/${userId}/chatMessages`), userMessage);

    const stopWords = new Set(['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'to', 'from', 'in', 'out', 'on']);
    const keywords = promptText.toLowerCase().split(/\s+/).filter(word => !stopWords.has(word) && word.length > 2);
    let contextEntries = [];
    if (keywords.length > 0) {
      contextEntries = entries.filter(entry => {
        const entryText = entry.text ? entry.text.toLowerCase() : '';
        return keywords.some(keyword => entryText.includes(keyword));
      });
    }
    if (contextEntries.length === 0) contextEntries = entries.slice(0, 5);

    try {
      const response = await fetch("https://living-diary-h2s.onrender.com/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText, entries: contextEntries, userName: userName }),
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      const aiMessage = { sender: 'ai', text: data.response, timestamp: Date.now() };
      await addDoc(collection(db, `users/${userId}/chatMessages`), aiMessage);

    } catch (error) {
      console.error("Chat send message error:", error);
      const errorMessageText = error.message.includes("Failed to fetch") 
        ? "I can't seem to connect right now. Please check your internet connection."
        : "Sorry, I'm having a little trouble thinking. Please try again later.";
      const errorMessage = { sender: 'ai', text: errorMessageText, timestamp: Date.now() };
      await addDoc(collection(db, `users/${userId}/chatMessages`), errorMessage);
    } finally {
      setThinking(false);
    }
  };

  const generateStory = async () => {
    if (!userId || isGeneratingStory) return;
    setIsGeneratingStory(true);
    setStoryData(prev => ({ ...prev, loadingMessage: 'Checking for new entries... 🧐' }));
    
    try {
        const characterProfileRef = doc(db, `users/${userId}/story/character_profile`);
        const characterProfileSnap = await getDoc(characterProfileRef);
        const characterProfile = characterProfileSnap.exists() ? characterProfileSnap.data().profile : "A young person navigating life.";
        
        const existingPanels = storyData.panels || [];
        const processedEntryIds = new Set(existingPanels.map(p => p.panelId.split('-')[0]));
        const newEntriesToProcess = entries.filter(entry => !processedEntryIds.has(entry.id));

        if (newEntriesToProcess.length === 0) {
            setStoryData(prev => ({...prev, loadingMessage: 'Your story is up to date! ✨' }));
            setTimeout(() => setStoryData(prev => ({...prev, loadingMessage: ''})), 2000);
            setIsGeneratingStory(false);
            return;
        }

        const lastNarratives = existingPanels.slice(-5).map(p => p.narrative).join('; ');
        
        setStoryData(prev => ({ ...prev, loadingMessage: `Syncing ${newEntriesToProcess.length} new entries... Your story will update in real-time! 🎨` }));
        
        const response = await fetch("https://living-diary-h2s.onrender.com/generate_story_panels", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                userId: userId,
                entries: newEntriesToProcess, 
                character_profile: characterProfile, 
                story_context: lastNarratives,
                language: language 
            }),
        });

        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        setTimeout(() => setStoryData(prev => ({...prev, loadingMessage: ''})), 4000);

    } catch (error) {
      console.error("Story generation error:", error);
      let errorMessage = "An unknown error occurred.";
      if (error.message.includes("Failed to fetch")) {
        errorMessage = "Could not connect to the server. Please check your internet connection.";
      } else if (error.message.includes("Server error")) {
        errorMessage = "The server had a problem starting the sync. Please try again later.";
      }
      setStoryData(prev => ({ ...prev, loadingMessage: `Error: ${errorMessage}` }));
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const handleUnlock = () => {
    setIsLocked(false);
  };

  const renderActiveView = () => {
    switch (currentView) {
      case 'diary':
        return <DiaryList entries={entries} onUpdateEntry={handleUpdateEntry} onDeleteEntry={handleDeleteEntry} onNewEntryClick={() => setIsNewEntryModalOpen(true)} />;
      case 'story':
        return <StoryView storyData={storyData} isLoading={isGeneratingStory} onSync={generateStory} />;
      case 'chat':
        return <ChatInterface messages={chatMessages} isLoading={thinking} onSendMessage={handleSendMessage} />;
      case 'settings':
        return <Settings theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} />;
      case 'about':
        return <About />;
      default:
        return <DiaryList entries={entries} onUpdateEntry={handleUpdateEntry} onDeleteEntry={handleDeleteEntry} onNewEntryClick={() => setIsNewEntryModalOpen(true)} />;
    }
  };

  return (
    <div className={theme}>
      <div className={`min-h-screen font-sans ${theme === 'oled' ? 'bg-black' : 'bg-gray-50 dark:bg-gray-900'} text-gray-900 dark:text-gray-100`}>
        
        {isLocked && pinHash && <AppLockScreen pinHash={pinHash} onUnlock={handleUnlock} />}

        <div className={isLocked && pinHash ? 'blur-sm pointer-events-none' : ''}>
          {showIntro && <WelcomeIntro onStartTutorial={handleStartTutorial} />}
          {showTutorial && <Tutorial onFinish={handleFinishTutorial} />}
          
          {!userName && !showIntro && !showTutorial && <UserNameModal setUserName={setUserName} />}
          
          <Header onMenuClick={() => setIsDrawerOpen(true)} title={currentView.charAt(0).toUpperCase() + currentView.slice(1)} />
          
          <SideDrawer 
            isOpen={isDrawerOpen} 
            onClose={() => setIsDrawerOpen(false)} 
            setView={setCurrentView} 
            currentView={currentView}
            userName={userName} 
          />

          <main className="pt-16">
            {renderActiveView()}
          </main>
          
          <NewEntryModal 
            isOpen={isNewEntryModalOpen}
            onClose={() => setIsNewEntryModalOpen(false)}
            onSave={handleSaveEntry}
          />
        </div>
      </div>
    </div>
  );
}
