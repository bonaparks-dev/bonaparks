import React, { useState, useEffect, useRef } from 'react';
import HomePage from './components/pages/HomePage';
import DigitalTwinsPage from './components/pages/DigitalTwinsPage';
import ProofOfWorkPage from './components/pages/ProofOfWorkPage';
import AISolutionsPage from './components/pages/AISolutionsPage';
import LoginPage from './components/pages/LoginPage';
import SignUpPage from './components/pages/SignUpPage';
import ControlRoomPage from './components/pages/ControlRoomPage';
import UserProfilePage from './components/pages/UserProfilePage';
import AvatarStudioPage from './components/pages/AvatarStudioPage';
import { Booking } from './types';
import { WalletIcon, UserIcon } from './components/IconComponents';
import LoginOptionsModal from './components/LoginOptionsModal';
import CookieConsentBanner from './components/CookieConsentBanner';

export type Page = 'home' | 'ai-assistant' | 'digital-twins' | 'proof-of-work' | 'ai-solutions' | 'login' | 'signup' | 'control-room' | 'user-profile' | 'avatar-studio' | 'business-studio';

type WalletConnectionStatus = 'idle' | 'connecting' | 'error';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [walletConnectionStatus, setWalletConnectionStatus] = useState<WalletConnectionStatus>('idle');
  const [walletError, setWalletError] = useState<string | null>(null);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAccessOptions, setShowAccessOptions] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedWalletAddress = localStorage.getItem('walletAddress');
    
    if (token || storedWalletAddress) {
      setIsLoggedIn(true);
      const storedBookings = localStorage.getItem('bona-parks-bookings');
      if (storedBookings) {
        setBookings(JSON.parse(storedBookings));
      } else {
          const now = new Date().toISOString();
          const tenDaysAgo = new Date(Date.now() - 86400000 * 10).toISOString();
          const dummyBookings: Booking[] = [
              { id: 'proj-1', title: 'Access Pass: The Onyx Lounge', status: 'Active', lastUpdate: now, imageUrl: 'https://images.pexels.com/photos/2114365/pexels-photo-2114365.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', description: 'VIP entry for the grand opening event.', type: 'Nightclub', bookingDate: now },
              { id: 'proj-2', title: 'Ticket: Starlight Disco', status: 'Redeemed', lastUpdate: tenDaysAgo, imageUrl: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1', description: 'General admission for the retro-funk night.', type: 'Nightclub', bookingDate: tenDaysAgo },
          ];
          setBookings(dummyBookings);
          localStorage.setItem('bona-parks-bookings', JSON.stringify(dummyBookings));
      }
    }
    if (storedWalletAddress) {
      setWalletAddress(storedWalletAddress);
    }

    const cookieConsent = localStorage.getItem('cookie-consent');
    if (!cookieConsent) {
      setShowCookieBanner(true);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setShowWalletMenu(false);
            setShowUserMenu(false);
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCookieConsent = (consent: boolean) => {
    localStorage.setItem('cookie-consent', consent ? 'accepted' : 'declined');
    setShowCookieBanner(false);
  };

  const navigate = (p: Page) => {
    setPage(p);
  };

  const handleLogin = () => {
    localStorage.setItem('authToken', 'dummy-token-for-bona-parks');
    setIsLoggedIn(true);
    navigate('home');
  };

  const handleSignUp = () => {
    localStorage.setItem('authToken', 'dummy-token-for-bona-parks');
    setIsLoggedIn(true);
    navigate('home');
  };

  const connectWallet = async () => {
    setWalletConnectionStatus('connecting');
    setWalletError(null);
    
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (typeof window.ethereum === 'undefined') {
      setWalletError("Web3 wallet not detected. Please install a browser extension like MetaMask.");
      setWalletConnectionStatus('error');
      return;
    }

    try {
      const dummyAddress = '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      setWalletAddress(dummyAddress);
      localStorage.setItem('walletAddress', dummyAddress);
      setIsLoggedIn(true);
      setWalletConnectionStatus('idle');
      setShowAccessOptions(false);
      navigate('home');
    } catch (error) {
      setWalletError("Wallet connection failed. Please ensure your wallet is unlocked and try again.");
      setWalletConnectionStatus('error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('user-logo');
    setIsLoggedIn(false);
    setWalletAddress(null);
    setWalletConnectionStatus('idle');
    navigate('home');
  };

  const getPageTitle = () => {
    switch (page) {
      case 'home': return 'VIRTUAL EXPERIENCES';
      case 'ai-assistant': return 'AI BUSINESS ASSISTANT';
      case 'digital-twins': return 'IMMERSIVE VENUES';
      case 'proof-of-work': return 'EXPERIENCE GALLERY';
      case 'ai-solutions': return 'BEHIND THE MAGIC';
      case 'login': return 'ACCOUNT LOGIN';
      case 'signup': return 'CREATE ACCOUNT';
      case 'control-room': return 'MY BOOKINGS';
      case 'user-profile': return 'MY PROFILE';
      case 'avatar-studio': return 'AVATAR STUDIO';
      case 'business-studio': return 'BUSINESS STUDIO';
      default: return 'BONA PARKS';
    }
  }
  
  const truncateAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-800 dark:text-slate-200 font-sans flex flex-col relative overflow-hidden">

      <header className="absolute top-0 left-0 right-0 p-6 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="container mx-auto flex justify-between items-center">
          <h1
            className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight cursor-pointer transition-colors hover:text-amber-600 dark:hover:text-amber-500"
            onClick={() => navigate('home')}
            aria-label="Back to home"
          >
            Bona Parks
          </h1>
          <div className="flex items-center space-x-4 md:space-x-6">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400 tracking-wide hidden sm:block">
              {getPageTitle()}
            </div>
            {isLoggedIn ? (
              <div className="relative" ref={menuRef}>
                {walletAddress ? (
                    <>
                        <button 
                            id="wallet-menu-button"
                            onClick={() => setShowWalletMenu(prev => !prev)} 
                            className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-fuchsia-500 dark:hover:text-fuchsia-400 transition-colors duration-300"
                            aria-haspopup="true"
                            aria-expanded={showWalletMenu}
                            aria-controls="wallet-menu"
                        >
                            <WalletIcon />
                            <span className="text-fuchsia-500 dark:text-fuchsia-300">{truncateAddress(walletAddress)}</span>
                        </button>
                        {showWalletMenu && (
                            <div 
                                id="wallet-menu"
                                className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-30 animate-fade-in" 
                                style={{ animationDuration: '0.2s' }}
                                role="menu"
                                aria-orientation="vertical"
                                aria-labelledby="wallet-menu-button"
                            >
                                <button onClick={() => { navigate('user-profile'); setShowWalletMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors" role="menuitem">
                                  My Profile
                                </button>
                                <button onClick={() => { navigate('avatar-studio'); setShowWalletMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors" role="menuitem">
                                  Avatar Studio
                                </button>
                                <button onClick={() => { navigate('business-studio'); setShowWalletMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors" role="menuitem">
                                  Business Studio
                                </button>
                                <button onClick={() => { navigate('control-room'); setShowWalletMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors" role="menuitem">
                                  My Bookings
                                </button>
                                <div className="border-t border-gray-200/50 dark:border-gray-700/50 mx-2"></div>
                                <button 
                                    onClick={() => { handleLogout(); setShowWalletMenu(false); }} 
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-fuchsia-500 dark:hover:text-fuchsia-400 transition-colors" role="menuitem">
                                  Disconnect Wallet
                                </button>
                            </div>
                        )}
                    </>
                ) : ( // Regular login
                     <>
                        <button 
                            id="user-menu-button"
                            onClick={() => setShowUserMenu(prev => !prev)} 
                            className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors duration-300"
                            aria-haspopup="true"
                            aria-expanded={showUserMenu}
                            aria-controls="user-menu"
                        >
                            <UserIcon />
                            <span>My Account</span>
                        </button>
                         {showUserMenu && (
                            <div 
                                id="user-menu"
                                className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-30 animate-fade-in" 
                                style={{ animationDuration: '0.2s' }}
                                role="menu"
                                aria-orientation="vertical"
                                aria-labelledby="user-menu-button"
                            >
                                <button onClick={() => { navigate('user-profile'); setShowUserMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors" role="menuitem">
                                  My Profile
                                </button>
                                <button onClick={() => { navigate('avatar-studio'); setShowUserMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors" role="menuitem">
                                  Avatar Studio
                                </button>
                                <button onClick={() => { navigate('business-studio'); setShowUserMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors" role="menuitem">
                                  Business Studio
                                </button>
                                <button onClick={() => { navigate('control-room'); setShowUserMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors" role="menuitem">
                                  My Bookings
                                </button>
                                <div className="border-t border-gray-200/50 dark:border-gray-700/50 mx-2"></div>
                                <button 
                                    onClick={() => { handleLogout(); setShowUserMenu(false); }} 
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-fuchsia-500 dark:hover:text-fuchsia-400 transition-colors" role="menuitem">
                                  Logout
                                </button>
                            </div>
                        )}
                     </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAccessOptions(true)}
                className="text-sm font-semibold bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 rounded-md hover:bg-amber-600 dark:hover:bg-amber-600 transition-colors duration-300 transform hover:scale-105"
              >
                LOGIN / ACCESS
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4 pt-24 pb-8">
        {page === 'home' && <HomePage onNavigate={navigate} isLoggedIn={isLoggedIn} />}
        {page === 'digital-twins' && <DigitalTwinsPage isLoggedIn={isLoggedIn} />}
        {page === 'proof-of-work' && <ProofOfWorkPage isLoggedIn={isLoggedIn} />}
        {page === 'ai-solutions' && <AISolutionsPage onNavigate={navigate} />}
        {page === 'login' && <LoginPage onLogin={handleLogin} onNavigate={navigate} />}
        {page === 'signup' && <SignUpPage onSignUp={handleSignUp} onNavigate={navigate} />}
        {page === 'control-room' && <ControlRoomPage bookings={bookings} onNavigate={navigate}/>}
        {page === 'user-profile' && <UserProfilePage walletAddress={walletAddress} handleLogout={handleLogout} />}
        {page === 'avatar-studio' && <AvatarStudioPage />}
      </main>

      {showAccessOptions && !isLoggedIn && (
        <LoginOptionsModal
            onClose={() => setShowAccessOptions(false)}
            onNavigate={navigate}
            onConnectWallet={connectWallet}
            walletStatus={walletConnectionStatus}
            walletError={walletError}
        />
      )}
      {showCookieBanner && (
        <CookieConsentBanner
          onAccept={() => handleCookieConsent(true)}
          onDecline={() => handleCookieConsent(false)}
        />
      )}
    </div>
  );
};

export default App;