import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import ChatMessage from './ChatMessage'; // Ensure you have ChatMessage.jsx

export default function ChatInterface({ messages, isLoading, onSendMessage }) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    // The main container now has a background color and proper flex layout
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-100 dark:bg-gray-900">
      <h1 className="p-4 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 flex-shrink-0">Chat with Diary</h1>
      
      {/* Messages Area */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl px-4 py-2.5 rounded-bl-none">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Your thoughts..."
            rows="1"
            className="w-full bg-gray-100 dark:bg-gray-700 rounded-xl p-3 pr-20 resize-none custom-scrollbar shadow-inner"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-500 text-white rounded-lg p-2 disabled:bg-gray-400 hover:bg-indigo-600 transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}