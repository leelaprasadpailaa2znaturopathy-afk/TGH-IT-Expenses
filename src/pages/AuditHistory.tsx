import React, { useState } from 'react';
import { History, Search, Lock } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditHistoryProps {
  auditLogs: AuditLog[];
}

export const AuditHistory: React.FC<AuditHistoryProps> = ({ auditLogs }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filtered = auditLogs.filter((log) => {
    if (filterType !== 'all' && log.recordType !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.recordId.toLowerCase().includes(q) ||
        (log.newValue && log.newValue.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Immutable Audit Trail
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-semibold border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Tamper-Proof
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            System logs recording expense entries, permission edits, stock movements, and asset allocations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Event Types</option>
            <option value="expense">Expenses</option>
            <option value="user">User &amp; Permissions</option>
            <option value="inventory">Inventory Movements</option>
            <option value="asset">Hardware Assets</option>
            <option value="import">Excel Batch Imports</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-mono text-[11px] whitespace-nowrap">
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Actor / User</th>
                <th className="py-3 px-3">Action Performed</th>
                <th className="py-3 px-3">Entity Type</th>
                <th className="py-3 px-3">Record Identifier</th>
                <th className="py-3 px-3">State Change Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No audit records match search.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-slate-900 dark:text-slate-200 font-sans font-semibold">
                      {log.userName}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-slate-700 text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 uppercase text-[10px]">
                      {log.recordType}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-bold">
                      {log.recordId}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-sans text-xs max-w-md truncate" title={log.newValue}>
                      {log.newValue}
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
