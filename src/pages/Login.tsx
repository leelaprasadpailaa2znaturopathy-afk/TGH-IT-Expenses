import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const DEMO_PASSWORD = 'password123';

export const Login: React.FC<LoginProps> = ({ onLogin, users, theme, onToggleTheme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (authenticated) {
      const timer = setTimeout(() => {
        onLogin(users.find((u) => u.email === email) || users[0]);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [authenticated, email, users, onLogin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const user = users.find((u) => u.email === email);

    if (!user) {
      setError('Account not found for this email address.');
      return;
    }

    if (password !== DEMO_PASSWORD) {
      setError('Incorrect password. Please try again.');
      return;
    }

    setIsLoading(true);
    setAuthenticated(true);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Navbar */}
      <nav className="h-16 px-6 sm:px-12 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight">IT Resource ERP</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Central Ledger &amp; Asset Management</p>
          </div>
        </div>

        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
        >
          {theme === 'dark' ? (
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          )}
        </button>
      </nav>

      {/* Main Login Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        {authenticated && (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center animate-in fade-in zoom-in duration-700">
            <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin mb-4" />
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Securely signing you in...</p>
          </div>
        )}
        {!authenticated && (
          <div className="w-full max-w-md">
            {/* Hero */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500">secure.access</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Welcome back</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sign in to your IT Resource account</p>
            </div>

            {/* Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/50 transition-colors">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors font-medium"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4"
                      >
                        <path d="m5 12 14 14" />
                        <path d="M19 12H5" />
                      </svg>
                    </>
                  )}
                </button>

                {/* Demo Hint */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800/50 text-center">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mb-2">Demo credentials</p>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('rohan.sharma@company.com');
                      setPassword('password123');
                    }}
                    className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 underline decoration-indigo-500/30 hover:decoration-indigo-500 transition-all"
                  >
                    Use demo account →
                  </button>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="text-center mt-6">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                IT Department Expense &amp; Resource Management System
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
