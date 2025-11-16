import React from 'react';
import { Page } from '../App';
import { WalletIcon, LoadingIcon, EmailIcon, UserPlusIcon } from './IconComponents';

type WalletConnectionStatus = 'idle' | 'connecting' | 'error';

interface LoginOptionsModalProps {
  onClose: () => void;
  onNavigate: (page: Page) => void;
  onConnectWallet: () => void;
  walletStatus: WalletConnectionStatus;
  walletError: string | null;
}

const LoginOptionsModal: React.FC<LoginOptionsModalProps> = ({ onClose, onNavigate, onConnectWallet, walletStatus, walletError }) => {
    
    const handleNavigation = (page: Page) => {
        onNavigate(page);
        onClose();
    };

    const isConnecting = walletStatus === 'connecting';

    const connectButtonClasses = `w-full flex items-center justify-center space-x-3 py-3 rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 ${
        isConnecting 
            ? 'bg-gray-400 dark:bg-gray-600 cursor-wait' 
            : walletStatus === 'error' 
                ? 'bg-red-500/80 hover:bg-red-500 text-white focus:ring-red-400' 
                : 'bg-fuchsia-500/80 hover:bg-fuchsia-500 text-white focus:ring-fuchsia-400'
    }`;


    return (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-options-title"
        >
          <div 
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
             <div className="p-8 text-center relative">
                 <button 
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-800 dark:text-white bg-white/50 dark:bg-black/50 rounded-full p-1 hover:bg-white/80 dark:hover:bg-black/80 transition-colors"
                    aria-label="Close modal"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h2 id="login-options-title" className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Bona Parks Access</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">Choose your preferred method to enter.</p>
                
                <div className="space-y-4">
                    <button
                        onClick={onConnectWallet}
                        disabled={isConnecting}
                        className={connectButtonClasses}
                    >
                         {isConnecting ? <LoadingIcon /> : <WalletIcon className="h-6 w-6" />}
                         <span>
                             {
                                {
                                  idle: 'Connect with Web3',
                                  connecting: 'Connecting...',
                                  error: 'Retry Connection'
                                }[walletStatus]
                              }
                         </span>
                    </button>
                    {walletStatus === 'error' && walletError && (
                        <p className="text-red-400 text-xs text-center mt-2">{walletError}</p>
                    )}

                    <button
                        onClick={() => handleNavigation('login')}
                        className="w-full flex items-center justify-center space-x-3 py-3 rounded-lg font-semibold bg-cyan-500/80 hover:bg-cyan-500 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 focus:ring-cyan-400 transition-all duration-300"
                    >
                        <EmailIcon />
                        <span>Login with Email</span>
                    </button>
                    
                     <button
                        onClick={() => handleNavigation('signup')}
                        className="w-full flex items-center justify-center space-x-3 py-3 rounded-lg font-semibold bg-gray-600 dark:bg-gray-700/80 hover:bg-gray-700 dark:hover:bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 focus:ring-gray-500 transition-all duration-300"
                    >
                         <UserPlusIcon />
                        <span>Create an Account</span>
                    </button>
                </div>
             </div>
          </div>
        </div>
    );
};

export default LoginOptionsModal;