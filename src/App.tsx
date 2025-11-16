
import React, { useState, useEffect, useRef } from 'react';
import HomePage from './pages/HomePage';
import ConciergePage from './pages/ConciergePage';
import DigitalTwinsPage from './pages/DigitalTwinsPage';
import ProofOfWorkPage from './pages/ProofOfWorkPage';
import AISolutionsPage from './pages/AISolutionsPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ControlRoomPage from './pages/ControlRoomPage';
import { Booking } from './types';
import { WalletIcon } from './components/IconComponents';
import LoginOptionsModal from './components/LoginOptionsModal';

export type Page = 'home' | 'concierge' | 'digital-twins' | 'proof-of-work' | 'ai-solutions' | 'login' | 'signup' | 'control-room';

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
  const [showLogoutOptions, setShowLogoutOptions] = useState(false);
  const [showAccessOptions, setShowAccessOptions] = useState(false);
  const logoutMenuRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedWalletAddress = localStorage.getItem('walletAddress');
    
    if (token || storedWalletAddress) {
      setIsLoggedIn(true);
      const storedBookings = localStorage.getItem('bona-parks-bookings');
      if (storedBookings) {
        setBookings(JSON.parse(storedBookings));
      } else {
          // FIX: Add `type` and `bookingDate` to dummy booking data to match the updated Booking interface.
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
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (logoutMenuRef.current && !logoutMenuRef.current.contains(event.target as Node)) {
            setShowLogoutOptions(false);
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    setIsLoggedIn(false);
    setWalletAddress(null);
    setWalletConnectionStatus('idle');
    navigate('home');
  };

  const getPageTitle = () => {
    switch (page) {
      case 'home': return 'VIRTUAL EXPERIENCES';
      case 'concierge': return 'AI CONCIERGE';
      case 'digital-twins': return 'IMMERSIVE VENUES';
      case 'proof-of-work': return 'EXPERIENCE GALLERY';
      case 'ai-solutions': return 'BEHIND THE MAGIC';
      case 'login': return 'ACCOUNT LOGIN';
      case 'signup': return 'CREATE ACCOUNT';
      case 'control-room': return 'MY BOOKINGS';
      default: return 'BONA PARKS';
    }
  }
  
  const truncateAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-gray-200 font-sans flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre-v2.png')] opacity-5"></div>
      
      <header className="absolute top-0 left-0 right-0 p-6 z-20 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto flex justify-between items-center">
          <h1 
            className="text-2xl font-bold text-white tracking-widest uppercase cursor-pointer transition-colors hover:text-cyan-300" 
            style={{ textShadow: '0 0 10px rgba(0, 255, 255, 0.7), 0 0 20px rgba(0, 255, 255, 0.5)' }}
            onClick={() => navigate('home')}
            aria-label="Back to home"
          >
            Bona Parks
          </h1>
          <div className="flex items-center space-x-4 md:space-x-6">
            <div className="text-sm font-light text-cyan-300 tracking-wider hidden sm:block">
              {getPageTitle()}
            </div>
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                 <button onClick={() => navigate('control-room')} className="text-sm font-semibold text-gray-300 hover:text-cyan-400 transition-colors duration-300">
                  MY BOOKINGS
                </button>
                {walletAddress ? (
                    <div className="relative" ref={logoutMenuRef}>
                        <button 
                            id="wallet-menu-button"
                            onClick={() => setShowLogoutOptions(prev => !prev)} 
                            className="flex items-center space-x-2 text-sm font-semibold text-gray-300 hover:text-fuchsia-400 transition-colors duration-300"
                            aria-haspopup="true"
                            aria-expanded={showLogoutOptions}
                            aria-controls="wallet-menu"
                        >
                            <WalletIcon />
                            <span className="text-fuchsia-300">{truncateAddress(walletAddress)}</span>
                        </button>
                        {showLogoutOptions && (
                            <div 
                                id="wallet-menu"
                                className="absolute top-full right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-30 animate-fade-in" 
                                style={{ animationDuration: '0.2s' }}
                                role="menu"
                                aria-orientation="vertical"
                                aria-labelledby="wallet-menu-button"
                            >
                                <button 
                                    onClick={() => { handleLogout(); setShowLogoutOptions(false); }} 
                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-fuchsia-400 transition-colors"
                                    role="menuitem"
                                >
                                    Disconnect Wallet
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <button onClick={handleLogout} className="text-sm font-semibold text-gray-300 hover:text-fuchsia-400 transition-colors duration-300">
                        LOGOUT
                    </button>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setShowAccessOptions(true)} 
                className="text-sm font-semibold bg-cyan-500 text-white px-4 py-2 rounded-md hover:bg-cyan-400 transition-colors duration-300 transform hover:scale-105"
              >
                LOGIN
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4 pt-24 pb-8">
        {page === 'home' && <HomePage onNavigate={navigate} isLoggedIn={isLoggedIn} />}
        {page === 'concierge' && <ConciergePage />}
        {page === 'digital-twins' && <DigitalTwinsPage isLoggedIn={isLoggedIn} />}
        {page === 'proof-of-work' && <ProofOfWorkPage isLoggedIn={isLoggedIn} />}
        {page === 'ai-solutions' && <AISolutionsPage onNavigate={navigate} />}
        {page === 'login' && <LoginPage onLogin={handleLogin} onNavigate={navigate} />}
        {page === 'signup' && <SignUpPage onSignUp={handleSignUp} onNavigate={navigate} />}
        {page === 'control-room' && <ControlRoomPage bookings={bookings} onNavigate={navigate}/>}
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
    </div>
  );
};

export default App;
