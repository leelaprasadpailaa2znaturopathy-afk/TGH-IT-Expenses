import React, { useState, useEffect } from 'react';
import {
  X,
  Calculator,
  IndianRupee,
  DollarSign,
  AlertCircle,
  Check,
  Link as LinkIcon,
  Calendar,
  Lock,
} from 'lucide-react';
import { ExpenseItem, Vendor, User } from '../types';
import { api } from '../services/api';
import { fetchExchangeRateForDate } from '../utils/currencyUtils';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expense: Partial<ExpenseItem>) => Promise<void>;
  vendors: Vendor[];
  currentUser: User;
  initialData?: ExpenseItem | null;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  vendors,
  currentUser,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    invoiceNumber: '', // MUST
    invoiceLink: '',   // Optional external DB / cloud link
    purchaseDate: new Date().toISOString().split('T')[0],
    productName: '',
    category: 'courier-labels',
    subcategory: '',
    quantity: 1,
    unit: 'Rolls',
    unitPrice: 0,
    currency: 'INR' as 'INR' | 'USD',
    exchangeRate: 0, // loaded from server or entered manually
    isManualExchangeRate: false,
    originalAmount: 0,
    taxMode: 'exclusive' as 'exclusive' | 'inclusive',
    gstMethod: 'automatic' as 'automatic' | 'manual',
    gstRate: 18,
    taxType: 'intra' as 'intra' | 'inter',
    manualTaxableAmount: 0,
    manualCgst: 0,
    manualSgst: 0,
    manualIgst: 0,
    manualTotalAmount: 0,
    vendorName: '',
    responsiblePerson: currentUser.name,
    purchasedBy: currentUser.name,
    designation: currentUser.designation,
    purposeJustification: '',
    paymentMethod: 'bank' as const,
    remarks: '',
    isConsumable: true,
    isAsset: false,
    isSubscription: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceTouched, setInvoiceTouched] = useState(false);
  const [syncedDateRate, setSyncedDateRate] = useState<number>(0);

  // Sync USD rate whenever date changes using the historical conversion rate utility
  useEffect(() => {
    if (formData.currency === 'USD' && !formData.isManualExchangeRate) {
      fetchExchangeRateForDate(formData.purchaseDate).then((rate) => {
        if (rate) {
          setSyncedDateRate(rate);
          setFormData((prev) => ({ ...prev, exchangeRate: rate }));
        }
      });
    }
  }, [formData.purchaseDate, formData.currency, formData.isManualExchangeRate]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        invoiceNumber: initialData.invoiceNumber,
        invoiceLink: initialData.invoiceLink || '',
        purchaseDate: initialData.purchaseDate,
        productName: initialData.productName,
        category: initialData.category,
        subcategory: initialData.subcategory || '',
        quantity: initialData.quantity,
        unit: initialData.unit,
        unitPrice: initialData.unitPrice,
        currency: initialData.currency as 'INR' | 'USD',
        exchangeRate: initialData.exchangeRate,
        isManualExchangeRate: !!initialData.isManualExchangeRate,
        originalAmount: initialData.originalAmount || 0,
        taxMode: initialData.taxMode,
        gstMethod: initialData.gstMethod,
        gstRate: initialData.gstRate,
        taxType: initialData.igst > 0 ? 'inter' : 'intra',
        manualTaxableAmount: initialData.taxableAmount,
        manualCgst: initialData.cgst,
        manualSgst: initialData.sgst,
        manualIgst: initialData.igst,
        manualTotalAmount: initialData.totalAmount,
        vendorName: initialData.vendorName,
        responsiblePerson: initialData.responsiblePerson,
        purchasedBy: initialData.purchasedBy,
        designation: initialData.designation,
        purposeJustification: initialData.purposeJustification,
        paymentMethod: initialData.paymentMethod as any,
        remarks: initialData.remarks || '',
        isConsumable: initialData.isConsumable,
        isAsset: initialData.isAsset,
        isSubscription: initialData.isSubscription,
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        responsiblePerson: currentUser.name,
        purchasedBy: currentUser.name,
        designation: currentUser.designation,
      }));
    }
  }, [initialData, currentUser]);

  const handleCategoryChange = (cat: string) => {
    const isConsumable = ['courier-labels', 'wax-rolls', 'barcode-rolls', 'barcode-wax-rolls'].includes(cat);
    const isSub = ['render', 'mongodb'].includes(cat);
    let defaultUnit = 'Rolls';
    if (isSub) defaultUnit = 'Month';
    if (cat === 'other') defaultUnit = 'Units';

    setFormData((prev) => ({
      ...prev,
      category: cat,
      isConsumable,
      isSubscription: isSub,
      unit: defaultUnit,
      currency: isSub ? 'USD' : prev.currency,
      gstRate: isSub ? 0 : 18,
    }));
  };

  // Arithmetic computations
  const qty = Number(formData.quantity) || 1;
  const price = Number(formData.unitPrice) || 0;
  const rate = formData.currency === 'USD' ? Number(formData.exchangeRate) || 0 : 1;
  const gstRate = Number(formData.gstRate) || 0;

  let calculatedTaxable = 0;
  let calculatedTax = 0;
  let calculatedTotal = 0;

  if (formData.currency === 'USD') {
    const baseInr = +(price * qty * rate).toFixed(2);
    calculatedTaxable = baseInr;
    calculatedTax = +(calculatedTaxable * (gstRate / 100)).toFixed(2);
    calculatedTotal = +(calculatedTaxable + calculatedTax).toFixed(2);
  } else {
    if (formData.taxMode === 'inclusive') {
      const full = price * qty;
      calculatedTaxable = +(full / (1 + gstRate / 100)).toFixed(2);
      calculatedTax = +(full - calculatedTaxable).toFixed(2);
      calculatedTotal = +full.toFixed(2);
    } else {
      calculatedTaxable = +(price * qty).toFixed(2);
      calculatedTax = +(calculatedTaxable * (gstRate / 100)).toFixed(2);
      calculatedTotal = +(calculatedTaxable + calculatedTax).toFixed(2);
    }
  }

  const finalTaxable = formData.gstMethod === 'manual' ? Number(formData.manualTaxableAmount) : calculatedTaxable;
  let finalCgst = 0;
  let finalSgst = 0;
  let finalIgst = 0;
  let finalTotalTax = 0;
  let finalGrandTotal = 0;

  if (formData.gstMethod === 'manual') {
    finalCgst = Number(formData.manualCgst) || 0;
    finalSgst = Number(formData.manualSgst) || 0;
    finalIgst = Number(formData.manualIgst) || 0;
    finalTotalTax = +(finalCgst + finalSgst + finalIgst).toFixed(2);
    finalGrandTotal = formData.manualTotalAmount ? Number(formData.manualTotalAmount) : +(finalTaxable + finalTotalTax).toFixed(2);
  } else {
    if (formData.taxType === 'intra') {
      finalCgst = +(calculatedTax / 2).toFixed(2);
      finalSgst = +(calculatedTax / 2).toFixed(2);
      finalIgst = 0;
    } else {
      finalCgst = 0;
      finalSgst = 0;
      finalIgst = calculatedTax;
    }
    finalTotalTax = calculatedTax;
    finalGrandTotal = calculatedTotal;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.invoiceNumber.trim()) {
      setInvoiceTouched(true);
      return alert('Invoice / Bill ID is mandatory! No expenses can be saved without an invoice identifier.');
    }
    if (!formData.productName.trim()) return alert('Please enter product or service name');
    if (formData.currency === 'USD' && !(Number(formData.exchangeRate) > 0)) return alert('Enter a valid USD exchange rate before saving.');
    if (!formData.vendorName.trim()) return alert('Please specify a vendor');

    if (formData.currency === 'USD' && formData.isManualExchangeRate) {
      
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        invoiceNumber: formData.invoiceNumber.trim(),
        invoiceLink: formData.invoiceLink.trim() || undefined,
        purchaseDate: formData.purchaseDate,
        productName: formData.productName,
        category: formData.category,
        subcategory: formData.subcategory,
        quantity: qty,
        unit: formData.unit,
        unitPrice: price,
        currency: formData.currency,
        exchangeRate: rate, // Locked forever for this bill
        isManualExchangeRate: formData.isManualExchangeRate,
        originalAmount: formData.currency === 'USD' ? +(qty * price).toFixed(2) : undefined,
        taxMode: formData.taxMode,
        gstMethod: formData.gstMethod,
        gstRate,
        taxableAmount: finalTaxable,
        cgst: finalCgst,
        sgst: finalSgst,
        igst: finalIgst,
        totalTax: finalTotalTax,
        totalAmount: finalGrandTotal,
        vendorName: formData.vendorName,
        responsiblePerson: formData.responsiblePerson,
        purchasedBy: formData.purchasedBy,
        designation: formData.designation,
        purposeJustification: formData.purposeJustification,
        paymentMethod: formData.paymentMethod,
        remarks: formData.remarks,
        isConsumable: formData.isConsumable,
        isAsset: formData.isAsset,
        isSubscription: formData.isSubscription,
      });
      onClose();
    } catch (err: any) {
      alert(`Error saving expense: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-8 transition-colors">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {initialData ? `Edit Bill: ${initialData.expenseNumber}` : 'Record a bill'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Invoice ID is mandatory • Date-locked USD conversion rate
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Mandatory Invoice Section */}
          <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-slate-950/70 border border-indigo-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-300 uppercase tracking-wider font-mono">
                Bill details
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Required to save a bill
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1 flex items-center justify-between">
                  <span>
                    Invoice / Bill number <span className="text-rose-500 font-extrabold">*</span>
                  </span>
                  {formData.invoiceNumber.trim() ? (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Valid ID
                    </span>
                  ) : (
                    <span className="text-[10px] text-rose-500 font-mono font-semibold">
                      Required
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PCTS/4672, INV-2026-9921, DELL-881"
                  value={formData.invoiceNumber}
                  onBlur={() => setInvoiceTouched(true)}
                  onChange={(e) => {
                    setFormData({ ...formData, invoiceNumber: e.target.value });
                    if (e.target.value.trim()) setInvoiceTouched(false);
                  }}
                  className={`w-full bg-white dark:bg-slate-800 border-2 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none transition-colors ${
                    invoiceTouched && !formData.invoiceNumber.trim()
                      ? 'border-rose-500 bg-rose-50/20 text-rose-900 dark:text-rose-200 focus:border-rose-600'
                      : formData.invoiceNumber.trim()
                      ? 'border-emerald-500/70 text-slate-900 dark:text-slate-100 focus:border-emerald-600'
                      : 'border-indigo-300 dark:border-indigo-500/50 text-slate-900 dark:text-slate-100 focus:border-indigo-600'
                  }`}
                />
                {invoiceTouched && !formData.invoiceNumber.trim() && (
                  <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Invoice / Bill ID is required. No bills can be saved without one.</span>
                  </p>
                )}
              </div>


            </div>
          </div>

          {/* Vendor */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Vendor / Supplier *</label>
            <input
              type="text"
              list="vendors-list"
              required
              placeholder="e.g. PC Technologies / Dell Technologies"
              value={formData.vendorName}
              onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
            />
            <datalist id="vendors-list">
              {vendors.map((v) => (
                <option key={v._id} value={v.name} />
              ))}
            </datalist>
          </div>

          {/* Classification & Product */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="courier-labels">Courier Labels (Consumable)</option>
                <option value="wax-rolls">Wax Rolls (Consumable)</option>
                <option value="barcode-rolls">Barcode Rolls (Consumable)</option>
                <option value="barcode-wax-rolls">Barcode Wax Rolls (Consumable)</option>
                <option value="render">Render Hosting (Subscription)</option>
                <option value="mongodb">MongoDB (Cloud Database)</option>
                <option value="other">Other Bills (Hardware &amp; SaaS)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Product / Service Purchased *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Courier Labels 4x6 / Dell Latitude 5540"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Purchase Date & Daily USD Exchange Rate Lock */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Purchase / Bill Date *</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Billing Currency
                </label>
                <div className="flex rounded-xl bg-slate-200/80 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, currency: 'INR' })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      formData.currency === 'INR'
                        ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    INR (₹)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, currency: 'USD' })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      formData.currency === 'USD'
                        ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    USD ($)
                  </button>
                </div>
              </div>

              {formData.currency === 'USD' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      USD Exchange Rate (₹/$)
                    </label>
                    <label className="text-[10px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isManualExchangeRate}
                        onChange={(e) => setFormData({ ...formData, isManualExchangeRate: e.target.checked })}
                      />
                      <span>Manual</span>
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.exchangeRate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          exchangeRate: parseFloat(e.target.value) || 0,
                          isManualExchangeRate: true,
                        })
                      }
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 block">
                    {formData.isManualExchangeRate
                      ? 'Manual rate entered'
                      : `Synced for ${formData.purchaseDate}: ₹${syncedDateRate}/USD (Locked)`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Economics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Quantity</label>
              <input
                type="number"
                min="0.1"
                step="any"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Packaging / Unit</label>
              <input
                type="text"
                placeholder="Rolls / Month / Units"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unit Price ({formData.currency === 'USD' ? '$' : '₹'})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>

          </div>

          <details open={Boolean(initialData)} className="group rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><span>Tax and additional details</span><span className="text-xs font-normal text-slate-500 dark:text-slate-400">Invoice link, GST, notes, tracking</span></summary>
            <div className="border-t border-slate-200 dark:border-slate-800 p-4 space-y-5">
              <div className="max-w-sm">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">GST rate</label>
                <select
                  value={formData.gstRate}
                  onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value={0}>0% (Exempt / Import of Service)</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18% (Standard IT Rate)</option>
                  <option value={28}>28%</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <LinkIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>External Invoice Link (Optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... or internal DB link"
                  value={formData.invoiceLink}
                  onChange={(e) => setFormData({ ...formData, invoiceLink: e.target.value })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
          {/* GST Calculation Section */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">GST Calculation Mode</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300">
                  <input
                    type="radio"
                    name="gstMethod"
                    checked={formData.gstMethod === 'automatic'}
                    onChange={() => setFormData({ ...formData, gstMethod: 'automatic' })}
                  />
                  <span>Automatic GST</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300">
                  <input
                    type="radio"
                    name="gstMethod"
                    checked={formData.gstMethod === 'manual'}
                    onChange={() => setFormData({ ...formData, gstMethod: 'manual' })}
                  />
                  <span>Manual Entry</span>
                </label>
              </div>
            </div>

            {formData.gstMethod === 'automatic' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Pricing Mode</label>
                  <select
                    value={formData.taxMode}
                    onChange={(e) => setFormData({ ...formData, taxMode: e.target.value as any })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="exclusive">GST Exclusive (Base + Tax)</option>
                    <option value="inclusive">GST Inclusive (Grand Total Contains Tax)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Supply Type</label>
                  <select
                    value={formData.taxType}
                    onChange={(e) => setFormData({ ...formData, taxType: e.target.value as any })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="intra">Intra-State (CGST 50% + SGST 50%)</option>
                    <option value="inter">Inter-State (IGST 100%)</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Taxable (₹)</label>
                  <input
                    type="number"
                    value={formData.manualTaxableAmount}
                    onChange={(e) => setFormData({ ...formData, manualTaxableAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">CGST (₹)</label>
                  <input
                    type="number"
                    value={formData.manualCgst}
                    onChange={(e) => setFormData({ ...formData, manualCgst: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">SGST (₹)</label>
                  <input
                    type="number"
                    value={formData.manualSgst}
                    onChange={(e) => setFormData({ ...formData, manualSgst: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">IGST (₹)</label>
                  <input
                    type="number"
                    value={formData.manualIgst}
                    onChange={(e) => setFormData({ ...formData, manualIgst: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            )}

            {/* Live Financial Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono">
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans uppercase">Taxable Base</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  ₹{finalTaxable.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans uppercase">GST Input Tax</span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  ₹{finalTotalTax.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans uppercase">Grand Total (INR)</span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  ₹{finalGrandTotal.toLocaleString('en-IN')}
                </span>
              </div>
              {formData.currency === 'USD' && (
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans uppercase">USD Paid</span>
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    ${(qty * price).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>


          {/* Justification & Remarks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Purpose / Justification
              </label>
              <textarea
                rows={2}
                placeholder="Business justification..."
                value={formData.purposeJustification}
                onChange={(e) => setFormData({ ...formData, purposeJustification: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Remarks / Delivery Note
              </label>
              <textarea
                rows={2}
                placeholder="Physical shelf, batch notes..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Resource Checkboxes */}
          <div className="flex flex-wrap items-center gap-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase font-mono">Ledger Targets:</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={formData.isConsumable}
                onChange={(e) => setFormData({ ...formData, isConsumable: e.target.checked })}
              />
              <span>Consumable Stock</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={formData.isAsset}
                onChange={(e) => setFormData({ ...formData, isAsset: e.target.checked })}
              />
              <span>Fixed Hardware Asset</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={formData.isSubscription}
                onChange={(e) => setFormData({ ...formData, isSubscription: e.target.checked })}
              />
              <span>Recurring SaaS Subscription</span>
            </label>
          </div>


              <div className="max-w-sm"><label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Payment method</label><select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"><option value="bank">Bank transfer</option><option value="credit_card">Credit card</option><option value="upi">UPI</option><option value="cash">Cash</option><option value="other">Other</option></select></div>
            </div>
          </details>
          <div className="sticky bottom-0 z-10 -mx-6 px-6 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-y border-emerald-200 dark:border-emerald-900/70">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-5 py-4">
              <div><p className="text-[11px] uppercase tracking-[0.16em] font-bold text-emerald-800 dark:text-emerald-300">Total bill amount</p><p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">Includes {'\u20B9'}{finalTotalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} GST</p></div>
              <div className="text-right"><p className="text-3xl sm:text-4xl leading-none font-black tracking-tight tabular-nums text-emerald-900 dark:text-emerald-200">{'\u20B9'}{finalGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>{formData.currency === 'USD' && <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-1">${(qty * price).toFixed(2)} USD</p>}</div>
            </div>
          </div>
          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.invoiceNumber.trim()}
              title={!formData.invoiceNumber.trim() ? 'Invoice ID is strictly required before saving' : undefined}
              className={`px-5 py-2 rounded-xl text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all ${
                !formData.invoiceNumber.trim()
                  ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
              }`}
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update Bill' : 'Save bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
