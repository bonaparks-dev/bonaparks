import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface CookieConsentBannerProps {
  onAccept: () => void;
  onDecline: () => void;
}

const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onAccept, onDecline }) => {
  const { t } = useLanguage();
  return (
  <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-ink/95 backdrop-blur-xl">
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-6 py-5 sm:flex-row md:px-10">
      <p className="text-center text-sm leading-relaxed text-muted sm:text-left">
        {t.cookies.text}
      </p>
      <div className="flex flex-shrink-0 items-center gap-3">
        <button
          onClick={onAccept}
          className="rounded-full bg-gold px-6 py-2.5 text-xs font-semibold uppercase tracking-widest2 text-ink transition-colors duration-300 hover:bg-bone"
        >
          {t.cookies.accept}
        </button>
        <button
          onClick={onDecline}
          className="rounded-full border border-line px-6 py-2.5 text-xs font-semibold uppercase tracking-widest2 text-muted transition-colors duration-300 hover:border-gold hover:text-gold"
        >
          {t.cookies.decline}
        </button>
      </div>
    </div>
  </div>
  );
};

export default CookieConsentBanner;
