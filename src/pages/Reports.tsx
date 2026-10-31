import React, { useState } from 'react';
import {
  Download,
} from 'lucide-react';
import { ExpenseItem } from '../types';

interface ReportsProps {
  expenses: ExpenseItem[];
}

export const Reports: React.FC<ReportsProps> = ({ expenses }) => {
  const [selectedFY, setSelectedFY] = useState<'2026-27' | '2025-26' | '2024-25'>('2026-27');
  const [reportType, setReportType] = useState<'monthly' | 'fy' | 'gst' | 'currency'>('fy');

  // Filter expenses by selected FY
  const fyExpenses = expenses.filter((e) => e.financialYear === selectedFY && e.paymentStatus !== 'cancelled');

  // Aggregates
  const totalTaxable = fyExpenses.reduce((s, e) => s + e.taxableAmount, 0);
  const totalCgst = fyExpenses.reduce((s, e) => s + e.cgst, 0);
  const totalSgst = fyExpenses.reduce((s, e) => s + e.sgst, 0);
  const totalIgst = fyExpenses.reduce((s, e) => s + e.igst, 0);
  const totalTax = fyExpenses.reduce((s, e) => s + e.totalTax, 0);
  const totalAmount = fyExpenses.reduce((s, e) => s + e.totalAmount, 0);

  // Group by month
  const monthlyData: Record<string, { total: number; tax: number; count: number }> = {};
  fyExpenses.forEach((e) => {
    const month = e.purchaseDate.slice(0, 7); // YYYY-MM
    if (!monthlyData[month]) monthlyData[month] = { total: 0, tax: 0, count: 0 };
    monthlyData[month].total += e.totalAmount;
    monthlyData[month].tax += e.totalTax;
    monthlyData[month].count += 1;
  });

  // Group by category
  const categoryData: Record<string, number> = {};
  fyExpenses.forEach((e) => {
    categoryData[e.category] = (categoryData[e.category] || 0) + e.totalAmount;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Financial Reports &amp; Analytics</h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-semibold border border-emerald-200 dark:border-emerald-500/30">
              April 1 – March 31 Boundary
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automated statutory tax compliance, monthly expense trends, category summaries and foreign currency ledgers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedFY}
            onChange={(e) => setSelectedFY(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="2026-27">FY 2026–27 (Current)</option>
            <option value="2025-26">FY 2025–26 (Historical)</option>
            <option value="2024-25">FY 2024–25 (Legacy)</option>
          </select>

          <a
            href="/api/excel/export/professional"
            download={`IT_Financial_Report_${selectedFY}.xlsx`}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download FY Report (Excel)</span>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 text-xs">
        {[
          { id: 'fy', label: 'Financial Year Summary' },
          { id: 'monthly', label: 'Monthly Breakdown' },
          { id: 'gst', label: 'GST Input Tax Credit' },
          { id: 'currency', label: 'USD Foreign Subscriptions' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id as any)}
            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
              reportType === tab.id
                ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-transparent'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Content */}
      {reportType === 'fy' && (
        <div className="space-y-6">
          {/* Key Totals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 text-xs block">Taxable Base Amount</span>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">
                ₹{totalTaxable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 text-xs block">Total GST Input Tax</span>
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                ₹{totalTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 text-xs block">Total Gross Invoiced</span>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                ₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 text-xs block">Total Billed Records</span>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400 font-mono mt-1">
                {fyExpenses.length} transactions
              </div>
            </div>
          </div>

          {/* Category Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-200">Category-wise Summary ({selectedFY})</h3>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                    <th className="py-2.5 px-3">Expense Category</th>
                    <th className="py-2.5 px-3 text-right">Transactions</th>
                    <th className="py-2.5 px-3 text-right">Total Expenditure</th>
                    <th className="py-2.5 px-3 text-right">Share (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {Object.entries(categoryData).map(([cat, amt]) => {
                    const count = fyExpenses.filter((e) => e.category === cat).length;
                    const pct = totalAmount > 0 ? (amt / totalAmount) * 100 : 0;
                    return (
                      <tr key={cat} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{cat}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">{count}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{amt.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500 dark:text-slate-400">{pct.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Breakdown */}
      {reportType === 'monthly' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-200">Monthly Expense &amp; Tax Summary ({selectedFY})</h3>
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                  <th className="py-2.5 px-3">Billing Month</th>
                  <th className="py-2.5 px-3 text-right">Transactions</th>
                  <th className="py-2.5 px-3 text-right">Total GST (INR)</th>
                  <th className="py-2.5 px-3 text-right">Gross Total Spend (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {Object.entries(monthlyData).map(([m, data]) => (
                  <tr key={m} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 font-mono transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{m}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{data.count}</td>
                    <td className="py-2.5 px-3 text-right text-indigo-600 dark:text-indigo-400 font-bold">
                      ₹{data.tax.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                      ₹{data.total.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GST Input Tax Credit */}
      {reportType === 'gst' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 text-xs block">CGST (Central Tax)</span>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                ₹{totalCgst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1 block">50% of Intra-State Purchases</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 text-xs block">SGST (State Tax)</span>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                ₹{totalSgst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1 block">50% of Intra-State Purchases</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 text-xs block">IGST (Integrated Inter-State Tax)</span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                ₹{totalIgst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1 block">Inter-State Supplier Purchases</span>
            </div>
          </div>
        </div>
      )}

      {/* USD Subscriptions */}
      {reportType === 'currency' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-200">Foreign Currency Subscriptions (USD)</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Date-Locked Exchange Rates (Historical Accuracy)</span>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Service</th>
                  <th className="py-2.5 px-3">Vendor</th>
                  <th className="py-2.5 px-3 text-right">Amount (USD)</th>
                  <th className="py-2.5 px-3 text-right">Exchange Rate</th>
                  <th className="py-2.5 px-3 text-right">INR Equivalent</th>
                  <th className="py-2.5 px-3">Invoice ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {fyExpenses
                  .filter((e) => e.currency === 'USD')
                  .map((e) => (
                    <tr key={e._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 font-mono transition-colors">
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{e.purchaseDate}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-200 font-sans">{e.productName}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-sans">{e.vendorName}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-600 dark:text-amber-400">
                        ${e.originalAmount || e.unitPrice}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400 font-semibold">
                        ₹{e.exchangeRate?.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{e.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-bold">{e.invoiceNumber}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
