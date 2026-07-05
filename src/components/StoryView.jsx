import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { getLocalImage } from '../services/imageStore';

const FallbackPanel = ({ narrative }) => (
  <div className="w-full h-96 flex items-center justify-center bg-gray-900 border-2 border-dashed border-gray-600 p-8 my-4">
    <div className="text-center">
      <p className="text-gray-400 text-lg italic mb-4">[ Image not available offline ]</p>
      <p className="text-lg text-white font-sans">{narrative}</p>
    </div>
  </div>
);

export default function StoryView({ storyData, isLoading, onSync }) {
  const { panels = [], loadingMessage } = storyData;
  const [displayPanels, setDisplayPanels] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const scrollContainerRef = useRef(null);
  const totalPages = displayPanels.length;

  useEffect(() => {
    let isMounted = true;
    const generateLocalUrls = async () => {
      if (!panels) return;
      const panelsWithLocalUrls = await Promise.all(
        panels.map(async (panel) => {
          const localUrl = await getLocalImage(panel.imageUrl);
          return { ...panel, localImageUrl: localUrl };
        })
      );
      if (isMounted) {
        setDisplayPanels(panelsWithLocalUrls);
      }
    };
    generateLocalUrls();
    return () => { isMounted = false; };
  }, [panels]);

  // Handle Vertical Scrolling to update the Page Counter
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || totalPages === 0) return;
    
    const handleScroll = () => {
      // Calculate approximate page based on scroll progress
      const panelHeight = container.scrollHeight / totalPages;
      const pageIndex = Math.floor((container.scrollTop + container.clientHeight / 3) / panelHeight);
      const newPage = Math.min(Math.max(pageIndex + 1, 1), totalPages);
      
      if (newPage !== currentPage) setCurrentPage(newPage);
    };
    
    let scrollTimeout;
    const debouncedScrollHandler = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 100);
    };
    
    container.addEventListener('scroll', debouncedScrollHandler);
    return () => container.removeEventListener('scroll', debouncedScrollHandler);
  }, [currentPage, totalPages]);

  const renderContent = () => {
    if (totalPages === 0 && !isLoading) {
      return (
        <div className="text-center p-10 flex flex-col items-center justify-center h-full">
            <h2 className="text-xl text-white">Your story awaits.</h2>
            <p className="text-gray-400">Sync with your entries to begin.</p>
        </div>
      );
    }
    
    return (
      <div className="h-full w-full relative bg-black">
        {/* Changed to vertical scrolling (overflow-y-auto, flex-col) without snap for smooth webtoon reading */}
        <div ref={scrollContainerRef} className="w-full h-full flex flex-col overflow-y-auto scroll-smooth items-center pt-4 pb-24 gap-8">
          {displayPanels.map((panel) => (
            <div key={panel.panelId} className="w-full max-w-lg flex flex-col items-center justify-center">
              
              {/* Image Container - Webtoon panels touch edge-to-edge usually, but kept a max-width for aesthetics */}
              <div className="w-full flex items-center justify-center overflow-hidden bg-gray-900 rounded-md">
                  <img 
                      src={panel.localImageUrl || panel.imageUrl} 
                      alt={panel.narrative} 
                      className="w-full h-auto object-cover" 
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                  <div style={{display: 'none'}} className="w-full h-full items-center justify-center">
                      <FallbackPanel narrative={panel.narrative} />
                  </div>
              </div>

              {/* Narrative Text directly below the image */}
              <div className="w-full p-4 text-center">
                <p className="text-lg text-gray-200 font-serif italic">{panel.narrative}</p>
              </div>

            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-4rem)] w-screen flex flex-col bg-black text-white">
      <div className="flex-shrink-0 z-10 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
        <div className="flex justify-between items-center px-4 py-3">
            <h2 className="text-md font-bold text-center text-pink-400 tracking-wider">
              EPISODE: {currentPage} / {totalPages || '?'}
            </h2>
            <button onClick={onSync} disabled={isLoading} className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 transition-all active:scale-95 shadow-md">
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Syncing...' : 'Sync Entries'}
            </button>
        </div>

        {loadingMessage && (
            <div className={`text-center py-2 text-sm transition-all font-medium ${loadingMessage.toLowerCase().includes('error') ? 'bg-red-900/50 text-red-200' : 'bg-purple-900/50 text-purple-200'}`}>
                {loadingMessage}
            </div>
        )}
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        {renderContent()}
      </div>
    </div>
  );
}