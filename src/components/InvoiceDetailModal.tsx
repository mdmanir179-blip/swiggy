import React from 'react';
import { InvoiceRecord } from '../types';
import { formatINR } from '../utils/currency';
import { 
  X, 
  FileText, 
  Building, 
  CreditCard, 
  Receipt, 
  ShieldCheck, 
  Copy,
  Calendar,
  Clock
} from 'lucide-react';

interface InvoiceDetailModalProps {
  invoice: InvoiceRecord | null;
  onClose: () => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  onClose
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!invoice) return null;

  const copyRef = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isOverdue = (invoice.overdueStatus || '').toLowerCase().includes('overdue');
  const isPaid = invoice.paymentStatus === 'Paid' || invoice.outstandingPayment <= 0.01;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono">{invoice.invoiceNumber}</h3>
                <span className={`text-[11px] font-sans px-2 py-0.5 rounded font-medium ${
                  isPaid ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
                  isOverdue ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800' :
                  'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                }`}>
                  {invoice.paymentStatus}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                <span>{invoice.warehouseName}</span>
                <span aria-hidden="true">·</span>
                <span>{invoice.city || 'Metro Hub'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-slate-700 dark:text-slate-300">
          
          {/* Key Dates Highlights Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60">
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
                <Calendar className="w-3 h-3 text-emerald-500" />
                <span>GRN Date</span>
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-xs mt-0.5 block">
                {invoice.grnDate || '—'}
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

            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>Due Date</span>
              </span>
              <span className="font-bold text-slate-900 dark:text-white font-mono text-xs mt-0.5 block">
                {invoice.dueDate || '—'}
              </span>
            </div>
          </div>

          {/* Key Amount Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg">
              <span className="text-slate-500 text-[11px] block">Gross Invoiced</span>
              <span className="text-base font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1 block">
                {formatINR(invoice.invoicesRecorded || invoice.grossGrnAmount)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg">
              <span className="text-slate-500 text-[11px] block">Total Deductions</span>
              <span className="text-base font-bold text-purple-600 dark:text-purple-400 font-mono tabular-nums mt-1 block">
                -{formatINR(invoice.totalDeductions)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg">
              <span className="text-slate-500 text-[11px] block">Net Payable</span>
              <span className="text-base font-bold text-sky-700 dark:text-sky-300 font-mono tabular-nums mt-1 block">
                {formatINR(invoice.netPayableAmount)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg">
              <span className="text-slate-500 text-[11px] block">Outstanding Due</span>
              <span className={`text-base font-bold font-mono tabular-nums mt-1 block ${
                invoice.outstandingPayment > 0 ? (isOverdue ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400') : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {formatINR(invoice.outstandingPayment)}
              </span>
            </div>
          </div>

          {/* Section 1: Invoicing & Purchase Order (PO & GRN) */}
          <div className="bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 rounded-lg space-y-3">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Receipt className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>Purchase Order & Goods Receipt (GRN) Details</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
              <div>
                <span className="text-slate-500 block text-[11px]">PO Number</span>
                <span className="text-slate-900 dark:text-slate-200 font-medium">{invoice.poNumber || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">PO Date</span>
                <span className="text-slate-900 dark:text-slate-200 font-semibold">{invoice.poDate || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">PO Amount</span>
                <span className="text-slate-900 dark:text-slate-200">{invoice.poAmount ? formatINR(invoice.poAmount) : '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">GRN Number</span>
                <span className="text-slate-900 dark:text-slate-200 truncate block" title={invoice.grnNumber}>{invoice.grnNumber || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">GRN Date</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">{invoice.grnDate || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Gross GRN Amount</span>
                <span className="text-slate-900 dark:text-slate-200">{formatINR(invoice.grossGrnAmount)}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Deductions Breakdown */}
          <div className="bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 rounded-lg space-y-3">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
              <span>Tax Withholding & Adjustment Breakdown</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
              <div>
                <span className="text-slate-500 block text-[11px]">TDS / TCS</span>
                <span className="text-slate-900 dark:text-slate-200">{formatINR(invoice.tdsTcs)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Purchase Returns</span>
                <span className="text-purple-700 dark:text-purple-300 font-medium">{formatINR(invoice.purchaseReturnAmount)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Brand Discount (Promo)</span>
                <span className="text-slate-900 dark:text-slate-200">{formatINR(invoice.brandDiscountPromoClaims)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Other Debit Amount</span>
                <span className="text-slate-900 dark:text-slate-200">{formatINR(invoice.otherDebitAmount)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Other Adjustments</span>
                <span className="text-slate-900 dark:text-slate-200">{formatINR(invoice.otherAdjustments)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Adjustment Date</span>
                <span className="text-slate-900 dark:text-slate-200">{invoice.otherAdjustmentDate || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Payment & Bank Remittance */}
          <div className="bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 rounded-lg space-y-3">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <CreditCard className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Payment Remittance & Banking UTR</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
              <div>
                <span className="text-slate-500 block text-[11px]">Payment Received</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatINR(invoice.paymentAmount)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Last Payment Date</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">{invoice.lastPaymentDate || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Due Date (Credit Period)</span>
                <span className="text-slate-900 dark:text-slate-200">{invoice.dueDate} ({invoice.creditPeriod} days)</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block text-[11px]">Payment Reference No / Bank UTR</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-amber-700 dark:text-amber-300 font-medium select-all">
                    {invoice.paymentReferenceNo || 'Awaiting bank reference'}
                  </span>
                  {invoice.paymentReferenceNo && (
                    <button
                      onClick={() => copyRef(invoice.paymentReferenceNo)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                      title="Copy UTR Reference"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                  {copied && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans">Copied!</span>}
                </div>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Invoice Status</span>
                <span className="text-slate-900 dark:text-slate-200">{invoice.invoiceStatus}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Vendor & Legal Entity */}
          <div className="bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 rounded-lg space-y-3">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <span>Vendor & Organization Identification</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
              <div>
                <span className="text-slate-500 block text-[11px]">Customer Org</span>
                <span className="text-slate-900 dark:text-slate-200 font-sans truncate block">{invoice.organizationName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Vendor Name (Code)</span>
                <span className="text-slate-900 dark:text-slate-200 font-sans">{invoice.vendorName} ({invoice.vendorCode})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">GSTIN</span>
                <span className="text-slate-900 dark:text-slate-200">{invoice.gstin}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">PAN</span>
                <span className="text-slate-900 dark:text-slate-200">{invoice.pan}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">State / Region</span>
                <span className="text-slate-900 dark:text-slate-200">{invoice.state || 'India'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-mono">
            Net Payable: <strong className="text-slate-900 dark:text-white">{formatINR(invoice.netPayableAmount)}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
