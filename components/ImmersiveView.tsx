import React, { useState, useEffect } from 'react';
import { LoadingIcon } from './IconComponents';

interface ImmersiveViewProps {
  item: {
    title: string;
    imageUrl: string;
    matterportUrl?: string;
  };
  onExit: () => void;
}

const ImmersiveView: React.FC<ImmersiveViewProps> = ({ item, onExit }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Extract Matterport model ID for embedding
  const getMatterportEmbedUrl = (url?: string) => {
    if (!url) return null;
    const match = url.match(/m=([a-zA-Z0-9]+)/);
    if (match) {
      return `https://my.matterport.com/show/?m=${match[1]}&play=1&qs=1`;
    }
    return null;
  };

  const embedUrl = getMatterportEmbedUrl(item.matterportUrl);

  return (
    <div
      className="fixed inset-0 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center z-50 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="immersive-view-title"
    >
      {/* Header bar with title and close button */}
      <div className="absolute top-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-700/50 p-4 z-20 flex justify-between items-center">
        <h2 id="immersive-view-title" className="text-xl md:text-2xl font-bold text-white tracking-tight">
          {item.title}
        </h2>
        <button
          onClick={onExit}
          className="px-6 py-2 rounded-lg font-semibold bg-slate-700 text-white hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300 transform hover:scale-105"
          aria-label="Close viewer"
        >
          Close
        </button>
      </div>

      {/* Main content area */}
      <div className="w-full h-full pt-16 pb-4 px-4">
        {embedUrl ? (
          <div className="relative w-full h-full">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
                <LoadingIcon />
                <span className="text-slate-300 text-lg font-semibold tracking-wide mt-4">LOADING 3D TOUR...</span>
              </div>
            )}
            <iframe
              src={embedUrl}
              className="w-full h-full rounded-lg border-2 border-slate-700/30 shadow-2xl"
              allow="xr-spatial-tracking; vr; fullscreen"
              allowFullScreen
              title={`3D tour of ${item.title}`}
              onLoad={() => setIsLoading(false)}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="max-w-2xl max-h-96 object-contain rounded-lg shadow-2xl mb-8 border-2 border-slate-700/30"
            />
            <p className="text-gray-300 text-lg">3D tour preview not available</p>
          </div>
        )}
      </div>

      {/* Footer instructions */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-700/50 p-3 text-center">
        <p className="text-sm text-slate-400">
          Use your mouse to navigate • Click and drag to look around • Scroll to zoom
        </p>
      </div>
    </div>
  );
};

export default ImmersiveView;