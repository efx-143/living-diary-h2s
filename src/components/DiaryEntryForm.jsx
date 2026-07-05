import React, { useState, useRef } from 'react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { Mic, Square, Trash2, Send, Type, Voicemail, ImagePlus, XCircle } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export default function DiaryEntryForm({ onSaveEntry }) {
  const [mode, setMode] = useState('text'); 
  const [text, setText] = useState("");
  const canvasRef = useRef(null);
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const { status, startRecording, stopRecording, clearBlobUrl, mediaBlobUrl, audioBlob } = useVoiceRecorder(canvasRef);

  const handleImageSelect = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos
      });

      if (image.webPath) {
        setImagePreview(image.webPath);
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        setImageFile(blob);
      }
    } catch (error) {
      console.error("Error selecting image:", error);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSave = () => {
    if (mode === 'text') {
      if (!text.trim() && !imageFile) return;
      onSaveEntry({ type: 'text', content: text, imageFile: imageFile });
      setText("");
      removeImage();
    } else { 
      if (!audioBlob) return;
      onSaveEntry({
        type: 'voice',
        content: audioBlob,
      });
      clearBlobUrl(); 
    }
  };

  const TabButton = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`w-full py-3 text-sm font-medium transition-all duration-200 rounded-lg flex items-center justify-center gap-2 ${
        active 
        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' 
        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex gap-2 mb-4">
        <TabButton active={mode === 'text'} onClick={() => setMode('text')}>
          <Type size={16} /> Text
        </TabButton>
        <TabButton active={mode === 'voice'} onClick={() => setMode('voice')}>
          <Voicemail size={16} /> Voice
        </TabButton>
      </div>

      <div className="flex-1 flex flex-col">
        {mode === 'text' ? (
          <>
            <div className="relative flex-1 flex flex-col">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="How was your day?"
                className="w-full flex-1 p-4 bg-gray-100 dark:bg-gray-700 rounded-xl resize-none focus:ring-2 focus:ring-pink-500 focus:outline-none"
              />
              {imagePreview && (
                <div className="relative w-24 h-24 mt-4">
                  <img src={imagePreview} alt="Selected" className="w-full h-full object-cover rounded-lg" />
                  <button onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                    <XCircle size={20} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={handleSave}
                disabled={!text.trim() && !imageFile}
                className="flex-grow bg-gradient-to-r from-pink-500 to-purple-600 rounded-full py-3 font-bold text-white text-lg disabled:opacity-50"
              >
                Save Entry
              </button>
              <button onClick={handleImageSelect} className="p-3 bg-gray-200 dark:bg-gray-600 rounded-full">
                <ImagePlus className="text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-between">
            <div className="w-full flex-1 flex items-center justify-center">
              {status === 'recording' ? (
                  <canvas ref={canvasRef} className="w-full h-32" />
              ) : mediaBlobUrl ? (
                  <audio src={mediaBlobUrl} controls className="w-full" />
              ) : (
                <div className="text-center text-gray-500">
                  <Mic size={48} className="mx-auto" />
                  <p className="mt-2">Tap the mic to start recording</p>
                </div>
              )}
            </div>

            <div className="w-full flex justify-around items-center pt-4">
              <button
                onClick={clearBlobUrl}
                disabled={!mediaBlobUrl}
                className="p-4 rounded-full bg-gray-200 dark:bg-gray-600 disabled:opacity-50"
              > <Trash2 size={24} /> </button>

              {status === 'recording' ? (
                <button onClick={stopRecording} className="p-6 rounded-full bg-red-500 text-white animate-pulse">
                  <Square size={32} />
                </button>
              ) : (
                <button onClick={startRecording} className="p-6 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                  <Mic size={32} />
                </button>
              )}

              <button onClick={handleSave} disabled={!mediaBlobUrl} className="p-4 rounded-full bg-blue-500 text-white disabled:opacity-50">
                <Send size={24} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}