import React, { useState, useEffect } from 'react';
import { ViewTab } from '../types';
import { 
  Upload, 
  Download, 
  Sun, 
  Moon,
  Trash2,
  Share2, 
  Maximize2, 
  Minimize2, 
  PlusCircle, 
  Cloud, 
  RefreshCw, 
  PanelLeft,
  Menu
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

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
  isSidebarOpen = true
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

          {/* Primary Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Real-time Multi-Device Cloud Sync Status Indicator */}
            {onManualSync && (
              <button
                onClick={onManualSync}
                disabled={isSyncing}
                title={lastSyncTime ? `Cloud Database Connected. Last synced: ${lastSyncTime}. Click to refresh.` : 'Cloud Database Connected. Click to refresh across devices.'}
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80 shadow-xs"
              >
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSyncing ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isSyncing ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                </span>
                <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="hidden sm:inline font-mono text-[11px]">
                  {isSyncing ? 'Syncing...' : 'Cloud Synced'}
                </span>
                <RefreshCw className={`w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            )}

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

            {/* PWA Save & Install Button - Desktop Only */}
            <div className="hidden sm:block">
              <PWAInstallButton />
            </div>

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

            {/* Add Invoice Button - Visible across all viewports */}
            <button
              onClick={onOpenAddInvoice}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/70 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
              title="Manually enter or create a new invoice"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden xs:inline sm:inline">+ Add Invoice</span>
              <span className="xs:hidden sm:hidden">+ Add</span>
            </button>

            {/* Upload Button */}
            <button
              onClick={onOpenUpload}
              className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span className="hidden md:inline">Upload</span>
            </button>

            {/* Share Link Button - Desktop Only */}
            <button
              onClick={onOpenShare}
              disabled={totalInvoices === 0 && totalPayments === 0}
              title={totalInvoices === 0 ? 'Upload data first to generate share link' : 'Share uploaded data via web link'}
              className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-sky-800 dark:text-sky-200 bg-sky-100 hover:bg-sky-200 dark:bg-sky-950/70 dark:hover:bg-sky-900 border border-sky-300 dark:border-sky-800/80 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap"
            >
              <Share2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Share</span>
            </button>

            {/* Export Button - Desktop Only */}
            <button
              onClick={onOpenExport}
              disabled={totalInvoices === 0}
              className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
