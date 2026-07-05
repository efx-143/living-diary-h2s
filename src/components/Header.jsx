import React from 'react';
import { Menu } from 'lucide-react';

export default function Header({ onMenuClick, title }) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg z-40 flex items-center px-4 shadow-sm">
      <button onClick={onMenuClick} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
        <Menu size={24} />
      </button>
      <h1 className="text-xl font-bold ml-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
        {title}
      </h1>
    </header>
  );
}