/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ExpenseModal } from './components/ExpenseModal';
import { IssueConsumableModal } from './components/IssueConsumableModal';
import { AssignAssetModal } from './components/AssignAssetModal';
import { Dashboard } from './pages/Dashboard';
import { AllTransactions } from './pages/AllTransactions';
import { CategoryView } from './pages/CategoryView';
import { Inventory } from './pages/Inventory';
import { Assets } from './pages/Assets';
import { Subscriptions } from './pages/Subscriptions';
import { Vendors } from './pages/Vendors';
import { Reports } from './pages/Reports';
import { ExcelCenter } from './pages/ExcelCenter';
import { AuditHistory } from './pages/AuditHistory';
import { Settings } from './pages/Settings';
import { UserManagement } from './pages/UserManagement';
import { Login } from './pages/Login';
import { api } from './services/api';
import {
  ExpenseItem,
  InventoryItem,
  InventoryTransaction,
  Asset,
  Subscription,
  Vendor,
  AuditLog,
  NotificationItem,
  User,
  UserPermissions,
} from './types';

const DEFAULT_USERS: User[] = [
  {
    _id: 'usr_admin_01',
    name: 'Rohan Sharma',
    email: 'rohan.sharma@company.com',
    role: 'admin',
    designation: 'IT Infrastructure Head',
    department: 'Information Technology',
    permissions: {
      canAddExpenses: true,
      canEditExpenses: true,
      canIssueInventory: true,
      canManageAssets: true,
      canExportReports: true,
      canManageVendors: true,
    },
  },
  {
    _id: 'usr_emp_01',
    name: 'Vikram Patel',
    email: 'vikram.patel@company.com',
    role: 'employee',
    designation: 'Senior Systems Administrator',
    department: 'IT Support & Systems',
    permissions: {
      canAddExpenses: true,
      canEditExpenses: true,
      canIssueInventory: true,
      canManageAssets: false,
      canExportReports: true,
      canManageVendors: false,
    },
  },
  {
    _id: 'usr_emp_02',
    name: 'Ananya Verma',
    email: 'ananya.verma@company.com',
    role: 'employee',
    designation: 'Procurement & Asset Executive',
    department: 'IT Logistics',
    permissions: {
      canAddExpenses: true,
      canEditExpenses: true,
      canIssueInventory: true,
      canManageAssets: true,
      canExportReports: true,
      canManageVendors: true,
    },
  },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [globalSearch, setGlobalSearch] = useState('');

  // Authentication State (Main Login Page Flow)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('it_erp_auth_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load saved authentication:', e);
    }
    return null; // Main page shows Login screen initially
  });

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('it_erp_auth_user', JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to persist auth session:', e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('it_erp_auth_user');
    } catch (e) {
      console.warn('Failed to clear auth session:', e);
    }
  };

  // Theme Management (Light and Dark Mode)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('it_erp_theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('it_erp_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Data state
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryTxns, setInventoryTxns] = useState<InventoryTransaction[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Modal states
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueProduct, setIssueProduct] = useState<InventoryItem | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignAsset, setAssignAsset] = useState<Asset | null>(null);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      const userList = await api.getUsers();
      if (userList && userList.length > 0) {
        setUsers(userList);
        // Sync current user if still logged in
        setCurrentUser((prev) => {
          if (!prev) return null;
          const match = userList.find((u) => u._id === prev._id);
          return match || prev;
        });
      }
    } catch (err) {
      console.warn('Could not fetch remote users, using local seed users:', err);
    }
  }, []);

  // Fetch all ledger data
  const fetchData = useCallback(async () => {
    try {
      const [expList, invData, astList, subList, vndList, audList, notifList] = await Promise.all([
        api.getExpenses(),
        api.getInventory(),
        api.getAssets(),
        api.getSubscriptions(),
        api.getVendors(),
        api.getAuditLogs(),
        api.getNotifications(),
      ]);

      setExpenses(expList);
      setInventory(invData.items);
      setInventoryTxns(invData.transactions);
      setAssets(astList);
      setSubscriptions(subList);
      setVendors(vndList);
      setAuditLogs(audList);
      setNotifications(notifList);
    } catch (err) {
      console.error('Failed to load application data:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchUsers();

    // Setup real-time event listener
    const unsubscribe = api.subscribeToEvents((event) => {
      if (event.type !== 'CONNECTED') {
        fetchData();
        if (event.type === 'USER_CREATED' || event.type === 'PERMISSIONS_UPDATED' || event.type === 'USER_DELETED') {
          fetchUsers();
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [fetchData, fetchUsers]);

  // Handler functions
  const handleSaveExpense = async (data: Partial<ExpenseItem>) => {
    if (!currentUser) return;
    if (editingExpense) {
      await api.updateExpense(editingExpense._id, data, currentUser);
    } else {
      await api.createExpense(data, currentUser);
    }
    await fetchData();
  };

  const handleDeleteExpense = async (id: string, reason: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      alert('Security Policy: Only administrators are authorized to delete transactions.');
      return;
    }
    await api.deleteExpense(id, currentUser, reason);
    await fetchData();
  };

  const handleMarkReceived = async (id: string, qty: number) => {
    if (!currentUser) return;
    await api.markReceived(id, qty, currentUser);
    await fetchData();
  };

  const handleMarkPaid = async (id: string, method: string) => {
    if (!currentUser) return;
    await api.markPaid(id, method, currentUser);
    await fetchData();
  };

  const handleIssueStock = async (
    productId: string,
    quantity: number,
    employeeName: string,
    department: string,
    remarks: string
  ) => {
    if (!currentUser) return;
    const res = await api.issueInventory(productId, quantity, employeeName, department, remarks, currentUser);
    if (!res.success) throw new Error(res.message);
    await fetchData();
  };

  const handleAdjustStock = async (productId: string, newCount: number, reason: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      alert('Stock adjustments are restricted to administrators.');
      return;
    }
    await api.adjustInventory(productId, newCount, reason, currentUser);
    await fetchData();
  };

  const handleAssignAsset = async (assetId: string, employee: string, dept: string, loc: string) => {
    if (!currentUser) return;
    await api.assignAsset(assetId, employee, dept, loc, currentUser);
    await fetchData();
  };

  const handleMarkNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
  };

  // User Management Handlers (Admin Only)
  const handleAddUser = async (userData: Partial<User>) => {
    if (!currentUser) return;
    await api.createUser(userData, currentUser);
    await fetchUsers();
  };

  const handleUpdatePermissions = async (userId: string, permissions: Partial<UserPermissions>) => {
    if (!currentUser) return;
    await api.updateUserPermissions(userId, permissions, currentUser);
    await fetchUsers();
  };

  const handleDeleteUser = async (userId: string) => {
    if (!currentUser) return;
    await api.deleteUser(userId, currentUser);
    await fetchUsers();
  };

  // If not logged in, render dedicated Login page as the main page
  if (!currentUser) {
    return (
      <Login
        onLogin={handleLogin}
        users={users}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  // Badges
  const lowStockCount = inventory.filter(
    (i) => i.reorderStatus === 'urgent' || i.reorderStatus === 'reorder' || i.reorderStatus === 'out_of_stock'
  ).length;

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        currentUser={currentUser}
        lowStockCount={lowStockCount}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          currentUser={currentUser}
          onUserChange={handleLogin}
          users={users}
          onOpenNewExpense={() => {
            setEditingExpense(null);
            setIsExpenseModalOpen(true);
          }}
          onSearch={(q) => {
            setGlobalSearch(q);
            if (q && currentPage !== 'transactions') {
              setCurrentPage('transactions');
            }
          }}
          searchQuery={globalSearch}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          theme={theme}
          onToggleTheme={toggleTheme}
          onNavigate={setCurrentPage}
          onLogout={handleLogout}
        />

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 dark:bg-slate-950 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
          {currentPage === 'dashboard' && (
            <Dashboard
              expenses={expenses}
              inventory={inventory}
              subscriptions={subscriptions}
              assets={assets}
              currentUser={currentUser}
              onNavigate={setCurrentPage}
              onOpenNewExpense={() => {
                setEditingExpense(null);
                setIsExpenseModalOpen(true);
              }}
            />
          )}

          {currentPage === 'transactions' && (
            <AllTransactions
              expenses={expenses}
              currentUser={currentUser}
              onEditExpense={(item) => {
                setEditingExpense(item);
                setIsExpenseModalOpen(true);
              }}
              onDeleteExpense={handleDeleteExpense}
              onMarkReceived={handleMarkReceived}
              onMarkPaid={handleMarkPaid}
            />
          )}

          {currentPage.startsWith('category-') && (
            <CategoryView
              categorySlug={currentPage.replace('category-', '')}
              expenses={expenses}
              inventory={inventory}
              subscriptions={subscriptions}
              currentUser={currentUser}
              onOpenNewExpense={() => {
                setEditingExpense(null);
                setIsExpenseModalOpen(true);
              }}
              onMarkReceived={handleMarkReceived}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'inventory' && (
            <Inventory
              inventory={inventory}
              transactions={inventoryTxns}
              currentUser={currentUser}
              onOpenIssueModal={(item) => {
                setIssueProduct(item || null);
                setIsIssueModalOpen(true);
              }}
              onAdjustStock={handleAdjustStock}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'assets' && (
            <Assets
              assets={assets}
              currentUser={currentUser}
              onOpenAssignModal={(asset) => {
                setAssignAsset(asset);
                setIsAssignModalOpen(true);
              }}
              onRegisterAsset={() => {
                setEditingExpense(null);
                setIsExpenseModalOpen(true);
              }}
            />
          )}

          {currentPage === 'subscriptions' && (
            <Subscriptions
              subscriptions={subscriptions}
              currentUser={currentUser}
              onOpenNewExpense={() => {
                setEditingExpense(null);
                setIsExpenseModalOpen(true);
              }}
            />
          )}

          {currentPage === 'vendors' && (
            <Vendors
              vendors={vendors}
              expenses={expenses}
              currentUser={currentUser}
              onAddNewVendor={() => {
                setEditingExpense(null);
                setIsExpenseModalOpen(true);
              }}
            />
          )}

          {currentPage === 'reports' && <Reports expenses={expenses} />}

          {currentPage === 'excel' && (
            <ExcelCenter
              currentUser={currentUser}
              expenses={expenses}
              onImportSuccess={fetchData}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'users' && (
            <UserManagement
              currentUser={currentUser}
              users={users}
              onAddUser={handleAddUser}
              onUpdatePermissions={handleUpdatePermissions}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {currentPage === 'audit' && <AuditHistory auditLogs={auditLogs} />}

          {currentPage === 'settings' && <Settings currentUser={currentUser} />}
        </main>
      </div>

      {/* Global Modals */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSubmit={handleSaveExpense}
        vendors={vendors}
        currentUser={currentUser}
        initialData={editingExpense}
      />

      <IssueConsumableModal
        isOpen={isIssueModalOpen}
        onClose={() => {
          setIsIssueModalOpen(false);
          setIssueProduct(null);
        }}
        inventory={inventory}
        preselectedProduct={issueProduct}
        onIssue={handleIssueStock}
        currentUser={currentUser}
      />

      <AssignAssetModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setAssignAsset(null);
        }}
        asset={assignAsset}
        onAssign={handleAssignAsset}
      />
    </div>
  );
}
