import React, { useState, useMemo } from 'react';
import { PaymentRecord, InvoiceRecord } from '../types';
import { formatINR } from '../utils/currency';
import { Search, CreditCard, ArrowDownRight, CheckCircle2, ShieldCheck, Download, X } from 'lucide-react';
import { exportPaymentsToExcel } from '../utils/exporter';

interface PaymentReportTableProps {
  payments: PaymentRecord[];
  invoices: InvoiceRecord[];
  onSelectInvoiceNumber?: (invoiceNumber: string) => void;
  onOpenUpload?: () => void;
}

export const PaymentReportTable: React.FC<PaymentReportTableProps> = ({
  payments,
  invoices,
  onSelectInvoiceNumber,
  onOpenUpload
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Total summary of payment transactions
  const totals = useMemo(() => {
    let gross = 0;
    let reversals = 0;
    let net = 0;
    for (const p of payments) {
      gross += p.amount || 0;
      reversals += p.reversal || 0;
      net += p.netAmount || 0;
    }
    return { gross, reversals, net, count: payments.length };
  }, [payments]);

  // Enhanced Filter: UTR, Date, Vendor Name, Linked Invoice, Payment Number
  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return payments;
    const q = searchQuery.toLowerCase().trim();
    return payments.filter(p => {
      const matchUtr = p.paymentReferenceNo && p.paymentReferenceNo.toLowerCase().includes(q);
      const matchDate = p.paymentDate && p.paymentDate.toLowerCase().includes(q);
      const matchVendor = (p.vendorName && p.vendorName.toLowerCase().includes(q)) || (p.vendorCode && p.vendorCode.toLowerCase().includes(q));
      const matchPayNum = p.paymentNumber && p.paymentNumber.toLowerCase().includes(q);
      const matchType = p.paymentType && p.paymentType.toLowerCase().includes(q);
      const matchInvoices = p.linkedInvoices && p.linkedInvoices.some(inv => inv.toLowerCase().includes(q));

      // Also check if any warehouse matches linked invoices
      const matchWarehouse = invoices.some(inv => 
        (inv.warehouseName && inv.warehouseName.toLowerCase().includes(q)) &&
        p.linkedInvoices && p.linkedInvoices.includes(inv.invoiceNumber)
      );

      return matchUtr || matchDate || matchVendor || matchPayNum || matchType || matchInvoices || matchWarehouse;
    });
  }, [payments, invoices, searchQuery]);

  return (
    <div className="space-y-4">
      
      {/* Point 2 Header Banner & Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1 text-xs">
            <span>Payment Batches</span>
            <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono">{totals.count} Transactions</div>
          <div className="text-[11px] text-slate-500 mt-1">Bank Remittance Slips</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1 text-xs">
            <span>Gross Disbursed</span>
            <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-xl font-bold text-sky-600 dark:text-sky-400 font-mono tabular-nums">
            {formatINR(totals.gross)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Total Remitted by Instamart</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1 text-xs">
            <span>Reversals / Bounces</span>
            <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-xl font-bold text-red-600 dark:text-red-400 font-mono tabular-nums">
            {formatINR(totals.reversals)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Cancelled Transactions</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1 text-xs">
            <span>Net Bank Credit</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            {formatINR(totals.net)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Actual Bank Deposits</div>
        </div>

      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs transition-colors">
        
        {/* Controls: Search Bar for Payments */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/80">
          <div className="relative flex-1 max-w-lg w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by UTR / Ref No, Payment Date, Vendor, Invoice #..."
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => exportPaymentsToExcel(payments)}
            disabled={payments.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Export Payment Report (.xlsx)</span>
          </button>
        </div>

        {/* Table view with all 13 Point 2 columns */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-950/90 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 select-none">
                <th className="py-3 px-3 font-semibold whitespace-nowrap">Payment Ref No (UTR)</th>
                <th className="py-3 px-3 font-semibold whitespace-nowrap">Payment Date</th>
                <th className="py-3 px-3 font-semibold whitespace-nowrap">Payment Number</th>
                <th className="py-3 px-3 font-semibold whitespace-nowrap">Payment Type</th>
                <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">Amount</th>
                <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">Reversal</th>
                <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">Net Amount</th>
                <th className="py-3 px-3 font-semibold whitespace-nowrap">Linked Invoices</th>
                <th className="py-3 px-3 font-semibold whitespace-nowrap">Vendor Name & Type</th>
                <th className="py-3 px-3 font-semibold whitespace-nowrap">Organization & GST</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono text-slate-700 dark:text-slate-300">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 font-sans">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CreditCard className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {payments.length === 0 ? 'No payment records available' : 'No matching payment records found'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {payments.length === 0 
                          ? 'Upload a Payment Report Excel or CSV file to view bank transactions' 
                          : 'Try searching by a different UTR number, date, vendor, or invoice number.'}
                      </p>
                      {payments.length === 0 && onOpenUpload && (
                        <button
                          onClick={onOpenUpload}
                          className="mt-2 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-lg text-xs"
                        >
                          Upload Payment Report
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((pmt) => (
                  <tr key={pmt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    
                    {/* Payment Ref */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-semibold text-amber-700 dark:text-amber-400 select-all">
                        {pmt.paymentReferenceNo}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400 tabular-nums">
                      {pmt.paymentDate || '—'}
                    </td>

                    {/* Payment Number */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-800 dark:text-slate-300">
                      {pmt.paymentNumber}
                    </td>

                    {/* Payment Type */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-sans text-slate-700 dark:text-slate-300">
                      {pmt.paymentType}
                    </td>

                    {/* Amount */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap tabular-nums text-slate-900 dark:text-slate-100 font-semibold">
                      {formatINR(pmt.amount)}
                    </td>

                    {/* Reversal */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap tabular-nums">
                      {pmt.reversal > 0 ? (
                        <span className="text-red-600 dark:text-red-400">-{formatINR(pmt.reversal)}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">₹0.00</span>
                      )}
                    </td>

                    {/* Net Amount */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                      {formatINR(pmt.netAmount)}
                    </td>

                    {/* Linked Invoices */}
                    <td className="py-2.5 px-3 font-sans">
                      {pmt.linkedInvoices && pmt.linkedInvoices.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {pmt.linkedInvoices.map((invNum) => (
                            <button
                              key={invNum}
                              onClick={() => onSelectInvoiceNumber && onSelectInvoiceNumber(invNum)}
                              className="text-[11px] font-mono text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 underline decoration-slate-400 dark:decoration-slate-600 mr-1"
                            >
                              {invNum}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-xs">Unmatched</span>
                      )}
                    </td>

                    {/* Vendor Name & Type */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-sans text-slate-700 dark:text-slate-300">
                      <div className="font-medium">{pmt.vendorName}</div>
                      <div className="text-[11px] text-slate-500">{pmt.tradeVendorType}</div>
                    </td>

                    {/* Org */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-sans text-[11px] text-slate-600 dark:text-slate-400">
                      <div>{pmt.organizationName}</div>
                      <div className="font-mono text-slate-500">GST: {pmt.gstin}</div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
          <span>Showing {filteredPayments.length} of {payments.length} payment records</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
            Net Realized: {formatINR(totals.net)}
          </span>
        </div>

      </div>
    </div>
  );
};
