import React, { useState } from 'react';
import { Page } from '../../App';
import { GoogleIcon } from '../IconComponents';
import { Button, Field, Panel } from '../ui';
import { useLanguage } from '../../i18n/LanguageContext';

const LoginPage: React.FC<{
  onLogin: () => void;
  onNavigate: (page: Page) => void;
}> = ({ onLogin, onNavigate }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState<'login' | 'forgot' | 'forgotSuccess'>('login');

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin();
    }
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setView('forgotSuccess');
    }
  };

  const handleGoogleLogin = () => {
    // In a real app, this would trigger the Google OAuth flow.
    // For this demo, we'll just call the main login handler.
    onLogin();
  };

  return (
    <div className="animate-fade-in mx-auto w-full max-w-md px-6">
      <Panel className="overflow-hidden">
        <div className="p-8 md:p-10">
          {view === 'login' && (
            <>
              <h1 className="font-display text-4xl leading-tight text-bone">{t.auth.loginTitle}</h1>
              <p className="mt-3 text-sm text-muted">{t.auth.loginIntro}</p>

              <button
                onClick={handleGoogleLogin}
                className="mt-8 flex w-full items-center justify-center gap-3 rounded-full border border-line bg-elev py-3 text-sm font-semibold text-bone transition-colors duration-300 hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <GoogleIcon />
                <span>{t.auth.google}</span>
              </button>

              <div className="my-8 flex items-center gap-4">
                <span className="h-px flex-grow bg-line" />
                <span className="text-xs text-muted">{t.auth.orEmail}</span>
                <span className="h-px flex-grow bg-line" />
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-6">
                <Field
                  id="email"
                  label={t.auth.email}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t.auth.emailPlaceholder}
                />
                <Field
                  id="password"
                  label={t.auth.password}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  action={
                    <button
                      type="button"
                      onClick={() => setView('forgot')}
                      className="text-[13px] font-semibold text-accent hover:text-bone"
                    >
                      {t.auth.forgot}
                    </button>
                  }
                />
                <Button type="submit" disabled={!email || !password} className="w-full">
                  {t.auth.signIn}
                </Button>
              </form>
            </>
          )}

          {view === 'forgot' && (
            <>
              <h1 className="font-display text-4xl leading-tight text-bone">{t.auth.resetTitle}</h1>
              <p className="mt-3 text-sm text-muted">{t.auth.resetIntro}</p>

              <form onSubmit={handlePasswordReset} className="mt-8 space-y-6">
                <Field
                  id="email-forgot"
                  label={t.auth.email}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t.auth.emailPlaceholder}
                />
                <Button type="submit" disabled={!email} className="w-full">
                  {t.auth.sendReset}
                </Button>
              </form>

              <button
                type="button"
                onClick={() => setView('login')}
                className="mt-6 text-sm text-muted transition-colors hover:text-accent"
              >
                &larr; {t.auth.backToLogin}
              </button>
            </>
          )}

          {view === 'forgotSuccess' && (
            <>
              <h1 className="font-display text-4xl leading-tight text-bone">{t.auth.checkTitle}</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {t.auth.checkBefore}<span className="text-bone">{email}</span>{t.auth.checkAfter}
              </p>
              <button
                type="button"
                onClick={() => setView('login')}
                className="mt-8 text-sm text-muted transition-colors hover:text-accent"
              >
                &larr; {t.auth.backToLogin}
              </button>
            </>
          )}
        </div>

        {view === 'login' && (
          <div className="border-t border-line bg-elev px-8 py-5 text-center text-sm md:px-10">
            <span className="text-muted">{t.auth.noAccount}</span>
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="font-semibold text-accent transition-colors hover:text-bone"
            >
              {t.auth.createOne}
            </button>
          </div>
        )}
      </Panel>
    </div>
  );
};

export default LoginPage;
