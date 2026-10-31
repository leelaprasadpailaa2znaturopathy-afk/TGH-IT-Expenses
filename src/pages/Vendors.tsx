import React, { useState } from 'react';
import {
  Building2,
  Mail,
  Phone,
  ArrowUpDown,
  Search,
} from 'lucide-react';
import { Vendor, ExpenseItem, User } from '../types';

interface VendorsProps {
  vendors: Vendor[];
  expenses: ExpenseItem[];
  currentUser: User;
  onAddNewVendor: () => void;
}

export const Vendors: React.FC<VendorsProps> = ({ vendors, expenses, currentUser, onAddNewVendor }) => {
  const [search, setSearch] = useState('');

  const filtered = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.code.toLowerCase().includes(search.toLowerCase()) ||
      v.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      v.gstin.toLowerCase().includes(search.toLowerCase())
  );

  // Price comparison analytics across suppliers
  const productPriceHistory = [
    {
      product: 'Courier Labels (4x6 Direct Thermal)',
      suppliers: [
        { vendor: 'PC Technologies', lastPrice: 195.0, date: '2026-10-18', diff: 'Lowest price' },
        { vendor: 'Barcode World & Solutions', lastPrice: 210.0, date: '2026-08-12', diff: '+7.6%' },
      ],
    },
    {
      product: 'Wax Rolls (110mm x 300m)',
      suppliers: [
        { vendor: 'PC Technologies', lastPrice: 280.0, date: '2026-10-12', diff: 'Contract rate' },
        { vendor: 'Comptech Peripherals', lastPrice: 295.0, date: '2026-07-15', diff: '+5.3%' },
      ],
    },
    {
      product: 'Barcode Rolls (50x25mm Dual Column)',
      suppliers: [
        { vendor: 'Barcode World & Solutions', lastPrice: 162.5, date: '2026-10-24', diff: 'Preferred' },
        { vendor: 'PC Technologies', lastPrice: 175.0, date: '2026-05-10', diff: '+7.7%' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Vendor Management &amp; Analytics</h2>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-semibold border border-indigo-200 dark:border-indigo-500/30">
              Procurement Intelligence
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Supplier directory, verified GSTIN credentials, purchase histories and unit price benchmarking
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Price Comparison Benchmark Tool */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-200">Consumable Unit Price Comparison</h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">Comparable tax &amp; unit treatments across vendors</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {productPriceHistory.map((p, idx) => (
            <div key={idx} className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">{p.product}</span>
              <div className="space-y-1.5 pt-1">
                {p.suppliers.map((s, sIdx) => (
                  <div key={sIdx} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 truncate max-w-[130px]">{s.vendor}:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-200">
                      ₹{s.lastPrice.toFixed(2)}{' '}
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">({s.diff})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((vendor) => {
          // Calculate historical metrics from expenses
          const vendorExpenses = expenses.filter(
            (e) => e.vendorName.toLowerCase().includes(vendor.name.toLowerCase()) || e.vendorId === vendor._id
          );
          const totalSpent = vendorExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
          const totalOrders = vendorExpenses.length;

          return (
            <div
              key={vendor._id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{vendor.name}</h3>
                  <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">{vendor.code}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                  {vendor.status}
                </span>
              </div>

              {/* GSTIN and State */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">GSTIN:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{vendor.gstin || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">State / Region:</span>
                  <span className="text-slate-700 dark:text-slate-300">{vendor.state}, {vendor.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">Payment Terms:</span>
                  <span className="text-slate-700 dark:text-slate-300">{vendor.paymentTerms}</span>
                </div>
              </div>

              {/* Vendor Order Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono py-1">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Total Spend</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
                    ₹{totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </strong>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-sans">Orders Billed</span>
                  <strong className="text-slate-800 dark:text-slate-200 text-sm">{totalOrders} purchases</strong>
                </div>
              </div>

              {/* Contact Information */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 pt-1 border-t border-slate-200 dark:border-slate-800">
                <p className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{vendor.email}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{vendor.phone}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Contact: {vendor.contactPerson}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
