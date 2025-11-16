import React, { useState } from 'react';
import { Page } from '../../App';
import { GoogleIcon } from '../IconComponents';

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
    <div className="w-full max-w-md animate-fade-in">
      <div className="bg-white/70 dark:bg-black/50 backdrop-blur-lg rounded-xl shadow-2xl shadow-cyan-500/10 border border-gray-200 dark:border-gray-700/50 overflow-hidden">
        <div className="p-8">
          {view === 'login' && (
            <>
              <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white tracking-wider mb-2">
                Account Login
              </h2>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                Access your tickets and experiences.
              </p>
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center space-x-3 py-3 mb-6 rounded-lg font-semibold bg-white/90 text-gray-800 hover:bg-white border border-gray-300 dark:border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-cyan-400 transition-all duration-300"
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400 text-xs uppercase">Or with email</span>
                <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <form onSubmit={handleEmailLogin} className="space-y-6 mt-4">
                <div>
                  <label htmlFor="email" className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-gray-100 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none transition-all duration-300"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label
                      htmlFor="password"
                      className="text-sm font-bold text-gray-700 dark:text-gray-300"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setView('forgot')}
                      className="text-xs font-medium text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-gray-100 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none transition-all duration-300"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!email || !password}
                  className="w-full py-3 rounded-lg font-semibold bg-cyan-500 text-white hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-cyan-400 transition-all duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                >
                  SIGN IN
                </button>
              </form>
            </>
          )}

          {view === 'forgot' && (
             <>
                <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white tracking-wider mb-2">
                    Reset Password
                </h2>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
                    Enter your email to receive a reset link.
                </p>
                <form onSubmit={handlePasswordReset} className="space-y-6">
                    <div>
                        <label htmlFor="email-forgot" className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">
                            Email Address
                        </label>
                        <input
                            id="email-forgot"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-gray-100 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none transition-all duration-300"
                            placeholder="you@example.com"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!email}
                        className="w-full py-3 rounded-lg font-semibold bg-cyan-500 text-white hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-cyan-400 transition-all duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        Send Reset Link
                    </button>
                </form>
                 <div className="text-center mt-6">
                    <button type="button" onClick={() => setView('login')} className="font-medium text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 text-sm">
                        &larr; Back to Login
                    </button>
                </div>
             </>
          )}

          {view === 'forgotSuccess' && (
               <div className="text-center">
                    <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white tracking-wider mb-2">
                        Check Your Email
                    </h2>
                    <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
                        If an account exists for <span className="font-semibold text-gray-800 dark:text-white">{email}</span>, you will receive a password reset link.
                    </p>
                    <button type="button" onClick={() => setView('login')} className="font-medium text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 text-sm">
                         &larr; Back to Login
                    </button>
                </div>
          )}
        </div>
        
        {view === 'login' && (
            <div className="bg-gray-100 dark:bg-gray-900/50 px-8 py-4 text-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Don't have an account? </span>
                <button
                    type="button"
                    onClick={() => onNavigate('signup')}
                    className="font-medium text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300"
                >
                    Create one
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;