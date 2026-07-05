import React, { useState } from 'react';
import { Edit, Save, Trash2, XCircle, Plus, Music4, FileText, Loader2, X } from 'lucide-react';

// NOTE: We are intentionally not using the localDb here to keep the transcription logic simple and bug-free for now.

export default function DiaryList({ entries, onUpdateEntry, onDeleteEntry, onNewEntryClick }) {
  const [editingEntry, setEditingEntry] = useState(null);
  // Using the simpler, more reliable state management for transcriptions
  const [transcription, setTranscription] = useState({ id: null, text: '', isLoading: false });

  const handleUpdate = () => {
    if (!editingEntry) return;
    onUpdateEntry(editingEntry);
    setEditingEntry(null);
  };

  // This is the working transcription function from your version
  const handleFetchTranscription = async (entryId, audioUrl) => {
    if (transcription.id === entryId) {
      setTranscription({ id: null, text: '', isLoading: false });
      return;
    }

    setTranscription({ id: entryId, text: '', isLoading: true });
    try {
      const response = await fetch("http://127.0.0.1:8080/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioUrl }),
      });
      if (!response.ok) throw new Error('Failed to fetch transcription');
      const data = await response.json();
      setTranscription({ id: entryId, text: data.text, isLoading: false });
    } catch (error) {
      console.error(error);
      setTranscription({ id: entryId, text: 'Could not load transcription.', isLoading: false });
    }
  };

  const renderEntry = (entry) => {
    const isEditing = editingEntry && editingEntry.id === entry.id;
    const isVoiceEntry = entry.type === 'voice';
    const showTranscription = transcription.id === entry.id;

    return (
      <div key={entry.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4 shadow-md animate-fade-in-up">
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-4">
            <p className="text-xs text-teal-500 dark:text-teal-400 mb-2 flex items-center gap-2">
              {isVoiceEntry && <Music4 size={14} />}
              {entry.user} - {new Date(entry.timestamp).toLocaleString()}
            </p>
            
            {isVoiceEntry ? (
              <div className="space-y-3">
                {/* MERGED: Correctly handles both synced (audioUrl) and unsynced (audioBlob) voice notes */}
                <audio controls src={entry.audioUrl || (entry.audioBlob && URL.createObjectURL(entry.audioBlob))} className="w-full">
                  Your browser does not support the audio element.
                </audio>
                
                <button
                  onClick={() => handleFetchTranscription(entry.id, entry.audioUrl)}
                  disabled={!entry.audioUrl} // Button is disabled if the audio hasn't been synced yet
                  className="flex items-center gap-2 text-sm text-indigo-500 hover:text-indigo-400 transition-colors px-2 py-1 rounded-md hover:bg-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {showTranscription ? <X size={14} /> : <FileText size={14} />}
                  {showTranscription ? 'Hide Transcription' : 'Read Transcription'}
                </button>
                
                {showTranscription && (
                  <div className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                    {transcription.isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Transcribing...</span>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap font-mono">{transcription.text}</p>
                    )}
                  </div>
                )}
              </div>
            ) : isEditing ? (
              <textarea
                value={editingEntry.text}
                onChange={(e) => setEditingEntry({ ...editingEntry, text: e.target.value })}
                className="w-full bg-gray-100 dark:bg-gray-700 p-2 rounded-md"
                rows={4}
              />
            ) : (
              <div>
                {entry.text && <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{entry.text}</p>}
              </div>
            )}
            
            {/* MERGED: Correctly handles both synced (imageUrl) and unsynced (imageFile) images */}
            {!isVoiceEntry && (entry.imageUrl || entry.imageFile) && (
              <img 
                src={entry.imageUrl || (entry.imageFile && URL.createObjectURL(entry.imageFile))} 
                alt="Diary entry attachment" 
                className="mt-4 rounded-lg w-full max-w-sm mx-auto shadow-md" 
              />
            )}
          </div>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button onClick={handleUpdate} className="p-2 text-green-500"><Save size={18} /></button>
                <button onClick={() => setEditingEntry(null)} className="p-2 text-gray-500"><XCircle size={18} /></button>
              </>
            ) : (
              <>
                {!isVoiceEntry && <button onClick={() => setEditingEntry({ ...entry })} className="p-2 text-blue-500"><Edit size={18} /></button>}
                <button onClick={() => onDeleteEntry(entry.id)} className="p-2 text-red-500"><Trash2 size={18} /></button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 relative min-h-screen pb-24"> 
      {entries.length === 0 ? (
        <div className="text-center mt-20 text-gray-500">
            <p>No entries yet.</p>
            <p>Tap the '+' button to start writing or recording!</p>
        </div>
      ) : (
        entries.map(renderEntry)
      )}
      <button 
        onClick={onNewEntryClick}
        className="fixed bottom-24 right-6 w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg"
        aria-label="New Diary Entry"
      >
          <Plus size={32} />
      </button>
    </div>
  );
}