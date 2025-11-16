import React, { useState } from 'react';
import { Page } from '../../App';
import { GoogleIcon } from '../IconComponents';

interface SignUpPageProps {
  onSignUp: () => void;
  onNavigate: (page: Page) => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ onSignUp, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
    <div className="w-full max-w-md animate-fade-in">
      <div className="bg-white/70 dark:bg-black/50 backdrop-blur-lg rounded-xl shadow-2xl shadow-cyan-500/10 border border-gray-200 dark:border-gray-700/50 overflow-hidden">
        <div className="p-8">
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white tracking-wider mb-2">
            Create Account
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            Join the world of virtual experiences.
          </p>
          <button
            onClick={handleGoogleSignUp}
            className="w-full flex items-center justify-center space-x-3 py-3 mb-6 rounded-lg font-semibold bg-white/90 text-gray-800 hover:bg-white border border-gray-300 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-cyan-400 transition-all duration-300"
          >
            <GoogleIcon />
            <span>Sign up with Google</span>
          </button>
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400 text-xs uppercase">Or with email</span>
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <form onSubmit={handleSignUp} className="space-y-6 mt-4">
            <div>
              <label htmlFor="email-signup" className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">
                Email Address
              </label>
              <input
                id="email-signup"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-gray-100 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none transition-all duration-300"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label
                htmlFor="password-signup"
                className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2"
              >
                Password
              </label>
              <input
                id="password-signup"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-gray-100 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none transition-all duration-300"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label
                htmlFor="confirm-password-signup"
                className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirm-password-signup"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-gray-100 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none transition-all duration-300"
                placeholder="••••••••"
              />
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-2">Passwords do not match.</p>
              )}
            </div>
            <button
              type="submit"
              disabled={!email || !password || password !== confirmPassword}
              className="w-full py-3 rounded-lg font-semibold bg-cyan-500 text-white hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-cyan-400 transition-all duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
            >
              CREATE ACCOUNT
            </button>
          </form>
        </div>
        <div className="bg-gray-100 dark:bg-gray-900/50 px-8 py-4 text-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">Already have an account? </span>
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="font-medium text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;