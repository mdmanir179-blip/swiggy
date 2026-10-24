import React, { useState, useMemo, useEffect } from 'react';
import { ViewTab, InvoiceRecord, PaymentRecord } from './types';
import { deriveInitialPayments } from './data/initialData';
import { calculateFinancialSummary } from './utils/summaryCalculator';
import { loadSharedDatasetFromUrl } from './utils/shareManager';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { InvoiceTable } from './components/InvoiceTable';
import { PaymentReportTable } from './components/PaymentReportTable';
import { ReconciliationView } from './components/ReconciliationView';
import { AgingAnalysisView } from './components/AgingAnalysisView';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { UploadModal } from './components/UploadModal';
import { ExportModal } from './components/ExportModal';
import { ShareModal } from './components/ShareModal';
import { ClearDataModal } from './components/ClearDataModal';
import { PrintStatement } from './components/PrintStatement';
import { OfflineIndicator } from './components/OfflineIndicator';
import { InstamartLogo } from './components/InstamartLogo';
import { 
  Upload, 
  FileSpreadsheet, 
  ShieldCheck, 
  CheckCircle2, 
  Share2, 
  Info, 
  Check, 
  Sparkles,
  X
} from 'lucide-react';

export default function App() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('instamart_invoices');
      if (saved) {
        if (saved.includes('TBC/26-27/831') || saved.includes('VIAPO74796') || saved.includes('1N96368405')) {
          localStorage.removeItem('instamart_invoices');
          localStorage.removeItem('instamart_payments');
          return [];
        }
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    try {
      const saved = localStorage.getItem('instamart_payments');
      if (saved) {
        if (saved.includes('1N96368405') || saved.includes('HSBCN52026')) {
          localStorage.removeItem('instamart_payments');
          return [];
        }
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Shared dataset notice from URL link
  const [sharedNotice, setSharedNotice] = useState<{
    vendorName: string;
    count: number;
    note?: string;
    createdAt?: string;
  } | null>(null);

  // Theme support
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const savedTheme = localStorage.getItem('instamart_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('instamart_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Sync state to localStorage
  useEffect(() => {
    try {
      if (invoices.length > 0) {
        localStorage.setItem('instamart_invoices', JSON.stringify(invoices));
      } else {
        localStorage.removeItem('instamart_invoices');
      }
    } catch {
      // ignore
    }
  }, [invoices]);

  useEffect(() => {
    try {
      if (payments.length > 0) {
        localStorage.setItem('instamart_payments', JSON.stringify(payments));
      } else {
        localStorage.removeItem('instamart_payments');
      }
    } catch {
      // ignore
    }
  }, [payments]);

  // Check URL on startup for shared dataset link (?share=... or #data=...)
  useEffect(() => {
    (async () => {
      try {
        const shared = await loadSharedDatasetFromUrl();
        if (shared && ((shared.invoices && shared.invoices.length > 0) || (shared.payments && shared.payments.length > 0))) {
          if (shared.invoices && shared.invoices.length > 0) {
            setInvoices(shared.invoices);
          }
          if (shared.payments && shared.payments.length > 0) {
            setPayments(shared.payments);
          }
          setSharedNotice({
            vendorName: shared.vendorName || 'Shared Vendor',
            count: shared.invoices?.length || 0,
            note: shared.note,
            createdAt: shared.createdAt,
          });
        }
      } catch (err) {
        console.warn('Could not parse shared dataset from URL:', err);
      }
    })();
  }, []);

  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');
  
  // Interactive filters & modals
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | undefined>(undefined);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isClearDataOpen, setIsClearDataOpen] = useState(false);

  // Financial summary computation
  const summary = useMemo(() => {
    return calculateFinancialSummary(invoices);
  }, [invoices]);

  // Vendor & Customer details from first record if loaded
  const vendorName = invoices[0]?.vendorName || (payments[0]?.vendorName ?? '');

  // Handle uploaded invoices
  const handleInvoicesLoaded = (newInvoices: InvoiceRecord[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setInvoices(newInvoices);
      setPayments(deriveInitialPayments(newInvoices));
    } else {
      setInvoices(prev => [...prev, ...newInvoices]);
      const newDerived = deriveInitialPayments(newInvoices);
      setPayments(prev => [...prev, ...newDerived]);
    }
    setSharedNotice(null);
  };

  // Handle uploaded payments
  const handlePaymentsLoaded = (newPayments: PaymentRecord[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setPayments(newPayments);
    } else {
      setPayments(prev => [...prev, ...newPayments]);
    }
  };

  // Clear all data directly from in-app modal
  const handleConfirmClear = () => {
    setInvoices([]);
    setPayments([]);
    setSelectedWarehouse(undefined);
    setSelectedInvoice(null);
    setCurrentTab('dashboard');
    setSharedNotice(null);
    try {
      localStorage.removeItem('instamart_invoices');
      localStorage.removeItem('instamart_payments');
      if (window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch {
      // ignore
    }
  };

  const handleFilterOverdue = () => {
    setCurrentTab('invoices');
  };

  const handleFilterNotDue = () => {
    setCurrentTab('invoices');
  };

  const handleFilterPaid = () => {
    setCurrentTab('invoices');
  };

  const handleSelectWarehouse = (wh: string) => {
    setSelectedWarehouse(wh);
    setCurrentTab('invoices');
  };

  const handleSelectInvoiceNumber = (invNum: string) => {
    const found = invoices.find(i => i.invoiceNumber.toLowerCase() === invNum.toLowerCase());
    if (found) {
      setSelectedInvoice(found);
    } else {
      setCurrentTab('invoices');
    }
  };

  const hasData = invoices.length > 0 || payments.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 transition-colors">
      
      {/* Header navigation bar adhering to Top Bar Contract */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onClearData={() => setIsClearDataOpen(true)}
        vendorName={vendorName}
        totalInvoices={invoices.length}
        totalPayments={payments.length}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Viewport - Full Screen Desktop Presentation */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5">
        
        {/* Shared Dataset Notification Banner */}
        {sharedNotice && hasData && (
          <div className="bg-gradient-to-r from-sky-500/10 via-amber-500/10 to-emerald-500/10 border border-sky-400/30 dark:border-sky-500/30 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    Viewing Shared Dataset: {sharedNotice.vendorName}
                  </span>
                  <span className="text-[11px] bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-medium px-2 py-0.5 rounded">
                    {sharedNotice.count} Invoices Loaded
                  </span>
                </div>
                {sharedNotice.note && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 italic">
                    &ldquo;{sharedNotice.note}&rdquo;
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => {
                  try {
                    localStorage.setItem('instamart_invoices', JSON.stringify(invoices));
                    localStorage.setItem('instamart_payments', JSON.stringify(payments));
                  } catch {}
                  setSharedNotice(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save to Workspace</span>
              </button>

              <button
                onClick={() => setSharedNotice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* If no data loaded, show clean welcome & upload invitation */}
        {!hasData ? (
          <div className="max-w-3xl mx-auto my-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center shadow-lg transition-colors">
            
            {/* New Logo Vector */}
            <div className="flex justify-center mb-5">
              <InstamartLogo className="w-16 h-16" size={64} />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
              Welcome to Instamart Payment Tracker
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-6">
              Upload your official Instamart Excel (.xlsx, .xls) or CSV Invoice and Payment reports to begin tracking sales, reconciling bank remittances, and sharing reports via web link.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-sm shadow-md transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Excel / CSV Report</span>
              </button>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-left text-xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Point 1: 34 Fields</div>
                  <div className="text-slate-500 text-[11px]">Gross sales, PO/GRN, Last Payment Date, Net Payable</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Web Link Sharing</div>
                  <div className="text-slate-500 text-[11px]">Share uploaded data sheets with anyone via 1 direct link</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Full Screen Desktop</div>
                  <div className="text-slate-500 text-[11px]">Computer full screen display with high-density audit views</div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <>
            {/* KPI Metric Cards displayed on top of dashboard & ledger */}
            <MetricCards
              summary={summary}
              onFilterOverdue={handleFilterOverdue}
              onFilterNotDue={handleFilterNotDue}
              onFilterPaid={handleFilterPaid}
            />

            {/* Tab 1: Dashboard View */}
            {currentTab === 'dashboard' && (
              <div className="space-y-5">
                <AnalyticsCharts
                  invoices={invoices}
                  summary={summary}
                  onSelectWarehouse={handleSelectWarehouse}
                />

                {/* Live Invoices Register */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Active Invoice Register (Sheet 1)</h3>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsShareOpen(true)}
                        className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold flex items-center gap-1"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share Sheet via Link</span>
                      </button>
                      <button
                        onClick={() => setCurrentTab('invoices')}
                        className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium"
                      >
                        View All {invoices.length} Invoices &rarr;
                      </button>
                    </div>
                  </div>

                  <InvoiceTable
                    invoices={invoices}
                    onSelectInvoice={(inv) => setSelectedInvoice(inv)}
                    selectedWarehouse={selectedWarehouse}
                    onClearWarehouseFilter={() => setSelectedWarehouse(undefined)}
                    onOpenUpload={() => setIsUploadOpen(true)}
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Full Invoice Ledger View */}
            {currentTab === 'invoices' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Invoice Master Register (Sheet 1)</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Comprehensive audit view with all 34 fields including Invoice Date, Due Date, and Last Payment Date.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsShareOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-100 hover:bg-sky-200 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-semibold rounded-lg text-xs transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share This Sheet</span>
                  </button>
                </div>

                <InvoiceTable
                  invoices={invoices}
                  onSelectInvoice={(inv) => setSelectedInvoice(inv)}
                  selectedWarehouse={selectedWarehouse}
                  onClearWarehouseFilter={() => setSelectedWarehouse(undefined)}
                  onOpenUpload={() => setIsUploadOpen(true)}
                />
              </div>
            )}

            {/* Tab 3: Point 2 Payment Report Ledger */}
            {currentTab === 'payments' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Payment Report Ledger (Point 2)</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Bank remittance details, payment numbers, UTR reference codes, and reversals.
                    </p>
                  </div>
                </div>

                <PaymentReportTable
                  payments={payments}
                  invoices={invoices}
                  onSelectInvoiceNumber={handleSelectInvoiceNumber}
                  onOpenUpload={() => setIsUploadOpen(true)}
                />
              </div>
            )}

            {/* Tab 4: Automated Reconciliation Hub */}
            {currentTab === 'reconciliation' && (
              <ReconciliationView
                invoices={invoices}
                payments={payments}
                summary={summary}
                onSelectInvoice={(inv) => setSelectedInvoice(inv)}
                onOpenUpload={() => setIsUploadOpen(true)}
              />
            )}

            {/* Tab 5: Aging & Overdue Recovery */}
            {currentTab === 'aging' && (
              <AgingAnalysisView
                invoices={invoices}
                summary={summary}
                onSelectInvoice={(inv) => setSelectedInvoice(inv)}
                onOpenUpload={() => setIsUploadOpen(true)}
              />
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 transition-colors">
        <p>Instamart Payment Tracker · Autonomous Vendor Finance & Reconciliation Engine</p>
      </footer>

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

      {/* Excel & CSV Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onInvoicesLoaded={handleInvoicesLoaded}
        onPaymentsLoaded={handlePaymentsLoaded}
      />

      {/* Export Reports Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        invoices={invoices}
        payments={payments}
        summary={summary}
      />

      {/* Share Dataset via Web Link Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        invoices={invoices}
        payments={payments}
        vendorName={vendorName}
      />

      {/* Hidden Printable Vendor Statement for Window Print */}
      <PrintStatement
        invoices={invoices}
        payments={payments}
        summary={summary}
      />

      {/* Clear Dataset In-App Confirmation Modal */}
      <ClearDataModal
        isOpen={isClearDataOpen}
        onClose={() => setIsClearDataOpen(false)}
        onConfirm={handleConfirmClear}
        totalInvoices={invoices.length}
        totalPayments={payments.length}
      />

      {/* Offline Connectivity Notification */}
      <OfflineIndicator />

    </div>
  );
}
