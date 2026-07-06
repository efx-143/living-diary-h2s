// src/components/AppLockScreen.jsx
import React, { useState, useEffect } from 'react';
import { Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AppLockScreen({ pinHash, onUnlock }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const SHA256 = require("crypto-js/sha256");

  useEffect(() => {
    if (input.length === 4) {
      const inputHash = SHA256(input).toString();
      if (inputHash === pinHash) {
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => {
          setInput('');
          setError(false);
        }, 800);
      }
    }
  }, [input, pinHash, onUnlock, SHA256]);

  const handleKeyClick = (key) => {
    if (input.length < 4) {
      setInput(input + key);
    }
  };

  const handleDelete = () => {
    setInput(input.slice(0, -1));
  };

  const PinDots = () => (
    <div className="flex justify-center items-center gap-4 my-6">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className={`w-4 h-4 rounded-full transition-all duration-200 ${
            input.length > i ? 'bg-purple-400' : 'bg-gray-600'
          }`}
        />
      ))}
    </div>
  );

  const KeypadButton = ({ value, onClick }) => (
    <button
      onClick={() => onClick(value)}
      className="w-20 h-20 rounded-full bg-gray-700/50 text-3xl font-light text-white flex items-center justify-center transition-colors hover:bg-gray-600/50"
    >
      {value}
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-gray-900 z-[200] flex flex-col items-center justify-center p-4 text-white"
    >
      <Fingerprint size={48} className="text-purple-400 mb-4" />
      <h2 className="text-xl font-medium">Enter PIN</h2>
      <PinDots />
      {error && (
        <motion.p
          initial={{ x: 0 }}
          animate={{ x: [-10, 10, -10, 10, 0] }}
          transition={{ duration: 0.5 }}
          className="text-red-400 text-sm absolute top-1/2 mt-12"
        >
          Incorrect PIN
        </motion.p>
      )}

      <div className="grid grid-cols-3 gap-6 mt-8">
        {[...Array(9).keys()].map(i => <KeypadButton key={i+1} value={i+1} onClick={handleKeyClick} />)}
        <div /> {/* Placeholder for alignment */}
        <KeypadButton value={0} onClick={handleKeyClick} />
        <button onClick={handleDelete} className="w-20 h-20 flex items-center justify-center text-gray-400">
          Delete
        </button>
      </div>
    </motion.div>
  );
}