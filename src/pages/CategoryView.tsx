import React, { useState } from 'react';
import {
  Package,
  Disc,
  Barcode,
  Tag,
  Cloud,
  Database,
  Layers,
  Download,
  Plus,
  Boxes,
  CheckCircle2,
  PackageCheck,
  ExternalLink,
} from 'lucide-react';
import { ExpenseItem, InventoryItem, Subscription, User } from '../types';

interface CategoryViewProps {
  categorySlug: string;
  expenses: ExpenseItem[];
  inventory: InventoryItem[];
  subscriptions: Subscription[];
  currentUser: User;
  onOpenNewExpense: () => void;
  onMarkReceived: (id: string, qty: number) => Promise<void>;
  onNavigate: (page: string) => void;
}

export const CategoryView: React.FC<CategoryViewProps> = ({
  categorySlug,
  expenses,
  inventory,
  subscriptions,
  currentUser,
  onOpenNewExpense,
  onMarkReceived,
  onNavigate,
}) => {
  const [selectedFY, setSelectedFY] = useState('all');

  const categoryExpenses = expenses.filter((e) => {
    if (e.category !== categorySlug) return false;
    if (selectedFY !== 'all' && e.financialYear !== selectedFY) return false;
    return true;
  });

  const inventoryItem = inventory.find((i) => i.category === categorySlug);
  const subscriptionItem = subscriptions.find(
    (s) =>
      (categorySlug === 'render' && s.name.toLowerCase().includes('render')) ||
      (categorySlug === 'mongodb' && s.name.toLowerCase().includes('mongodb'))
  );

  const categoryConfig: Record<
    string,
    { title: string; subtitle: string; icon: any; color: string; isSubscription: boolean; isConsumable: boolean }
  > = {
    'courier-labels': {
      title: 'Courier Labels (Page 1)',
      subtitle: 'Dispatch thermal labels procurement & inventory balance',
      icon: Package,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
      isSubscription: false,
      isConsumable: true,
    },
    'wax-rolls': {
      title: 'Wax Rolls (Page 2)',
      subtitle: 'Thermal transfer ribbons procurement & available stock',
      icon: Disc,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
      isSubscription: false,
      isConsumable: true,
    },
    'barcode-rolls': {
      title: 'Barcode Rolls (Page 3)',
      subtitle: 'SKU and product barcode label rolls balance',
      icon: Barcode,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
      isSubscription: false,
      isConsumable: true,
    },
    'barcode-wax-rolls': {
      title: 'Barcode Wax Rolls (Page 4)',
      subtitle: 'Wax resin ribbons for high-durability barcode printing',
      icon: Tag,
      color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20',
      isSubscription: false,
      isConsumable: true,
    },
    'render': {
      title: 'Render Hosting (Page 5)',
      subtitle: 'Web servers and cloud backend hosting services',
      icon: Cloud,
      color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20',
      isSubscription: true,
      isConsumable: false,
    },
    'mongodb': {
      title: 'MongoDB Atlas (Page 6)',
      subtitle: 'Dedicated production database cluster and automated backups',
      icon: Database,
      color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20',
      isSubscription: true,
      isConsumable: false,
    },
    'other': {
      title: 'Other Bills (Page 7)',
      subtitle: 'Hardware, Laptops, Monitors, Peripherals, and Software Subscriptions',
      icon: Layers,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20',
      isSubscription: false,
      isConsumable: false,
    },
  };

  const currentConfig = categoryConfig[categorySlug] || {
    title: 'Category Ledger',
    subtitle: 'Independent live view powered by MongoDB master ledger',
    icon: Layers,
    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20',
    isSubscription: false,
    isConsumable: false,
  };

  const Icon = currentConfig.icon;

  const totalCategorySpend = categoryExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
  const totalTaxable = categoryExpenses.reduce((sum, e) => sum + e.taxableAmount, 0);
  const totalUnitsOrdered = categoryExpenses.reduce((sum, e) => sum + e.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs transition-colors">
        <div className="flex items-start gap-3.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${currentConfig.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{currentConfig.title}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-700">
                Live View
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{currentConfig.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedFY}
            onChange={(e) => setSelectedFY(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Financial Years</option>
            <option value="2026-27">FY 2026–27</option>
            <option value="2025-26">FY 2025–26</option>
          </select>

          <a
            href="/api/excel/export/professional"
            download="IT_Expenses_Professional_Report.xlsx"
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </a>

          <button
            onClick={onOpenNewExpense}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Enter Bill</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs block">Total Spend</span>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">
            ₹{totalCategorySpend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
            Taxable: ₹{totalTaxable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs block">Bills Recorded</span>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-1">
            {categoryExpenses.length}{' '}
            <span className="text-xs font-normal text-slate-400">
              ({totalUnitsOrdered} {currentConfig.isConsumable ? 'rolls' : 'units'})
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Total quantity procured</span>
        </div>

        {currentConfig.isConsumable && inventoryItem ? (
          <>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-xs block">Current Stock</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                    inventoryItem.reorderStatus === 'urgent'
                      ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
                      : inventoryItem.reorderStatus === 'reorder'
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                      : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {inventoryItem.reorderStatus}
                </span>
              </div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {inventoryItem.currentStock} <span className="text-xs font-normal text-slate-400">rolls</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Min: {inventoryItem.minimumStock} | Reorder: {inventoryItem.reorderLevel}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-slate-500 dark:text-slate-400 text-xs block">Last Purchase Price</span>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">
                ₹{inventoryItem.lastPurchasePrice.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                Ordered: {inventoryItem.lastPurchaseDate}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-slate-500 dark:text-slate-400 text-xs block">Billing Cadence</span>
              <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                {subscriptionItem?.billingCycle || 'On-Demand'}
              </div>
              <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                {subscriptionItem ? `Renews: ${subscriptionItem.nextRenewalDate}` : 'IT Procurement'}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
              <span className="text-slate-500 dark:text-slate-400 text-xs block">Active Suppliers</span>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">
                {Array.from(new Set(categoryExpenses.map((e) => e.vendorName))).length}
              </div>
              <span className="text-[10px] text-slate-400 font-mono mt-1 block">Vendors on file</span>
            </div>
          </>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            {currentConfig.title} — Transactions ({categoryExpenses.length})
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Single shared MongoDB collection (`expenses`)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-mono text-[11px] whitespace-nowrap">
                <th className="py-3 px-3">S.No</th>
                <th className="py-3 px-3">Invoice / Bill ID</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Product Name</th>
                {currentConfig.isConsumable && (
                  <>
                    <th className="py-3 px-3">Packaging Unit</th>
                    <th className="py-3 px-3 text-right">Qty</th>
                  </>
                )}
                {currentConfig.isSubscription ? (
                  <>
                    <th className="py-3 px-3 text-right">Amount (USD)</th>
                    <th className="py-3 px-3 text-right">Exchange Rate (Locked)</th>
                    <th className="py-3 px-3 text-right">Amount (INR)</th>
                  </>
                ) : (
                  <>
                    <th className="py-3 px-3 text-right">Unit Price (INR)</th>
                    <th className="py-3 px-3 text-right">Taxable Cost (INR)</th>
                    <th className="py-3 px-3 text-right">Total Amount</th>
                  </>
                )}
                <th className="py-3 px-3">Vendor</th>
                <th className="py-3 px-3">Remarks / Status</th>
                <th className="py-3 px-3 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {categoryExpenses.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    No transactions recorded for this category yet. Click &quot;Enter Bill&quot; to create one.
                  </td>
                </tr>
              ) : (
                categoryExpenses.map((e, idx) => (
                  <tr key={e._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors whitespace-nowrap">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                    
                    {/* Invoice ID with external link */}
                    <td className="py-2.5 px-3 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{e.invoiceNumber}</span>
                        {e.invoiceLink && (
                          <a
                            href={e.invoiceLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 dark:text-indigo-400"
                            title="Open external document"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">{e.purchaseDate}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{e.productName}</td>

                    {currentConfig.isConsumable && (
                      <>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{e.unit}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                          {e.quantity}
                        </td>
                      </>
                    )}

                    {currentConfig.isSubscription ? (
                      <>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-600 dark:text-amber-400 font-bold">
                          ${e.originalAmount || e.unitPrice}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                          ₹{e.exchangeRate}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          ₹{e.totalAmount.toLocaleString('en-IN')}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                          ₹{e.unitPrice.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                          ₹{e.taxableAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{e.totalAmount.toLocaleString('en-IN')}
                        </td>
                      </>
                    )}

                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{e.vendorName}</td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {e.remarks || '—'}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {currentConfig.isConsumable ? (
                        e.receivedStatus === 'received' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Received
                          </span>
                        ) : (
                          <button
                            onClick={() => onMarkReceived(e._id, e.quantity)}
                            className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 text-[11px] font-semibold flex items-center gap-1 mx-auto transition-colors"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Receive</span>
                          </button>
                        )
                      ) : (
                        <span className="text-slate-400 text-[10px]">Active</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
