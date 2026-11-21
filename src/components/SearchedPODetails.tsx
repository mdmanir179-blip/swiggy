import React, { useState } from 'react';
import { InvoiceRecord, PaymentRecord } from '../types';
import { formatINR } from '../utils/currency';
import {
  Search,
  X,
  ArrowLeft,
  FileText,
  Receipt,
  ShieldCheck,
  CreditCard,
  Building,
  Calendar,
  Clock,
  Copy,
  Check,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  PackageCheck,
  Landmark
} from 'lucide-react';

interface SearchedPODetailsProps {
  searchQuery: string;
  matchedInvoices: InvoiceRecord[];
  allInvoices: InvoiceRecord[];
  payments: PaymentRecord[];
  onClearSearch: () => void;
  onOpenMarkPaid: (invoice: InvoiceRecord) => void;
  onOpenEdit: (invoice: InvoiceRecord) => void;
  onSearchInvoice?: (invoiceNumber: string) => void;
}

export const SearchedPODetails: React.FC<SearchedPODetailsProps> = ({
  searchQuery,
  matchedInvoices,
  allInvoices,
  payments,
  onClearSearch,
  onOpenMarkPaid,
  onOpenEdit,
  onSearchInvoice
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Aggregate totals when multiple invoices match (e.g. a PO with multiple invoices)
  const totals = matchedInvoices.reduce(
    (acc, inv) => {
      acc.gross += inv.invoicesRecorded || inv.grossGrnAmount || 0;
      acc.deductions += inv.totalDeductions || 0;
      acc.netPayable += inv.netPayableAmount || 0;
      acc.paid += inv.paymentAmount || 0;
      acc.outstanding += inv.outstandingPayment || 0;
      return acc;
    },
    { gross: 0, deductions: 0, netPayable: 0, paid: 0, outstanding: 0 }
  );

  // Limit rendered cards for extreme partial queries while showing accurate count
  const MAX_RENDER = 25;
  const displayedInvoices = matchedInvoices.slice(0, MAX_RENDER);

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Search Context Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                PO / Invoice Search Details
              </h2>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60">
                &ldquo;{searchQuery.trim()}&rdquo;
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {matchedInvoices.length} {matchedInvoices.length === 1 ? 'Record' : 'Records'} Found
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Showing complete PO, GRN, deduction, and bank remittance details for your search.
            </p>
          </div>
        </div>

        <button
          onClick={onClearSearch}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Clear Search &amp; Back to Dashboard</span>
        </button>
      </div>

      {/* Empty Search Result State */}
      {matchedInvoices.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-4">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            No matching PO or Invoice found
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5">
            No records matched <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">&ldquo;{searchQuery.trim()}&rdquo;</span> across PO Number, Invoice Number, GRN Number, or UTR Reference.
          </p>
          <button
            onClick={onClearSearch}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-xs transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Search</span>
          </button>
        </div>
      ) : (
        <>
          {/* Combined Summary Strip when multiple invoices match a PO/query */}
          {matchedInvoices.length > 1 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Combined Summary ({matchedInvoices.length} Matched Invoices)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Total Gross Invoiced</span>
                  <span className="text-sm sm:text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
                    {formatINR(totals.gross)}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Total Deductions</span>
                  <span className="text-sm sm:text-base font-bold font-mono text-purple-600 dark:text-purple-400 mt-0.5 block">
                    -{formatINR(totals.deductions)}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Total Net Payable</span>
                  <span className="text-sm sm:text-base font-bold font-mono text-sky-700 dark:text-sky-300 mt-0.5 block">
                    {formatINR(totals.netPayable)}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Total Paid</span>
                  <span className="text-sm sm:text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    {formatINR(totals.paid)}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-slate-500 block">Total Outstanding</span>
                  <span className={`text-sm sm:text-base font-bold font-mono mt-0.5 block ${
                    totals.outstanding > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {formatINR(totals.outstanding)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {matchedInvoices.length > MAX_RENDER && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-lg px-4 py-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Showing the top {MAX_RENDER} of {matchedInvoices.length} matching records. Enter a more specific PO or Invoice number to narrow results.
              </span>
            </div>
          )}

          {/* Full Details Card for Each Matched PO / Invoice */}
          <div className="space-y-6">
            {displayedInvoices.map((invoice) => {
              const isOverdue = (invoice.overdueStatus || '').toLowerCase().includes('overdue') && invoice.outstandingPayment > 0.01;
              const isPaid = invoice.paymentStatus === 'Paid' || invoice.outstandingPayment <= 0.01;

              // Find linked payment remittances for this invoice (supports comma-separated UTR refs)
              const invRefs = (invoice.paymentReferenceNo || '')
                .split(/[,;\n]+/)
                .map((r) => r.trim().toLowerCase())
                .filter(Boolean);
              const invNumLower = (invoice.invoiceNumber || '').trim().toLowerCase();

              const linkedPayments = payments.filter((p) => {
                const pRefLower = (p.paymentReferenceNo || '').trim().toLowerCase();
                const matchesLinkedList =
                  Array.isArray(p.linkedInvoices) &&
                  p.linkedInvoices.some((num) => num.trim().toLowerCase() === invNumLower);
                const matchesRef = Boolean(pRefLower && invRefs.includes(pRefLower));
                return matchesLinkedList || matchesRef;
              });

              const getBatchInvoiceNumbers = (pmt: PaymentRecord): string[] => {
                const seen = new Map<string, string>();
                const addInv = (num?: string) => {
                  const cleaned = (num || '').trim();
                  if (!cleaned) return;
                  const key = cleaned.toLowerCase();
                  if (!seen.has(key)) seen.set(key, cleaned);
                };

                if (Array.isArray(pmt.linkedInvoices)) {
                  pmt.linkedInvoices.forEach(addInv);
                }

                const pRefLower = (pmt.paymentReferenceNo || '').trim().toLowerCase();
                if (pRefLower) {
                  allInvoices.forEach((otherInv) => {
                    const otherRefs = (otherInv.paymentReferenceNo || '')
                      .split(/[,;\n]+/)
                      .map((r) => r.trim().toLowerCase())
                      .filter(Boolean);
                    if (otherRefs.includes(pRefLower)) {
                      addInv(otherInv.invoiceNumber);
                    }
                  });
                }

                return Array.from(seen.values());
              };

              return (
                <div
                  key={invoice.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden"
                >
                  {/* Record Header */}
                  <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {invoice.poNumber && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold font-mono bg-amber-400 text-slate-950 shadow-2xs">
                              PO: {invoice.poNumber}
                            </span>
                          )}
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono">
                            {invoice.invoiceNumber}
                          </h3>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded font-semibold border ${
                              isPaid
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                : isOverdue
                                  ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800'
                                  : 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                            }`}
                          >
                            {invoice.paymentStatus}
                          </span>
                          {isOverdue && (
                            <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-red-500 text-white">
                              {invoice.overdueStatus}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 font-mono">
                          <span>{invoice.warehouseName || 'General Warehouse'}</span>
                          <span aria-hidden="true">·</span>
                          <span>{invoice.city || 'Metro Hub'}</span>
                          {invoice.vendorName && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-sans font-medium text-slate-600 dark:text-slate-300">
                                {invoice.vendorName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() => onOpenEdit(invoice)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                        <span>Edit Invoice</span>
                      </button>
                      <button
                        onClick={() => onOpenMarkPaid(invoice)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isPaid ? 'Edit Payment / UTR' : 'Mark as Paid'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300">
                    {/* Key Dates Highlights Ribbon */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60">
                      <div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-500" />
                          <span>PO Date</span>
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono text-xs mt-0.5 block">
                          {invoice.poDate || '—'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <PackageCheck className="w-3 h-3 text-emerald-500" />
                          <span>GRN Date</span>
                        </span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-xs mt-0.5 block">
                          {invoice.grnDate || '—'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-sky-500" />
                          <span>Invoice Date</span>
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono text-xs mt-0.5 block">
                          {invoice.invoiceAccountingDate || '—'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>Due Date</span>
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono text-xs mt-0.5 block">
                          {invoice.dueDate || '—'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-emerald-500" />
                          <span>Last Payment Date</span>
                        </span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-xs mt-0.5 block">
                          {invoice.lastPaymentDate || (invoice.paymentAmount > 0 ? 'Recorded' : 'Unpaid')}
                        </span>
                      </div>
                    </div>

                    {/* Key Financial Amounts Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                        <span className="text-slate-500 text-[11px] block">Gross Invoiced</span>
                        <span className="text-base font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1 block">
                          {formatINR(invoice.invoicesRecorded || invoice.grossGrnAmount)}
                        </span>
                      </div>

                      <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                        <span className="text-slate-500 text-[11px] block">Total Deductions</span>
                        <span className="text-base font-bold text-purple-600 dark:text-purple-400 font-mono tabular-nums mt-1 block">
                          -{formatINR(invoice.totalDeductions)}
                        </span>
                      </div>

                      <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                        <span className="text-slate-500 text-[11px] block">Net Payable</span>
                        <span className="text-base font-bold text-sky-700 dark:text-sky-300 font-mono tabular-nums mt-1 block">
                          {formatINR(invoice.netPayableAmount)}
                        </span>
                      </div>

                      <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                        <span className="text-slate-500 text-[11px] block">Payment Received</span>
                        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1 block">
                          {formatINR(invoice.paymentAmount)}
                        </span>
                      </div>

                      <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl col-span-2 sm:col-span-1">
                        <span className="text-slate-500 text-[11px] block">Outstanding Due</span>
                        <span
                          className={`text-base font-bold font-mono tabular-nums mt-1 block ${
                            invoice.outstandingPayment > 0.01
                              ? isOverdue
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {formatINR(invoice.outstandingPayment)}
                        </span>
                      </div>
                    </div>

                    {/* Detailed Breakdown Sections */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Section 1: Purchase Order & Goods Receipt (PO & GRN) */}
                      <div className="bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3">
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                          <Receipt className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                          <span>Purchase Order &amp; GRN Details</span>
                        </h4>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
                          <div>
                            <span className="text-slate-500 block text-[11px]">PO Number</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-slate-900 dark:text-slate-100 font-bold">
                                {invoice.poNumber || '—'}
                              </span>
                              {invoice.poNumber && (
                                <button
                                  onClick={() => handleCopy(`${invoice.id}-po`, invoice.poNumber)}
                                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                                  title="Copy PO Number"
                                >
                                  {copiedKey === `${invoice.id}-po` ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">PO Date</span>
                            <span className="text-slate-900 dark:text-slate-200 font-semibold mt-0.5 block">
                              {invoice.poDate || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">PO Amount</span>
                            <span className="text-slate-900 dark:text-slate-200 mt-0.5 block">
                              {invoice.poAmount ? formatINR(invoice.poAmount) : '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">GRN Number</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-slate-900 dark:text-slate-200 truncate block" title={invoice.grnNumber}>
                                {invoice.grnNumber || '—'}
                              </span>
                              {invoice.grnNumber && (
                                <button
                                  onClick={() => handleCopy(`${invoice.id}-grn`, invoice.grnNumber)}
                                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0"
                                  title="Copy GRN Number"
                                >
                                  {copiedKey === `${invoice.id}-grn` ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">GRN Date</span>
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold mt-0.5 block">
                              {invoice.grnDate || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Gross GRN Amount</span>
                            <span className="text-slate-900 dark:text-slate-200 mt-0.5 block">
                              {formatINR(invoice.grossGrnAmount)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Invoices Recorded</span>
                            <span className="text-slate-900 dark:text-slate-200 mt-0.5 block">
                              {formatINR(invoice.invoicesRecorded)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Status of Invoice</span>
                            <span className="text-slate-900 dark:text-slate-200 mt-0.5 block">
                              {invoice.statusOfInvoice || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Invoice Status</span>
                            <span className="text-slate-900 dark:text-slate-200 mt-0.5 block">
                              {invoice.invoiceStatus || '—'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Tax Withholding & Adjustment Breakdown */}
                      <div className="bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3">
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                          <span>Tax Withholding &amp; Deductions</span>
                        </h4>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
                          <div>
                            <span className="text-slate-500 block text-[11px]">TDS / TCS</span>
                            <span className="text-slate-900 dark:text-slate-200 mt-0.5 block">
                              {formatINR(invoice.tdsTcs)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Purchase Returns</span>
                            <span className="text-purple-700 dark:text-purple-300 font-medium mt-0.5 block">
                              {formatINR(invoice.purchaseReturnAmount)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Brand Discount (Promo)</span>
                            <span className="text-slate-900 dark:text-slate-200 mt-0.5 block">
                              {formatINR(invoice.brandDiscountPromoClaims)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Other Debit Amount</span>
                            <span className="text-slate-900 dark:text-slate-200 mt-0.5 block">
                              {formatINR(invoice.otherDebitAmount)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Other Adjustments</span>
                            <span className="text-slate-900 dark:text-slate-200 mt-0.5 block">
                              {formatINR(invoice.otherAdjustments)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Adjustment Date</span>
                            <span className="text-slate-900 dark:text-slate-200 mt-0.5 block">
                              {invoice.otherAdjustmentDate || '—'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Payment & Bank Remittance */}
                      <div className="bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3">
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                          <CreditCard className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                          <span>Payment Remittance &amp; Banking UTR</span>
                        </h4>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
                          <div>
                            <span className="text-slate-500 block text-[11px]">Payment Status</span>
                            <span className="text-slate-900 dark:text-slate-200 font-bold mt-0.5 block">
                              {invoice.paymentStatus}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Credit Period</span>
                            <span className="text-slate-900 dark:text-slate-200 mt-0.5 block">
                              {invoice.creditPeriod} days
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Overdue / Aging</span>
                            <span className="text-slate-900 dark:text-slate-200 mt-0.5 block">
                              {invoice.overdueStatus || 'Not Due'}
                              {invoice.agingBucket ? ` (${invoice.agingBucket})` : ''}
                            </span>
                          </div>
                          <div className="col-span-2 sm:col-span-3">
                            <span className="text-slate-500 block text-[11px]">Payment Reference No / Bank UTR</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-amber-700 dark:text-amber-300 font-medium select-all break-all">
                                {invoice.paymentReferenceNo || 'Awaiting bank reference'}
                              </span>
                              {invoice.paymentReferenceNo && (
                                <button
                                  onClick={() => handleCopy(`${invoice.id}-utr`, invoice.paymentReferenceNo)}
                                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0"
                                  title="Copy UTR Reference"
                                >
                                  {copiedKey === `${invoice.id}-utr` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Vendor & Legal Entity */}
                      <div className="bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-3">
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                          <Building className="w-3.5 h-3.5 text-slate-500" />
                          <span>Vendor &amp; Warehouse Details</span>
                        </h4>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
                          <div className="col-span-2 sm:col-span-3">
                            <span className="text-slate-500 block text-[11px]">Customer Organization</span>
                            <span className="text-slate-900 dark:text-slate-200 font-sans font-medium mt-0.5 block">
                              {invoice.organizationName || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Vendor Name</span>
                            <span className="text-slate-900 dark:text-slate-200 font-sans mt-0.5 block">
                              {invoice.vendorName || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Vendor Code</span>
                            <span className="text-slate-900 dark:text-slate-200 mt-0.5 block">
                              {invoice.vendorCode || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Warehouse</span>
                            <span className="text-slate-900 dark:text-slate-200 font-sans mt-0.5 block">
                              {invoice.warehouseName || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">GSTIN</span>
                            <span className="text-slate-900 dark:text-slate-200 mt-0.5 block">
                              {invoice.gstin || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">PAN</span>
                            <span className="text-slate-900 dark:text-slate-200 mt-0.5 block">
                              {invoice.pan || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">City / State</span>
                            <span className="text-slate-900 dark:text-slate-200 font-sans mt-0.5 block">
                              {[invoice.city, invoice.state].filter(Boolean).join(', ') || '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Linked Bank Remittance Records (from Point 2 Payment Report) */}
                    {linkedPayments.length > 0 && (
                      <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-xl space-y-3">
                        <h4 className="font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                          <Landmark className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Linked Bank Remittance Transactions ({linkedPayments.length})</span>
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-emerald-200 dark:border-emerald-800/60 text-[11px] text-slate-500 dark:text-slate-400">
                                <th className="py-1.5 pr-3 font-medium whitespace-nowrap">Payment No.</th>
                                <th className="py-1.5 pr-3 font-medium whitespace-nowrap">Payment Date</th>
                                <th className="py-1.5 pr-3 font-medium whitespace-nowrap">Mode</th>
                                <th className="py-1.5 pr-3 font-medium whitespace-nowrap">UTR / Reference</th>
                                <th className="py-1.5 pr-3 font-medium whitespace-nowrap">Paid Together (Invoice Numbers)</th>
                                <th className="py-1.5 pr-3 font-medium text-right whitespace-nowrap">Amount</th>
                                <th className="py-1.5 pr-3 font-medium text-right whitespace-nowrap">Reversal</th>
                                <th className="py-1.5 font-medium text-right whitespace-nowrap">Net Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-100 dark:divide-emerald-900/40 font-mono">
                              {linkedPayments.map((pmt) => {
                                const batchInvoices = getBatchInvoiceNumbers(pmt);
                                return (
                                  <tr key={pmt.id} className="align-top">
                                    <td className="py-2 pr-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                                      {pmt.paymentNumber || '—'}
                                    </td>
                                    <td className="py-2 pr-3 whitespace-nowrap">{pmt.paymentDate || '—'}</td>
                                    <td className="py-2 pr-3 whitespace-nowrap">{pmt.paymentType || 'NEFT'}</td>
                                    <td className="py-2 pr-3 text-amber-700 dark:text-amber-300 whitespace-nowrap">
                                      {pmt.paymentReferenceNo || '—'}
                                    </td>
                                    <td className="py-2 pr-3 min-w-[220px]">
                                      {batchInvoices.length > 0 ? (
                                        <div className="space-y-1">
                                          <div className="flex flex-wrap gap-1">
                                            {batchInvoices.map((invNum) => {
                                              const isCurrent = invNum.toLowerCase() === invNumLower;
                                              return (
                                                <button
                                                  key={invNum}
                                                  type="button"
                                                  onClick={() => onSearchInvoice?.(invNum)}
                                                  title={isCurrent ? 'Currently viewed invoice' : `Search details for ${invNum}`}
                                                  className={`px-1.5 py-0.5 rounded text-[11px] font-semibold border transition-colors ${
                                                    isCurrent
                                                      ? 'bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:text-slate-950 dark:border-emerald-500'
                                                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-emerald-300 dark:border-emerald-800 hover:bg-amber-50 dark:hover:bg-slate-800 hover:border-amber-400'
                                                  }`}
                                                >
                                                  {invNum}
                                                </button>
                                              );
                                            })}
                                          </div>
                                          {batchInvoices.length > 1 && (
                                            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                                              {batchInvoices.length} invoices paid together in this batch
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-slate-400">—</span>
                                      )}
                                    </td>
                                    <td className="py-2 pr-3 text-right whitespace-nowrap">{formatINR(pmt.amount)}</td>
                                    <td className="py-2 pr-3 text-right text-red-600 dark:text-red-400 whitespace-nowrap">
                                      {pmt.reversal ? formatINR(pmt.reversal) : '—'}
                                    </td>
                                    <td className="py-2 text-right font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                      {formatINR(pmt.netAmount)}
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
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
