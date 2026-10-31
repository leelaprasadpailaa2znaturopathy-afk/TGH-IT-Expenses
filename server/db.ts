import { MongoClient, type Collection, type Db } from 'mongodb';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
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
  return db?.getSettings().currentUsdRate || 0;
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

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'it_expense_resource_management';

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
  return {
    users: [], expenses: [], vendors: [], categories: [], inventory: [],
    inventory_transactions: [], assets: [], subscriptions: [], audit_logs: [], notifications: [],
    settings: {
      companyName: '', primaryCurrency: 'INR', secondaryCurrency: 'USD', defaultGstRate: 18,
      currentUsdRate: 0, financialYearStartMonth: 4,
    },
  };
}

class MongoDBStore {
  private data: DatabaseState;
  private persistenceQueue: Promise<void> = Promise.resolve();

  public replaceState(state: DatabaseState) { this.data = { ...getInitialData(), ...state }; }

  public authenticateUser(email: string, password: string): User | null {
    const user: any = this.data.users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());
    if (!user?.passwordHash || !password) return null;
    const [salt, hash] = user.passwordHash.split(':');
    if (!salt || !hash) return null;
    const actual = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, 'hex');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const { passwordHash: _secret, ...safeUser } = user;
    return safeUser;
  }

  public createBootstrapAdmin(email: string, password: string, name: string) {
    if (!email || !password || this.data.users.length > 0) return;
    const salt = randomBytes(16).toString('hex');
    const passwordHash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
    this.data.users.push({
      _id: generateObjectId(), name: name || 'Administrator', email: email.toLowerCase(), role: 'admin',
      designation: 'Administrator', department: 'IT', passwordHash,
      permissions: { canAddExpenses: true, canEditExpenses: true, canIssueInventory: true, canManageAssets: true, canExportReports: true, canManageVendors: true },
      createdAt: new Date().toISOString(),
    } as any);
    this.save();
  }

  private async persist() {
    if (!stateCollections || !settingsCollection) return;
    const arrayKeys = [
      'users', 'expenses', 'vendors', 'categories', 'inventory', 'inventory_transactions',
      'assets', 'subscriptions', 'audit_logs', 'notifications',
    ] as const;
    for (const key of arrayKeys) {
      const records = this.data[key] as any[];
      const collection = stateCollections[key];
      const ids = records.map((record) => record._id);
      await collection.deleteMany({ _id: { $nin: ids } });
      if (records.length) {
        await collection.bulkWrite(records.map((record) => ({
          replaceOne: { filter: { _id: record._id }, replacement: record, upsert: true },
        })));
      }
    }
    await settingsCollection.replaceOne({ _id: 'settings' }, { _id: 'settings', ...this.data.settings }, { upsert: true });
  }

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseState { return getInitialData(); }

  private save(state?: DatabaseState) {
    if (state) this.data = state;
    this.persistenceQueue = this.persistenceQueue
      .then(() => this.persist())
      .catch((error) => console.error('MongoDB state write failed:', error));
  }

  // --- Users & Access Management ---
  public getUsers(): User[] {
    return this.data.users.map((user: any) => {
      const { passwordHash: _secret, ...safeUser } = user;
      return safeUser;
    });
  }

  public createUser(userData: Partial<User>, adminUser: User): User {
    if (adminUser.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can create users');
    }

    const _id = generateObjectId();
    const password = String((userData as any).password || '');
    if (password.length < 8) throw new Error('Password must be at least 8 characters.');
    const salt = randomBytes(16).toString('hex');
    const newUser: any = {
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
      passwordHash: `${salt}:${scryptSync(password, salt, 64).toString('hex')}`,
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
    const { passwordHash: _secret, ...safeUser } = newUser;
    return safeUser;
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

let mongoClient: MongoClient | undefined;
let stateCollections: Record<string, Collection<any>> | undefined;
let settingsCollection: Collection<any> | undefined;

export async function connectDatabase() {
  if (!MONGODB_URI) throw new Error('MONGODB_URI is required. Add your MongoDB Atlas connection string to .env.');
  mongoClient = new MongoClient(MONGODB_URI);
  await mongoClient.connect();
  const mongoDb: Db = mongoClient.db(MONGODB_DB_NAME);
  const arrayKeys = [
    'users', 'expenses', 'vendors', 'categories', 'inventory', 'inventory_transactions',
    'assets', 'subscriptions', 'audit_logs', 'notifications',
  ];
  stateCollections = Object.fromEntries(arrayKeys.map((name) => [name, mongoDb.collection(name)]));
  settingsCollection = mongoDb.collection('app_settings');
  const loadedState: any = {};
  for (const name of arrayKeys) loadedState[name] = await stateCollections[name].find().toArray();
  const settings = await settingsCollection.findOne({ _id: 'settings' });
  if (settings) {
    const { _id: _ignored, ...values } = settings;
    loadedState.settings = values;
  }
  db.replaceState(loadedState as DatabaseState);
  db.createBootstrapAdmin(process.env.ADMIN_EMAIL || '', process.env.ADMIN_PASSWORD || '', process.env.ADMIN_NAME || 'Administrator');
  await mongoDb.collection('users').createIndex({ email: 1 }, { unique: true });
  return mongoDb;
}
