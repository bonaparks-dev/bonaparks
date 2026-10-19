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
import { useLanguage, Lang } from './i18n/LanguageContext';
import type { Dictionary } from './i18n/dictionary';

export type Page = 'home' | 'ai-assistant' | 'digital-twins' | 'proof-of-work' | 'ai-solutions' | 'login' | 'signup' | 'control-room' | 'user-profile' | 'avatar-studio' | 'business-studio';

type WalletConnectionStatus = 'idle' | 'connecting' | 'error';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const CONTACT_EMAIL = 'contact@bonaparks.com';

/** Main navigation, always visible. */
const navLinks = (t: Dictionary): { page: Page; label: string }[] => [
  { page: 'home', label: t.nav.tours },
  { page: 'proof-of-work', label: t.nav.gallery },
  { page: 'digital-twins', label: t.nav.venues },
  { page: 'ai-solutions', label: t.nav.technology },
  { page: 'business-studio', label: t.nav.business },
];

const LANGUAGES: Lang[] = ['fr', 'en'];

const App: React.FC = () => {
  const { lang, setLang, t } = useLanguage();
  const NAV_LINKS = navLinks(t);
  const [page, setPage] = useState<Page>('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [walletConnectionStatus, setWalletConnectionStatus] = useState<WalletConnectionStatus>('idle');
  const [walletError, setWalletError] = useState<keyof Dictionary['wallet'] | null>(null);
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
      setWalletError('notDetected');
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
      setWalletError('failed');
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
    { page: 'user-profile', label: t.account.myProfile },
    { page: 'avatar-studio', label: 'Avatar Studio' },
    { page: 'business-studio', label: 'Business Studio' },
    { page: 'control-room', label: t.account.myBookings },
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
            aria-label={t.nav.backHome}
          >
            <img src="/brand/bonaparks-icon.svg" alt="" width={36} height={36} className="h-9 w-9 rounded-[22.5%] ring-1 ring-line" />
            Bona Parks
          </button>

          <nav className="hidden items-center gap-8 lg:flex" aria-label={t.nav.main}>
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
            <div
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest2 text-line"
              role="group"
              aria-label={t.nav.language}
            >
              {LANGUAGES.map((code, index) => (
                <React.Fragment key={code}>
                  {index > 0 && <span aria-hidden="true">|</span>}
                  <button
                    onClick={() => setLang(code)}
                    lang={code}
                    className={`transition-colors ${lang === code ? 'text-gold' : 'text-muted hover:text-bone'}`}
                    aria-pressed={lang === code}
                  >
                    {code.toUpperCase()}
                  </button>
                </React.Fragment>
              ))}
            </div>

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
                    {showWalletMenu && renderAccountMenu('wallet-menu', () => setShowWalletMenu(false), t.account.disconnectWallet)}
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
                      <span className="hidden sm:inline">{t.account.myAccount}</span>
                    </button>
                    {showUserMenu && renderAccountMenu('user-menu', () => setShowUserMenu(false), t.account.logOut)}
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAccessOptions(true)}
                className="rounded-full border border-line px-5 py-2 text-xs font-semibold uppercase tracking-widest2 text-bone transition-colors duration-300 hover:border-accent hover:text-accent"
              >
                {t.account.login}
              </button>
            )}

            <button
              onClick={() => setShowMobileNav(prev => !prev)}
              className="text-muted transition-colors hover:text-bone lg:hidden"
              aria-expanded={showMobileNav}
              aria-controls="mobile-nav"
              aria-label={t.nav.toggle}
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
          <nav id="mobile-nav" className="border-t border-line px-6 py-4 lg:hidden" aria-label={t.nav.mainMobile}>
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
              {t.footer.tagline}
            </p>
          </div>

          <nav aria-label={t.footer.label}>
            <p className="text-[11px] font-semibold uppercase tracking-widest2 text-accent">{t.footer.explore}</p>
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
            <p className="text-[11px] font-semibold uppercase tracking-widest2 text-accent">{t.footer.contact}</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-4 block text-sm text-muted transition-colors hover:text-bone"
            >
              {CONTACT_EMAIL}
            </a>
            <p className="mt-2 text-sm text-muted">{t.footer.location}</p>
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-widest2 text-accent">{t.footer.app}</p>
            <a href={t.footer.appPrivacyHref} className="mt-3 block text-sm text-muted transition-colors hover:text-bone">{t.footer.appPrivacy}</a>
            <a href={t.footer.appSupportHref} className="mt-2 block text-sm text-muted transition-colors hover:text-bone">{t.footer.appSupport}</a>
          </div>
        </div>

        <div className="border-t border-line px-6 py-6 text-center md:px-10">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} Bona Parks. {t.footer.rights}
          </p>
        </div>
      </footer>

      {showAccessOptions && !isLoggedIn && (
        <LoginOptionsModal
            onClose={() => setShowAccessOptions(false)}
            onNavigate={navigate}
            onConnectWallet={connectWallet}
            walletStatus={walletConnectionStatus}
            walletError={walletError ? t.wallet[walletError] : null}
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
