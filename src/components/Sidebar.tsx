import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Package,
  Disc,
  Barcode,
  Tag,
  Cloud,
  Database,
  Layers,
  Boxes,
  Laptop,
  Repeat,
  Building2,
  FileBarChart,
  FileSpreadsheet,
  History,
  Settings as SettingsIcon,
  ChevronRight,
  Users,
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  currentUser: User;
  lowStockCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  currentUser,
  lowStockCount,
  isCollapsed,
}) => {
  const isAdmin = currentUser.role === 'admin';

  const navSections = [
    {
      title: 'CORE LEDGER',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'transactions', label: 'All Transactions', icon: Receipt },
      ],
    },
    {
      title: 'DEDICATED CATEGORY VIEWS',
      items: [
        { id: 'category-courier-labels', label: 'Courier Labels', icon: Package },
        { id: 'category-wax-rolls', label: 'Wax Rolls', icon: Disc },
        { id: 'category-barcode-rolls', label: 'Barcode Rolls', icon: Barcode },
        { id: 'category-barcode-wax-rolls', label: 'Barcode Wax Rolls', icon: Tag },
        { id: 'category-render', label: 'Render Hosting', icon: Cloud },
        { id: 'category-mongodb', label: 'MongoDB', icon: Database },
        { id: 'category-other', label: 'Other Bills', icon: Layers },
      ],
    },
    {
      title: 'OPERATIONS & RESOURCES',
      items: [
        {
          id: 'inventory',
          label: 'Consumables & Stock',
          icon: Boxes,
          badge: lowStockCount > 0 ? lowStockCount : undefined,
          badgeColor: 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30',
        },
        { id: 'assets', label: 'Fixed Assets', icon: Laptop },
        { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
        { id: 'vendors', label: 'Vendors & Pricing', icon: Building2 },
      ],
    },
    {
      title: 'REPORTS & EXCEL',
      items: [
        { id: 'reports', label: 'Financial Reports', icon: FileBarChart },
        { id: 'excel', label: 'Excel Import / Export', icon: FileSpreadsheet },
        { id: 'audit', label: 'Audit History', icon: History },
      ],
    },
    ...(isAdmin
      ? [
          {
            title: 'ADMINISTRATION',
            items: [
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'settings', label: 'System Settings', icon: SettingsIcon },
            ],
          },
        ]
      : [
          {
            title: 'SYSTEM',
            items: [{ id: 'settings', label: 'System Settings', icon: SettingsIcon }],
          },
        ]),
  ];

  return (
    <aside
      className={`bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className={`h-16 px-3 flex items-center justify-center border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-[#101a2d] text-slate-900 dark:text-white ${isCollapsed ? '' : 'justify-start px-4'}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
            <img src="/tgh-logo-trim.png" alt="TGH Good Health logo" className="w-full h-full object-contain" />
          </div>
          {!isCollapsed && (
            <div className="leading-tight truncate">
              <h1 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">TGH IT Expense</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Central Ledger &amp; Asset Management</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        {navSections.map((section, idx) => (
          <div key={idx}>
            {!isCollapsed && (
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase px-2 mb-2 font-mono">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.badge !== undefined && (
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 opacity-60" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between bg-white dark:bg-slate-950">
          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">Financial Year</p>
            <p className="text-[10px] font-mono">FY 2026–27 (Apr–Mar)</p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono border border-slate-200 dark:border-slate-700/60">
            ₹ INR / $ USD
          </span>
        </div>
      )}
    </aside>
  );
};
