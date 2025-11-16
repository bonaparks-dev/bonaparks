import React, { useState, useEffect } from 'react';
import { LoadingIcon } from './IconComponents';

interface ImmersiveViewProps {
  item: {
    title: string;
    imageUrl: string;
  };
  onExit: () => void;
}

const ImmersiveView: React.FC<ImmersiveViewProps> = ({ item, onExit }) => {
  const [isWebXRSupported, setIsWebXRSupported] = useState(false);

  useEffect(() => {
    // Check for WebXR support on the client side
    setIsWebXRSupported('xr' in navigator);
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="immersive-view-title"
      onClick={onExit} // Allow closing by clicking the background
    >
      <img
        src={item.imageUrl}
        alt={`Immersive view of ${item.title}`}
        className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
      />
      <div 
        className="relative text-center z-10 flex flex-col items-center"
        onClick={e => e.stopPropagation()} // Prevent clicks inside from closing the modal
      >
        <div className="flex items-center space-x-3 text-cyan-300 mb-4">
          <LoadingIcon />
          <span className="text-xl font-semibold tracking-wider">INITIALIZING IMMERSIVE SESSION</span>
        </div>
        <h2 id="immersive-view-title" className="text-4xl md:text-6xl font-extrabold text-white mb-4" style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}>
          {item.title}
        </h2>
        <div className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            <p>Please put on your VR/AR device to begin the experience.</p>
            {!isWebXRSupported && (
                 <p className="text-sm text-yellow-400/80 mt-2">
                    For the best experience, use a WebXR compatible browser.
                 </p>
            )}
        </div>
        
        <button
          onClick={onExit}
          className="px-8 py-3 rounded-lg font-semibold bg-fuchsia-500/80 text-white hover:bg-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-fuchsia-400 transition-all duration-300 transform hover:scale-105"
        >
          Exit Experience
        </button>
      </div>
    </div>
  );
};

export default ImmersiveView;