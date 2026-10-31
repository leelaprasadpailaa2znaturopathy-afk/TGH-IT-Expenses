import {
  ExpenseItem,
  Vendor,
  InventoryItem,
  InventoryTransaction,
  Asset,
  Subscription,
  AuditLog,
  NotificationItem,
  User,
  UserPermissions,
} from '../types';

export const api = {
  // --- Real-time SSE Listener ---
  subscribeToEvents(callback: (event: { type: string; data: any; timestamp: string }) => void) {
    const eventSource = new EventSource('/api/events');
    eventSource.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        callback(parsed);
      } catch {
        // ignore
      }
    };
    return () => eventSource.close();
  },

  // --- Exchange Rate API (by date) ---
  async getExchangeRate(dateStr?: string): Promise<{ date: string; rate: number }> {
    const d = dateStr || new Date().toISOString().split('T')[0];
    const res = await fetch(`/api/exchange-rate?date=${d}`);
    return await res.json();
  },

  // --- Users & Access Management (Admin only) ---
  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/users');
    const json = await res.json();
    return json.data || [];
  },

  async createUser(userData: Partial<User>, adminUser?: User): Promise<User> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userData, adminUser }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create user');
    return json.data;
  },

  async updateUser(id: string, updates: Partial<User>, adminUser?: User): Promise<User> {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates, adminUser }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update user');
    return json.data;
  },

  async updateUserPermissions(id: string, permissions: Partial<UserPermissions>, adminUser?: User): Promise<User> {
    return this.updateUser(id, { permissions } as any, adminUser);
  },

  async deleteUser(id: string, adminUser?: User): Promise<boolean> {
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminUser }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete user');
    return json.success;
  },

  // --- GraphQL Client ---
  async graphql<T = any>(query: string, variables?: any): Promise<T> {
    const res = await fetch('/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors && json.errors.length > 0) {
      throw new Error(json.errors[0].message);
    }
    return json.data;
  },

  // --- Expenses ---
  async getExpenses(params?: {
    category?: string;
    search?: string;
    financialYear?: string;
    paymentStatus?: string;
  }): Promise<ExpenseItem[]> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.financialYear) searchParams.set('financialYear', params.financialYear);
    if (params?.paymentStatus) searchParams.set('paymentStatus', params.paymentStatus);

    const res = await fetch(`/api/expenses?${searchParams.toString()}`);
    const json = await res.json();
    return json.data || [];
  },

  async createExpense(expense: Partial<ExpenseItem>, currentUser?: User): Promise<ExpenseItem> {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...expense, currentUser }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to record expense');
    return json.data;
  },

  async updateExpense(id: string, updates: Partial<ExpenseItem>, currentUser?: User): Promise<ExpenseItem> {
    const res = await fetch(`/api/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, currentUser }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update expense');
    return json.data;
  },

  // STRICTLY ADMIN ONLY
  async deleteExpense(id: string, currentUser: User, reason: string): Promise<boolean> {
    const res = await fetch(`/api/expenses/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUser, reason }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete expense');
    return json.success;
  },

  async markReceived(id: string, quantity: number, currentUser?: User): Promise<ExpenseItem> {
    const res = await fetch(`/api/expenses/${id}/receive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity, user: currentUser }),
    });
    const json = await res.json();
    return json.data;
  },

  async markPaid(id: string, paymentMethod: string, currentUser?: User): Promise<ExpenseItem> {
    const res = await fetch(`/api/expenses/${id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod, user: currentUser }),
    });
    const json = await res.json();
    return json.data;
  },

  // --- Inventory ---
  async getInventory(): Promise<{ items: InventoryItem[]; transactions: InventoryTransaction[] }> {
    const res = await fetch('/api/inventory');
    const json = await res.json();
    return { items: json.items || [], transactions: json.transactions || [] };
  },

  async issueInventory(
    productId: string,
    quantity: number,
    employeeName: string,
    department: string,
    remarks: string,
    currentUser?: User
  ): Promise<{ success: boolean; message: string; item?: InventoryItem }> {
    const res = await fetch('/api/inventory/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity, employeeName, department, remarks, user: currentUser }),
    });
    return await res.json();
  },

  async adjustInventory(productId: string, newCount: number, reason: string, currentUser?: User): Promise<InventoryItem> {
    const res = await fetch('/api/inventory/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, newCount, reason, user: currentUser }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to adjust inventory');
    return json.item;
  },

  // --- Assets ---
  async getAssets(): Promise<Asset[]> {
    const res = await fetch('/api/assets');
    const json = await res.json();
    return json.data || [];
  },

  async createAsset(asset: Partial<Asset>, currentUser?: User): Promise<Asset> {
    const res = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...asset, user: currentUser }),
    });
    const json = await res.json();
    return json.data;
  },

  async assignAsset(
    assetId: string,
    assignedEmployee: string,
    department: string,
    location: string,
    currentUser?: User
  ): Promise<Asset> {
    const res = await fetch(`/api/assets/${assetId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedEmployee, department, location, user: currentUser }),
    });
    const json = await res.json();
    return json.data;
  },

  // --- Subscriptions ---
  async getSubscriptions(): Promise<Subscription[]> {
    const res = await fetch('/api/subscriptions');
    const json = await res.json();
    return json.data || [];
  },

  async createSubscription(sub: Partial<Subscription>, currentUser?: User): Promise<Subscription> {
    const res = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...sub, user: currentUser }),
    });
    const json = await res.json();
    return json.data;
  },

  // --- Vendors ---
  async getVendors(): Promise<Vendor[]> {
    const res = await fetch('/api/vendors');
    const json = await res.json();
    return json.data || [];
  },

  async createVendor(vendor: Partial<Vendor>): Promise<Vendor> {
    const res = await fetch('/api/vendors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vendor),
    });
    const json = await res.json();
    return json.data;
  },

  // --- Categories ---
  async getCategories() {
    const res = await fetch('/api/categories');
    const json = await res.json();
    return json.data || [];
  },

  // --- Audit & Notifications ---
  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/audit-logs');
    const json = await res.json();
    return json.data || [];
  },

  async getNotifications(): Promise<NotificationItem[]> {
    const res = await fetch('/api/notifications');
    const json = await res.json();
    return json.data || [];
  },

  async markNotificationRead(id: string): Promise<void> {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
  },

  // --- Excel Import ---
  async previewExcelImport(base64Data: string) {
    const res = await fetch('/api/excel/import/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Data }),
    });
    return await res.json();
  },

  async confirmExcelImport(validRows: Partial<ExpenseItem>[], currentUser?: User) {
    const res = await fetch('/api/excel/import/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validRows, user: currentUser }),
    });
    return await res.json();
  },

  // --- Settings ---
  async getSettings() {
    const res = await fetch('/api/settings');
    const json = await res.json();
    return json.data;
  },

  async updateSettings(settings: any) {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const json = await res.json();
    return json.data;
  },
};
