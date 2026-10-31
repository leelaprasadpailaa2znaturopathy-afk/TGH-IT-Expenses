export type Role = 'admin' | 'employee';

export interface UserPermissions {
  canAddExpenses: boolean;
  canEditExpenses: boolean;
  canIssueInventory: boolean;
  canManageAssets: boolean;
  canExportReports: boolean;
  canManageVendors: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  designation: string;
  department: string;
  avatar?: string;
  permissions?: UserPermissions;
  createdAt: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'failed' | 'cancelled';
export type ReceivedStatus = 'pending' | 'received' | 'partial' | 'not_applicable';
export type TaxMode = 'inclusive' | 'exclusive';
export type GstMethod = 'automatic' | 'manual';
export type Currency = 'INR' | 'USD';

export interface ExpenseItem {
  _id: string;
  expenseNumber: string; // e.g. IT-EXP-2026-0001
  invoiceNumber: string; // REQUIRED: Mandatory invoice / bill number
  invoiceLink?: string;  // Optional external link / URL to separate DB/cloud storage
  purchaseDate: string; // YYYY-MM-DD
  productName: string;
  category: string;
  subcategory?: string;
  responsiblePerson: string;
  purchasedBy: string;
  designation: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  currency: Currency;
  exchangeRate: number; // Historical rate locked to the purchase date
  isManualExchangeRate?: boolean; // If user manually altered the exchange rate
  taxMode: TaxMode;
  gstMethod: GstMethod;
  gstRate: number;
  taxableAmount: number; // in INR
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  totalAmount: number; // in INR
  originalAmount?: number; // USD amount if foreign currency
  vendorName: string;
  vendorId?: string;
  purposeJustification: string;
  paymentMethod: 'bank' | 'credit_card' | 'upi' | 'cash' | 'other';
  paymentStatus: PaymentStatus;
  paymentDate?: string;
  receivedStatus: ReceivedStatus;
  receivedDate?: string;
  receivedQuantity?: number;
  remarks?: string;
  financialYear: string;
  isConsumable: boolean;
  isAsset: boolean;
  isSubscription: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Vendor {
  _id: string;
  name: string;
  code: string;
  gstin: string;
  address: string;
  state: string;
  country: string;
  email: string;
  phone: string;
  contactPerson: string;
  paymentTerms: string;
  status: 'active' | 'inactive';
  categories: string[];
}

export interface InventoryItem {
  _id: string;
  productId: string;
  productName: string;
  sku: string;
  category: string;
  unit: string;
  packageQuantity: number;
  openingStock: number;
  stockReceived: number;
  stockIssued: number;
  stockReturned: number;
  damagedStock: number;
  currentStock: number;
  minimumStock: number;
  reorderLevel: number;
  lastPurchasePrice: number;
  averagePurchasePrice: number;
  lastPurchaseDate: string;
  reorderStatus: 'available' | 'low_stock' | 'reorder' | 'urgent' | 'out_of_stock' | 'not_required';
  remarks?: string;
}

export interface InventoryTransaction {
  _id: string;
  productId: string;
  productName: string;
  transactionType: 'received' | 'issued' | 'returned' | 'damaged' | 'adjustment';
  quantity: number;
  date: string;
  employeeName?: string;
  department?: string;
  issuedBy?: string;
  expenseId?: string;
  invoiceNumber?: string;
  remarks: string;
  createdAt: string;
}

export interface Asset {
  _id: string;
  assetId: string;
  assetName: string;
  brand: string;
  model: string;
  serialNumber: string;
  category: string;
  purchaseDate: string;
  purchasePrice: number;
  linkedExpenseId?: string;
  vendor: string;
  invoiceNumber: string;
  warrantyExpiry: string;
  assignedEmployee?: string;
  department?: string;
  location: string;
  assetStatus: 'in_stock' | 'assigned' | 'under_maintenance' | 'damaged' | 'retired' | 'disposed';
  notes?: string;
}

export interface Subscription {
  _id: string;
  name: string;
  vendor: string;
  serviceCategory: string;
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  originalAmount: number;
  currency: Currency;
  exchangeRate: number;
  inrEquivalent: number;
  startDate: string;
  lastPaymentDate: string;
  nextRenewalDate: string;
  paymentStatus: PaymentStatus;
  subscriptionStatus: 'active' | 'pending' | 'cancelled' | 'expired';
  invoiceNumber?: string;
  notes?: string;
}

export interface AuditLog {
  _id: string;
  userId: string;
  userName: string;
  action: string;
  recordType: string;
  recordId: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface NotificationItem {
  _id: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  relatedRecordId?: string;
  relatedRecordType?: string;
  isRead: boolean;
  createdAt: string;
}
