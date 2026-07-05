import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, MessageSquareHeart } from 'lucide-react';

export default function WelcomeIntro({ onStartTutorial }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full text-center p-8"
      >
        <BookOpen size={48} className="mx-auto text-indigo-500 mb-4" />
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-2">
          Welcome to Living Diary
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Your personal space that grows and dreams with you.
        </p>

        <div className="space-y-4 text-left my-8">
          <div className="flex items-start gap-4">
            <Sparkles className="text-purple-500 h-6 w-6 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Turn entries into stories</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Write diary entries and our AI will transform them into a visual comic-style story.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <MessageSquareHeart className="text-pink-500 h-6 w-6 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Chat with your diary</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ask questions and gain insights by having a conversation with your own thoughts.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onStartTutorial}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full py-3 font-bold text-white text-lg transition-transform hover:scale-105"
        >
          Show Me How
        </button>
      </motion.div>
    </div>
  );
}
