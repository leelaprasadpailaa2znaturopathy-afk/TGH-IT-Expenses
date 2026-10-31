import React, { useState } from 'react';
import {
  Users,
  Shield,
  ShieldAlert,
  UserPlus,
  Check,
  X,
  Trash2,
  Lock,
  Unlock,
  KeyRound,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { User, UserPermissions } from '../types';

interface UserManagementProps {
  currentUser: User;
  users: User[];
  onAddUser: (userData: Partial<User>) => Promise<void>;
  onUpdatePermissions: (userId: string, permissions: Partial<UserPermissions>) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  currentUser,
  users,
  onAddUser,
  onUpdatePermissions,
  onDeleteUser,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'employee' as 'admin' | 'employee',
    designation: 'IT Support Executive',
    department: 'Information Technology',
    permissions: {
      canAddExpenses: true,
      canEditExpenses: true,
      canIssueInventory: true,
      canManageAssets: false,
      canExportReports: true,
      canManageVendors: false,
    },
  });

  const [saving, setSaving] = useState(false);

  // Guard: Only admin can access user management
  if (currentUser.role !== 'admin') {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">Admin Access Required</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          The User Management &amp; Access Control console is restricted to Administrator accounts.
          Switch to an Admin profile in the top header to manage employee permissions.
        </p>
      </div>
    );
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim()) return alert('Name and Email are required');
    setSaving(true);
    try {
      await onAddUser(newUser);
      setShowAddModal(false);
      setNewUser({
        name: '',
        email: '',
        role: 'employee',
        designation: 'IT Support Executive',
        department: 'Information Technology',
        permissions: {
          canAddExpenses: true,
          canEditExpenses: true,
          canIssueInventory: true,
          canManageAssets: false,
          canExportReports: true,
          canManageVendors: false,
        },
      });
    } catch (err: any) {
      alert(`Error creating user: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = async (user: User, permKey: keyof UserPermissions) => {
    const current = user.permissions || {
      canAddExpenses: true,
      canEditExpenses: true,
      canIssueInventory: true,
      canManageAssets: false,
      canExportReports: true,
      canManageVendors: false,
    };
    const updated = {
      ...current,
      [permKey]: !current[permKey],
    };
    await onUpdatePermissions(user._id, updated);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              User Management &amp; Employee Access Control
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-mono font-bold border border-indigo-200 dark:border-indigo-500/20">
              Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Configure employee roles and system capabilities. Employees can add transaction data and issue inventory according to permissions, while permanent delete operations are strictly protected for administrators.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all self-start sm:self-auto shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Employee Account</span>
        </button>
      </div>

      {/* Role Segregation Notice */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300">
        <Shield className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100">Access Governance Policy</span>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            <strong>Admin</strong>: Full unrestricted access, user configuration, audit view, and transaction deletion / reversal.<br />
            <strong>Employee</strong>: Can enter bills, issue consumables, view category ledgers. Delete operations are permanently hidden and prohibited.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Registered Accounts ({users.length})
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Click toggles to grant or restrict specific employee actions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-mono text-[11px] whitespace-nowrap">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Designation &amp; Dept</th>
                <th className="py-3 px-4 text-center">Add Expenses</th>
                <th className="py-3 px-4 text-center">Edit Records</th>
                <th className="py-3 px-4 text-center">Issue Stock</th>
                <th className="py-3 px-4 text-center">Manage Assets</th>
                <th className="py-3 px-4 text-center">Export Reports</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {users.map((u) => {
                const perms = u.permissions || {
                  canAddExpenses: true,
                  canEditExpenses: true,
                  canIssueInventory: true,
                  canManageAssets: false,
                  canExportReports: true,
                  canManageVendors: false,
                };
                const isAdmin = u.role === 'admin';

                return (
                  <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* User Name & Email */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{u.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isAdmin
                            ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30'
                            : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    {/* Designation & Dept */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <span className="font-medium text-slate-800 dark:text-slate-200 block">{u.designation}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{u.department}</span>
                    </td>

                    {/* Permission: Add Expenses */}
                    <td className="py-3 px-4 text-center">
                      <button
                        disabled={isAdmin}
                        onClick={() => togglePermission(u, 'canAddExpenses')}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          isAdmin || perms.canAddExpenses
                            ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                        title={isAdmin ? 'Admin always has full access' : 'Toggle Add Expenses permission'}
                      >
                        {isAdmin || perms.canAddExpenses ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </td>

                    {/* Permission: Edit Records */}
                    <td className="py-3 px-4 text-center">
                      <button
                        disabled={isAdmin}
                        onClick={() => togglePermission(u, 'canEditExpenses')}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          isAdmin || perms.canEditExpenses
                            ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                        title={isAdmin ? 'Admin always has full access' : 'Toggle Edit Records permission'}
                      >
                        {isAdmin || perms.canEditExpenses ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </td>

                    {/* Permission: Issue Stock */}
                    <td className="py-3 px-4 text-center">
                      <button
                        disabled={isAdmin}
                        onClick={() => togglePermission(u, 'canIssueInventory')}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          isAdmin || perms.canIssueInventory
                            ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                        title={isAdmin ? 'Admin always has full access' : 'Toggle Issue Stock permission'}
                      >
                        {isAdmin || perms.canIssueInventory ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </td>

                    {/* Permission: Manage Assets */}
                    <td className="py-3 px-4 text-center">
                      <button
                        disabled={isAdmin}
                        onClick={() => togglePermission(u, 'canManageAssets')}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          isAdmin || perms.canManageAssets
                            ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                        title={isAdmin ? 'Admin always has full access' : 'Toggle Manage Assets permission'}
                      >
                        {isAdmin || perms.canManageAssets ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </td>

                    {/* Permission: Export Reports */}
                    <td className="py-3 px-4 text-center">
                      <button
                        disabled={isAdmin}
                        onClick={() => togglePermission(u, 'canExportReports')}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          isAdmin || perms.canExportReports
                            ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                        title={isAdmin ? 'Admin always has full access' : 'Toggle Export Reports permission'}
                      >
                        {isAdmin || perms.canExportReports ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      {!isAdmin && (
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete user account "${u.name}"?`)) {
                              onDeleteUser(u._id);
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Delete User Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Create New Account</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Gupta"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Work Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul.gupta@company.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Role *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="employee">Employee (No Delete access)</option>
                    <option value="admin">Administrator (Full access)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Designation</label>
                  <input
                    type="text"
                    value={newUser.designation}
                    onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <input
                  type="text"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              {newUser.role === 'employee' && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Default Employee Permissions:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newUser.permissions.canAddExpenses}
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            permissions: { ...newUser.permissions, canAddExpenses: e.target.checked },
                          })
                        }
                      />
                      <span>Add Expenses</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newUser.permissions.canIssueInventory}
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            permissions: { ...newUser.permissions, canIssueInventory: e.target.checked },
                          })
                        }
                      />
                      <span>Issue Consumables</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newUser.permissions.canManageAssets}
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            permissions: { ...newUser.permissions, canManageAssets: e.target.checked },
                          })
                        }
                      />
                      <span>Manage Hardware</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newUser.permissions.canExportReports}
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            permissions: { ...newUser.permissions, canExportReports: e.target.checked },
                          })
                        }
                      />
                      <span>Export Reports</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{saving ? 'Creating...' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
