import React from 'react';
import DiaryEntryForm from './DiaryEntryForm';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NewEntryModal({ isOpen, onClose, onSave }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex flex-col z-50 p-4"
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full h-full bg-white dark:bg-gray-800 rounded-2xl flex flex-col p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">New Entry</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 flex flex-col">
              <DiaryEntryForm onSaveEntry={onSave} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}