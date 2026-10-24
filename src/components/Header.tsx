import React, { useState, useEffect } from 'react';
import { ViewTab } from '../types';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  CreditCard, 
  GitCompare, 
  Clock, 
  Upload, 
  Download, 
  Sun, 
  Moon,
  Trash2,
  Share2,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { InstamartLogo } from './InstamartLogo';

interface HeaderProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  onOpenUpload: () => void;
  onOpenExport: () => void;
  onOpenShare: () => void;
  onClearData: () => void;
  vendorName: string;
  totalInvoices: number;
  totalPayments?: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenUpload,
  onOpenExport,
  onOpenShare,
  onClearData,
  vendorName,
  totalInvoices,
  totalPayments = 0,
  theme,
  onToggleTheme
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
      {/* Top Bar Container - Full Screen desktop presence with strict overflow protection */}
      <div className="w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4 min-w-0">
          
          {/* Zone 1: Logo & App Title - Protected against shrinking or overlapping */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0 max-w-[50%] sm:max-w-none">
            <InstamartLogo className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" size={34} />
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

          {/* Zone 2: Navigation Links / View Tabs (Displayed only when width >= 1280px to prevent crowding) */}
          <nav className="hidden xl:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-lg shrink-0">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                currentTab === 'dashboard'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onTabChange('invoices')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                currentTab === 'invoices'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Invoice Ledger</span>
            </button>

            <button
              onClick={() => onTabChange('payments')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                currentTab === 'payments'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payment Report</span>
            </button>

            <button
              onClick={() => onTabChange('reconciliation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                currentTab === 'reconciliation'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Reconciliation</span>
            </button>

            <button
              onClick={() => onTabChange('aging')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                currentTab === 'aging'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Aging & Overdue</span>
            </button>
          </nav>

          {/* Zone 3: Primary Actions - Compact and Responsive */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Computer Full Screen Toggle */}
            <button
              onClick={toggleFullscreen}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors border ${
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

            {/* PWA Save & Install Button */}
            <PWAInstallButton />

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

            {/* Clear Data button if data exists */}
            {(totalInvoices > 0 || totalPayments > 0) && (
              <button
                onClick={onClearData}
                title="Clear current dataset"
                className="p-1.5 sm:p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                aria-label="Clear current dataset"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Upload Button */}
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span className="hidden md:inline">Upload</span>
            </button>

            {/* Share Link Button */}
            <button
              onClick={onOpenShare}
              disabled={totalInvoices === 0 && totalPayments === 0}
              title={totalInvoices === 0 ? 'Upload data first to generate share link' : 'Share uploaded data via web link'}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-sky-800 dark:text-sky-200 bg-sky-100 hover:bg-sky-200 dark:bg-sky-950/70 dark:hover:bg-sky-900 border border-sky-300 dark:border-sky-800/80 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap"
            >
              <Share2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Export Button */}
            <button
              onClick={onOpenExport}
              disabled={totalInvoices === 0}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>

        </div>

        {/* Sub-Header Navigation Tabs for Mobile and Tablet (< 1280px) */}
        <div className="xl:hidden flex items-center gap-1 py-2 overflow-x-auto border-t border-slate-200 dark:border-slate-800/60 no-scrollbar">
          {(['dashboard', 'invoices', 'payments', 'reconciliation', 'aging'] as ViewTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`px-3 py-1 text-xs font-medium rounded-md capitalize whitespace-nowrap transition-colors ${
                currentTab === tab 
                  ? 'bg-amber-400 text-slate-950 font-semibold' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab === 'invoices' ? 'Invoices' : tab === 'payments' ? 'Payments' : tab}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
