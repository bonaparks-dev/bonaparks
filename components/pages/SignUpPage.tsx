import React, { useState } from 'react';
import { Page } from '../../App';
import { GoogleIcon } from '../IconComponents';
import { Button, Field, Panel } from '../ui';

interface SignUpPageProps {
  onSignUp: () => void;
  onNavigate: (page: Page) => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ onSignUp, onNavigate }) => {
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
          <h1 className="font-display text-4xl leading-tight text-bone">Create account</h1>
          <p className="mt-3 text-sm text-muted">Join the world of virtual experiences.</p>

          <button
            onClick={handleGoogleSignUp}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-full border border-line bg-elev py-3 text-sm font-semibold text-bone transition-colors duration-300 hover:border-gold hover:text-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <GoogleIcon />
            <span>Sign up with Google</span>
          </button>

          <div className="my-8 flex items-center gap-4">
            <span className="h-px flex-grow bg-line" />
            <span className="text-[10px] uppercase tracking-widest2 text-muted">Or with email</span>
            <span className="h-px flex-grow bg-line" />
          </div>

          <form onSubmit={handleSignUp} className="space-y-6">
            <Field
              id="email-signup"
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
            <Field
              id="password-signup"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
            <div>
              <Field
                id="confirm-password-signup"
                label="Confirm password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              {passwordsMismatch && (
                <p className="mt-2 text-xs text-gold">Passwords do not match.</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={!email || !password || password !== confirmPassword}
              className="w-full"
            >
              Create account
            </Button>
          </form>
        </div>

        <div className="border-t border-line bg-elev px-8 py-5 text-center text-sm md:px-10">
          <span className="text-muted">Already have an account? </span>
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="font-semibold text-gold transition-colors hover:text-bone"
          >
            Sign in
          </button>
        </div>
      </Panel>
    </div>
  );
};

export default SignUpPage;
