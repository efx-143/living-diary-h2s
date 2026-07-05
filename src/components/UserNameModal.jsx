import React, { useState } from "react";
import { motion } from "framer-motion";

export default function UserNameModal({ setUserName }) {
  const [name, setName] = useState("");

  const handleSave = () => {
    if (!name.trim()) return;
    // The setUserName function now handles persistence
    setUserName(name);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-sm"
      >
        <h2 className="text-lg font-bold text-pink-500 dark:text-pink-400 mb-4">Welcome!</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Please enter your name to get started.
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full p-3 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-pink-500 focus:outline-none"
          onKeyPress={(e) => e.key === 'Enter' && handleSave()}
        />
        <button
          onClick={handleSave}
          className="mt-4 w-full py-2 rounded bg-gradient-to-r from-pink-500 to-purple-600 font-bold text-white"
        >
          Save
        </button>
      </motion.div>
    </div>
  );
}
