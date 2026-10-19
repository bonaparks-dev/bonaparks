import React, { useEffect } from 'react';
import { Page } from '../App';
import { WalletIcon, LoadingIcon, EmailIcon, UserPlusIcon } from './IconComponents';
import { useLanguage } from '../i18n/LanguageContext';

type WalletConnectionStatus = 'idle' | 'connecting' | 'error';

interface LoginOptionsModalProps {
  onClose: () => void;
  onNavigate: (page: Page) => void;
  onConnectWallet: () => void;
  walletStatus: WalletConnectionStatus;
  walletError: string | null;
}

const optionClasses =
  'flex w-full items-center justify-center gap-3 rounded-full border border-line bg-elev py-3.5 text-sm font-semibold text-bone transition-colors duration-300 hover:border-gold hover:text-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-wait disabled:opacity-60';

const LoginOptionsModal: React.FC<LoginOptionsModalProps> = ({
  onClose,
  onNavigate,
  onConnectWallet,
  walletStatus,
  walletError,
}) => {
  const { t } = useLanguage();
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleNavigation = (page: Page) => {
    onNavigate(page);
    onClose();
  };

  const isConnecting = walletStatus === 'connecting';

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-4 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-options-title"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-muted transition-colors hover:text-bone"
          aria-label={t.access.close}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8 md:p-10">
          <h2 id="login-options-title" className="font-display text-4xl leading-tight text-bone">
            {t.access.title}
          </h2>
          <p className="mt-3 text-sm text-muted">{t.access.intro}</p>

          <div className="mt-8 space-y-3">
            <button onClick={onConnectWallet} disabled={isConnecting} className={optionClasses}>
              {isConnecting ? <LoadingIcon /> : <WalletIcon className="h-5 w-5" />}
              <span>
                {
                  {
                    idle: t.access.walletIdle,
                    connecting: t.access.walletConnecting,
                    error: t.access.walletRetry,
                  }[walletStatus]
                }
              </span>
            </button>

            {walletStatus === 'error' && walletError && (
              <p className="text-center text-xs leading-relaxed text-gold">{walletError}</p>
            )}

            <button onClick={() => handleNavigation('login')} className={optionClasses}>
              <EmailIcon />
              <span>{t.access.email}</span>
            </button>

            <button onClick={() => handleNavigation('signup')} className={optionClasses}>
              <UserPlusIcon className="h-5 w-5" />
              <span>{t.access.signup}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginOptionsModal;
