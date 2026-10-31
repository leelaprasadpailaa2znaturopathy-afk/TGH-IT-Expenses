import React, { useState } from 'react';
import { X, Boxes, ArrowUpRight } from 'lucide-react';
import { InventoryItem, User } from '../types';

interface IssueConsumableModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  preselectedProduct?: InventoryItem | null;
  onIssue: (
    productId: string,
    quantity: number,
    employeeName: string,
    department: string,
    remarks: string
  ) => Promise<void>;
  currentUser: User;
}

export const IssueConsumableModal: React.FC<IssueConsumableModalProps> = ({
  isOpen,
  onClose,
  inventory,
  preselectedProduct,
  onIssue,
  currentUser,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    preselectedProduct?.productId || (inventory[0] ? inventory[0].productId : '')
  );
  const [quantity, setQuantity] = useState(10);
  const [employeeName, setEmployeeName] = useState('');
  const [department, setDepartment] = useState('E-Commerce Dispatch Hub');
  const [remarks, setRemarks] = useState('Issued for dispatch processing');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeItem = inventory.find((i) => i.productId === selectedProductId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim()) return alert('Please enter recipient employee name');
    if (!selectedProductId) return alert('Please select a product');
    if (activeItem && quantity > activeItem.currentStock) {
      return alert(`Cannot issue ${quantity}. Current stock is only ${activeItem.currentStock} ${activeItem.unit}.`);
    }

    setIsSubmitting(true);
    try {
      await onIssue(selectedProductId, quantity, employeeName, department, remarks);
      onClose();
    } catch (err: any) {
      alert(`Issue failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Issue Consumables to Department</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Stock updates atomically • Audit trail preserved</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Consumable Product *</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
            >
              {inventory.map((inv) => (
                <option key={inv._id} value={inv.productId}>
                  {inv.productName} — Current Stock: {inv.currentStock} {inv.unit}
                </option>
              ))}
            </select>
          </div>

          {activeItem && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Current Available Stock</span>
                <span className="font-bold text-slate-900 dark:text-slate-200 text-sm">
                  {activeItem.currentStock} {activeItem.unit}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Minimum Threshold</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">{activeItem.minimumStock} rolls</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Quantity to Issue *</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Department *</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Issued To (Employee Name) *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Sundaram"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Remarks / Work Order</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : 'Confirm Stock Issue'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
