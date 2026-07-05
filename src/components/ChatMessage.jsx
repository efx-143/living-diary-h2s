import React from 'react';

export default function ChatMessage({ message }) {
  const { text, sender, timestamp } = message;
  const isUser = sender === 'user';

  // Format the timestamp to show only time
  const formattedTime = timestamp 
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs md:max-w-md lg:max-w-lg rounded-2xl px-4 py-2.5 ${isUser ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
        <p className="whitespace-pre-wrap">{text}</p>
        {formattedTime && (
          <p className={`text-xs mt-1.5 ${isUser ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
            {formattedTime}
          </p>
        )}
      </div>
    </div>
  );
}