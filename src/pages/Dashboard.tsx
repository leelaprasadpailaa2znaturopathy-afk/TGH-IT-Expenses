import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  Database,
  Cloud,
  DollarSign,
  FileSpreadsheet,
  CalendarDays,
} from 'lucide-react';
import { ExpenseItem, InventoryItem, Subscription, Asset, User } from '../types';

interface DashboardProps {
  expenses: ExpenseItem[];
  inventory: InventoryItem[];
  subscriptions: Subscription[];
  assets: Asset[];
  currentUser: User;
  onNavigate: (page: string) => void;
  onOpenNewExpense: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  expenses,
  inventory,
  subscriptions,
  assets,
  currentUser,
  onNavigate,
  onOpenNewExpense,
}) => {
  const [dateRange, setDateRange] = useState<'all' | 'year' | 'month' | '7days' | 'today'>('all');
  const now = new Date();
  const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const rangeStart = (() => {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (dateRange === 'year') start.setFullYear(start.getFullYear() - 1);
    if (dateRange === 'month') {
      start.setDate(1);
      start.setMonth(start.getMonth() - 1);
    }
    if (dateRange === '7days') start.setDate(start.getDate() - 6);
    return dateRange === 'all' ? '' : formatDate(start);
  })();
  const rangeEnd = dateRange === 'month'
    ? formatDate(new Date(now.getFullYear(), now.getMonth(), 0))
    : formatDate(now);
  const filteredExpenses = expenses.filter((expense) => dateRange === 'all'
    ? expense.paymentStatus !== 'cancelled'
    : expense.purchaseDate >= rangeStart && expense.purchaseDate <= rangeEnd && expense.paymentStatus !== 'cancelled');
  const rangeLabel = ({ all: 'All time', year: 'Last year', month: 'Last month', '7days': 'Last 7 days', today: 'Today' } as const)[dateRange];
  const totalExpenditure = filteredExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
  const totalTax = filteredExpenses.reduce((sum, e) => sum + e.totalTax, 0);
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthExpenses = expenses
    .filter((e) => e.purchaseDate.startsWith(currentMonthPrefix) && e.paymentStatus !== 'cancelled')
    .reduce((sum, e) => sum + e.totalAmount, 0);

  const pendingPayments = expenses.filter((e) => e.paymentStatus === 'pending');
  const urgentStock = inventory.filter((i) => i.reorderStatus === 'urgent' || i.reorderStatus === 'reorder' || i.reorderStatus === 'out_of_stock');
  const totalAssetValue = assets.reduce((sum, a) => sum + a.purchasePrice, 0);

  const categorySpending: Record<string, number> = {};
  filteredExpenses.forEach((e) => {
    const cat = e.category || 'other';
    categorySpending[cat] = (categorySpending[cat] || 0) + e.totalAmount;
  });

  const categoryLabels: Record<string, string> = {
    'courier-labels': 'Courier Labels',
    'wax-rolls': 'Wax Rolls',
    'barcode-rolls': 'Barcode Rolls',
    'barcode-wax-rolls': 'Barcode Wax Rolls',
    'render': 'Render Hosting',
    'mongodb': 'MongoDB',
    'other': 'Other Bills (Hardware & SaaS)',
  };

  const usdExpenses = filteredExpenses.filter((e) => e.currency === 'USD');
  const totalUsdSpent = usdExpenses.reduce((sum, e) => sum + (e.originalAmount || 0), 0);
  const totalUsdInrEquivalent = usdExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
  const recentExpenses = [...filteredExpenses]
    .sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);
  const renewalReminders = subscriptions
    .filter((subscription) => {
      if (subscription.subscriptionStatus !== 'active' || subscription.billingCycle !== 'monthly') return false;
      const provider = `${subscription.name} ${subscription.vendor} ${subscription.serviceCategory}`.toLowerCase();
      return !provider.includes('render') && !provider.includes('mongo');
    })
    .flatMap((subscription) => {
      const dateParts = subscription.nextRenewalDate.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
      if (!dateParts) return [];

      const [, yearText, monthText, dayText] = dateParts;
      const year = Number(yearText);
      const month = Number(monthText);
      const day = Number(dayText);
      const renewalDate = new Date(year, month - 1, day);
      if (
        renewalDate.getFullYear() !== year
        || renewalDate.getMonth() !== month - 1
        || renewalDate.getDate() !== day
      ) return [];

      const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
      const renewalUtc = Date.UTC(year, month - 1, day);
      const daysRemaining = Math.round((renewalUtc - todayUtc) / 86_400_000);
      if (daysRemaining > 7) return [];

      return [{ ...subscription, renewalDate, daysRemaining }];
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
  const monthlyBillReminders = [
    { category: 'render', name: 'Render Hosting', icon: Cloud, destination: 'category-render' },
    { category: 'mongodb', name: 'MongoDB Atlas', icon: Database, destination: 'category-mongodb' },
  ]
    .filter(({ category }) => !expenses.some((expense) => {
      if (expense.category !== category || expense.paymentStatus !== 'paid') return false;

      const paymentDate = expense.paymentDate || expense.purchaseDate;
      const dateParts = paymentDate.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
      if (!dateParts) return false;

      const [, yearText, monthText, dayText] = dateParts;
      const year = Number(yearText);
      const month = Number(monthText);
      const day = Number(dayText);
      const paidDate = new Date(year, month - 1, day);
      return paidDate.getFullYear() === year
        && paidDate.getMonth() === month - 1
        && paidDate.getDate() === day
        && `${yearText}-${monthText}` === currentMonthPrefix;
    }));
  const isMonthlyBillOverdue = now.getDate() >= 5;

  return (
    <div className="space-y-6">
      {/* Welcome Hero Card */}
      <div className="bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden transition-colors">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-mono text-xs font-semibold border border-indigo-200 dark:border-indigo-500/30">
                FY 2026–27 (Apr 1 – Mar 31)
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Department: Information Technology</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              TGH IT Expense Dashboard
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-2xl leading-relaxed">
              Real-time ledger with automated USD exchange rate lock per date, live stock levels, and fixed hardware tracking.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <select aria-label="Filter dashboard date range" value={dateRange} onChange={(e) => setDateRange(e.target.value as typeof dateRange)} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700">
              <option value="all">All time</option>
              <option value="year">Last year</option>
              <option value="month">Last month</option>
              <option value="7days">Last 7 days</option>
              <option value="today">Today</option>
            </select>
            <button
              onClick={() => onNavigate('excel')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={onOpenNewExpense}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 hover:scale-[1.02]"
            >
              <span>+ Enter Bill</span>
            </button>
          </div>
        </div>
      </div>

      {currentUser.role === 'admin' && monthlyBillReminders.length > 0 && (
        <section
          aria-labelledby="monthly-bill-reminder-heading"
          aria-live="polite"
          className={`overflow-hidden rounded-2xl border shadow-sm ${
            isMonthlyBillOverdue
              ? 'border-rose-300 bg-rose-50 dark:border-rose-500/40 dark:bg-rose-950/30'
              : 'border-amber-300 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-950/25'
          }`}
        >
          <div className="flex flex-col gap-4 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                  isMonthlyBillOverdue
                    ? 'border-rose-300 bg-rose-100 text-rose-700 motion-safe:animate-pulse dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-300'
                    : 'border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
                }`}
              >
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    id="monthly-bill-reminder-heading"
                    className={`text-sm font-bold ${
                      isMonthlyBillOverdue
                        ? 'text-rose-950 dark:text-rose-100'
                        : 'text-amber-950 dark:text-amber-100'
                    }`}
                  >
                    {isMonthlyBillOverdue ? 'Monthly bills need immediate attention' : 'Monthly bills due by the 5th'}
                  </h3>
                  <span
                    className={`rounded-full border bg-white/70 px-2 py-0.5 text-[10px] font-semibold dark:bg-slate-950/40 ${
                      isMonthlyBillOverdue
                        ? 'border-rose-300 text-rose-800 dark:border-rose-500/40 dark:text-rose-200'
                        : 'border-amber-300 text-amber-800 dark:border-amber-500/30 dark:text-amber-200'
                    }`}
                  >
                    {isMonthlyBillOverdue
                      ? now.getDate() === 5 ? 'Due today' : 'Overdue'
                      : `${5 - now.getDate()} ${5 - now.getDate() === 1 ? 'day' : 'days'} left`}
                  </span>
                </div>
                <p className={`mt-0.5 text-xs leading-relaxed ${
                  isMonthlyBillOverdue
                    ? 'text-rose-800 dark:text-rose-200/80'
                    : 'text-amber-800 dark:text-amber-200/80'
                }`}>
                  Record each bill as paid in its category to clear this reminder.
                </p>
              </div>
            </div>

            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" aria-label="Unpaid monthly service bills">
              {monthlyBillReminders.map(({ category, name, icon: Icon, destination }) => {
                const isDueToday = now.getDate() === 5;
                const status = isMonthlyBillOverdue
                  ? isDueToday
                    ? 'Due today'
                    : `Overdue by ${now.getDate() - 5} ${now.getDate() - 5 === 1 ? 'day' : 'days'}`
                  : `Due in ${5 - now.getDate()} ${5 - now.getDate() === 1 ? 'day' : 'days'}`;

                return (
                  <li
                    key={category}
                    className={`flex min-w-0 items-center gap-3 rounded-xl border bg-white/80 px-3.5 py-3 dark:bg-slate-900/70 ${
                      isMonthlyBillOverdue
                        ? 'border-rose-200 dark:border-rose-500/25'
                        : 'border-amber-200 dark:border-amber-500/20'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        category === 'render'
                          ? 'text-cyan-600 dark:text-cyan-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">{name}</p>
                      <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300">Deadline: 5th of this month</p>
                    </div>
                    <span
                      className={`ml-auto shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                        isMonthlyBillOverdue
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200'
                          : 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200'
                      }`}
                    >
                      {status}
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate(destination)}
                      aria-label={`View ${name} expenses`}
                      className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      View <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {currentUser.role === 'admin' && renewalReminders.length > 0 && (
        <section
          aria-labelledby="renewal-reminder-heading"
          aria-live="polite"
          className="overflow-hidden rounded-2xl border border-amber-300 bg-amber-50 shadow-sm dark:border-amber-500/30 dark:bg-amber-950/25"
        >
          <div className="flex flex-col gap-4 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 id="renewal-reminder-heading" className="text-sm font-bold text-amber-950 dark:text-amber-100">
                      Subscription renewals need planning
                    </h3>
                    <span className="rounded-full border border-amber-300 bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/60 dark:text-amber-200">
                      {renewalReminders.length} {renewalReminders.length === 1 ? 'renewal' : 'renewals'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-amber-800 dark:text-amber-200/80">
                    Arrange purchase before renewal to keep services uninterrupted.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('subscriptions')}
                className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 self-start rounded-xl border border-amber-400 bg-white px-3 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 dark:border-amber-500/40 dark:bg-slate-900 dark:text-amber-100 dark:hover:bg-amber-950/70 dark:focus-visible:ring-offset-slate-950 sm:self-center"
              >
                View subscriptions <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            <ul
              aria-label="Monthly subscription renewals due within seven days or overdue"
              className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-amber-950"
              tabIndex={0}
            >
              {renewalReminders.map((subscription) => {
                const isOverdue = subscription.daysRemaining < 0;
                const isDueToday = subscription.daysRemaining === 0;
                const status = isOverdue
                  ? `Overdue by ${Math.abs(subscription.daysRemaining)} ${Math.abs(subscription.daysRemaining) === 1 ? 'day' : 'days'}`
                  : isDueToday
                    ? 'Due today'
                    : `${subscription.daysRemaining} ${subscription.daysRemaining === 1 ? 'day' : 'days'} left`;

                return (
                  <li
                    key={subscription._id}
                    className="flex min-w-[min(15rem,85vw)] snap-start items-center gap-3 rounded-xl border border-amber-200 bg-white/80 px-3.5 py-3 dark:border-amber-500/20 dark:bg-slate-900/70"
                  >
                    <CalendarDays
                      className={`h-4 w-4 shrink-0 ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">{subscription.name}</p>
                      <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                        {subscription.renewalDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <span
                      className={`ml-auto shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                        isOverdue
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200'
                      }`}
                    >
                      {status}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="-mt-2 text-[10px] text-amber-800/80 dark:text-amber-200/70 sm:hidden">
              Swipe to view all renewal reminders.
            </p>
          </div>
        </section>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Spend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span>Total IT Spend ({rangeLabel})</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">
            ₹{totalExpenditure.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Current Month:</span>
            <span className="text-slate-700 dark:text-slate-200 font-semibold">
              ₹{currentMonthExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Total GST Input Tax */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span>GST Input Tax Credit</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            ₹{totalTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>CGST + SGST + IGST:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Eligible ITC</span>
          </div>
        </div>

        {/* Total Asset Valuation */}
        <div
          onClick={() => onNavigate('assets')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-indigo-400 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span>Fixed Assets Valuation</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">
            ₹{totalAssetValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Hardware Register:</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{assets.length} items</span>
          </div>
        </div>

        {/* Low Stock Reorders */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-rose-400 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span>Low Stock / Reorders</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 font-mono">{urgentStock.length}</div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Consumables:</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-0.5">
              Check Stores <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Category-wise Expenditure</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Distribution across consumables, hardware and SaaS</p>
            </div>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
            >
              Master Ledger <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {Object.entries(categorySpending).map(([slug, amt]) => {
              const pct = totalExpenditure > 0 ? (amt / totalExpenditure) * 100 : 0;
              return (
                <div key={slug} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{categoryLabels[slug] || slug}</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">
                      ₹{amt.toLocaleString('en-IN')} <span className="text-slate-400 font-normal">({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        slug === 'courier-labels'
                          ? 'bg-blue-500'
                          : slug === 'wax-rolls'
                          ? 'bg-amber-500'
                          : slug === 'barcode-rolls'
                          ? 'bg-emerald-500'
                          : slug === 'render'
                          ? 'bg-cyan-500'
                          : slug === 'mongodb'
                          ? 'bg-green-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Direct Category View Links */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'category-courier-labels', label: 'Courier Labels' },
              { id: 'category-wax-rolls', label: 'Wax Rolls' },
              { id: 'category-barcode-rolls', label: 'Barcode Rolls' },
              { id: 'category-barcode-wax-rolls', label: 'Barcode Wax' },
              { id: 'category-render', label: 'Render' },
              { id: 'category-mongodb', label: 'MongoDB' },
              { id: 'category-other', label: 'Other Bills' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => onNavigate(btn.id)}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-700 dark:text-slate-300 text-left font-medium flex items-center justify-between transition-colors"
              >
                <span>{btn.label}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Currency & Subscriptions */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-500" /> USD Subscriptions
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Historical Rate Locked</span>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                ${totalUsdSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                Converted: ₹{totalUsdInrEquivalent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-cyan-500" /> Render Hosting:
                </span>
                <span className="font-mono font-semibold">$25 / mo</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-500" /> MongoDB Atlas:
                </span>
                <span className="font-mono font-semibold">$57 / mo</span>
              </div>
            </div>
          </div>

          {/* Consumables Inventory Health */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-indigo-500" /> Inventory Stock Levels
              </span>
              <button
                onClick={() => onNavigate('inventory')}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View Stock
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {inventory.slice(0, 4).map((item) => (
                <div key={item._id} className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{item.productName}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.currentStock} {item.unit}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      item.reorderStatus === 'urgent'
                        ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30'
                        : item.reorderStatus === 'reorder'
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30'
                        : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                    }`}
                  >
                    {item.reorderStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bills */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Recent Bills</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Latest bills recorded in the ledger</p>
          </div>
          <button onClick={() => onNavigate('transactions')} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {recentExpenses.length ? (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2 pr-3 font-semibold">Bill / Invoice</th>
                  <th className="py-2 px-3 font-semibold">Item</th>
                  <th className="py-2 px-3 font-semibold">Date</th>
                  <th className="py-2 px-3 font-semibold">Status</th>
                  <th className="py-2 pl-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentExpenses.map((expense) => (
                  <tr key={expense._id}>
                    <td className="py-3 pr-3 font-medium text-slate-800 dark:text-slate-200">{expense.invoiceNumber || expense.expenseNumber}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{expense.productName}</td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{expense.purchaseDate}</td>
                    <td className="py-3 px-3 capitalize text-slate-600 dark:text-slate-300">{expense.paymentStatus.replace('_', ' ')}</td>
                    <td className="py-3 pl-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">₹{expense.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">No bills recorded yet. Use “Enter Bill” to add the first one.</p>
        )}
      </section>
    </div>
  );
};
