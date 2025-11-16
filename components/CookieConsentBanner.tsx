import React from 'react';

interface CookieConsentBannerProps {
  onAccept: () => void;
  onDecline: () => void;
}

const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onAccept, onDecline }) => {
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-gray-900/90 dark:bg-black/90 backdrop-blur-sm text-white z-50 animate-fade-in"
      style={{ animationName: 'fadeInUp', animationDuration: '0.5s' }}
    >
      <div className="container mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-300 text-center sm:text-left">
          We use cookies to enhance your experience, analyze site traffic, and personalize content. By clicking "Accept", you agree to our use of cookies.
        </p>
        <div className="flex-shrink-0 flex items-center gap-3">
          <button 
            onClick={onAccept}
            className="px-5 py-2 rounded-md font-semibold bg-cyan-500 text-white hover:bg-cyan-400 transition-colors duration-300 text-sm"
          >
            Accept
          </button>
          <button 
            onClick={onDecline}
            className="px-5 py-2 rounded-md font-semibold bg-transparent text-gray-300 hover:bg-gray-700/50 transition-colors duration-300 text-sm"
          >
            Decline
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default CookieConsentBanner;
