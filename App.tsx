import React, { useState, useEffect } from 'react';
import HomePage from './components/pages/HomePage';
import DigitalTwinsPage from './components/pages/DigitalTwinsPage';
import ProofOfWorkPage from './components/pages/ProofOfWorkPage';
import AISolutionsPage from './components/pages/AISolutionsPage';
import B2BHubPage from './components/pages/B2BHubPage';
import AvatarStudioPage from './components/pages/AvatarStudioPage';
import CookieConsentBanner from './components/CookieConsentBanner';
import ThemeSwitch from './components/ThemeSwitch';
import { useLanguage, Lang } from './i18n/LanguageContext';
import type { Dictionary } from './i18n/dictionary';

export type Page = 'home' | 'ai-assistant' | 'digital-twins' | 'proof-of-work' | 'ai-solutions' | 'avatar-studio' | 'business-studio';

const CONTACT_EMAIL = 'contact@bonaparks.com';

/**
 * Keys written by the old demo login, Web3 wallet and fake bookings.
 * Removed on load so returning visitors do not keep a dummy session around.
 */
const LEGACY_STORAGE_KEYS = ['authToken', 'walletAddress', 'user-logo', 'bona-parks-bookings'];

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
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  useEffect(() => {
    try {
      LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Storage can be blocked (private mode, disabled site data): nothing to clean.
    }

    const cookieConsent = localStorage.getItem('cookie-consent');
    if (!cookieConsent) {
      setShowCookieBanner(true);
    }
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

  return (
    <div className="relative flex min-h-screen flex-col bg-ink font-sans text-bone">

      <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 sm:gap-6 sm:px-6 py-5 md:px-10">
          <button
            onClick={() => navigate('home')}
            className="inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg font-display text-xl leading-none sm:gap-3 sm:text-2xl tracking-tight text-bone transition-colors hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-ink"
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
                className={`text-xs font-semibold transition-colors ${
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
              className="flex items-center gap-1.5 text-xs font-semibold text-line"
              role="group"
              aria-label={t.nav.language}
            >
              {LANGUAGES.map((code, index) => (
                <React.Fragment key={code}>
                  {index > 0 && <span aria-hidden="true">|</span>}
                  <button
                    onClick={() => setLang(code)}
                    lang={code}
                    className={`rounded px-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink ${lang === code ? 'text-accent' : 'text-muted hover:text-bone'}`}
                    aria-pressed={lang === code}
                  >
                    {code.toUpperCase()}
                  </button>
                </React.Fragment>
              ))}
            </div>

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
                className={`block w-full py-3 text-left text-sm font-semibold ${
                  page === link.page ? 'text-accent' : 'text-muted'
                }`}
              >
                {link.label}
              </button>
            ))}
            <div className="mt-3 border-t border-line pt-4">
              <ThemeSwitch />
            </div>
          </nav>
        )}
      </header>

      <main className="relative z-10 flex-grow py-16 md:py-24">
        {page === 'home' && <HomePage onNavigate={navigate} />}
        {page === 'digital-twins' && <DigitalTwinsPage />}
        {page === 'proof-of-work' && <ProofOfWorkPage />}
        {page === 'ai-solutions' && <AISolutionsPage onNavigate={navigate} />}
        {page === 'business-studio' && <B2BHubPage />}
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
            <p className="text-[13px] font-semibold text-accent">{t.footer.explore}</p>
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
            <p className="text-[13px] font-semibold text-accent">{t.footer.contact}</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-4 block text-sm text-muted transition-colors hover:text-bone"
            >
              {CONTACT_EMAIL}
            </a>
            <p className="mt-2 text-sm text-muted">{t.footer.location}</p>
            <p className="mt-6 text-[13px] font-semibold text-accent">{t.footer.app}</p>
            <a href={t.footer.appPrivacyHref} className="mt-3 block text-sm text-muted transition-colors hover:text-bone">{t.footer.appPrivacy}</a>
            <a href={t.footer.appSupportHref} className="mt-2 block text-sm text-muted transition-colors hover:text-bone">{t.footer.appSupport}</a>
          </div>
        </div>

        <div className="border-t border-line">
          <div className="mx-auto flex max-w-7xl flex-col-reverse items-center justify-between gap-4 px-6 py-6 sm:flex-row md:px-10">
            <p className="text-xs text-muted">
              &copy; {new Date().getFullYear()} Bona Parks. {t.footer.rights}
            </p>
            <ThemeSwitch />
          </div>
        </div>
      </footer>

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
