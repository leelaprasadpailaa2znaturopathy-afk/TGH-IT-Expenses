import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Download,
  FileSpreadsheet,
  PackageCheck,
  CreditCard,
  Edit2,
  Trash2,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { ExpenseItem, User } from '../types';

interface AllTransactionsProps {
  expenses: ExpenseItem[];
  currentUser: User;
  onEditExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (id: string, reason: string) => Promise<void>;
  onMarkReceived: (id: string, qty: number) => Promise<void>;
  onMarkPaid: (id: string, method: string) => Promise<void>;
}

export const AllTransactions: React.FC<AllTransactionsProps> = ({
  expenses,
  currentUser,
  onEditExpense,
  onDeleteExpense,
  onMarkReceived,
  onMarkPaid,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [selectedFY, setSelectedFY] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState('all');
  const [selectedReceived, setSelectedReceived] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<Set<string>>(new Set());
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const isAdmin = currentUser.role === 'admin';

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
      if (selectedVendor !== 'all' && e.vendorName !== selectedVendor) return false;
      if (selectedFY !== 'all' && e.financialYear !== selectedFY) return false;
      if (selectedPayment !== 'all' && e.paymentStatus !== selectedPayment) return false;
      if (selectedReceived !== 'all' && e.receivedStatus !== selectedReceived) return false;
      if (dateFrom && e.purchaseDate < dateFrom) return false;
      if (dateTo && e.purchaseDate > dateTo) return false;

      if (search) {
        const q = search.toLowerCase();
        const matches =
          e.invoiceNumber.toLowerCase().includes(q) ||
          e.productName.toLowerCase().includes(q) ||
          e.vendorName.toLowerCase().includes(q) ||
          e.expenseNumber.toLowerCase().includes(q) ||
          e.purchasedBy.toLowerCase().includes(q) ||
          (e.remarks && e.remarks.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    }).sort((a, b) => dateSort === 'newest'
      ? b.purchaseDate.localeCompare(a.purchaseDate)
      : a.purchaseDate.localeCompare(b.purchaseDate));
  }, [expenses, selectedCategory, selectedVendor, selectedFY, selectedPayment, selectedReceived, search, dateFrom, dateTo, dateSort]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedVendor, selectedFY, selectedPayment, selectedReceived, search, dateFrom, dateTo, dateSort]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allVisibleSelected = paginated.length > 0 && paginated.every((expense) => selectedExpenseIds.has(expense._id));

  const toggleExpenseSelection = (id: string) => {
    setSelectedExpenseIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleVisibleSelection = () => {
    setSelectedExpenseIds((previous) => {
      const next = new Set(previous);
      if (allVisibleSelected) paginated.forEach((expense) => next.delete(expense._id));
      else paginated.forEach((expense) => next.add(expense._id));
      return next;
    });
  };

  const vendors = Array.from(new Set(expenses.map((e) => e.vendorName))).filter(Boolean);

  const totalTaxableSum = filtered.reduce((sum, e) => sum + e.taxableAmount, 0);
  const totalTaxSum = filtered.reduce((sum, e) => sum + e.totalTax, 0);
  const grandTotalSum = filtered.reduce((sum, e) => sum + e.totalAmount, 0);

  const handleDelete = async (item: ExpenseItem) => {
    if (!isAdmin) return;
    const reason = prompt(
      `Confirm deletion of expense ${item.expenseNumber} (Invoice: ${item.invoiceNumber})?\n\nOnly Administrators can perform delete operations.\n\nEnter deletion audit reason:`
    );
    if (reason && reason.trim()) {
      try {
        await onDeleteExpense(item._id, reason.trim());
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (!isAdmin || selectedExpenseIds.size === 0 || isDeletingSelected) return;
    const selected = expenses.filter((expense) => selectedExpenseIds.has(expense._id));
    const reason = prompt(`Delete ${selected.length} selected transaction(s)?\n\nEnter the audit reason for this deletion:`);
    if (!reason?.trim()) return;

    setIsDeletingSelected(true);
    const deletedIds: string[] = [];
    try {
      for (const expense of selected) {
        await onDeleteExpense(expense._id, reason.trim());
        deletedIds.push(expense._id);
      }
      setSelectedExpenseIds((previous) => {
        const next = new Set(previous);
        deletedIds.forEach((id) => next.delete(id));
        return next;
      });
    } catch (err: any) {
      alert(`Deleted ${deletedIds.length} of ${selected.length} selected transactions. ${err.message || 'The remaining deletions failed.'}`);
    } finally {
      setIsDeletingSelected(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Centralized Transaction Ledger (Master)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Single canonical record of truth • Search directly by Invoice / Bill ID
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={selectedExpenseIds.size === 0 || isDeletingSelected}
              className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isDeletingSelected ? 'Deleting…' : `Delete Selected (${selectedExpenseIds.size})`}
            </button>
          )}
          <a
            href="/api/excel/export/original"
            download="IT_Expenses_Original_Format.xlsx"
            className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Format A: 16-Col Excel</span>
          </a>
          <a
            href="/api/excel/export/professional"
            download="IT_Expenses_Professional_Report.xlsx"
            className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Format B: Multi-Sheet</span>
          </a>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Invoice ID / Global Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Invoice ID, product, vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="courier-labels">Courier Labels</option>
              <option value="wax-rolls">Wax Rolls</option>
              <option value="barcode-rolls">Barcode Rolls</option>
              <option value="barcode-wax-rolls">Barcode Wax Rolls</option>
              <option value="render">Render Hosting</option>
              <option value="mongodb">MongoDB</option>
              <option value="other">Other Bills</option>
            </select>
          </div>

          {/* Vendor */}
          <div>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Vendors</option>
              {vendors.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Financial Year */}
          <div>
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Financial Years</option>
              <option value="2026-27">FY 2026–27</option>
              <option value="2025-26">FY 2025–26</option>
              <option value="2024-25">FY 2024–25</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-3 pt-1">
          <label className="flex flex-col gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            From date
            <input type="date" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200" />
          </label>
          <label className="flex flex-col gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            To date
            <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200" />
          </label>
          <label className="flex flex-col gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            Date order
            <select value={dateSort} onChange={(e) => setDateSort(e.target.value as 'newest' | 'oldest')} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        </div>

        {/* Totals Row */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span>Showing {filtered.length} of {expenses.length} bills</span>
            {(selectedCategory !== 'all' || selectedVendor !== 'all' || selectedFY !== 'all' || selectedPayment !== 'all' || selectedReceived !== 'all' || search || dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedVendor('all');
                  setSelectedFY('all');
                  setSelectedPayment('all');
                  setSelectedReceived('all');
                  setSearch('');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 font-mono">
            <span>Taxable: <strong className="text-slate-800 dark:text-slate-200">₹{totalTaxableSum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
            <span>GST: <strong className="text-indigo-600 dark:text-indigo-400">₹{totalTaxSum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
            <span>Total: <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">₹{grandTotalSum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-mono text-[11px] whitespace-nowrap">
                {isAdmin && (
                  <th className="py-3 px-3 text-center">
                    <input
                      type="checkbox"
                      aria-label="Select all transactions on this page"
                      checked={allVisibleSelected}
                      onChange={toggleVisibleSelection}
                    />
                  </th>
                )}
                <th className="py-3 px-3">S.No</th>
                <th className="py-3 px-3">Invoice / Bill ID</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Product / Service</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Qty</th>
                <th className="py-3 px-3 text-right">Unit Price</th>
                <th className="py-3 px-3 text-right">Taxable</th>
                <th className="py-3 px-3 text-right">Total Amount</th>
                <th className="py-3 px-3">Vendor</th>
                <th className="py-3 px-3">Entered By</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3">Stock Received</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 15 : 14} className="py-12 text-center text-slate-400">
                    No bills match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                paginated.map((item, idx) => {
                  const serialNum = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors whitespace-nowrap">
                      {isAdmin && (
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            aria-label={`Select transaction ${item.invoiceNumber}`}
                            checked={selectedExpenseIds.has(item._id)}
                            onChange={() => toggleExpenseSelection(item._id)}
                          />
                        </td>
                      )}
                      {/* S.No */}
                      <td className="py-2.5 px-3 font-mono text-slate-400">{serialNum}</td>

                      {/* Invoice ID + External Link */}
                      <td className="py-2.5 px-3 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{item.invoiceNumber}</span>
                          {item.invoiceLink && (
                            <a
                              href={item.invoiceLink}
                              target="_blank"
                              rel="noreferrer"
                              title="Open External Invoice Link"
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block">{item.expenseNumber}</span>
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">
                        {item.purchaseDate}
                      </td>

                      {/* Product */}
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                        {item.productName}
                      </td>

                      {/* Category Badge */}
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {item.category}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {item.quantity} <span className="text-[10px] text-slate-400">{item.unit}</span>
                      </td>

                      {/* Unit Price */}
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {item.currency === 'USD' ? `$${item.unitPrice}` : `₹${item.unitPrice.toLocaleString('en-IN')}`}
                      </td>

                      {/* Without Tax */}
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        ₹{item.taxableAmount.toLocaleString('en-IN')}
                      </td>

                      {/* Total Amount */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{item.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        {item.currency === 'USD' && (
                          <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                            (${item.originalAmount || item.unitPrice * item.quantity} @ ₹{item.exchangeRate})
                          </span>
                        )}
                      </td>

                      {/* Vendor */}
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        {item.vendorName}
                      </td>

                      {/* Entered By */}
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {item.purchasedBy}
                      </td>

                      {/* Payment Status */}
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            item.paymentStatus === 'paid'
                              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                              : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {item.paymentStatus}
                        </span>
                      </td>

                      {/* Received Status */}
                      <td className="py-2.5 px-3">
                        {item.isConsumable ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              item.receivedStatus === 'received'
                                ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {item.receivedStatus}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">N/A</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {item.isConsumable && item.receivedStatus !== 'received' && (
                            <button
                              onClick={() => onMarkReceived(item._id, item.quantity)}
                              title="Confirm Goods Received (Increments Stock)"
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <PackageCheck className="w-4 h-4" />
                            </button>
                          )}

                          {item.paymentStatus !== 'paid' && (
                            <button
                              onClick={() => onMarkPaid(item._id, 'bank')}
                              title="Mark as Paid"
                              className="p-1 rounded text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => onEditExpense(item)}
                            title="Edit Bill Details"
                            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* DELETE BUTTON: ONLY VISIBLE & PERMITTED FOR ADMIN */}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(item)}
                              title="Delete Record (Admin Only)"
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            Page <strong className="text-slate-900 dark:text-slate-200">{currentPage}</strong> of{' '}
            <strong className="text-slate-900 dark:text-slate-200">{totalPages}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
