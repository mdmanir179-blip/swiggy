import React from 'react';
import { ViewTab } from '../types';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  CreditCard, 
  GitCompare,
  AlertTriangle,
  PlusCircle
} from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  onOpenAddInvoice: () => void;
  onOpenMobileSidebar?: () => void;
  totalInvoices: number;
  totalPayments: number;
  overdueCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onTabChange,
  onOpenAddInvoice,
  totalInvoices,
  totalPayments,
  overdueCount
}) => {
  // All 5 primary views from the navigation suite
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
      badge: totalInvoices > 0 ? (totalInvoices > 99 ? '99+' : totalInvoices) : null,
      badgeColor: 'bg-amber-500 text-slate-950'
    },
    {
      id: 'payments' as ViewTab,
      label: 'Payments',
      icon: CreditCard,
      badge: totalPayments > 0 ? (totalPayments > 99 ? '99+' : totalPayments) : null,
      badgeColor: 'bg-emerald-500 text-white'
    },
    {
      id: 'reconciliation' as ViewTab,
      label: 'Reconcile',
      icon: GitCompare,
      badge: null
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
    <>
      {/* Mobile Floating Action Button: Quick Add Invoice */}
      <button
        onClick={onOpenAddInvoice}
        className="fixed bottom-19 right-4 z-40 md:hidden flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-full shadow-lg border border-emerald-400/40 transition-transform cursor-pointer"
        aria-label="Add Invoice Manually"
        title="Add Invoice"
      >
        <PlusCircle className="w-4 h-4 shrink-0" />
        <span>+ Add</span>
      </button>

      {/* Fixed Bottom Navigation Bar for Mobile */}
      <nav 
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-1 pt-1.5 pb-[calc(env(safe-area-inset-bottom,0px)+0.35rem)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] transition-colors"
      >
        <div className="flex items-center justify-between w-full max-w-lg mx-auto gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`
                  flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all relative
                  ${isActive 
                    ? 'text-amber-500 dark:text-amber-400 font-bold bg-amber-500/10 dark:bg-amber-500/15' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}
                `}
                aria-label={`Go to ${tab.label}`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.4] scale-110' : 'stroke-[1.8]'}`} />
                  {tab.badge !== null && (
                    <span className={`
                      absolute -top-1.5 -right-2.5 text-[9px] font-mono font-bold px-1 py-0.2 rounded-full leading-none shadow-xs
                      ${tab.badgeColor || 'bg-amber-500 text-slate-950'}
                    `}>
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 tracking-tight truncate max-w-full ${isActive ? 'font-bold text-slate-950 dark:text-white' : 'font-medium'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1 rounded-full bg-amber-500 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
