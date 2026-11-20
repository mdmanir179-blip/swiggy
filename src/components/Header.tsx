import React, { useState, useEffect } from 'react';
import { ViewTab } from '../types';
import { 
  Sun, 
  Moon,
  Trash2,
  Maximize2, 
  Minimize2, 
  PanelLeft,
  Menu,
  Search,
  X,
  Calendar
} from 'lucide-react';

interface HeaderProps {
  currentTab?: ViewTab;
  onTabChange?: (tab: ViewTab) => void;
  onOpenUpload: () => void;
  onOpenAddInvoice: () => void;
  onOpenExport: () => void;
  onOpenShare: () => void;
  onClearData: () => void;
  vendorName: string;
  totalInvoices: number;
  totalPayments?: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isSyncing?: boolean;
  lastSyncTime?: string;
  onManualSync?: () => void;
  onToggleSidebar?: () => void;
  onOpenMobileSidebar?: () => void;
  isSidebarOpen?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (date: string) => void;
  onDateToChange?: (date: string) => void;
  onClearDateRange?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenUpload,
  onOpenAddInvoice,
  onOpenExport,
  onOpenShare,
  onClearData,
  vendorName,
  totalInvoices,
  totalPayments = 0,
  theme,
  onToggleTheme,
  isSyncing = false,
  lastSyncTime,
  onManualSync,
  onToggleSidebar,
  onOpenMobileSidebar,
  isSidebarOpen = true,
  searchQuery = '',
  onSearchChange,
  dateFrom = '',
  dateTo = '',
  onDateFromChange,
  onDateToChange,
  onClearDateRange
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Fullscreen request error:', err);
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 sticky top-0 z-40 transition-colors">
      {/* Top Bar Container with strict overflow protection */}
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4 min-w-0">
          
          {/* Zone 1: Mobile Left-Corner Menubar Button, Desktop Sidebar Toggle & App Title */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            {/* Mobile Left-Corner Menubar Button */}
            <button
              onClick={onOpenMobileSidebar}
              className="md:hidden p-2 text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center justify-center shrink-0 shadow-xs"
              title="Open Navigation Menubar"
              aria-label="Open menubar"
            >
              <Menu className="w-5 h-5 text-amber-500" />
            </button>

            {/* Desktop Sidebar Toggle */}
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="hidden md:flex p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 rounded-lg transition-colors items-center justify-center shrink-0"
                title={isSidebarOpen ? 'Hide Navigation Menubar' : 'Show Navigation Menubar'}
                aria-label="Toggle navigation menubar"
              >
                <PanelLeft className="w-4.5 h-4.5 text-amber-500" />
              </button>
            )}

            {/* App Title & Status */}
            <div className="min-w-0">
              <a href="#" className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white truncate block">
                Instamart Payment Tracker
              </a>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono truncate">
                <span className="truncate max-w-[110px] sm:max-w-[200px]">
                  {totalInvoices > 0 ? (vendorName || 'Active Ledger') : 'No Dataset'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="shrink-0">{totalInvoices} Invoices</span>
              </div>
            </div>
          </div>

          {/* Center Search Bar + Date-to-Date Range Filter (Desktop lg+) */}
          {(onSearchChange || (onDateFromChange && onDateToChange)) && (
            <div className="hidden lg:flex flex-1 max-w-3xl mx-2 min-w-0 items-center gap-2">
              {onSearchChange && (
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape' && searchQuery) {
                        onSearchChange('');
                      }
                    }}
                    placeholder="Search PO No. or Invoice No..."
                    aria-label="Search PO or Invoice number"
                    className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-slate-100/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/70 focus:border-amber-400 dark:focus:border-amber-500 transition-all font-mono"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => onSearchChange('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded transition-colors"
                      title="Clear search (Esc)"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {onDateFromChange && onDateToChange && (
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all shrink-0 ${
                    dateFrom || dateTo
                      ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600'
                      : 'bg-slate-100/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => onDateFromChange(e.target.value)}
                    aria-label="From date"
                    title="Track Payment / Data From Date"
                    className="bg-transparent text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none w-[114px] cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium select-none">
                    to
                  </span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => onDateToChange(e.target.value)}
                    aria-label="To date"
                    title="Track Payment / Data To Date"
                    className="bg-transparent text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none w-[114px] cursor-pointer"
                  />
                  {(dateFrom || dateTo) && onClearDateRange && (
                    <button
                      type="button"
                      onClick={onClearDateRange}
                      className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded transition-colors"
                      title="Clear date filter"
                      aria-label="Clear date filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Primary Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Computer Full Screen Toggle - Desktop Only */}
            <button
              onClick={toggleFullscreen}
              className={`hidden sm:flex p-1.5 sm:p-2 rounded-lg transition-colors border ${
                isFullscreen 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' 
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300'
              }`}
              title={isFullscreen ? 'Exit Computer Full Screen' : 'View in Computer Full Screen (F11)'}
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={onToggleTheme}
              className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Clear Data button if data exists - Desktop Only */}
            {(totalInvoices > 0 || totalPayments > 0) && (
              <button
                onClick={onClearData}
                title="Clear current dataset"
                className="hidden md:flex p-1.5 sm:p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                aria-label="Clear current dataset"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* Mobile & Tablet Header Search Bar + Date-to-Date Range Filter (< lg) */}
        {(onSearchChange || (onDateFromChange && onDateToChange)) && (
          <div className="lg:hidden pb-2.5 flex flex-col sm:flex-row gap-2">
            {onSearchChange && (
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape' && searchQuery) {
                      onSearchChange('');
                    }
                  }}
                  placeholder="Search PO No. or Invoice No..."
                  aria-label="Search PO or Invoice number"
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-100/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/70 focus:border-amber-400 dark:focus:border-amber-500 transition-all font-mono"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded transition-colors"
                    title="Clear search"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {onDateFromChange && onDateToChange && (
              <div
                className={`flex items-center justify-between sm:justify-start gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all shrink-0 ${
                  dateFrom || dateTo
                    ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600'
                    : 'bg-slate-100/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1 sm:flex-initial">
                  <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => onDateFromChange(e.target.value)}
                    aria-label="From date"
                    className="bg-transparent text-[11px] font-mono text-slate-800 dark:text-slate-100 focus:outline-none w-full sm:w-[108px] min-w-0 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
                    to
                  </span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => onDateToChange(e.target.value)}
                    aria-label="To date"
                    className="bg-transparent text-[11px] font-mono text-slate-800 dark:text-slate-100 focus:outline-none w-full sm:w-[108px] min-w-0 cursor-pointer"
                  />
                </div>
                {(dateFrom || dateTo) && onClearDateRange && (
                  <button
                    type="button"
                    onClick={onClearDateRange}
                    className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded transition-colors shrink-0"
                    title="Clear date filter"
                    aria-label="Clear date filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
