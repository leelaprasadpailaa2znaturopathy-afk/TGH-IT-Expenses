import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Download,
  Database,
  Building,
  DollarSign,
  Percent,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface SettingsProps {
  currentUser: User;
}

export const Settings: React.FC<SettingsProps> = ({ currentUser }) => {
  const [settings, setSettings] = useState({
    companyName: '',
    primaryCurrency: 'INR',
    secondaryCurrency: 'USD',
    defaultGstRate: 18,
    usdToInrRate: 0,
    financialYearStartMonth: 4,
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getSettings().then((data) => {
      if (data) setSettings({ ...data, usdToInrRate: data.currentUsdRate || 0 });
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateSettings({ ...settings, currentUsdRate: settings.usdToInrRate });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackup = () => {
    api.graphql(`{ expenses { _id } inventory { _id } assets { _id } subscriptions { _id } }`).then((res) => {
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `it_expense_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SettingsIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">System &amp; Financial Settings</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure statutory GST tax treatments, benchmark exchange rates, and financial year cycles
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
        {/* Company Identity */}
        <div className="space-y-3 pb-5 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-200 flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Company &amp; Entity Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Registered Company Name</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Financial Year Start Month</label>
              <select
                value={settings.financialYearStartMonth}
                onChange={(e) => setSettings({ ...settings, financialYearStartMonth: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none"
              >
                <option value={4}>April (Standard Indian Financial Year: Apr 1 – Mar 31)</option>
                <option value={1}>January (Calendar Year)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Currency & Exchange Rates */}
        <div className="space-y-3 pb-5 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-200 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Multi-Currency &amp; Conversion Engine
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Primary Currency</label>
              <input
                type="text"
                disabled
                value="INR (₹ Indian Rupee)"
                className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Secondary Currency</label>
              <input
                type="text"
                disabled
                value="USD ($ United States Dollar)"
                className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Default USD to INR Exchange Rate</label>
              <input
                type="number"
                step="0.01"
                value={settings.usdToInrRate}
                onChange={(e) => setSettings({ ...settings, usdToInrRate: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 block">Used when purchase date rate is not fetched</span>
            </div>
          </div>
        </div>

        {/* GST Taxation */}
        <div className="space-y-3 pb-5 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-200 flex items-center gap-2">
            <Percent className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Default GST Rates
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Default GST Rate for IT Purchases</label>
              <select
                value={settings.defaultGstRate}
                onChange={(e) => setSettings({ ...settings, defaultGstRate: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none"
              >
                <option value={18}>18% (Standard GST Rate for Software &amp; IT Consumables)</option>
                <option value={12}>12%</option>
                <option value={5}>5%</option>
                <option value={0}>0%</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              System automatically computes <strong className="text-slate-800 dark:text-slate-200">CGST (50%) + SGST (50%)</strong> for Intra-state supplies, and <strong className="text-slate-800 dark:text-slate-200">IGST (100%)</strong> for Inter-state supplies.
            </div>
          </div>
        </div>

        {/* Database Backup */}
        <div className="space-y-3 pb-3">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-200 flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Database Backup &amp; Recovery
          </h3>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Export System Snapshot</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Download JSON backup of collections including expenses, inventory, assets, and audit logs.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadBackup}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Backup (.json)</span>
            </button>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          {saved && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Settings updated successfully
            </span>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
