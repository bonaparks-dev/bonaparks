import React, { useState, useEffect, useRef } from 'react';
import HomePage from './components/pages/HomePage';
import DigitalTwinsPage from './components/pages/DigitalTwinsPage';
import ProofOfWorkPage from './components/pages/ProofOfWorkPage';
import AISolutionsPage from './components/pages/AISolutionsPage';
import B2BHubPage from './components/pages/B2BHubPage';
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

const CONTACT_EMAIL = 'contact@bonaparks.com';

/** Main navigation, always visible. */
const NAV_LINKS: { page: Page; label: string }[] = [
  { page: 'home', label: 'Tours' },
  { page: 'proof-of-work', label: 'Gallery' },
  { page: 'digital-twins', label: 'Venues' },
  { page: 'ai-solutions', label: 'Technology' },
  { page: 'business-studio', label: 'For business' },
];

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
  const [showMobileNav, setShowMobileNav] = useState(false);
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
    setShowMobileNav(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
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

  const truncateAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  const accountMenuItems: { page: Page; label: string }[] = [
    { page: 'user-profile', label: 'My profile' },
    { page: 'avatar-studio', label: 'Avatar Studio' },
    { page: 'business-studio', label: 'Business Studio' },
    { page: 'control-room', label: 'My bookings' },
  ];

  const renderAccountMenu = (id: string, close: () => void, logoutLabel: string) => (
    <div
      id={id}
      className="absolute right-0 top-full z-30 mt-3 w-52 overflow-hidden rounded-xl border border-line bg-surface shadow-2xl shadow-black/60 animate-fade-in"
      style={{ animationDuration: '0.2s' }}
      role="menu"
      aria-orientation="vertical"
    >
      {accountMenuItems.map((entry) => (
        <button
          key={entry.page}
          onClick={() => { navigate(entry.page); close(); }}
          className="block w-full px-5 py-3 text-left text-sm text-muted transition-colors hover:bg-elev hover:text-bone"
          role="menuitem"
        >
          {entry.label}
        </button>
      ))}
      <div className="mx-5 border-t border-line" />
      <button
        onClick={() => { handleLogout(); close(); }}
        className="block w-full px-5 py-3 text-left text-sm text-muted transition-colors hover:bg-elev hover:text-accent"
        role="menuitem"
      >
        {logoutLabel}
      </button>
    </div>
  );

  return (
    <div className="relative flex min-h-screen flex-col bg-ink font-sans text-bone">

      <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5 md:px-10">
          <button
            onClick={() => navigate('home')}
            className="inline-flex items-center gap-3 rounded-lg font-display text-2xl leading-none tracking-tight text-bone transition-colors hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-ink"
            aria-label="Back to home"
          >
            <img src="/brand/bonaparks-icon.svg" alt="" width={36} height={36} className="h-9 w-9 rounded-[22.5%] ring-1 ring-line" />
            Bona Parks
          </button>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
            {NAV_LINKS.map((link) => (
              <button
                key={link.page}
                onClick={() => navigate(link.page)}
                className={`text-xs font-semibold uppercase tracking-widest2 transition-colors ${
                  page === link.page ? 'text-accent' : 'text-muted hover:text-bone'
                }`}
                aria-current={page === link.page ? 'page' : undefined}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <div className="relative" ref={menuRef}>
                {walletAddress ? (
                  <>
                    <button
                      id="wallet-menu-button"
                      onClick={() => setShowWalletMenu(prev => !prev)}
                      className="flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-accent"
                      aria-haspopup="true"
                      aria-expanded={showWalletMenu}
                      aria-controls="wallet-menu"
                    >
                      <WalletIcon />
                      <span className="text-accent">{truncateAddress(walletAddress)}</span>
                    </button>
                    {showWalletMenu && renderAccountMenu('wallet-menu', () => setShowWalletMenu(false), 'Disconnect wallet')}
                  </>
                ) : (
                  <>
                    <button
                      id="user-menu-button"
                      onClick={() => setShowUserMenu(prev => !prev)}
                      className="flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-accent"
                      aria-haspopup="true"
                      aria-expanded={showUserMenu}
                      aria-controls="user-menu"
                    >
                      <UserIcon />
                      <span className="hidden sm:inline">My account</span>
                    </button>
                    {showUserMenu && renderAccountMenu('user-menu', () => setShowUserMenu(false), 'Log out')}
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAccessOptions(true)}
                className="rounded-full border border-line px-5 py-2 text-xs font-semibold uppercase tracking-widest2 text-bone transition-colors duration-300 hover:border-accent hover:text-accent"
              >
                Login
              </button>
            )}

            <button
              onClick={() => setShowMobileNav(prev => !prev)}
              className="text-muted transition-colors hover:text-bone lg:hidden"
              aria-expanded={showMobileNav}
              aria-controls="mobile-nav"
              aria-label="Toggle navigation"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                {showMobileNav
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5h16.5M3.75 16.5h16.5" />}
              </svg>
            </button>
          </div>
        </div>

        {showMobileNav && (
          <nav id="mobile-nav" className="border-t border-line px-6 py-4 lg:hidden" aria-label="Main mobile">
            {NAV_LINKS.map((link) => (
              <button
                key={link.page}
                onClick={() => navigate(link.page)}
                className={`block w-full py-3 text-left text-sm font-semibold uppercase tracking-widest2 ${
                  page === link.page ? 'text-accent' : 'text-muted'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main className="relative z-10 flex-grow py-16 md:py-24">
        {page === 'home' && <HomePage onNavigate={navigate} isLoggedIn={isLoggedIn} />}
        {page === 'digital-twins' && <DigitalTwinsPage isLoggedIn={isLoggedIn} />}
        {page === 'proof-of-work' && <ProofOfWorkPage isLoggedIn={isLoggedIn} />}
        {page === 'ai-solutions' && <AISolutionsPage onNavigate={navigate} />}
        {page === 'business-studio' && <B2BHubPage />}
        {page === 'login' && <LoginPage onLogin={handleLogin} onNavigate={navigate} />}
        {page === 'signup' && <SignUpPage onSignUp={handleSignUp} onNavigate={navigate} />}
        {page === 'control-room' && <ControlRoomPage bookings={bookings} onNavigate={navigate}/>}
        {page === 'user-profile' && <UserProfilePage walletAddress={walletAddress} handleLogout={handleLogout} />}
        {page === 'avatar-studio' && <AvatarStudioPage />}
      </main>

      <footer className="relative z-10 border-t border-line">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-3 md:px-10">
          <div>
            <p className="flex items-center gap-3 font-display text-2xl text-bone">
              <img src="/brand/bonaparks-icon.svg" alt="" width={36} height={36} className="h-9 w-9 rounded-[22.5%] ring-1 ring-line" />
              Bona Parks
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              Immersive 3D tours and digital twins of the places that deserve to be walked
              through, from anywhere.
            </p>
          </div>

          <nav aria-label="Footer">
            <p className="text-[11px] font-semibold uppercase tracking-widest2 text-accent">Explore</p>
            <div className="mt-4 space-y-2">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.page}
                  onClick={() => navigate(link.page)}
                  className="block text-sm text-muted transition-colors hover:text-bone"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </nav>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest2 text-accent">Get in touch</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-4 block text-sm text-muted transition-colors hover:text-bone"
            >
              {CONTACT_EMAIL}
            </a>
            <p className="mt-2 text-sm text-muted">Sardinia, Italy</p>
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-widest2 text-accent">Bonaparks app</p>
            <a href="/confidentialite" lang="fr" className="mt-3 block text-sm text-muted transition-colors hover:text-bone">Confidentialité</a>
            <a href="/support" lang="fr" className="mt-2 block text-sm text-muted transition-colors hover:text-bone">Support</a>
          </div>
        </div>

        <div className="border-t border-line px-6 py-6 text-center md:px-10">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} Bona Parks. All rights reserved.
          </p>
        </div>
      </footer>

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
