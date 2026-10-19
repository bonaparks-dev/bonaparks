import React, { useState } from 'react';
import { Page } from '../../App';
import { GoogleIcon } from '../IconComponents';
import { Button, Field, Panel } from '../ui';
import { useLanguage } from '../../i18n/LanguageContext';

interface SignUpPageProps {
  onSignUp: () => void;
  onNavigate: (page: Page) => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ onSignUp, onNavigate }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const passwordsMismatch = Boolean(password && confirmPassword && password !== confirmPassword);

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password && password === confirmPassword) {
      onSignUp();
    }
  };

  const handleGoogleSignUp = () => {
    // In a real app, this would trigger the Google OAuth flow.
    // For this demo, we'll just call the main signup handler.
    onSignUp();
  };

  return (
    <div className="animate-fade-in mx-auto w-full max-w-md px-6">
      <Panel className="overflow-hidden">
        <div className="p-8 md:p-10">
          <h1 className="font-display text-4xl leading-tight text-bone">{t.auth.signupTitle}</h1>
          <p className="mt-3 text-sm text-muted">{t.auth.signupIntro}</p>

          <button
            onClick={handleGoogleSignUp}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-full border border-line bg-elev py-3 text-sm font-semibold text-bone transition-colors duration-300 hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <GoogleIcon />
            <span>{t.auth.googleSignup}</span>
          </button>

          <div className="my-8 flex items-center gap-4">
            <span className="h-px flex-grow bg-line" />
            <span className="text-[10px] uppercase tracking-widest2 text-muted">{t.auth.orEmail}</span>
            <span className="h-px flex-grow bg-line" />
          </div>

          <form onSubmit={handleSignUp} className="space-y-6">
            <Field
              id="email-signup"
              label={t.auth.email}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t.auth.emailPlaceholder}
            />
            <Field
              id="password-signup"
              label={t.auth.password}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
            <div>
              <Field
                id="confirm-password-signup"
                label={t.auth.confirmPassword}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              {passwordsMismatch && (
                <p className="mt-2 text-xs text-accent">{t.auth.mismatch}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={!email || !password || password !== confirmPassword}
              className="w-full"
            >
              {t.auth.createAccount}
            </Button>
          </form>
        </div>

        <div className="border-t border-line bg-elev px-8 py-5 text-center text-sm md:px-10">
          <span className="text-muted">{t.auth.haveAccount}</span>
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="font-semibold text-accent transition-colors hover:text-bone"
          >
            {t.auth.signIn}
          </button>
        </div>
      </Panel>
    </div>
  );
};

export default SignUpPage;
