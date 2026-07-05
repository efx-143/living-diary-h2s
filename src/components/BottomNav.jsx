import React from 'react';
import { Book, Film, MessageSquare, Plus } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, onNewEntryClick }) {
  const navItems = [
    { id: 'diary', icon: Book, label: 'Diary' },
    { id: 'story', icon: Film, label: 'Story' },
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 flex justify-around items-center z-50">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
            activeTab === item.id ? 'text-purple-500' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <item.icon size={24} />
          <span className="text-xs mt-1">{item.label}</span>
        </button>
      ))}
      <div className="absolute top-[-28px] left-1/2 -translate-x-1/2">
        <button
          onClick={onNewEntryClick}
          className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg transform hover:scale-110 transition-transform"
          aria-label="New Diary Entry"
        >
          <Plus size={32} />
        </button>
      </div>
    </div>
  );
}