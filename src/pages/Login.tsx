import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, Sun, Moon, AlertCircle, KeyRound } from 'lucide-react';
import { User } from '../types';

interface LoginProps { onLogin: (email: string, password: string) => Promise<void>; theme: 'light' | 'dark'; onToggleTheme: () => void; }
export const Login: React.FC<LoginProps> = ({ onLogin, theme, onToggleTheme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null); setIsLoading(true);
    try { await onLogin(email, password); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to sign in.'); }
    finally { setIsLoading(false); }
  };
  return <div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
    <nav className="h-16 px-6 sm:px-12 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
      <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white"><ShieldCheck className="w-5 h-5" /></div><div><h1 className="font-bold text-sm">IT Resource ERP</h1><p className="text-[10px] text-slate-500">Central Ledger &amp; Asset Management</p></div></div>
      <button onClick={onToggleTheme} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800">{theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button>
    </nav>
    <main className="flex-1 flex items-center justify-center p-4"><div className="w-full max-w-md"><div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
      <div className="text-center mb-6"><div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto mb-3"><KeyRound className="w-6 h-6" /></div><h2 className="text-xl font-bold">Sign in</h2><p className="text-xs text-slate-500 mt-1">Use your registered account credentials</p></div>
      {error && <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700"><AlertCircle className="w-4 h-4" />{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4"><label className="block text-xs font-semibold">Email address<input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1.5 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm" /></label>
      <label className="block text-xs font-semibold">Password<span className="relative block"><Lock className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1.5 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm" /></span></label>
      <button type="submit" disabled={isLoading} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2">{isLoading ? 'Signing in?' : <>Sign in <ArrowRight className="w-4 h-4" /></>}</button></form>
      </div><p className="text-center text-[11px] text-slate-500 mt-5">IT Department Expense &amp; Resource Management System</p></div></main>
    <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800">IT Governance Console</footer>
  </div>;
};
