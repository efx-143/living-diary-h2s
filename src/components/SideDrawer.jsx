import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Film, MessageSquare, Settings, Info, X, UserCircle } from 'lucide-react';

export default function SideDrawer({ isOpen, onClose, setView, currentView, userName }) {
  const menuItems = [
    { id: 'diary', icon: Book, label: 'Diary' },
    { id: 'story', icon: Film, label: 'Story' },
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
  ];

  const actionItems = [
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'about', icon: Info, label: 'About' },
  ];

  // Helper function to render menu items for consistency
  const renderButton = (item) => {
    const isActive = currentView === item.id;
    return (
      <button
        key={item.id}
        onClick={() => { setView(item.id); onClose(); }}
        className={`flex items-center w-full space-x-4 px-4 py-3 rounded-lg text-left text-lg transition-all duration-200 ${
          isActive 
          ? 'bg-indigo-500 text-white shadow-lg' 
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`}
      >
        <item.icon size={22} />
        <span className="font-medium">{item.label}</span>
      </button>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            // Using the "Deeper Slate" color palette for a more modern look
            className="fixed top-0 left-0 h-full w-80 bg-slate-50 dark:bg-slate-900 z-50 flex flex-col shadow-2xl"
          >
            {/* 1. HEADER SECTION: Creates a clear top boundary */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700/60">
              <h2 className="text-2xl font-bold text-indigo-500">Living Diary</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                <X size={24}/>
              </button>
            </div>

            {/* 2. USER PROFILE SECTION: Fills empty space and adds personalization */}
            <div className="p-4 flex items-center gap-3 border-b border-slate-200 dark:border-slate-700/60 mb-4">
                <UserCircle size={40} className="text-slate-500"/>
                <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{userName || 'Guest'}</p>
                    <p className="text-sm text-slate-500">Welcome back!</p>
                </div>
            </div>

            <nav className="flex-1 flex flex-col p-4">
              {/* 3. IMPROVED HIERARCHY & SPACING */}
              <span className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 px-4 mb-2">Menu</span>
              <div className="space-y-2">
                {menuItems.map(renderButton)}
              </div>
              
              <div className="mt-auto">
                <span className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 px-4 mb-2">Other</span>
                <div className="space-y-2">
                  {actionItems.map(renderButton)}
                </div>
              </div>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}