import React, { useState } from 'react';
import { Page } from '../../App';
import { GoogleIcon } from '../IconComponents';
import { Button, Field, Panel } from '../ui';

const LoginPage: React.FC<{
  onLogin: () => void;
  onNavigate: (page: Page) => void;
}> = ({ onLogin, onNavigate }) => {
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
              <h1 className="font-display text-4xl leading-tight text-bone">Account login</h1>
              <p className="mt-3 text-sm text-muted">Access your tickets and experiences.</p>

              <button
                onClick={handleGoogleLogin}
                className="mt-8 flex w-full items-center justify-center gap-3 rounded-full border border-line bg-elev py-3 text-sm font-semibold text-bone transition-colors duration-300 hover:border-gold hover:text-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>

              <div className="my-8 flex items-center gap-4">
                <span className="h-px flex-grow bg-line" />
                <span className="text-[10px] uppercase tracking-widest2 text-muted">Or with email</span>
                <span className="h-px flex-grow bg-line" />
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-6">
                <Field
                  id="email"
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
                <Field
                  id="password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  action={
                    <button
                      type="button"
                      onClick={() => setView('forgot')}
                      className="text-[11px] font-semibold uppercase tracking-widest2 text-gold hover:text-bone"
                    >
                      Forgot?
                    </button>
                  }
                />
                <Button type="submit" disabled={!email || !password} className="w-full">
                  Sign in
                </Button>
              </form>
            </>
          )}

          {view === 'forgot' && (
            <>
              <h1 className="font-display text-4xl leading-tight text-bone">Reset password</h1>
              <p className="mt-3 text-sm text-muted">Enter your email to receive a reset link.</p>

              <form onSubmit={handlePasswordReset} className="mt-8 space-y-6">
                <Field
                  id="email-forgot"
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
                <Button type="submit" disabled={!email} className="w-full">
                  Send reset link
                </Button>
              </form>

              <button
                type="button"
                onClick={() => setView('login')}
                className="mt-6 text-sm text-muted transition-colors hover:text-gold"
              >
                &larr; Back to login
              </button>
            </>
          )}

          {view === 'forgotSuccess' && (
            <>
              <h1 className="font-display text-4xl leading-tight text-bone">Check your email</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                If an account exists for <span className="text-bone">{email}</span>, you will
                receive a password reset link.
              </p>
              <button
                type="button"
                onClick={() => setView('login')}
                className="mt-8 text-sm text-muted transition-colors hover:text-gold"
              >
                &larr; Back to login
              </button>
            </>
          )}
        </div>

        {view === 'login' && (
          <div className="border-t border-line bg-elev px-8 py-5 text-center text-sm md:px-10">
            <span className="text-muted">Don't have an account? </span>
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="font-semibold text-gold transition-colors hover:text-bone"
            >
              Create one
            </button>
          </div>
        )}
      </Panel>
    </div>
  );
};

export default LoginPage;
