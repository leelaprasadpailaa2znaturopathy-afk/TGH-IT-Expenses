import React from 'react';
import {
  Repeat,
  Cloud,
  Database,
  Clock,
  Plus,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import { Subscription, User } from '../types';

interface SubscriptionsProps {
  subscriptions: Subscription[];
  currentUser: User;
  onOpenNewExpense: () => void;
}

export const Subscriptions: React.FC<SubscriptionsProps> = ({ subscriptions, currentUser, onOpenNewExpense }) => {
  const totalMonthlyUsd = subscriptions
    .filter((s) => s.billingCycle === 'monthly' && s.currency === 'USD')
    .reduce((sum, s) => sum + s.originalAmount, 0);

  const totalMonthlyInrEquivalent = subscriptions
    .filter((s) => s.billingCycle === 'monthly')
    .reduce((sum, s) => sum + s.inrEquivalent, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Cloud &amp; SaaS Subscriptions</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 font-mono text-xs font-semibold border border-cyan-200 dark:border-cyan-500/30">
              Recurring Infrastructure
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track renewal dates, USD conversion rate stability, and monthly commitments
          </p>
        </div>

        <button
          onClick={onOpenNewExpense}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Record Subscription Bill</span>
        </button>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs block">Monthly USD Commitments</span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono mt-1">
            ${totalMonthlyUsd.toFixed(2)}{' '}
            <span className="text-xs text-slate-400 font-normal">/ month</span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1 block">
            INR Equiv: ₹{totalMonthlyInrEquivalent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs block">Currency Rate Benchmark</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">
            Configure exchange rate in Settings
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
            Auto-synced per bill purchase date &amp; locked
          </span>
        </div>
      </div>

      {/* Subscriptions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subscriptions.map((sub) => {
          const nextDate = new Date(sub.nextRenewalDate);
          const diffDays = Math.ceil((nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

          return (
            <div
              key={sub._id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{sub.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {sub.billingCycle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub.vendor} • {sub.serviceCategory}</p>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {sub.currency === 'USD' ? `$${sub.originalAmount}` : `₹${sub.originalAmount.toLocaleString('en-IN')}`}
                  </div>
                  {sub.currency === 'USD' && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      (₹{sub.inrEquivalent.toLocaleString('en-IN')})
                    </span>
                  )}
                </div>
              </div>

              {/* Renewal Bar */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  diffDays <= 7
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-500/40 text-amber-800 dark:text-amber-200'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${diffDays <= 7 ? 'text-amber-500' : 'text-slate-400'}`} />
                  <div>
                    <span className="font-bold block">Next Renewal: {sub.nextRenewalDate}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Last Payment: {sub.lastPaymentDate}</span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    diffDays <= 7
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {diffDays > 0 ? `Renews in ${diffDays} days` : 'Renews Today'}
                </span>
              </div>

              {sub.notes && (
                <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 leading-relaxed">
                  {sub.notes}
                </p>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Auto-Debit Active
                </span>
                <span className="font-mono text-[11px]">Invoice ID: {sub.invoiceNumber}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
