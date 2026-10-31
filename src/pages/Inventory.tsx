import React, { useState } from 'react';
import {
  Boxes,
  ArrowUpRight,
  SlidersHorizontal,
  Search,
} from 'lucide-react';
import { InventoryItem, InventoryTransaction, User } from '../types';

interface InventoryProps {
  inventory: InventoryItem[];
  transactions: InventoryTransaction[];
  currentUser: User;
  onOpenIssueModal: (item?: InventoryItem) => void;
  onAdjustStock: (productId: string, newCount: number, reason: string) => Promise<void>;
  onNavigate: (page: string) => void;
}

export const Inventory: React.FC<InventoryProps> = ({
  inventory,
  transactions,
  currentUser,
  onOpenIssueModal,
  onAdjustStock,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'balances' | 'movements'>('balances');
  const [search, setSearch] = useState('');
  const isAdmin = currentUser.role === 'admin';

  const filteredItems = inventory.filter(
    (i) =>
      i.productName.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTxns = transactions.filter(
    (t) =>
      t.productName.toLowerCase().includes(search.toLowerCase()) ||
      (t.employeeName && t.employeeName.toLowerCase().includes(search.toLowerCase())) ||
      (t.department && t.department.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Consumables &amp; Stock Ledger</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-mono text-xs font-semibold border border-indigo-200 dark:border-indigo-500/30">
              Formula: Opening + Received - Issued
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Stock increments upon confirmed receipt of goods • Complete distribution &amp; issue audit register
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex text-xs">
            <button
              onClick={() => setActiveTab('balances')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                activeTab === 'balances'
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Current Balances
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                activeTab === 'movements'
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Stock Movements
            </button>
          </div>

          <button
            onClick={() => onOpenIssueModal()}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Issue Consumable</span>
          </button>
        </div>
      </div>

      {/* Balances Tab */}
      {activeTab === 'balances' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.productName}</h3>
                  <span className="font-mono text-[10px] text-slate-400">{item.sku}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
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

              <div className="py-2 border-y border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Current Balance</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {item.currentStock} <span className="text-xs font-normal text-slate-400">{item.unit.split(' ')[0]}</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Thresholds</span>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                    Min: {item.minimumStock} | Reorder: {item.reorderLevel}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Opening Stock:</span>
                  <span className="text-slate-700 dark:text-slate-300">{item.openingStock}</span>
                </div>
                <div className="flex justify-between">
                  <span>Received (+):</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{item.stockReceived}</span>
                </div>
                <div className="flex justify-between">
                  <span>Issued (-):</span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">{item.stockIssued}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Price:</span>
                  <span className="text-slate-800 dark:text-slate-200">₹{item.lastPurchasePrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenIssueModal(item)}
                  className="flex-1 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Issue Stock</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      const count = prompt(`Enter audited physical count for ${item.productName}:`, String(item.currentStock));
                      if (count !== null) {
                        const reason = prompt('Reason for stock adjustment audit:', 'Physical store count verification');
                        if (reason) onAdjustStock(item.productId, parseFloat(count) || 0, reason);
                      }
                    }}
                    title="Audit Adjustment (Admin Only)"
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Movements Tab */}
      {activeTab === 'movements' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Stock Movements History</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {filteredTxns.length} stock log events
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-mono text-[11px] whitespace-nowrap">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3">Issued To</th>
                  <th className="py-2.5 px-3">Recorded By</th>
                  <th className="py-2.5 px-3">Invoice Ref</th>
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredTxns.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">{t.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{t.productName}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          t.transactionType === 'received'
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {t.transactionType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                      {t.transactionType === 'issued' ? `-${t.quantity}` : `+${t.quantity}`}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      {t.employeeName ? `${t.employeeName} (${t.department})` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{t.issuedBy}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400">{t.invoiceNumber || '—'}</td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">{t.remarks}</td>
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
