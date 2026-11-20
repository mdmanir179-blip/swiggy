import React, { useMemo, useState } from 'react';
import { InvoiceRecord, PaymentRecord } from '../types';
import { formatINR } from '../utils/currency';
import { toUtcDayTimestamp, parseAndFormatDate } from '../utils/dateFormatter';
import {
  Calendar,
  CreditCard,
  FileText,
  ArrowLeft,
  Copy,
  Check,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Landmark,
  X,
  Search
} from 'lucide-react';

export type DateFilterField = 'paymentDate' | 'invoiceDate' | 'dueDate';

interface DateRangePaymentViewProps {
  invoices: InvoiceRecord[];
  payments: PaymentRecord[];
  dateFrom: string;
  dateTo: string;
  searchQuery: string;
  onDateRangeChange: (from: string, to: string) => void;
  onClearAll: () => void;
  onSelectInvoice: (invoice: InvoiceRecord) => void;
  onOpenMarkPaid: (invoice: InvoiceRecord) => void;
  onOpenEdit: (invoice: InvoiceRecord) => void;
}

function formatInputDate(isoDate: string): string {
  if (!isoDate) return '';
  return parseAndFormatDate(isoDate) || isoDate;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const DateRangePaymentView: React.FC<DateRangePaymentViewProps> = ({
  invoices,
  payments,
  dateFrom,
  dateTo,
  searchQuery,
  onDateRangeChange,
  onClearAll,
  onSelectInvoice,
  onOpenMarkPaid,
  onOpenEdit
}) => {
  const [dateField, setDateField] = useState<DateFilterField>('paymentDate');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, val: string) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Normalized UTC day boundaries
  const { startTs, endTs } = useMemo(() => {
    const t1 = dateFrom ? toUtcDayTimestamp(dateFrom) : 0;
    const t2 = dateTo ? toUtcDayTimestamp(dateTo) : 0;
    if (t1 && t2 && t1 > t2) {
      return { startTs: t2, endTs: t1 };
    }
    return { startTs: t1 || null, endTs: t2 || null };
  }, [dateFrom, dateTo]);

  const isTsInRange = (ts: number): boolean => {
    if (!ts) return false;
    if (startTs !== null && ts < startTs) return false;
    if (endTs !== null && ts > endTs) return false;
    return true;
  };

  // Map invoiceNumber -> InvoiceRecord for fast lookup from payment rows
  const invoiceByNumberMap = useMemo(() => {
    const map = new Map<string, InvoiceRecord>();
    for (const inv of invoices) {
      if (inv.invoiceNumber) {
        map.set(inv.invoiceNumber.trim().toLowerCase(), inv);
      }
    }
    return map;
  }, [invoices]);

  // Text query matcher helper
  const q = searchQuery.trim().toLowerCase();

  const matchesInvoiceQuery = (inv: InvoiceRecord): boolean => {
    if (!q) return true;
    return Boolean(
      (inv.poNumber && inv.poNumber.toLowerCase().includes(q)) ||
      (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(q)) ||
      (inv.grnNumber && inv.grnNumber.toLowerCase().includes(q)) ||
      (inv.paymentReferenceNo && inv.paymentReferenceNo.toLowerCase().includes(q)) ||
      (inv.vendorName && inv.vendorName.toLowerCase().includes(q)) ||
      (inv.warehouseName && inv.warehouseName.toLowerCase().includes(q))
    );
  };

  const matchesPaymentQuery = (pmt: PaymentRecord): boolean => {
    if (!q) return true;
    const directMatch = Boolean(
      (pmt.paymentNumber && pmt.paymentNumber.toLowerCase().includes(q)) ||
      (pmt.paymentReferenceNo && pmt.paymentReferenceNo.toLowerCase().includes(q)) ||
      (pmt.vendorName && pmt.vendorName.toLowerCase().includes(q)) ||
      (pmt.paymentType && pmt.paymentType.toLowerCase().includes(q)) ||
      (pmt.linkedInvoices && pmt.linkedInvoices.some((num) => num.toLowerCase().includes(q)))
    );
    if (directMatch) return true;

    // Also check linked invoices' PO number / warehouse
    if (pmt.linkedInvoices) {
      for (const invNum of pmt.linkedInvoices) {
        const linkedInv = invoiceByNumberMap.get(invNum.trim().toLowerCase());
        if (linkedInv && matchesInvoiceQuery(linkedInv)) return true;
      }
    }
    return false;
  };

  // Filtered Payments & Invoices based on selected Date Field and Date Range
  const { matchedPayments, matchedInvoices } = useMemo(() => {
    if (dateField === 'paymentDate') {
      // 1. Payments whose paymentDate falls in range
      const pmtList = payments
        .filter((p) => isTsInRange(toUtcDayTimestamp(p.paymentDate)) && matchesPaymentQuery(p))
        .sort((a, b) => toUtcDayTimestamp(b.paymentDate) - toUtcDayTimestamp(a.paymentDate));

      // Collect linked invoice numbers & UTRs from those payments so no paid invoice is missed
      const linkedInvSet = new Set<string>();
      const linkedUtrSet = new Set<string>();
      for (const p of pmtList) {
        if (p.linkedInvoices) {
          p.linkedInvoices.forEach((num) => linkedInvSet.add(num.trim().toLowerCase()));
        }
        if (p.paymentReferenceNo) {
          linkedUtrSet.add(p.paymentReferenceNo.trim().toLowerCase());
        }
      }

      // 2. Invoices whose lastPaymentDate is in range OR linked to an in-range payment
      const invList = invoices
        .filter((inv) => {
          if (!matchesInvoiceQuery(inv)) return false;
          const payTs = toUtcDayTimestamp(inv.lastPaymentDate);
          if (isTsInRange(payTs)) return true;
          const invKey = (inv.invoiceNumber || '').trim().toLowerCase();
          const utrKey = (inv.paymentReferenceNo || '').trim().toLowerCase();
          if (invKey && linkedInvSet.has(invKey)) return true;
          if (utrKey && linkedUtrSet.has(utrKey)) return true;
          return false;
        })
        .sort((a, b) => {
          const tB = toUtcDayTimestamp(b.lastPaymentDate) || toUtcDayTimestamp(b.invoiceAccountingDate);
          const tA = toUtcDayTimestamp(a.lastPaymentDate) || toUtcDayTimestamp(a.invoiceAccountingDate);
          return tB - tA;
        });

      return { matchedPayments: pmtList, matchedInvoices: invList };
    }

    // Invoice Date or Due Date mode
    const invList = invoices
      .filter((inv) => {
        if (!matchesInvoiceQuery(inv)) return false;
        const rawDate = dateField === 'invoiceDate' ? inv.invoiceAccountingDate : inv.dueDate;
        return isTsInRange(toUtcDayTimestamp(rawDate));
      })
      .sort((a, b) => {
        const dA = dateField === 'invoiceDate' ? a.invoiceAccountingDate : a.dueDate;
        const dB = dateField === 'invoiceDate' ? b.invoiceAccountingDate : b.dueDate;
        return toUtcDayTimestamp(dB) - toUtcDayTimestamp(dA);
      });

    const invNumSet = new Set(invList.map((i) => (i.invoiceNumber || '').trim().toLowerCase()).filter(Boolean));
    const invUtrSet = new Set(invList.map((i) => (i.paymentReferenceNo || '').trim().toLowerCase()).filter(Boolean));

    const pmtList = payments
      .filter((p) => {
        if (!matchesPaymentQuery(p)) return false;
        const linkedMatch = p.linkedInvoices?.some((num) => invNumSet.has(num.trim().toLowerCase()));
        const utrMatch = p.paymentReferenceNo && invUtrSet.has(p.paymentReferenceNo.trim().toLowerCase());
        return Boolean(linkedMatch || utrMatch);
      })
      .sort((a, b) => toUtcDayTimestamp(b.paymentDate) - toUtcDayTimestamp(a.paymentDate));

    return { matchedPayments: pmtList, matchedInvoices: invList };
  }, [invoices, payments, dateField, startTs, endTs, q, invoiceByNumberMap]);

  // Summary Metrics for selected Date Range
  const rangeSummary = useMemo(() => {
    const paymentNetTotal = matchedPayments.reduce((sum, p) => sum + (p.netAmount || p.amount || 0), 0);
    const paymentReversalTotal = matchedPayments.reduce((sum, p) => sum + (p.reversal || 0), 0);
    const invoicePaidTotal = matchedInvoices.reduce((sum, inv) => sum + (inv.paymentAmount || 0), 0);
    const invoiceNetPayableTotal = matchedInvoices.reduce((sum, inv) => sum + (inv.netPayableAmount || 0), 0);
    const invoiceOutstandingTotal = matchedInvoices.reduce((sum, inv) => sum + (inv.outstandingPayment || 0), 0);
    const invoiceDeductionsTotal = matchedInvoices.reduce((sum, inv) => sum + (inv.totalDeductions || 0), 0);

    // Prefer bank payment net total when available in paymentDate mode, fallback to invoice paid total
    const effectivePaidTotal =
      matchedPayments.length > 0 ? paymentNetTotal : invoicePaidTotal;

    return {
      effectivePaidTotal,
      paymentNetTotal,
      paymentReversalTotal,
      invoicePaidTotal,
      invoiceNetPayableTotal,
      invoiceOutstandingTotal,
      invoiceDeductionsTotal
    };
  }, [matchedPayments, matchedInvoices]);

  // Quick date presets
  const applyPreset = (preset: 'last7' | 'last30' | 'thisMonth' | 'lastMonth') => {
    const now = new Date();
    if (preset === 'last7') {
      const from = new Date(now);
      from.setDate(now.getDate() - 6);
      onDateRangeChange(toIsoDate(from), toIsoDate(now));
    } else if (preset === 'last30') {
      const from = new Date(now);
      from.setDate(now.getDate() - 29);
      onDateRangeChange(toIsoDate(from), toIsoDate(now));
    } else if (preset === 'thisMonth') {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      onDateRangeChange(toIsoDate(from), toIsoDate(now));
    } else if (preset === 'lastMonth') {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      onDateRangeChange(toIsoDate(from), toIsoDate(to));
    }
  };

  const rangeLabel = (() => {
    if (dateFrom && dateTo) {
      return `${formatInputDate(dateFrom)} to ${formatInputDate(dateTo)}`;
    }
    if (dateFrom) return `From ${formatInputDate(dateFrom)}`;
    if (dateTo) return `Up to ${formatInputDate(dateTo)}`;
    return 'Selected Dates';
  })();

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Filter Context & Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Date-to-Date Payment &amp; Ledger Tracker
                </h2>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60">
                  {rangeLabel}
                </span>
                {q && (
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300/60 dark:border-sky-800/60 flex items-center gap-1">
                    <Search className="w-3 h-3" />
                    <span>&ldquo;{searchQuery.trim()}&rdquo;</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Track bank remittances, settled invoices, UTR numbers, and outstanding amounts across your chosen dates.
              </p>
            </div>
          </div>

          <button
            onClick={onClearAll}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Clear Dates &amp; Back to Dashboard</span>
          </button>
        </div>

        {/* Date Field Mode & Quick Presets Row */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Track By Date Field */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
              Track By:
            </span>
            {(
              [
                { id: 'paymentDate', label: 'Payment Date' },
                { id: 'invoiceDate', label: 'Invoice Date' },
                { id: 'dueDate', label: 'Due Date' }
              ] as { id: DateFilterField; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDateField(opt.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                  dateField === opt.id
                    ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-2xs'
                    : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Quick Range Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
              Quick Range:
            </span>
            <button
              type="button"
              onClick={() => applyPreset('last7')}
              className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => applyPreset('last30')}
              className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => applyPreset('thisMonth')}
              className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => applyPreset('lastMonth')}
              className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              Last Month
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Payments Tracked</span>
            <CreditCard className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {formatINR(rangeSummary.effectivePaidTotal)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
            {matchedPayments.length} {matchedPayments.length === 1 ? 'Bank Remittance' : 'Bank Remittances'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Matched Invoices Net</span>
            <FileText className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-sky-700 dark:text-sky-300 mt-1 tabular-nums">
            {formatINR(rangeSummary.invoiceNetPayableTotal)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
            {matchedInvoices.length} {matchedInvoices.length === 1 ? 'Invoice' : 'Invoices'} Found
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Outstanding Balance</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`text-lg sm:text-xl font-bold font-mono mt-1 tabular-nums ${
            rangeSummary.invoiceOutstandingTotal > 0.01 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {formatINR(rangeSummary.invoiceOutstandingTotal)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
            Across matched invoices
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Deductions / Reversals</span>
            <Landmark className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1 tabular-nums">
            {formatINR(rangeSummary.invoiceDeductionsTotal + rangeSummary.paymentReversalTotal)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
            Reversals: {formatINR(rangeSummary.paymentReversalTotal)}
          </div>
        </div>
      </div>

      {/* Empty Result State */}
      {matchedPayments.length === 0 && matchedInvoices.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-4">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            No payments or invoices found in this date range
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5">
            No records matched <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{rangeLabel}</span> under{' '}
            <strong>{dateField === 'paymentDate' ? 'Payment Date' : dateField === 'invoiceDate' ? 'Invoice Date' : 'Due Date'}</strong>.
            Try switching the &ldquo;Track By&rdquo; date type or adjusting your From / To dates.
          </p>
          <button
            onClick={onClearAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-xs transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Date Filter</span>
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* 1. Payment Remittances Table */}
          {matchedPayments.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Payment Remittances ({matchedPayments.length})
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Net Credited: {formatINR(rangeSummary.paymentNetTotal)}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3 font-semibold">Payment Date</th>
                      <th className="py-2.5 px-3 font-semibold">Payment No. / Mode</th>
                      <th className="py-2.5 px-3 font-semibold">Bank UTR / Ref</th>
                      <th className="py-2.5 px-3 font-semibold">Linked Invoices &amp; POs</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Reversal</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Net Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {matchedPayments.map((pmt) => (
                      <tr key={pmt.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          {pmt.paymentDate || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {pmt.paymentNumber || '—'}
                          </div>
                          <div className="text-[10px] text-slate-500">{pmt.paymentType || 'NEFT'}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="text-amber-700 dark:text-amber-300 font-medium">
                              {pmt.paymentReferenceNo || '—'}
                            </span>
                            {pmt.paymentReferenceNo && (
                              <button
                                onClick={() => handleCopy(`pmt-${pmt.id}`, pmt.paymentReferenceNo)}
                                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                                title="Copy UTR"
                              >
                                {copiedKey === `pmt-${pmt.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          {pmt.linkedInvoices && pmt.linkedInvoices.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {pmt.linkedInvoices.map((invNum) => {
                                const linked = invoiceByNumberMap.get(invNum.trim().toLowerCase());
                                return linked ? (
                                  <button
                                    key={invNum}
                                    onClick={() => onSelectInvoice(linked)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-mono text-[11px] font-medium transition-colors"
                                    title={linked.poNumber ? `PO: ${linked.poNumber} — Click for full details` : 'Click for full details'}
                                  >
                                    <span>{invNum}</span>
                                    {linked.poNumber && (
                                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                        ({linked.poNumber})
                                      </span>
                                    )}
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </button>
                                ) : (
                                  <span
                                    key={invNum}
                                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]"
                                  >
                                    {invNum}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {formatINR(pmt.amount)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right whitespace-nowrap text-red-600 dark:text-red-400">
                          {pmt.reversal ? formatINR(pmt.reversal) : '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                          {formatINR(pmt.netAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Matched Invoices & POs Table */}
          {matchedInvoices.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Invoices &amp; POs in Date Range ({matchedInvoices.length})
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                  Paid: <strong className="text-emerald-600 dark:text-emerald-400">{formatINR(rangeSummary.invoicePaidTotal)}</strong>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3 font-semibold">PO / Invoice No.</th>
                      <th className="py-2.5 px-3 font-semibold">Last Pay Date</th>
                      <th className="py-2.5 px-3 font-semibold">Invoice / Due Date</th>
                      <th className="py-2.5 px-3 font-semibold">Warehouse</th>
                      <th className="py-2.5 px-3 font-semibold">UTR / Ref No.</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Net Payable</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Paid</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Outstanding</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {matchedInvoices.map((inv) => {
                      const isPaid = inv.paymentStatus === 'Paid' || inv.outstandingPayment <= 0.01;
                      const isOverdue = (inv.overdueStatus || '').toLowerCase().includes('overdue') && inv.outstandingPayment > 0.01;

                      return (
                        <tr
                          key={inv.id}
                          onClick={() => onSelectInvoice(inv)}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                        >
                          <td className="py-2.5 px-3 font-mono">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {inv.invoiceNumber}
                            </div>
                            {inv.poNumber && (
                              <div className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                                PO: {inv.poNumber}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono whitespace-nowrap font-semibold text-emerald-700 dark:text-emerald-400">
                            {inv.lastPaymentDate || (inv.paymentAmount > 0 ? 'Recorded' : '—')}
                          </td>
                          <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                            <div className="text-slate-800 dark:text-slate-200">{inv.invoiceAccountingDate || '—'}</div>
                            <div className="text-[10px] text-slate-500">Due: {inv.dueDate || '—'}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[140px]">
                              {inv.warehouseName || '—'}
                            </div>
                            {inv.city && (
                              <div className="text-[10px] text-slate-500">{inv.city}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            <span className="text-amber-700 dark:text-amber-300">
                              {inv.paymentReferenceNo || '—'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-right whitespace-nowrap text-slate-800 dark:text-slate-200">
                            {formatINR(inv.netPayableAmount)}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-right whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                            {formatINR(inv.paymentAmount)}
                          </td>
                          <td className={`py-2.5 px-3 font-mono font-bold text-right whitespace-nowrap ${
                            inv.outstandingPayment > 0.01 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {formatINR(inv.outstandingPayment)}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded font-semibold border ${
                                isPaid
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                  : isOverdue
                                    ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800'
                                    : 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                              }`}
                            >
                              {inv.paymentStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => onOpenMarkPaid(inv)}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50 transition-colors"
                                title={isPaid ? 'Edit Payment / UTR' : 'Mark as Paid'}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onOpenEdit(inv)}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50 transition-colors"
                                title="Edit Invoice"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
