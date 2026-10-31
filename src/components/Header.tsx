import React, { useState } from 'react';
import {
  Bell,
  Search,
  Plus,
  Sun,
  Moon,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  FileSpreadsheet,
  Shield,
  User as UserIcon,
  LogOut,
} from 'lucide-react';
import { User, NotificationItem } from '../types';

interface HeaderProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  users: User[];
  onOpenNewExpense: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onUserChange,
  users,
  onOpenNewExpense,
  onSearch,
  searchQuery,
  notifications,
  onMarkNotificationRead,
  theme,
  onToggleTheme,
  onNavigate,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Invoice ID, Product, Vendor, Asset or SKU..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs rounded-xl pl-10 pr-8 py-2 border border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Light / Dark Mode Toggle */}
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* Quick Excel Export */}
        <button
          onClick={() => onNavigate('excel')}
          title="Excel Export Center"
          className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 z-50 text-slate-800 dark:text-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">Notifications &amp; Alerts</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold">
                    {unreadCount} new
                  </span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                >
                  Close
                </button>
              </div>

              <div className="mt-3 space-y-2 max-h-80 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No alerts at present.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => onMarkNotificationRead(n._id)}
                      className={`p-3 rounded-xl text-xs cursor-pointer border transition-colors ${
                        n.isRead
                          ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                          : 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-500/30 text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {n.type === 'alert' && <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                        {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                        {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                        {n.type === 'info' && <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />}
                        <div className="flex-1">
                          <p className="font-semibold">{n.title}</p>
                          <p className="mt-0.5 text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">{n.description}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Switcher (Admin vs Employee) */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">{currentUser.name}</p>
            <span
              className={`text-[9px] uppercase tracking-wider font-extrabold inline-block mt-0.5 ${
                currentUser.role === 'admin'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-indigo-600 dark:text-indigo-400'
              }`}
            >
              {currentUser.role}
            </span>
          </div>

          <select
            value={currentUser._id}
            onChange={(e) => {
              const target = users.find((u) => u._id === e.target.value);
              if (target) onUserChange(target);
            }}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs py-1.5 px-2.5 text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.role.toUpperCase()})
              </option>
            ))}
          </select>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out to Login Page"
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Primary Action Button: Enter Bill */}
        <button
          onClick={onOpenNewExpense}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Enter Bill</span>
        </button>
      </div>
    </header>
  );
};
