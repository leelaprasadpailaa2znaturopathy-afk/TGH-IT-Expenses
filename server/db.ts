import fs from 'fs';
import path from 'path';
import {
  User,
  UserPermissions,
  ExpenseItem,
  Vendor,
  InventoryItem,
  InventoryTransaction,
  Asset,
  Subscription,
  AuditLog,
  NotificationItem,
} from './types.ts';

export function getFinancialYear(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '2026-27';
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  if (month >= 4) {
    const nextYearShort = String(year + 1).slice(-2);
    return `${year}-${nextYearShort}`;
  } else {
    const currYearShort = String(year).slice(-2);
    return `${year - 1}-${currYearShort}`;
  }
}

// Historical and current date-based USD exchange rates
export function getExchangeRateForDate(dateStr: string): number {
  if (!dateStr) return 93.10;
  // Deterministic daily lookup map based on date
  const dateMap: Record<string, number> = {
    '2026-10-30': 93.10, // today
    '2026-10-29': 90.22, // yesterday
    '2026-10-28': 90.22,
    '2026-10-26': 90.22,
    '2026-10-24': 90.18,
    '2026-10-18': 90.15,
    '2026-10-15': 90.12,
    '2026-10-12': 90.10,
    '2026-10-05': 90.05,
    '2026-10-01': 90.00,
    '2026-09-28': 89.85,
  };

  if (dateMap[dateStr]) return dateMap[dateStr];

  // Derive slight day variance if past date
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const day = d.getDate();
    return +(90.0 + (day % 4) * 0.8).toFixed(2);
  }
  return 93.10;
}

export function generateObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const machine = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  const pid = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  const increment = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  return `${timestamp}${machine}${pid}${increment}`;
}

export interface DatabaseState {
  users: User[];
  expenses: ExpenseItem[];
  vendors: Vendor[];
  categories: { id: string; name: string; slug: string; type: 'consumable' | 'software' | 'hardware' | 'other'; icon?: string }[];
  inventory: InventoryItem[];
  inventory_transactions: InventoryTransaction[];
  assets: Asset[];
  subscriptions: Subscription[];
  audit_logs: AuditLog[];
  notifications: NotificationItem[];
  settings: {
    companyName: string;
    primaryCurrency: string;
    secondaryCurrency: string;
    defaultGstRate: number;
    currentUsdRate: number;
    financialYearStartMonth: number;
  };
}

const DB_FILE = path.resolve(process.cwd(), '.db_state.json');

type Listener = (event: { type: string; data: any; timestamp: string }) => void;
const subscribers: Set<Listener> = new Set();

export function subscribeToEvents(listener: Listener): () => void {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

export function broadcast(type: string, data: any) {
  const payload = { type, data, timestamp: new Date().toISOString() };
  subscribers.forEach((fn) => {
    try {
      fn(payload);
    } catch {
      // ignore
    }
  });
}

function getInitialData(): DatabaseState {
  const now = '2026-10-30T10:00:00.000Z';

  const defaultAdminPermissions: UserPermissions = {
    canAddExpenses: true,
    canEditExpenses: true,
    canIssueInventory: true,
    canManageAssets: true,
    canExportReports: true,
    canManageVendors: true,
  };

  const defaultEmployeePermissions: UserPermissions = {
    canAddExpenses: true,
    canEditExpenses: true,
    canIssueInventory: true,
    canManageAssets: true,
    canExportReports: true,
    canManageVendors: false,
  };

  const users: User[] = [
    {
      _id: 'usr_admin_01',
      name: 'Rohan Sharma',
      email: 'rohan.sharma@company.com',
      role: 'admin',
      designation: 'IT Infrastructure Head',
      department: 'Information Technology',
      permissions: defaultAdminPermissions,
      createdAt: now,
    },
    {
      _id: 'usr_emp_01',
      name: 'Vikram Patel',
      email: 'vikram.patel@company.com',
      role: 'employee',
      designation: 'Senior Systems Administrator',
      department: 'IT Support & Systems',
      permissions: defaultEmployeePermissions,
      createdAt: now,
    },
    {
      _id: 'usr_emp_02',
      name: 'Ananya Verma',
      email: 'ananya.verma@company.com',
      role: 'employee',
      designation: 'Procurement & Asset Executive',
      department: 'IT Logistics',
      permissions: {
        ...defaultEmployeePermissions,
        canManageAssets: true,
        canManageVendors: true,
      },
      createdAt: now,
    },
  ];

  const vendors: Vendor[] = [
    {
      _id: 'vnd_pctech',
      name: 'PC Technologies',
      code: 'VND-PCT-01',
      gstin: '29AABCP1234F1Z8',
      address: 'No 45, Commercial Street, Shivajinagar, Bengaluru',
      state: 'Karnataka',
      country: 'India',
      email: 'sales@pctechnologies.in',
      phone: '+91 80 4123 4567',
      contactPerson: 'Mr. Suresh Kumar',
      paymentTerms: 'Net 15 Days',
      status: 'active',
      categories: ['courier-labels', 'wax-rolls', 'barcode-rolls'],
    },
    {
      _id: 'vnd_barcodeworld',
      name: 'Barcode World & Solutions',
      code: 'VND-BCW-02',
      gstin: '27AABCB9876Q1Z2',
      address: 'Plot 12, Industrial Area, MIDC Andheri East, Mumbai',
      state: 'Maharashtra',
      country: 'India',
      email: 'orders@barcodeworld.co.in',
      phone: '+91 22 6789 0123',
      contactPerson: 'Mr. Rajesh Jain',
      paymentTerms: 'Immediate / Net 7',
      status: 'active',
      categories: ['barcode-rolls', 'barcode-wax-rolls', 'courier-labels'],
    },
    {
      _id: 'vnd_dell',
      name: 'Dell Technologies India',
      code: 'VND-DEL-03',
      gstin: '29AABCD1111E1Z5',
      address: 'Divyasree Greens, Koramangala Inner Ring Rd, Bengaluru',
      state: 'Karnataka',
      country: 'India',
      email: 'enterprise@dell.co.in',
      phone: '+91 80 2510 2000',
      contactPerson: 'Kavita Menon',
      paymentTerms: 'Advance / Bank Transfer',
      status: 'active',
      categories: ['other'],
    },
    {
      _id: 'vnd_render',
      name: 'Render Services Inc.',
      code: 'VND-RND-04',
      gstin: 'NOT APPLICABLE (US OIDAR / Import of Service)',
      address: '525 Brannan St, San Francisco, CA 94107, USA',
      state: 'California',
      country: 'United States',
      email: 'billing@render.com',
      phone: '+1 415 555 0192',
      contactPerson: 'Billing Team',
      paymentTerms: 'Monthly Credit Card Auto-Debit',
      status: 'active',
      categories: ['render'],
    },
    {
      _id: 'vnd_mongodb',
      name: 'MongoDB Inc.',
      code: 'VND-MDB-05',
      gstin: 'NOT APPLICABLE (US OIDAR / Cloud Database)',
      address: '1633 Broadway 38th Floor, New York, NY 10019, USA',
      state: 'New York',
      country: 'United States',
      email: 'invoice@mongodb.com',
      phone: '+1 646 727 4092',
      contactPerson: 'Cloud Accounts Team',
      paymentTerms: 'Monthly Usage Auto-charge',
      status: 'active',
      categories: ['mongodb'],
    },
    {
      _id: 'vnd_compushop',
      name: 'Comptech Peripherals & Systems',
      code: 'VND-CPS-06',
      gstin: '29AABFC3421K1ZM',
      address: 'SP Road, Hardware Market, Bengaluru',
      state: 'Karnataka',
      country: 'India',
      email: 'orders@comptechperipherals.com',
      phone: '+91 80 2221 8899',
      contactPerson: 'Dinesh Gowda',
      paymentTerms: 'Net 30 Days',
      status: 'active',
      categories: ['other'],
    },
  ];

  const categories = [
    { id: 'courier-labels', name: 'Courier Labels', slug: 'courier-labels', type: 'consumable' as const, icon: 'Package' },
    { id: 'wax-rolls', name: 'Wax Rolls', slug: 'wax-rolls', type: 'consumable' as const, icon: 'Disc' },
    { id: 'barcode-rolls', name: 'Barcode Rolls', slug: 'barcode-rolls', type: 'consumable' as const, icon: 'Barcode' },
    { id: 'barcode-wax-rolls', name: 'Barcode Wax Rolls', slug: 'barcode-wax-rolls', type: 'consumable' as const, icon: 'Tag' },
    { id: 'render', name: 'Render Hosting', slug: 'render', type: 'software' as const, icon: 'Cloud' },
    { id: 'mongodb', name: 'MongoDB', slug: 'mongodb', type: 'software' as const, icon: 'Database' },
    { id: 'other', name: 'Other Bills (Hardware & SaaS)', slug: 'other', type: 'other' as const, icon: 'Layers' },
  ];

  const inventory: InventoryItem[] = [
    {
      _id: 'inv_01',
      productId: 'PROD-CL-01',
      productName: 'Courier Labels',
      sku: 'SKU-LBL-4X6',
      category: 'courier-labels',
      unit: 'Rolls (4x6 Direct Thermal 500/roll)',
      packageQuantity: 50,
      openingStock: 120,
      stockReceived: 200,
      stockIssued: 145,
      stockReturned: 5,
      damagedStock: 2,
      currentStock: 178,
      minimumStock: 40,
      reorderLevel: 60,
      lastPurchasePrice: 195.0,
      averagePurchasePrice: 192.5,
      lastPurchaseDate: '2026-10-18',
      reorderStatus: 'available',
      remarks: 'Healthy buffer stock in Central IT Stores',
    },
    {
      _id: 'inv_02',
      productId: 'PROD-WR-02',
      productName: 'Wax Rolls',
      sku: 'SKU-WAX-110X300',
      category: 'wax-rolls',
      unit: 'Rolls (110mm x 300m Premium Ribbon)',
      packageQuantity: 24,
      openingStock: 45,
      stockReceived: 50,
      stockIssued: 68,
      stockReturned: 0,
      damagedStock: 1,
      currentStock: 26,
      minimumStock: 20,
      reorderLevel: 35,
      lastPurchasePrice: 280.0,
      averagePurchasePrice: 275.0,
      lastPurchaseDate: '2026-10-12',
      reorderStatus: 'reorder',
      remarks: 'Stock approaching reorder threshold',
    },
    {
      _id: 'inv_03',
      productId: 'PROD-BR-03',
      productName: 'Barcode Rolls',
      sku: 'SKU-BCR-50X25',
      category: 'barcode-rolls',
      unit: 'Rolls (50x25mm Dual Column 2000/roll)',
      packageQuantity: 60,
      openingStock: 80,
      stockReceived: 120,
      stockIssued: 110,
      stockReturned: 0,
      damagedStock: 0,
      currentStock: 90,
      minimumStock: 30,
      reorderLevel: 50,
      lastPurchasePrice: 162.5,
      averagePurchasePrice: 160.0,
      lastPurchaseDate: '2026-10-24',
      reorderStatus: 'available',
      remarks: 'Standard inventory level',
    },
    {
      _id: 'inv_04',
      productId: 'PROD-BWR-04',
      productName: 'Barcode Wax Rolls',
      sku: 'SKU-BWR-80X300',
      category: 'barcode-wax-rolls',
      unit: 'Rolls (Wax Resin 80mm x 300m)',
      packageQuantity: 20,
      openingStock: 15,
      stockReceived: 20,
      stockIssued: 27,
      stockReturned: 0,
      damagedStock: 0,
      currentStock: 8,
      minimumStock: 10,
      reorderLevel: 15,
      lastPurchasePrice: 320.0,
      averagePurchasePrice: 315.0,
      lastPurchaseDate: '2026-09-28',
      reorderStatus: 'urgent',
      remarks: 'Urgent: below minimum stock! Immediate order required.',
    },
  ];

  const inventory_transactions: InventoryTransaction[] = [
    {
      _id: 'txn_01',
      productId: 'PROD-CL-01',
      productName: 'Courier Labels',
      transactionType: 'received',
      quantity: 100,
      date: '2026-10-18',
      issuedBy: 'Vikram Patel',
      expenseId: 'IT-EXP-2026-0001',
      invoiceNumber: 'PCTS/4672',
      remarks: 'Shipment received and verified at IT Stores',
      createdAt: now,
    },
    {
      _id: 'txn_02',
      productId: 'PROD-CL-01',
      productName: 'Courier Labels',
      transactionType: 'issued',
      quantity: 40,
      date: '2026-10-20',
      employeeName: 'Ramesh Sundaram',
      department: 'E-Commerce Dispatch Hub',
      issuedBy: 'Vikram Patel',
      remarks: 'Issued 40 rolls for Q4 festive dispatch rush',
      createdAt: now,
    },
  ];

  const expenses: ExpenseItem[] = [
    {
      _id: 'exp_01',
      expenseNumber: 'IT-EXP-2026-0001',
      invoiceNumber: 'PCTS/4672',
      invoiceLink: 'https://drive.google.com/file/d/sample-pcts-4672/view',
      purchaseDate: '2026-10-18',
      productName: 'Courier Labels',
      category: 'courier-labels',
      subcategory: 'Consumables',
      responsiblePerson: 'Rohan Sharma',
      purchasedBy: 'Vikram Patel',
      designation: 'Senior Systems Administrator',
      quantity: 100,
      unit: 'Rolls',
      unitPrice: 195.0,
      currency: 'INR',
      exchangeRate: 1.0,
      taxMode: 'exclusive',
      gstMethod: 'automatic',
      gstRate: 18,
      taxableAmount: 19500,
      cgst: 1755,
      sgst: 1755,
      igst: 0,
      totalTax: 3510,
      totalAmount: 23010,
      vendorName: 'PC Technologies',
      vendorId: 'vnd_pctech',
      purposeJustification: 'Replenishing dispatch shipping labels for regional warehouse',
      paymentMethod: 'bank',
      paymentStatus: 'paid',
      paymentDate: '2026-10-21',
      receivedStatus: 'received',
      receivedDate: '2026-10-20',
      receivedQuantity: 100,
      remarks: 'Material Received and verified in IT Stores',
      financialYear: '2026-27',
      isConsumable: true,
      isAsset: false,
      isSubscription: false,
      createdAt: '2026-10-18T09:30:00.000Z',
      updatedAt: '2026-10-21T14:00:00.000Z',
      createdBy: 'Vikram Patel',
    },
    {
      _id: 'exp_02',
      expenseNumber: 'IT-EXP-2026-0002',
      invoiceNumber: 'PCTS/4610',
      purchaseDate: '2026-10-12',
      productName: 'Wax Rolls',
      category: 'wax-rolls',
      subcategory: 'Consumables',
      responsiblePerson: 'Rohan Sharma',
      purchasedBy: 'Vikram Patel',
      designation: 'Senior Systems Administrator',
      quantity: 50,
      unit: 'Rolls',
      unitPrice: 280.0,
      currency: 'INR',
      exchangeRate: 1.0,
      taxMode: 'exclusive',
      gstMethod: 'automatic',
      gstRate: 18,
      taxableAmount: 14000,
      cgst: 1260,
      sgst: 1260,
      igst: 0,
      totalTax: 2520,
      totalAmount: 16520,
      vendorName: 'PC Technologies',
      vendorId: 'vnd_pctech',
      purposeJustification: 'Ribbons for high-speed industrial barcode printing',
      paymentMethod: 'bank',
      paymentStatus: 'paid',
      paymentDate: '2026-10-15',
      receivedStatus: 'received',
      receivedDate: '2026-10-14',
      receivedQuantity: 50,
      remarks: 'Stock added to inventory shelf B3',
      financialYear: '2026-27',
      isConsumable: true,
      isAsset: false,
      isSubscription: false,
      createdAt: '2026-10-12T11:00:00.000Z',
      updatedAt: '2026-10-15T16:20:00.000Z',
      createdBy: 'Vikram Patel',
    },
    {
      _id: 'exp_03',
      expenseNumber: 'IT-EXP-2026-0003',
      invoiceNumber: 'BCW/8921',
      purchaseDate: '2026-10-24',
      productName: 'Barcode Rolls',
      category: 'barcode-rolls',
      subcategory: 'Consumables',
      responsiblePerson: 'Rohan Sharma',
      purchasedBy: 'Ananya Verma',
      designation: 'Procurement Executive',
      quantity: 60,
      unit: 'Rolls',
      unitPrice: 162.5,
      currency: 'INR',
      exchangeRate: 1.0,
      taxMode: 'exclusive',
      gstMethod: 'automatic',
      gstRate: 18,
      taxableAmount: 9750,
      cgst: 877.5,
      sgst: 877.5,
      igst: 0,
      totalTax: 1755,
      totalAmount: 11505,
      vendorName: 'Barcode World & Solutions',
      vendorId: 'vnd_barcodeworld',
      purposeJustification: 'Inventory asset tagging and product SKU barcoding',
      paymentMethod: 'upi',
      paymentStatus: 'paid',
      paymentDate: '2026-10-26',
      receivedStatus: 'received',
      receivedDate: '2026-10-25',
      receivedQuantity: 60,
      remarks: 'Material Received',
      financialYear: '2026-27',
      isConsumable: true,
      isAsset: false,
      isSubscription: false,
      createdAt: '2026-10-24T14:10:00.000Z',
      updatedAt: '2026-10-26T10:00:00.000Z',
      createdBy: 'Ananya Verma',
    },
    {
      _id: 'exp_04',
      expenseNumber: 'IT-EXP-2026-0004',
      invoiceNumber: 'BCW/8740',
      purchaseDate: '2026-09-28',
      productName: 'Barcode Wax Rolls',
      category: 'barcode-wax-rolls',
      subcategory: 'Consumables',
      responsiblePerson: 'Rohan Sharma',
      purchasedBy: 'Vikram Patel',
      designation: 'Senior Systems Administrator',
      quantity: 20,
      unit: 'Rolls',
      unitPrice: 320.0,
      currency: 'INR',
      exchangeRate: 1.0,
      taxMode: 'exclusive',
      gstMethod: 'automatic',
      gstRate: 18,
      taxableAmount: 6400,
      cgst: 0,
      sgst: 0,
      igst: 1152,
      totalTax: 1152,
      totalAmount: 7552,
      vendorName: 'Barcode World & Solutions',
      vendorId: 'vnd_barcodeworld',
      purposeJustification: 'High durability wax-resin ribbons for harsh environment labeling',
      paymentMethod: 'bank',
      paymentStatus: 'paid',
      paymentDate: '2026-10-02',
      receivedStatus: 'received',
      receivedDate: '2026-10-01',
      receivedQuantity: 20,
      remarks: 'Received in good condition',
      financialYear: '2026-27',
      isConsumable: true,
      isAsset: false,
      isSubscription: false,
      createdAt: '2026-09-28T10:00:00.000Z',
      updatedAt: '2026-10-02T12:00:00.000Z',
      createdBy: 'Vikram Patel',
    },
    {
      _id: 'exp_05',
      expenseNumber: 'IT-EXP-2026-0005',
      invoiceNumber: 'RND-INV-2026-10',
      invoiceLink: 'https://dashboard.render.com/invoices/2026-10',
      purchaseDate: '2026-10-01',
      productName: 'Render Cloud Web Hosting',
      category: 'render',
      subcategory: 'Cloud Hosting',
      responsiblePerson: 'Rohan Sharma',
      purchasedBy: 'Rohan Sharma',
      designation: 'IT Infrastructure Head',
      quantity: 1,
      unit: 'Monthly Pro Plan',
      unitPrice: 2250.0,
      currency: 'USD',
      exchangeRate: 90.00, // Locked on 2026-10-01 rate
      taxMode: 'exclusive',
      gstMethod: 'manual',
      gstRate: 0,
      taxableAmount: 2250.0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalTax: 0,
      totalAmount: 2250.0,
      originalAmount: 25.0,
      vendorName: 'Render Services Inc.',
      vendorId: 'vnd_render',
      purposeJustification: 'Production application servers and Redis cache cluster hosting',
      paymentMethod: 'credit_card',
      paymentStatus: 'paid',
      paymentDate: '2026-10-01',
      receivedStatus: 'not_applicable',
      remarks: 'Automated renewal for October 2026 ($25 USD locked @ ₹90.00)',
      financialYear: '2026-27',
      isConsumable: false,
      isAsset: false,
      isSubscription: true,
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-01T08:00:00.000Z',
      createdBy: 'Rohan Sharma',
    },
    {
      _id: 'exp_06',
      expenseNumber: 'IT-EXP-2026-0006',
      invoiceNumber: 'MDB-INV-99238',
      invoiceLink: 'https://cloud.mongodb.com/billing/invoices/99238',
      purchaseDate: '2026-10-05',
      productName: 'MongoDB Atlas Dedicated Cluster',
      category: 'mongodb',
      subcategory: 'Cloud Database',
      responsiblePerson: 'Rohan Sharma',
      purchasedBy: 'Rohan Sharma',
      designation: 'IT Infrastructure Head',
      quantity: 1,
      unit: 'Monthly M10 Cluster',
      unitPrice: 5132.85,
      currency: 'USD',
      exchangeRate: 90.05, // Locked on 2026-10-05 rate
      taxMode: 'exclusive',
      gstMethod: 'manual',
      gstRate: 0,
      taxableAmount: 5132.85,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalTax: 0,
      totalAmount: 5132.85,
      originalAmount: 57.0,
      vendorName: 'MongoDB Inc.',
      vendorId: 'vnd_mongodb',
      purposeJustification: 'Central production database with automated continuous backups & VPC peering',
      paymentMethod: 'credit_card',
      paymentStatus: 'paid',
      paymentDate: '2026-10-05',
      receivedStatus: 'not_applicable',
      remarks: 'Monthly consumption billing ($57 USD locked @ ₹90.05)',
      financialYear: '2026-27',
      isConsumable: false,
      isAsset: false,
      isSubscription: true,
      createdAt: '2026-10-05T08:30:00.000Z',
      updatedAt: '2026-10-05T08:30:00.000Z',
      createdBy: 'Rohan Sharma',
    },
    {
      _id: 'exp_07',
      expenseNumber: 'IT-EXP-2026-0007',
      invoiceNumber: 'DELL/BLR/2026/881',
      purchaseDate: '2026-10-15',
      productName: 'Dell Latitude 5540 Laptop (Core i7 16GB 512GB)',
      category: 'other',
      subcategory: 'Hardware / Laptops',
      responsiblePerson: 'Rohan Sharma',
      purchasedBy: 'Ananya Verma',
      designation: 'Procurement Executive',
      quantity: 2,
      unit: 'Laptops',
      unitPrice: 72000.0,
      currency: 'INR',
      exchangeRate: 1.0,
      taxMode: 'exclusive',
      gstMethod: 'automatic',
      gstRate: 18,
      taxableAmount: 144000,
      cgst: 12960,
      sgst: 12960,
      igst: 0,
      totalTax: 25920,
      totalAmount: 169920,
      vendorName: 'Dell Technologies India',
      vendorId: 'vnd_dell',
      purposeJustification: 'New developer onboardings for Core Engineering team',
      paymentMethod: 'bank',
      paymentStatus: 'paid',
      paymentDate: '2026-10-18',
      receivedStatus: 'received',
      receivedDate: '2026-10-17',
      receivedQuantity: 2,
      remarks: 'Tagged into Asset Register: AST-DEL-001 and AST-DEL-002',
      financialYear: '2026-27',
      isConsumable: false,
      isAsset: true,
      isSubscription: false,
      createdAt: '2026-10-15T15:00:00.000Z',
      updatedAt: '2026-10-18T11:00:00.000Z',
      createdBy: 'Ananya Verma',
    },
    {
      _id: 'exp_08',
      expenseNumber: 'IT-EXP-2026-0008',
      invoiceNumber: 'CPS-2026-119',
      purchaseDate: '2026-10-22',
      productName: 'Samsung 27-inch 4K IPS Developer Monitor',
      category: 'other',
      subcategory: 'Hardware / Monitors',
      responsiblePerson: 'Rohan Sharma',
      purchasedBy: 'Vikram Patel',
      designation: 'Senior Systems Administrator',
      quantity: 3,
      unit: 'Monitors',
      unitPrice: 22500.0,
      currency: 'INR',
      exchangeRate: 1.0,
      taxMode: 'exclusive',
      gstMethod: 'automatic',
      gstRate: 18,
      taxableAmount: 67500,
      cgst: 6075,
      sgst: 6075,
      igst: 0,
      totalTax: 12150,
      totalAmount: 79650,
      vendorName: 'Comptech Peripherals & Systems',
      vendorId: 'vnd_compushop',
      purposeJustification: 'Ergonomic dual-screen setups for DevOps & Security operations',
      paymentMethod: 'bank',
      paymentStatus: 'paid',
      paymentDate: '2026-10-25',
      receivedStatus: 'received',
      receivedDate: '2026-10-24',
      receivedQuantity: 3,
      remarks: 'Installed in NOC / Server room workstations',
      financialYear: '2026-27',
      isConsumable: false,
      isAsset: true,
      isSubscription: false,
      createdAt: '2026-10-22T10:45:00.000Z',
      updatedAt: '2026-10-25T09:30:00.000Z',
      createdBy: 'Vikram Patel',
    },
  ];

  const assets: Asset[] = [
    {
      _id: 'ast_01',
      assetId: 'AST-DEL-001',
      assetName: 'Dell Latitude 5540 Laptop',
      brand: 'Dell',
      model: 'Latitude 5540 (Intel Core i7 13th Gen, 16GB RAM, 512GB NVMe SSD)',
      serialNumber: 'DL5540-8849-IN',
      category: 'Laptops',
      purchaseDate: '2026-10-15',
      purchasePrice: 84960,
      linkedExpenseId: 'exp_07',
      vendor: 'Dell Technologies India',
      invoiceNumber: 'DELL/BLR/2026/881',
      warrantyExpiry: '2029-10-15',
      assignedEmployee: 'Vikram Patel',
      department: 'Information Technology',
      location: 'Bengaluru Tech Park - Floor 4',
      assetStatus: 'assigned',
      notes: 'Provisioned with Ubuntu 24.04 LTS & Dev tooling',
    },
    {
      _id: 'ast_02',
      assetId: 'AST-DEL-002',
      assetName: 'Dell Latitude 5540 Laptop',
      brand: 'Dell',
      model: 'Latitude 5540 (Intel Core i7 13th Gen, 16GB RAM, 512GB NVMe SSD)',
      serialNumber: 'DL5540-8850-IN',
      category: 'Laptops',
      purchaseDate: '2026-10-15',
      purchasePrice: 84960,
      linkedExpenseId: 'exp_07',
      vendor: 'Dell Technologies India',
      invoiceNumber: 'DELL/BLR/2026/881',
      warrantyExpiry: '2029-10-15',
      assignedEmployee: 'Ananya Verma',
      department: 'IT Logistics',
      location: 'Bengaluru Tech Park - Floor 4',
      assetStatus: 'assigned',
      notes: 'Provisioned with Windows 11 Enterprise',
    },
  ];

  const subscriptions: Subscription[] = [
    {
      _id: 'sub_01',
      name: 'Render Cloud Web Hosting',
      vendor: 'Render Services Inc.',
      serviceCategory: 'Cloud Hosting / PaaS',
      billingCycle: 'monthly',
      originalAmount: 25.0,
      currency: 'USD',
      exchangeRate: 90.00,
      inrEquivalent: 2250.0,
      startDate: '2024-04-01',
      lastPaymentDate: '2026-10-01',
      nextRenewalDate: '2026-11-01',
      paymentStatus: 'paid',
      subscriptionStatus: 'active',
      invoiceNumber: 'RND-INV-2026-10',
      notes: 'Hosts primary container workloads and Redis instances',
    },
    {
      _id: 'sub_02',
      name: 'MongoDB Atlas Dedicated Tier',
      vendor: 'MongoDB Inc.',
      serviceCategory: 'Managed Database',
      billingCycle: 'monthly',
      originalAmount: 57.0,
      currency: 'USD',
      exchangeRate: 90.05,
      inrEquivalent: 5132.85,
      startDate: '2024-04-01',
      lastPaymentDate: '2026-10-05',
      nextRenewalDate: '2026-11-05',
      paymentStatus: 'paid',
      subscriptionStatus: 'active',
      invoiceNumber: 'MDB-INV-99238',
      notes: 'M10 cluster on AWS ap-south-1 with multi-AZ failover',
    },
  ];

  const audit_logs: AuditLog[] = [
    {
      _id: 'aud_01',
      userId: 'usr_emp_01',
      userName: 'Vikram Patel',
      action: 'Expense Created',
      recordType: 'expense',
      recordId: 'IT-EXP-2026-0001',
      newValue: 'Courier Labels 100 rolls from PC Technologies ₹23,010 (Invoice: PCTS/4672)',
      timestamp: '2026-10-18T09:30:00.000Z',
    },
    {
      _id: 'aud_02',
      userId: 'usr_emp_01',
      userName: 'Vikram Patel',
      action: 'Inventory Received',
      recordType: 'inventory',
      recordId: 'inv_01',
      oldValue: 'stock: 78',
      newValue: 'stock: 178 (+100 received from PCTS/4672)',
      timestamp: '2026-10-20T11:00:00.000Z',
    },
  ];

  const notifications: NotificationItem[] = [
    {
      _id: 'notif_01',
      title: 'Urgent Stock Alert: Barcode Wax Rolls',
      description: 'Stock level is at 8 rolls (below minimum threshold of 10). Reorder immediately.',
      type: 'alert',
      relatedRecordId: 'inv_04',
      relatedRecordType: 'inventory',
      isRead: false,
      createdAt: '2026-10-29T08:00:00.000Z',
    },
    {
      _id: 'notif_02',
      title: 'Upcoming Subscription Renewal: Render Hosting',
      description: 'Render Cloud Web Hosting ($25 USD) renews in 2 days on Nov 01, 2026.',
      type: 'warning',
      relatedRecordId: 'sub_01',
      relatedRecordType: 'subscription',
      isRead: false,
      createdAt: '2026-10-29T09:00:00.000Z',
    },
  ];

  const settings = {
    companyName: 'Apex Logistics & Tech Solutions Pvt Ltd',
    primaryCurrency: 'INR',
    secondaryCurrency: 'USD',
    defaultGstRate: 18,
    currentUsdRate: 93.10,
    financialYearStartMonth: 4,
  };

  return {
    users,
    expenses,
    vendors,
    categories,
    inventory,
    inventory_transactions,
    assets,
    subscriptions,
    audit_logs,
    notifications,
    settings,
  };
}

class MongoDBStore {
  private data: DatabaseState;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseState {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const state: DatabaseState = JSON.parse(raw);
        if (state.users) {
          state.users = state.users
            .filter((u: any) => u.email !== 'priya.iyer@company.com') // remove approver account
            .map((u: any) => ({
              ...u,
              role: u.role === 'admin' ? ('admin' as const) : ('employee' as const),
            }));
        }
        return state;
      }
    } catch {
      // ignore
    }
    const initial = getInitialData();
    this.save(initial);
    return initial;
  }

  private save(state?: DatabaseState) {
    if (state) this.data = state;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch {
      // ignore
    }
  }

  // --- Users & Access Management ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public createUser(userData: Partial<User>, adminUser: User): User {
    if (adminUser.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can create users');
    }

    const _id = generateObjectId();
    const newUser: User = {
      _id,
      name: userData.name || 'New Staff',
      email: userData.email || 'staff@company.com',
      role: userData.role === 'admin' ? 'admin' : 'employee',
      designation: userData.designation || 'IT Staff',
      department: userData.department || 'Information Technology',
      permissions: userData.permissions || {
        canAddExpenses: true,
        canEditExpenses: true,
        canIssueInventory: true,
        canManageAssets: false,
        canExportReports: true,
        canManageVendors: false,
      },
      createdAt: new Date().toISOString(),
    };

    this.data.users.push(newUser);
    this.addAuditLog({
      userId: adminUser._id,
      userName: adminUser.name,
      action: 'User Created',
      recordType: 'user',
      recordId: newUser._id,
      newValue: `${newUser.name} (${newUser.role})`,
    });

    this.save();
    broadcast('USER_UPDATED', newUser);
    return newUser;
  }

  public updateUser(userId: string, updates: Partial<User>, adminUser: User): User | null {
    if (adminUser.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can modify user access');
    }

    const idx = this.data.users.findIndex((u) => u._id === userId);
    if (idx === -1) return null;

    const old = this.data.users[idx];
    const updated: User = {
      ...old,
      ...updates,
      permissions: updates.permissions ? { ...old.permissions, ...updates.permissions } : old.permissions,
    };

    this.data.users[idx] = updated;
    this.addAuditLog({
      userId: adminUser._id,
      userName: adminUser.name,
      action: 'User Permissions Updated',
      recordType: 'user',
      recordId: updated._id,
      oldValue: JSON.stringify(old.permissions),
      newValue: JSON.stringify(updated.permissions),
    });

    this.save();
    broadcast('USER_UPDATED', updated);
    return updated;
  }

  public deleteUser(userId: string, adminUser: User): boolean {
    if (adminUser.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can remove users');
    }

    const idx = this.data.users.findIndex((u) => u._id === userId);
    if (idx === -1) return false;

    const removed = this.data.users.splice(idx, 1)[0];
    this.addAuditLog({
      userId: adminUser._id,
      userName: adminUser.name,
      action: 'User Deleted',
      recordType: 'user',
      recordId: removed._id,
      oldValue: `${removed.name} (${removed.role})`,
    });

    this.save();
    broadcast('USER_DELETED', { userId });
    return true;
  }

  // --- Expenses ---
  public getExpenses(): ExpenseItem[] {
    return [...this.data.expenses].sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  }

  public getExpenseById(id: string): ExpenseItem | undefined {
    return this.data.expenses.find((e) => e._id === id || e.expenseNumber === id);
  }

  public createExpense(expense: Partial<ExpenseItem>, user: User): ExpenseItem {
    // Permission check
    if (user.role === 'employee' && user.permissions && user.permissions.canAddExpenses === false) {
      throw new Error('Unauthorized: Employee account does not have permission to add expenses');
    }

    // Invoice number is MUST
    if (!expense.invoiceNumber || !expense.invoiceNumber.trim()) {
      throw new Error('Invoice Number / Bill ID is mandatory. Please provide a valid invoice reference.');
    }

    const count = this.data.expenses.length + 1;
    const year = new Date().getFullYear();
    const expenseNumber = expense.expenseNumber || `IT-EXP-${year}-${String(count).padStart(4, '0')}`;
    const _id = generateObjectId();
    const now = new Date().toISOString();
    const purchaseDate = expense.purchaseDate || new Date().toISOString().split('T')[0];

    // Exchange rate handling:
    // If USD and manual rate provided, use that; otherwise auto-assign rate for that exact day
    let rate = 1.0;
    if (expense.currency === 'USD') {
      if (expense.isManualExchangeRate && expense.exchangeRate && expense.exchangeRate > 0) {
        rate = Number(expense.exchangeRate);
      } else {
        rate = getExchangeRateForDate(purchaseDate);
      }
    }

    const qty = Number(expense.quantity) || 1;
    const uPrice = Number(expense.unitPrice) || 0;
    const gstRate = Number(expense.gstRate) ?? 18;

    let taxableAmount = Number(expense.taxableAmount);
    let totalTax = Number(expense.totalTax);
    let totalAmount = Number(expense.totalAmount);

    if (expense.gstMethod !== 'manual') {
      if (expense.taxMode === 'inclusive') {
        const fullAmount = (expense.currency === 'USD' ? (expense.originalAmount || qty * uPrice) * rate : qty * uPrice);
        taxableAmount = +(fullAmount / (1 + gstRate / 100)).toFixed(2);
        totalTax = +(fullAmount - taxableAmount).toFixed(2);
        totalAmount = +fullAmount.toFixed(2);
      } else {
        const base = (expense.currency === 'USD' ? (expense.originalAmount || qty * uPrice) * rate : qty * uPrice);
        taxableAmount = +base.toFixed(2);
        totalTax = +(taxableAmount * (gstRate / 100)).toFixed(2);
        totalAmount = +(taxableAmount + totalTax).toFixed(2);
      }
    }

    const cgst = expense.cgst !== undefined ? Number(expense.cgst) : +(totalTax / 2).toFixed(2);
    const sgst = expense.sgst !== undefined ? Number(expense.sgst) : +(totalTax / 2).toFixed(2);
    const igst = expense.igst !== undefined ? Number(expense.igst) : 0;

    const fullRecord: ExpenseItem = {
      _id,
      expenseNumber,
      invoiceNumber: expense.invoiceNumber.trim(),
      invoiceLink: expense.invoiceLink?.trim(),
      purchaseDate,
      productName: expense.productName || 'General IT Purchase',
      category: expense.category || 'other',
      subcategory: expense.subcategory,
      responsiblePerson: expense.responsiblePerson || user.name,
      purchasedBy: expense.purchasedBy || user.name,
      designation: expense.designation || user.designation,
      quantity: qty,
      unit: expense.unit || 'Units',
      unitPrice: uPrice,
      currency: expense.currency || 'INR',
      exchangeRate: rate, // Locked to this bill's date
      isManualExchangeRate: !!expense.isManualExchangeRate,
      taxMode: expense.taxMode || 'exclusive',
      gstMethod: expense.gstMethod || 'automatic',
      gstRate,
      taxableAmount,
      cgst,
      sgst,
      igst,
      totalTax,
      totalAmount,
      originalAmount: expense.originalAmount || (expense.currency === 'USD' ? qty * uPrice : undefined),
      vendorName: expense.vendorName || 'General Supplier',
      vendorId: expense.vendorId,
      purposeJustification: expense.purposeJustification || 'IT Operational requirement',
      paymentMethod: expense.paymentMethod || 'bank',
      paymentStatus: expense.paymentStatus || 'paid',
      paymentDate: expense.paymentDate || purchaseDate,
      receivedStatus: expense.receivedStatus || 'pending',
      remarks: expense.remarks,
      financialYear: getFinancialYear(purchaseDate),
      isConsumable: !!expense.isConsumable,
      isAsset: !!expense.isAsset,
      isSubscription: !!expense.isSubscription,
      createdAt: now,
      updatedAt: now,
      createdBy: user.name,
    };

    this.data.expenses.unshift(fullRecord);

    this.addAuditLog({
      userId: user._id,
      userName: user.name,
      action: 'Expense Recorded',
      recordType: 'expense',
      recordId: fullRecord.expenseNumber,
      newValue: `${fullRecord.productName} (${fullRecord.quantity} ${fullRecord.unit}) - ₹${fullRecord.totalAmount} (Inv: ${fullRecord.invoiceNumber})`,
    });

    if (fullRecord.receivedStatus === 'received') {
      this.syncInventoryOnReceive(fullRecord, user.name);
    }

    this.save();
    broadcast('EXPENSE_CREATED', fullRecord);
    return fullRecord;
  }

  public updateExpense(id: string, updates: Partial<ExpenseItem>, user: User): ExpenseItem | null {
    if (user.role === 'employee' && user.permissions && user.permissions.canEditExpenses === false) {
      throw new Error('Unauthorized: Employee account does not have permission to edit expenses');
    }

    const idx = this.data.expenses.findIndex((e) => e._id === id || e.expenseNumber === id);
    if (idx === -1) return null;

    const old = this.data.expenses[idx];
    const updated: ExpenseItem = {
      ...old,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Keep invoice number mandatory
    if (!updated.invoiceNumber || !updated.invoiceNumber.trim()) {
      throw new Error('Invoice Number cannot be empty');
    }

    if (updates.purchaseDate) {
      updated.financialYear = getFinancialYear(updates.purchaseDate);
      // Only recalculate rate if not manually overridden
      if (!updated.isManualExchangeRate && updated.currency === 'USD') {
        updated.exchangeRate = getExchangeRateForDate(updates.purchaseDate);
        if (updated.originalAmount) {
          updated.taxableAmount = +(updated.originalAmount * updated.exchangeRate).toFixed(2);
          updated.totalAmount = updated.taxableAmount;
        }
      }
    }

    this.data.expenses[idx] = updated;

    if (old.receivedStatus !== 'received' && updated.receivedStatus === 'received') {
      this.syncInventoryOnReceive(updated, user.name);
    }

    this.addAuditLog({
      userId: user._id,
      userName: user.name,
      action: 'Expense Updated',
      recordType: 'expense',
      recordId: updated.expenseNumber,
      oldValue: `Amount: ₹${old.totalAmount}, Inv: ${old.invoiceNumber}`,
      newValue: `Amount: ₹${updated.totalAmount}, Inv: ${updated.invoiceNumber}`,
    });

    this.save();
    broadcast('EXPENSE_UPDATED', updated);
    return updated;
  }

  // DELETE / REVERSE: STRICTLY ADMIN ONLY
  public deleteExpense(id: string, user: User, reason: string): boolean {
    if (user.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can perform delete operations.');
    }

    const idx = this.data.expenses.findIndex((e) => e._id === id || e.expenseNumber === id);
    if (idx === -1) return false;

    const removed = this.data.expenses.splice(idx, 1)[0];

    this.addAuditLog({
      userId: user._id,
      userName: user.name,
      action: 'Expense Permanently Deleted',
      recordType: 'expense',
      recordId: removed.expenseNumber,
      oldValue: `${removed.productName} (Inv: ${removed.invoiceNumber}, ₹${removed.totalAmount})`,
      newValue: `DELETED by Admin ${user.name}. Reason: ${reason}`,
    });

    this.save();
    broadcast('EXPENSE_DELETED', { id: removed._id, expenseNumber: removed.expenseNumber });
    return true;
  }

  public markExpenseReceived(id: string, receivedQty: number, user: User): ExpenseItem | null {
    const expense = this.getExpenseById(id);
    if (!expense) return null;

    return this.updateExpense(
      expense._id,
      {
        receivedStatus: 'received',
        receivedDate: new Date().toISOString().split('T')[0],
        receivedQuantity: receivedQty || expense.quantity,
      },
      user
    );
  }

  public markExpensePaid(id: string, paymentMethod: any, user: User): ExpenseItem | null {
    const expense = this.getExpenseById(id);
    if (!expense) return null;

    return this.updateExpense(
      expense._id,
      {
        paymentStatus: 'paid',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: paymentMethod || expense.paymentMethod,
      },
      user
    );
  }

  // --- Inventory ---
  public getInventory(): InventoryItem[] {
    return this.data.inventory;
  }

  public getInventoryTransactions(): InventoryTransaction[] {
    return [...this.data.inventory_transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  private syncInventoryOnReceive(expense: ExpenseItem, operatorName: string) {
    const prodName = expense.productName.toLowerCase();
    const item = this.data.inventory.find(
      (inv) => inv.category === expense.category || inv.productName.toLowerCase().includes(prodName) || prodName.includes(inv.productName.toLowerCase())
    );

    if (item) {
      const qty = expense.receivedQuantity || expense.quantity;
      item.stockReceived += qty;
      item.lastPurchasePrice = expense.unitPrice;
      item.lastPurchaseDate = expense.purchaseDate;
      this.recalculateStock(item);

      const txn: InventoryTransaction = {
        _id: generateObjectId(),
        productId: item.productId,
        productName: item.productName,
        transactionType: 'received',
        quantity: qty,
        date: expense.purchaseDate,
        issuedBy: operatorName,
        expenseId: expense.expenseNumber,
        invoiceNumber: expense.invoiceNumber,
        remarks: `Auto-incremented from received purchase ${expense.expenseNumber} (Invoice: ${expense.invoiceNumber})`,
        createdAt: new Date().toISOString(),
      };
      this.data.inventory_transactions.unshift(txn);
    }
  }

  public issueInventory(
    productId: string,
    quantity: number,
    employeeName: string,
    department: string,
    remarks: string,
    operator: User
  ): { success: boolean; message: string; item?: InventoryItem } {
    if (operator.role === 'employee' && operator.permissions && operator.permissions.canIssueInventory === false) {
      return { success: false, message: 'Unauthorized: You do not have permission to issue stock' };
    }

    const item = this.data.inventory.find((i) => i.productId === productId || i._id === productId);
    if (!item) return { success: false, message: 'Product not found in inventory' };

    if (item.currentStock < quantity) {
      return { success: false, message: `Insufficient stock! Current available stock is ${item.currentStock} ${item.unit}.` };
    }

    item.stockIssued += quantity;
    this.recalculateStock(item);

    const txn: InventoryTransaction = {
      _id: generateObjectId(),
      productId: item.productId,
      productName: item.productName,
      transactionType: 'issued',
      quantity,
      date: new Date().toISOString().split('T')[0],
      employeeName,
      department,
      issuedBy: operator.name,
      remarks,
      createdAt: new Date().toISOString(),
    };
    this.data.inventory_transactions.unshift(txn);

    this.addAuditLog({
      userId: operator._id,
      userName: operator.name,
      action: 'Inventory Issued',
      recordType: 'inventory',
      recordId: item.productId,
      newValue: `Issued ${quantity} ${item.unit} to ${employeeName} (${department})`,
    });

    this.save();
    broadcast('INVENTORY_UPDATED', { item, txn });
    return { success: true, message: `Successfully issued ${quantity} ${item.unit} to ${employeeName}`, item };
  }

  public adjustInventory(
    productId: string,
    newCount: number,
    reason: string,
    operator: User
  ): InventoryItem | null {
    if (operator.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can manually adjust stock counts');
    }

    const item = this.data.inventory.find((i) => i.productId === productId || i._id === productId);
    if (!item) return null;

    const diff = newCount - item.currentStock;
    item.currentStock = newCount;

    const txn: InventoryTransaction = {
      _id: generateObjectId(),
      productId: item.productId,
      productName: item.productName,
      transactionType: 'adjustment',
      quantity: Math.abs(diff),
      date: new Date().toISOString().split('T')[0],
      issuedBy: operator.name,
      remarks: `Manual audit adjustment: ${diff >= 0 ? '+' : ''}${diff}. Reason: ${reason}`,
      createdAt: new Date().toISOString(),
    };
    this.data.inventory_transactions.unshift(txn);
    this.recalculateStock(item);

    this.save();
    broadcast('INVENTORY_UPDATED', { item, txn });
    return item;
  }

  private recalculateStock(item: InventoryItem) {
    item.currentStock = item.openingStock + item.stockReceived + item.stockReturned - item.stockIssued - item.damagedStock;
    if (item.currentStock <= 0) {
      item.reorderStatus = 'out_of_stock';
    } else if (item.currentStock <= item.minimumStock) {
      item.reorderStatus = 'urgent';
    } else if (item.currentStock <= item.reorderLevel) {
      item.reorderStatus = 'reorder';
    } else {
      item.reorderStatus = 'available';
    }
  }

  // --- Fixed Assets ---
  public getAssets(): Asset[] {
    return this.data.assets;
  }

  public createAsset(asset: Partial<Asset>, operator: User): Asset {
    const count = this.data.assets.length + 1;
    const assetId = asset.assetId || `AST-${String(count).padStart(3, '0')}`;
    const newAsset: Asset = {
      _id: generateObjectId(),
      assetId,
      assetName: asset.assetName || 'IT Asset',
      brand: asset.brand || 'Generic',
      model: asset.model || 'Standard',
      serialNumber: asset.serialNumber || `SN-${Date.now().toString().slice(-8)}`,
      category: asset.category || 'Hardware',
      purchaseDate: asset.purchaseDate || new Date().toISOString().split('T')[0],
      purchasePrice: Number(asset.purchasePrice) || 0,
      linkedExpenseId: asset.linkedExpenseId,
      vendor: asset.vendor || 'Authorized Distributor',
      invoiceNumber: asset.invoiceNumber || 'INV-REF',
      warrantyExpiry: asset.warrantyExpiry || '',
      assignedEmployee: asset.assignedEmployee,
      department: asset.department,
      location: asset.location || 'Headquarters',
      assetStatus: asset.assetStatus || 'in_stock',
      notes: asset.notes,
    };
    this.data.assets.unshift(newAsset);
    this.addAuditLog({
      userId: operator._id,
      userName: operator.name,
      action: 'Asset Registered',
      recordType: 'asset',
      recordId: newAsset.assetId,
      newValue: `${newAsset.assetName} (${newAsset.serialNumber})`,
    });
    this.save();
    broadcast('ASSET_UPDATED', newAsset);
    return newAsset;
  }

  public assignAsset(
    assetId: string,
    assignedEmployee: string,
    department: string,
    location: string,
    operator: User
  ): Asset | null {
    const asset = this.data.assets.find((a) => a.assetId === assetId || a._id === assetId);
    if (!asset) return null;

    asset.assignedEmployee = assignedEmployee;
    asset.department = department;
    asset.location = location;
    asset.assetStatus = assignedEmployee ? 'assigned' : 'in_stock';

    this.addAuditLog({
      userId: operator._id,
      userName: operator.name,
      action: 'Asset Reassigned',
      recordType: 'asset',
      recordId: asset.assetId,
      newValue: `Assigned to ${assignedEmployee} (${department}) at ${location}`,
    });

    this.save();
    broadcast('ASSET_UPDATED', asset);
    return asset;
  }

  // --- Subscriptions ---
  public getSubscriptions(): Subscription[] {
    return this.data.subscriptions;
  }

  public createSubscription(sub: Partial<Subscription>, operator: User): Subscription {
    const rate = sub.currency === 'USD' ? (sub.exchangeRate || getExchangeRateForDate(sub.startDate || '')) : 1.0;
    const origAmount = Number(sub.originalAmount) || 0;
    const inr = sub.currency === 'USD' ? +(origAmount * rate).toFixed(2) : origAmount;

    const newSub: Subscription = {
      _id: generateObjectId(),
      name: sub.name || 'Cloud Service',
      vendor: sub.vendor || 'Cloud Provider',
      serviceCategory: sub.serviceCategory || 'SaaS',
      billingCycle: sub.billingCycle || 'monthly',
      originalAmount: origAmount,
      currency: sub.currency || 'USD',
      exchangeRate: rate,
      inrEquivalent: inr,
      startDate: sub.startDate || new Date().toISOString().split('T')[0],
      lastPaymentDate: sub.lastPaymentDate || new Date().toISOString().split('T')[0],
      nextRenewalDate: sub.nextRenewalDate || '',
      paymentStatus: sub.paymentStatus || 'paid',
      subscriptionStatus: sub.subscriptionStatus || 'active',
      invoiceNumber: sub.invoiceNumber || 'SUB-INV',
      notes: sub.notes,
    };

    this.data.subscriptions.unshift(newSub);
    this.addAuditLog({
      userId: operator._id,
      userName: operator.name,
      action: 'Subscription Created',
      recordType: 'subscription',
      recordId: newSub.name,
      newValue: `${newSub.name} - ${newSub.originalAmount} ${newSub.currency} (${newSub.billingCycle})`,
    });

    this.save();
    broadcast('SUBSCRIPTION_UPDATED', newSub);
    return newSub;
  }

  // --- Vendors ---
  public getVendors(): Vendor[] {
    return this.data.vendors;
  }

  public createVendor(vendor: Partial<Vendor>): Vendor {
    const _id = generateObjectId();
    const newVendor: Vendor = {
      _id,
      name: vendor.name || 'New Supplier',
      code: vendor.code || `VND-${Date.now().toString().slice(-4)}`,
      gstin: vendor.gstin || '',
      address: vendor.address || '',
      state: vendor.state || 'Karnataka',
      country: vendor.country || 'India',
      email: vendor.email || '',
      phone: vendor.phone || '',
      contactPerson: vendor.contactPerson || '',
      paymentTerms: vendor.paymentTerms || 'Net 15 Days',
      status: 'active',
      categories: vendor.categories || ['other'],
    };
    this.data.vendors.push(newVendor);
    this.save();
    return newVendor;
  }

  // --- Categories ---
  public getCategories() {
    return this.data.categories;
  }

  // --- Notifications & Audit ---
  public getNotifications(): NotificationItem[] {
    return this.data.notifications;
  }

  public markNotificationAsRead(id: string) {
    const n = this.data.notifications.find((item) => item._id === id);
    if (n) {
      n.isRead = true;
      this.save();
    }
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.data.audit_logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public addAuditLog(log: Omit<AuditLog, '_id' | 'timestamp'>) {
    const fullLog: AuditLog = {
      _id: generateObjectId(),
      ...log,
      timestamp: new Date().toISOString(),
    };
    this.data.audit_logs.unshift(fullLog);
  }

  public getSettings() {
    return this.data.settings;
  }

  public updateSettings(settings: Partial<DatabaseState['settings']>) {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
    return this.data.settings;
  }
}

export const db = new MongoDBStore();
