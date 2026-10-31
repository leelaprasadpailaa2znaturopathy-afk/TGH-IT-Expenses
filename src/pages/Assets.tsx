import React, { useState } from 'react';
import {
  Laptop,
  Search,
  UserCheck,
  Plus,
} from 'lucide-react';
import { Asset, User } from '../types';

interface AssetsProps {
  assets: Asset[];
  currentUser: User;
  onOpenAssignModal: (asset: Asset) => void;
  onRegisterAsset: () => void;
}

export const Assets: React.FC<AssetsProps> = ({ assets, currentUser, onOpenAssignModal, onRegisterAsset }) => {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = assets.filter((a) => {
    if (filterCategory !== 'all' && a.category !== filterCategory) return false;
    if (filterStatus !== 'all' && a.assetStatus !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.assetName.toLowerCase().includes(q) ||
        a.serialNumber.toLowerCase().includes(q) ||
        a.assetId.toLowerCase().includes(q) ||
        (a.assignedEmployee && a.assignedEmployee.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalAssetValuation = assets.reduce((sum, a) => sum + (a.purchasePrice || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Fixed IT Asset Register</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-mono text-xs font-semibold border border-indigo-200 dark:border-indigo-500/30">
              Hardware Capital
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track serial numbers, warranty terms, desk locations and employee assignments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono">
            <span className="text-slate-500 dark:text-slate-400">Book Value: </span>
            <strong className="text-emerald-600 dark:text-emerald-400">₹{totalAssetValuation.toLocaleString('en-IN')}</strong>
          </div>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3 flex-1 max-w-md relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search asset ID, serial, model, employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Hardware</option>
            <option value="Laptops">Laptops</option>
            <option value="Monitors">Monitors</option>
            <option value="Desktops">Desktops</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="assigned">Assigned</option>
            <option value="in_stock">In Stock</option>
            <option value="under_maintenance">Under Maintenance</option>
          </select>
        </div>
      </div>

      {/* Asset Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-mono text-[11px] whitespace-nowrap">
                <th className="py-3 px-4">Asset ID</th>
                <th className="py-3 px-4">Asset Name</th>
                <th className="py-3 px-4">Brand &amp; Model</th>
                <th className="py-3 px-4">Serial Number</th>
                <th className="py-3 px-4 text-right">Purchase Price</th>
                <th className="py-3 px-4">Assigned User</th>
                <th className="py-3 px-4">Department &amp; Desk</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map((a) => (
                <tr key={a._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 whitespace-nowrap">
                  <td className="py-2.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{a.assetId}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">{a.assetName}</td>
                  <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                    {a.brand} {a.model}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-500 dark:text-slate-400">{a.serialNumber}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{a.purchasePrice.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200">
                    {a.assignedEmployee ? (
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{a.assignedEmployee}</span>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned (In IT Pool)</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">
                    {a.department} • {a.location}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        a.assetStatus === 'assigned'
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                          : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30'
                      }`}
                    >
                      {a.assetStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      onClick={() => onOpenAssignModal(a)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1 mx-auto transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Assign</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
