import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const tutorialSteps = [
  {
    title: '1. Create an Entry',
    text: "Tap the '+' button in the bottom corner to write your first diary entry. This is where your journey begins!",
  },
  {
    title: '2. View Your Story',
    text: "After writing a few entries, open the side menu and navigate to the 'Story' view. Here, your memories come to life as a comic.",
  },
  {
    title: '3. Sync New Entries',
    text: "Press the 'Sync' button in the Story view to update your comic with your latest entries.",
  },
  {
    title: '4. Chat With Your Diary',
    text: "Finally, visit the 'Chat' view to ask questions, explore your thoughts, and get to know yourself better.",
  }
];

export default function Tutorial({ onFinish }) {
  const [stepIndex, setStepIndex] = useState(0);

  const handleNext = () => {
    if (stepIndex < tutorialSteps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      onFinish();
    }
  };

  const handleSkip = () => {
    onFinish();
  };

  const currentStep = tutorialSteps[stepIndex];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 z-[110] flex items-center justify-center p-4">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-sm w-full relative"
        >
          <div className="p-6">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-2">
              {currentStep.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {currentStep.text}
            </p>
          </div>

          <div className="px-6 pb-4 flex justify-between items-center">
            <button onClick={handleSkip} className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
              Skip
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold"
            >
              {stepIndex === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
           <button onClick={handleSkip} className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
             <X size={18} />
           </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
