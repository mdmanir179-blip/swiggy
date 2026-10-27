import React, { useState, useMemo, useEffect } from 'react';
import { ViewTab, InvoiceRecord, PaymentRecord } from './types';
import { deriveInitialPayments } from './data/initialData';
import { calculateFinancialSummary } from './utils/summaryCalculator';
import { loadSharedDatasetFromUrl } from './utils/shareManager';
import { 
  saveInvoicesToStorage, 
  loadInitialDataset, 
  savePaymentsToStorage, 
  clearAllPersistentStorage 
} from './utils/storage';
import { 
  subscribeToCloudLedger, 
  loadDatasetFromCloud, 
  saveInvoicesToCloud, 
  savePaymentsToCloud, 
  updateSingleInvoiceInCloud 
} from './utils/firebase';
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
import { MarkAsPaidModal } from './components/MarkAsPaidModal';
import { AddInvoiceModal } from './components/AddInvoiceModal';
import { 
  Upload, 
  FileSpreadsheet, 
  ShieldCheck, 
  CheckCircle2, 
  Share2, 
  Info, 
  Check, 
  Sparkles,
  X,
  PlusCircle
} from 'lucide-react';

export default function App() {
  // Synchronous immediate memory read with IndexedDB hydration
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('instamart_invoices_data') || localStorage.getItem('instamart_invoices');
      if (saved) {
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
      const saved = localStorage.getItem('instamart_payments_data') || localStorage.getItem('instamart_payments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Hydrate from Cloud Firestore first (ensures multi-device parity on startup), with IndexedDB offline fallback
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setIsSyncing(true);
        const dataset = await loadInitialDataset();
        if (isMounted) {
          if (dataset.invoices.length > 0) {
            setInvoices(dataset.invoices);
          }
          if (dataset.payments.length > 0) {
            setPayments(dataset.payments);
          }
          setIsStorageLoaded(true);
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setLastSyncTime(timeStr);
        }
      } catch (err) {
        console.warn('Persistent storage hydration failed:', err);
        if (isMounted) setIsStorageLoaded(true);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Real-time multi-device cloud synchronization via Firebase Firestore
  useEffect(() => {
    let isSubscribed = true;
    const unsubscribe = subscribeToCloudLedger((cloudData) => {
      if (!isSubscribed) return;
      if (cloudData.invoices && cloudData.invoices.length > 0) {
        setInvoices(cloudData.invoices);
        saveInvoicesToStorage(cloudData.invoices, cloudData.vendorName, true);
        setIsStorageLoaded(true);
      }
      if (cloudData.payments && cloudData.payments.length > 0) {
        setPayments(cloudData.payments);
        savePaymentsToStorage(cloudData.payments, true);
      }
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, []);

  // Manual refresh from Cloud Database across devices
  const refreshFromCloud = async () => {
    setIsSyncing(true);
    try {
      const dataset = await loadDatasetFromCloud();
      if (dataset && (dataset.invoices.length > 0 || dataset.payments.length > 0)) {
        setInvoices(dataset.invoices);
        setPayments(dataset.payments);
        setIsStorageLoaded(true);
        saveInvoicesToStorage(dataset.invoices, dataset.vendorName, true);
        savePaymentsToStorage(dataset.payments, true);
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(timeStr);
      }
    } catch (err) {
      console.warn('Manual cloud sync notice:', err);
    } finally {
      setIsSyncing(false);
    }
  };

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

  // Sync state to persistent local cache (IndexedDB + localStorage)
  useEffect(() => {
    if (!isStorageLoaded && invoices.length === 0) return;
    saveInvoicesToStorage(invoices, undefined, true).catch(err => console.warn('Save invoices to cache failed:', err));
  }, [invoices, isStorageLoaded]);

  useEffect(() => {
    if (!isStorageLoaded && payments.length === 0) return;
    savePaymentsToStorage(payments, true).catch(err => console.warn('Save payments to cache failed:', err));
  }, [payments, isStorageLoaded]);

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

  // Mark As Paid Modal state
  const [isMarkPaidOpen, setIsMarkPaidOpen] = useState(false);
  const [invoiceToMarkPaid, setInvoiceToMarkPaid] = useState<InvoiceRecord | null>(null);

  // Manual Add/Edit Invoice Modal state
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<InvoiceRecord | null>(null);

  // Financial summary computation
  const summary = useMemo(() => {
    return calculateFinancialSummary(invoices);
  }, [invoices]);

  // Vendor & Customer details from first record if loaded
  const vendorName = invoices[0]?.vendorName || (payments[0]?.vendorName ?? '');

  // Handle uploaded invoices (Syncs immediately to Cloud Firestore for multi-device visibility)
  const handleInvoicesLoaded = async (newInvoices: InvoiceRecord[], mode: 'replace' | 'append') => {
    setIsSyncing(true);
    let targetInvoices: InvoiceRecord[] = [];
    let targetPayments: PaymentRecord[] = [];

    if (mode === 'replace') {
      targetInvoices = newInvoices;
      targetPayments = deriveInitialPayments(newInvoices);
    } else {
      targetInvoices = [...invoices, ...newInvoices];
      const newDerived = deriveInitialPayments(newInvoices);
      targetPayments = [...payments, ...newDerived];
    }

    setInvoices(targetInvoices);
    setPayments(targetPayments);
    setSharedNotice(null);

    // Immediate local cache
    saveInvoicesToStorage(targetInvoices, targetInvoices[0]?.vendorName, true);
    savePaymentsToStorage(targetPayments, true);

    // Immediate Cloud Firestore push so other devices (Vercel, phone, PC) see data instantly
    try {
      await saveInvoicesToCloud(targetInvoices, targetInvoices[0]?.vendorName);
      if (targetPayments.length > 0) {
        await savePaymentsToCloud(targetPayments);
      }
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Failed to sync uploaded invoices to cloud:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle uploaded payments
  const handlePaymentsLoaded = async (newPayments: PaymentRecord[], mode: 'replace' | 'append') => {
    setIsSyncing(true);
    let targetPayments: PaymentRecord[] = [];
    if (mode === 'replace') {
      targetPayments = newPayments;
    } else {
      targetPayments = [...payments, ...newPayments];
    }

    setPayments(targetPayments);
    savePaymentsToStorage(targetPayments, true);

    try {
      await savePaymentsToCloud(targetPayments);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Failed to sync uploaded payments to cloud:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Open Mark As Paid modal
  const handleOpenMarkPaid = (invoice: InvoiceRecord) => {
    setInvoiceToMarkPaid(invoice);
    setIsMarkPaidOpen(true);
  };

  // Open Manual Add or Edit invoice modal
  const handleOpenAddInvoice = (invoice?: InvoiceRecord) => {
    setInvoiceToEdit(invoice || null);
    setIsAddInvoiceOpen(true);
  };

  // Confirm payment handler
  const handleConfirmPayment = (
    invoiceId: string, 
    paidAmount: number, 
    paymentDate: string, 
    paymentRef: string, 
    paymentType: string
  ) => {
    let updatedTargetInvoice: InvoiceRecord | null = null;
    const nextInvoices = invoices.map(inv => {
      if (inv.id !== invoiceId) return inv;
      const outstanding = Math.max(0, inv.netPayableAmount - paidAmount);
      const isFullPaid = outstanding <= 0.01;
      const paymentStatus = isFullPaid ? 'Paid' : (paidAmount > 0 ? 'Partially Paid' : 'Unpaid');
      const updated: InvoiceRecord = {
        ...inv,
        paymentAmount: paidAmount,
        outstandingPayment: outstanding,
        paymentStatus,
        lastPaymentDate: paymentDate,
        paymentReferenceNo: paymentRef,
        statusOfInvoice: isFullPaid ? 'Paid' : inv.statusOfInvoice
      };
      updatedTargetInvoice = updated;
      return updated;
    });

    setInvoices(nextInvoices);

    // Also update payments ledger
    let nextPayments = payments;
    const invNum = invoiceToMarkPaid?.invoiceNumber || '';
    const existingIdx = payments.findIndex(p => (invNum && p.linkedInvoices?.includes(invNum)) || (paymentRef && p.paymentReferenceNo === paymentRef));
    if (existingIdx >= 0) {
      const copy = [...payments];
      const existing = copy[existingIdx];
      copy[existingIdx] = {
        ...existing,
        amount: paidAmount,
        netAmount: paidAmount,
        paymentDate: paymentDate,
        paymentReferenceNo: paymentRef,
        paymentType: paymentType || existing.paymentType,
        linkedInvoices: invNum && !existing.linkedInvoices?.includes(invNum) 
          ? [...(existing.linkedInvoices || []), invNum] 
          : existing.linkedInvoices
      };
      nextPayments = copy;
    } else if (invoiceToMarkPaid && paidAmount > 0) {
      const newPay: PaymentRecord = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        organizationName: invoiceToMarkPaid.organizationName || 'Instamart Retail',
        vendorName: invoiceToMarkPaid.vendorName,
        vendorCode: invoiceToMarkPaid.vendorCode,
        gstin: invoiceToMarkPaid.gstin || '',
        pan: invoiceToMarkPaid.pan || '',
        tradeVendorType: 'Goods / Grocery Supplier',
        paymentType: paymentType || 'NEFT',
        paymentDate: paymentDate,
        paymentNumber: paymentRef || `PMT-${Date.now().toString().slice(-6)}`,
        paymentReferenceNo: paymentRef,
        amount: paidAmount,
        reversal: 0,
        netAmount: paidAmount,
        linkedInvoices: [invoiceToMarkPaid.invoiceNumber],
        matchedInvoiceCount: 1
      };
      nextPayments = [newPay, ...payments];
    }
    setPayments(nextPayments);

    setIsMarkPaidOpen(false);
    setInvoiceToMarkPaid(null);

    // Sync to Cloud Database immediately
    if (updatedTargetInvoice) {
      updateSingleInvoiceInCloud(updatedTargetInvoice).catch(err => console.warn('Cloud invoice payment update notice:', err));
    }
    savePaymentsToCloud(nextPayments).catch(err => console.warn('Cloud payments update notice:', err));
  };

  // Revert payment back to unpaid
  const handleRevertToUnpaid = (invoiceId: string) => {
    let updatedTargetInvoice: InvoiceRecord | null = null;
    const nextInvoices = invoices.map(inv => {
      if (inv.id !== invoiceId) return inv;
      const updated: InvoiceRecord = {
        ...inv,
        paymentAmount: 0,
        outstandingPayment: inv.netPayableAmount,
        paymentStatus: 'Unpaid',
        lastPaymentDate: '',
        paymentReferenceNo: '',
        statusOfInvoice: 'Approved'
      };
      updatedTargetInvoice = updated;
      return updated;
    });

    setInvoices(nextInvoices);
    setIsMarkPaidOpen(false);
    setInvoiceToMarkPaid(null);

    if (updatedTargetInvoice) {
      updateSingleInvoiceInCloud(updatedTargetInvoice).catch(err => console.warn('Cloud revert invoice notice:', err));
    }
  };

  // Save manual or edited invoice
  const handleSaveManualInvoice = (invoice: InvoiceRecord) => {
    let nextInvoices = invoices;
    const idx = invoices.findIndex(i => i.id === invoice.id);
    if (idx >= 0) {
      const copy = [...invoices];
      copy[idx] = invoice;
      nextInvoices = copy;
    } else {
      nextInvoices = [invoice, ...invoices];
    }
    setInvoices(nextInvoices);

    let nextPayments = payments;
    if (invoice.paymentAmount > 0) {
      const invNum = invoice.invoiceNumber;
      const pIdx = payments.findIndex(p => p.linkedInvoices?.includes(invNum) || (invoice.paymentReferenceNo && p.paymentReferenceNo === invoice.paymentReferenceNo));
      if (pIdx >= 0) {
        const copy = [...payments];
        const existing = copy[pIdx];
        copy[pIdx] = {
          ...existing,
          amount: invoice.paymentAmount,
          netAmount: invoice.paymentAmount,
          paymentDate: invoice.lastPaymentDate || existing.paymentDate,
          paymentReferenceNo: invoice.paymentReferenceNo || existing.paymentReferenceNo
        };
        nextPayments = copy;
      } else {
        const newPay: PaymentRecord = {
          id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          organizationName: invoice.organizationName || 'Instamart Retail',
          vendorName: invoice.vendorName,
          vendorCode: invoice.vendorCode,
          gstin: invoice.gstin || '',
          pan: invoice.pan || '',
          tradeVendorType: 'Goods / Grocery Supplier',
          paymentType: 'NEFT',
          paymentDate: invoice.lastPaymentDate || invoice.invoiceAccountingDate,
          paymentNumber: invoice.paymentReferenceNo || `PMT-${Date.now().toString().slice(-6)}`,
          paymentReferenceNo: invoice.paymentReferenceNo || '',
          amount: invoice.paymentAmount,
          reversal: 0,
          netAmount: invoice.paymentAmount,
          linkedInvoices: [invoice.invoiceNumber],
          matchedInvoiceCount: 1
        };
        nextPayments = [newPay, ...payments];
      }
      setPayments(nextPayments);
    }

    setIsAddInvoiceOpen(false);
    setInvoiceToEdit(null);

    // Sync to Cloud Database immediately
    updateSingleInvoiceInCloud(invoice).catch(err => console.warn('Cloud invoice save notice:', err));
    if (invoice.paymentAmount > 0) {
      savePaymentsToCloud(nextPayments).catch(err => console.warn('Cloud payment save notice:', err));
    }
  };

  // Clear all data directly from in-app modal
  const handleConfirmClear = async () => {
    setInvoices([]);
    setPayments([]);
    setSelectedWarehouse(undefined);
    setSelectedInvoice(null);
    setCurrentTab('dashboard');
    setSharedNotice(null);
    await clearAllPersistentStorage();
    if (window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname);
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
        onOpenAddInvoice={() => handleOpenAddInvoice()}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onClearData={() => setIsClearDataOpen(true)}
        vendorName={vendorName}
        totalInvoices={invoices.length}
        totalPayments={payments.length}
        theme={theme}
        onToggleTheme={toggleTheme}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        onManualSync={refreshFromCloud}
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
              <button
                onClick={() => handleOpenAddInvoice()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-md transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Add Invoice Manually</span>
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
                    onOpenAddInvoice={() => handleOpenAddInvoice()}
                    onMarkPaid={handleOpenMarkPaid}
                    onEditInvoice={(inv) => handleOpenAddInvoice(inv)}
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
                  onOpenAddInvoice={() => handleOpenAddInvoice()}
                  onMarkPaid={handleOpenMarkPaid}
                  onEditInvoice={(inv) => handleOpenAddInvoice(inv)}
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
        onOpenMarkPaid={handleOpenMarkPaid}
        onOpenEdit={(inv) => handleOpenAddInvoice(inv)}
      />

      {/* Mark As Paid Modal */}
      <MarkAsPaidModal
        isOpen={isMarkPaidOpen}
        invoice={invoiceToMarkPaid}
        onClose={() => {
          setIsMarkPaidOpen(false);
          setInvoiceToMarkPaid(null);
        }}
        onConfirmPayment={handleConfirmPayment}
        onRevertToUnpaid={handleRevertToUnpaid}
      />

      {/* Manual Add / Edit Invoice Modal */}
      <AddInvoiceModal
        isOpen={isAddInvoiceOpen}
        onClose={() => {
          setIsAddInvoiceOpen(false);
          setInvoiceToEdit(null);
        }}
        onSaveInvoice={handleSaveManualInvoice}
        initialInvoice={invoiceToEdit}
        defaultVendorName={vendorName || undefined}
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
