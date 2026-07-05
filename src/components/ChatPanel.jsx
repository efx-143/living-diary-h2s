import React from "react";

export default function ChatPanel({ entries }) {
  return (
    <div className="bg-gray-800 rounded-2xl p-6 flex-1 overflow-y-auto">
      <h2 className="text-purple-400 text-xl font-semibold">Your Conversations</h2>
      {entries.length === 0 ? (
        <p className="text-gray-400 mt-4">Your diary is empty. Start writing!</p>
      ) : (
        entries.map((e, idx) => (
          <div key={idx} className="p-3 bg-gray-700 rounded-xl my-2">
            <p>{e.text}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(e.timestamp).toLocaleString()}</p>
          </div>
        ))
      )}
    </div>
  );
}