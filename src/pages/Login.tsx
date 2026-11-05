import React, { useState } from 'react';
import { ArrowRight, Sun, Moon, AlertCircle, LockKeyhole, Activity } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, theme, onToggleTheme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ee] text-slate-900 dark:bg-[#0b1220] dark:text-slate-100 flex flex-col">
      <header className="h-[76px] px-5 sm:px-10 lg:px-14 flex items-center justify-between bg-white dark:bg-[#101a2d] text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10">
        <a href="/" className="flex items-center gap-3.5" aria-label="TGH IT Expense home">
          <span className="w-12 h-12 p-1.5 rounded-xl bg-white flex items-center justify-center shrink-0">
            <img src="/tgh-logo-trim.png" alt="TGH Good Health logo" className="w-full h-full object-contain" />
          </span>
          <span className="leading-tight">
            <span className="block font-bold text-[15px] tracking-tight">TGH IT Expense</span>
            <span className="block text-[11px] text-slate-400 mt-1">Central Ledger &amp; Asset Management</span>
          </span>
        </a>
        <button type="button" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} className="p-2.5 rounded-lg border border-white/15 text-slate-300 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>

      <main className="flex-1 grid lg:grid-cols-[1.08fr_.92fr] max-w-[1440px] w-full mx-auto">
        <section aria-label="About TGH IT Expense" className="relative overflow-hidden px-7 py-12 sm:px-12 lg:px-16 lg:py-20 flex flex-col justify-center bg-[#f5f3ee] dark:bg-[#111c2d]">
          <div className="absolute -right-24 -top-24 w-[26rem] h-[26rem] rounded-full border border-[#c6a45b]/20" />
          <div className="absolute -right-8 -top-8 w-[18rem] h-[18rem] rounded-full border border-[#c6a45b]/15" />
          <div className="relative max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c8aa69]/45 bg-[#c8aa69]/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-[#70591f] dark:text-[#e2c982]">
              <Activity className="w-3.5 h-3.5" /> INFORMATION TECHNOLOGY · OPERATIONS
            </div>
            <div className="mt-9 mb-8 w-[min(100%,390px)] rounded-2xl border border-slate-200/80 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-[#111c2d]">
              <img src="/tgh-logo-trim.png" alt="TGH Good Health" className="block w-full h-[110px] object-contain" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.08] font-semibold tracking-[-0.04em] text-[#14223a] dark:text-white">
              Clear records.<br /><span className="text-[#94752f] dark:text-[#d8ba70]">Confident decisions.</span>
            </h1>
            <p className="mt-6 max-w-lg text-[15px] leading-7 text-slate-600 dark:text-slate-300">
              One secure place to manage IT expenses, bills, assets and inventory across TGH.
            </p>
            <div className="mt-10 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="w-8 h-px bg-[#c6a45b]" /> TGH IT EXPENSE MANAGEMENT
            </div>
          </div>
        </section>

        <section className="px-6 py-12 sm:px-12 lg:px-16 flex items-center justify-center bg-white dark:bg-[#0b1220] border-l border-slate-200/80 dark:border-slate-800">
          <div className="w-full max-w-[390px]">
            <div className="mb-8">
              <p className="text-[11px] uppercase tracking-[.18em] font-bold text-[#94752f] dark:text-[#d8ba70]">Secure workspace</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Sign in with your TGH account to continue.</p>
            </div>

            {error && (
              <div role="alert" className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-sm text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Email address
                <input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@tgh.com" className="mt-2 w-full h-12 bg-[#fbfaf7] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 text-sm font-normal outline-none transition focus:border-[#a8883d] focus:ring-2 focus:ring-[#c6a45b]/20 placeholder:text-slate-400" />
              </label>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Password
                <span className="relative block">
                  <LockKeyhole className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className="mt-2 w-full h-12 bg-[#fbfaf7] dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-10 pr-3.5 text-sm font-normal outline-none transition focus:border-[#a8883d] focus:ring-2 focus:ring-[#c6a45b]/20 placeholder:text-slate-400" />
                </span>
              </label>
              <button type="submit" disabled={isLoading} className="w-full h-12 mt-1 rounded-lg bg-[#15233a] hover:bg-[#203653] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[#c6a45b] focus:ring-offset-2 dark:focus:ring-offset-[#0b1220]">
                {isLoading ? 'Signing in…' : <>Sign in <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
            <p className="mt-7 text-xs text-slate-500 dark:text-slate-400">Need access? Contact your IT administrator.</p>
            <div className="mt-10 pt-5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
              <LockKeyhole className="w-3.5 h-3.5" /> Protected TGH internal workspace
            </div>
          </div>
        </section>
      </main>
      <footer className="px-6 py-4 text-center text-[11px] text-slate-500 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800 bg-[#f5f3ee] dark:bg-[#0b1220]">TGH IT Expense <span className="mx-2 text-[#c6a45b]">•</span> IT Governance Console</footer>
    </div>
  );
};
