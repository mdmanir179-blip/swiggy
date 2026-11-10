import React from 'react';
import { ViewTab } from '../types';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  CreditCard, 
  AlertTriangle,
  PlusCircle,
  Menu
} from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  onOpenAddInvoice: () => void;
  onOpenMobileSidebar: () => void;
  totalInvoices: number;
  totalPayments: number;
  overdueCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onTabChange,
  onOpenAddInvoice,
  onOpenMobileSidebar,
  totalInvoices,
  totalPayments,
  overdueCount
}) => {
  const tabs = [
    {
      id: 'dashboard' as ViewTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'invoices' as ViewTab,
      label: 'Invoices',
      icon: FileSpreadsheet,
      badge: totalInvoices > 0 ? (totalInvoices > 99 ? '99+' : totalInvoices) : null
    },
    {
      id: 'payments' as ViewTab,
      label: 'Payments',
      icon: CreditCard,
      badge: totalPayments > 0 ? (totalPayments > 99 ? '99+' : totalPayments) : null
    },
    {
      id: 'aging' as ViewTab,
      label: 'Overdue',
      icon: AlertTriangle,
      badge: overdueCount > 0 ? (overdueCount > 99 ? '99+' : overdueCount) : null,
      badgeColor: 'bg-red-500 text-white'
    }
  ];

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1 shadow-lg transition-colors"
    >
      <div className="flex items-center justify-around h-15 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all relative
                ${isActive 
                  ? 'text-amber-600 dark:text-amber-400 font-bold scale-105' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}
              `}
              aria-label={`Go to ${tab.label}`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {tab.badge !== null && (
                  <span className={`
                    absolute -top-1.5 -right-3 text-[9px] font-mono font-bold px-1 py-0.2 rounded-full leading-none
                    ${tab.badgeColor || 'bg-amber-500 text-slate-950'}
                  `}>
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'font-bold text-slate-900 dark:text-white' : 'font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-amber-500 mt-0.5" />
              )}
            </button>
          );
        })}

        {/* Quick Add / More Menu Button */}
        <button
          onClick={onOpenAddInvoice}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors"
          aria-label="Add Invoice Manually"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
            <PlusCircle className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 font-semibold text-emerald-700 dark:text-emerald-300">
            + Add
          </span>
        </button>
      </div>
    </nav>
  );
};
