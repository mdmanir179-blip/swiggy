import React from 'react';
import { InvoiceRecord, FinancialSummary } from '../types';
import { formatINR } from '../utils/currency';
import { exportOverdueRecoveryReport } from '../utils/exporter';
import { Clock, ShieldAlert, Download, ExternalLink, Upload } from 'lucide-react';

interface AgingAnalysisViewProps {
  invoices: InvoiceRecord[];
  summary: FinancialSummary;
  onSelectInvoice: (invoice: InvoiceRecord) => void;
  onOpenUpload?: () => void;
}

export const AgingAnalysisView: React.FC<AgingAnalysisViewProps> = ({
  invoices,
  summary,
  onSelectInvoice,
  onOpenUpload
}) => {
  // Overdue invoices sorted by highest outstanding balance
  const overdueInvoices = invoices
    .filter(i => (i.overdueStatus || '').toLowerCase().includes('overdue') && i.outstandingPayment > 0)
    .sort((a, b) => b.outstandingPayment - a.outstandingPayment);

  // Group by warehouse
  const warehouseOverdue = React.useMemo(() => {
    const map = new Map<string, { warehouse: string; amount: number; count: number }>();
    for (const inv of overdueInvoices) {
      const wh = inv.warehouseName || 'Direct';
      const existing = map.get(wh) || { warehouse: wh, amount: 0, count: 0 };
      existing.amount += inv.outstandingPayment;
      existing.count += 1;
      map.set(wh, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [overdueInvoices]);

  if (invoices.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-xs">
        <Clock className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Aging & Overdue Monitor Ready</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
          Upload your Instamart invoice report to track credit terms, pinpoint overdue payments across warehouses, and generate recovery sheets.
        </p>
        {onOpenUpload && (
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded-lg text-xs transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Excel / CSV</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-red-50 dark:bg-gradient-to-r dark:from-red-950/40 dark:to-slate-900 border border-red-200 dark:border-red-900/50 p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-1">
            <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Critical Overdue Recovery Monitor</h2>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300">
            {overdueInvoices.length} invoices have surpassed their agreed 30-day Instamart payment credit period. Total overdue exposure: <strong className="text-red-700 dark:text-red-300 font-mono">{formatINR(summary.totalOverdueAmount)}</strong>.
          </p>
        </div>

        <button
          onClick={() => exportOverdueRecoveryReport(invoices)}
          disabled={overdueInvoices.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>Download Overdue Recovery Excel</span>
        </button>
      </div>

      {/* Warehouse-wise Overdue Exposure */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs transition-colors">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span>Overdue Exposure by Instamart Warehouse</span>
        </h3>

        {warehouseOverdue.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">No overdue warehouses recorded.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {warehouseOverdue.map((wh) => (
              <div key={wh.warehouse} className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-lg">
                <div className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate">{wh.warehouse}</div>
                <div className="text-lg font-bold text-red-600 dark:text-red-400 font-mono tabular-nums mt-1">
                  {formatINR(wh.amount)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  {wh.count} Overdue Invoices
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Overdue Invoices Priority Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs transition-colors">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Priority Overdue Invoices Queue</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{overdueInvoices.length} Invoices Pending Action</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-950/90 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 select-none">
                <th className="py-3 px-3 font-semibold">Invoice #</th>
                <th className="py-3 px-3 font-semibold">Warehouse</th>
                <th className="py-3 px-3 font-semibold">Due Date</th>
                <th className="py-3 px-3 font-semibold">PO Number</th>
                <th className="py-3 px-3 font-semibold text-right">Invoiced Amount</th>
                <th className="py-3 px-3 font-semibold text-right">Partial Paid</th>
                <th className="py-3 px-3 font-semibold text-right">Overdue Outstanding</th>
                <th className="py-3 px-3 font-semibold">Payment Status</th>
                <th className="py-3 px-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono text-slate-700 dark:text-slate-300">
              {overdueInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                    No overdue invoices currently pending.
                  </td>
                </tr>
              ) : (
                overdueInvoices.map((inv) => (
                  <tr 
                    key={inv.id} 
                    onClick={() => onSelectInvoice(inv)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-700 dark:text-slate-300">
                      {inv.warehouseName}
                    </td>
                    <td className="py-2.5 px-3 tabular-nums text-red-600 dark:text-red-400 font-medium">
                      {inv.dueDate}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                      {inv.poNumber}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-slate-800 dark:text-slate-300">
                      {formatINR(inv.netPayableAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                      {inv.paymentAmount > 0 ? formatINR(inv.paymentAmount) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-red-600 dark:text-red-400">
                      {formatINR(inv.outstandingPayment)}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-xs">
                      {inv.paymentAmount > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">Partially Paid</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 font-medium">Unpaid</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectInvoice(inv);
                        }}
                        className="p-1 hover:text-amber-600 dark:hover:text-amber-400 text-slate-400 transition-colors"
                        title="View Full Breakdown"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
