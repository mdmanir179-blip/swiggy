import React from 'react';
import { ViewTab } from '../types';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  CreditCard, 
  GitCompare, 
  Clock, 
  Upload, 
  PlusCircle, 
  Share2, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Cloud,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  isOpen: boolean;            // Desktop visibility (show / hide)
  isCollapsed: boolean;       // Desktop collapsed (icons only) vs expanded
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  isMobileOpen: boolean;
  onOpenUpload: () => void;
  onOpenAddInvoice: () => void;
  onOpenExport: () => void;
  onOpenShare: () => void;
  totalInvoices: number;
  totalPayments: number;
  overdueCount: number;
  isSyncing?: boolean;
  lastSyncTime?: string;
  vendorName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isOpen,
  isCollapsed,
  onToggleCollapse,
  onCloseMobile,
  isMobileOpen,
  onOpenUpload,
  onOpenAddInvoice,
  onOpenExport,
  onOpenShare,
  totalInvoices,
  totalPayments,
  overdueCount,
  isSyncing,
  lastSyncTime,
  vendorName
}) => {
  const navItems = [
    {
      id: 'dashboard' as ViewTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      description: 'Overview & Charts'
    },
    {
      id: 'invoices' as ViewTab,
      label: 'Invoice Ledger',
      icon: FileSpreadsheet,
      badge: totalInvoices > 0 ? totalInvoices : null,
      description: '34 Standard Fields'
    },
    {
      id: 'payments' as ViewTab,
      label: 'Payment Report',
      icon: CreditCard,
      badge: totalPayments > 0 ? totalPayments : null,
      description: '13 Bank Fields'
    },
    {
      id: 'reconciliation' as ViewTab,
      label: 'Reconciliation',
      icon: GitCompare,
      badge: null,
      description: 'Auto Settlement Match'
    },
    {
      id: 'aging' as ViewTab,
      label: 'Aging & Overdue',
      icon: Clock,
      badge: overdueCount > 0 ? `${overdueCount}` : null,
      badgeColor: 'bg-red-500 text-white',
      description: 'Due Date Buckets'
    }
  ];

  const handleNavClick = (tab: ViewTab) => {
    onTabChange(tab);
    onCloseMobile();
  };

  // Base classes for desktop sidebar
  const desktopWidthClass = !isOpen 
    ? 'hidden' 
    : isCollapsed 
      ? 'w-18' 
      : 'w-64';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50 md:z-30 h-screen
          bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
          flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0
          ${/* Mobile drawer positioning */ ''}
          ${isMobileOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full md:translate-x-0'}
          ${/* Desktop responsive sizing */ ''}
          md:${desktopWidthClass}
        `}
      >
        {/* Top Header / Brand in Sidebar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {(!isCollapsed || isMobileOpen) ? (
              <div className="min-w-0">
                <span className="font-bold text-base text-slate-900 dark:text-white truncate block tracking-tight">
                  Instamart
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-500 font-semibold uppercase tracking-wider block">
                  Vendor Portal
                </span>
              </div>
            ) : (
              <span className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                IM
              </span>
            )}
          </div>

          {/* Desktop Show/Hide or Collapse Button */}
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar to Icons'}
              aria-label="Toggle sidebar width"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Middle Navigation Links */}
        <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-6 no-scrollbar">
          {/* Main Menus */}
          <div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Main Navigation
              </div>
            )}

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    title={isCollapsed && !isMobileOpen ? item.label : undefined}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative
                      ${isActive 
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'}
                      ${isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'justify-between'}
                    `}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-500 dark:text-slate-400 group-hover:text-amber-500'}`} />
                      {(!isCollapsed || isMobileOpen) && (
                        <div className="text-left truncate">
                          <span className="block truncate">{item.label}</span>
                          <span className={`text-[10px] block font-normal truncate ${isActive ? 'text-slate-800' : 'text-slate-400 dark:text-slate-500'}`}>
                            {item.description}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Badge */}
                    {item.badge !== null && (!isCollapsed || isMobileOpen) && (
                      <span className={`
                        text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md shrink-0
                        ${item.badgeColor || (isActive ? 'bg-slate-950 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300')}
                      `}>
                        {item.badge}
                      </span>
                    )}

                    {/* Indicator Dot if collapsed */}
                    {isCollapsed && !isMobileOpen && item.badge !== null && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Action Tools Section */}
          <div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Data Operations
              </div>
            )}

            <div className="space-y-1">
              <button
                onClick={() => { onOpenAddInvoice(); onCloseMobile(); }}
                title={isCollapsed && !isMobileOpen ? 'Add Invoice Manually' : undefined}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-colors
                  text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50
                  ${isCollapsed && !isMobileOpen ? 'justify-center px-2' : ''}
                `}
              >
                <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                {(!isCollapsed || isMobileOpen) && <span>+ Add Invoice</span>}
              </button>

              <button
                onClick={() => { onOpenUpload(); onCloseMobile(); }}
                title={isCollapsed && !isMobileOpen ? 'Upload Excel / CSV' : undefined}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-colors
                  text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50
                  ${isCollapsed && !isMobileOpen ? 'justify-center px-2' : ''}
                `}
              >
                <Upload className="w-4 h-4 text-amber-500 shrink-0" />
                {(!isCollapsed || isMobileOpen) && <span>Upload Report</span>}
              </button>

              <button
                onClick={() => { onOpenShare(); onCloseMobile(); }}
                disabled={totalInvoices === 0 && totalPayments === 0}
                title={isCollapsed && !isMobileOpen ? 'Share Dataset Link' : undefined}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-colors disabled:opacity-40
                  text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/50
                  ${isCollapsed && !isMobileOpen ? 'justify-center px-2' : ''}
                `}
              >
                <Share2 className="w-4 h-4 text-sky-500 shrink-0" />
                {(!isCollapsed || isMobileOpen) && <span>Share via Link</span>}
              </button>

              <button
                onClick={() => { onOpenExport(); onCloseMobile(); }}
                disabled={totalInvoices === 0}
                title={isCollapsed && !isMobileOpen ? 'Export Excel / PDF' : undefined}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-colors disabled:opacity-40
                  text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60
                  ${isCollapsed && !isMobileOpen ? 'justify-center px-2' : ''}
                `}
              >
                <Download className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                {(!isCollapsed || isMobileOpen) && <span>Export Records</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Area with Sync Status & Collapse Toggle */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
          {(!isCollapsed || isMobileOpen) ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <Cloud className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Cloud Database</span>
                </span>
                <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  {isSyncing ? 'Syncing...' : 'Connected'}
                </span>
              </div>
              {lastSyncTime && (
                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                  Synced: {lastSyncTime}
                </div>
              )}
              {vendorName && (
                <div className="text-[10px] text-slate-600 dark:text-slate-300 font-medium truncate pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                  Vendor: {vendorName}
                </div>
              )}

              {/* Show/Hide collapse trigger at bottom */}
              <button
                onClick={onToggleCollapse}
                className="hidden md:flex items-center justify-center gap-2 w-full mt-2 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Collapse Menubar</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Cloud Database Connected" />
              <button
                onClick={onToggleCollapse}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Expand Menubar"
                aria-label="Expand Menubar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
