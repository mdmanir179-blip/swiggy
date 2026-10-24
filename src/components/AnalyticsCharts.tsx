import React from 'react';
import { InvoiceRecord, FinancialSummary } from '../types';
import { getWarehouseBreakdown, getAgingBuckets } from '../utils/summaryCalculator';
import { formatINR } from '../utils/currency';
import { Building2, PieChart } from 'lucide-react';

interface AnalyticsChartsProps {
  invoices: InvoiceRecord[];
  summary: FinancialSummary;
  onSelectWarehouse?: (warehouse: string) => void;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  invoices,
  summary,
  onSelectWarehouse
}) => {
  const warehouseData = getWarehouseBreakdown(invoices).slice(0, 6);

  // Calculate highest warehouse outstanding for scaling bars
  const maxOutstanding = Math.max(...warehouseData.map(w => w.outstanding), 1);

  // Status breakdown calculations
  const totalInvoices = summary.totalInvoicesCount || 1;
  const paidPct = Math.round((summary.totalPaidInvoicesCount / totalInvoices) * 100);
  const partialPct = Math.round((summary.totalPartialInvoicesCount / totalInvoices) * 100);
  const unpaidPct = 100 - (paidPct + partialPct);

  if (invoices.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Chart 1: Warehouse-wise Outstanding Breakdown */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs flex flex-col justify-between transition-colors">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Warehouse Outstanding Exposure</h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Top Distribution Centers</span>
          </div>

          <div className="space-y-3.5">
            {warehouseData.map((wh) => {
              const barWidth = Math.min(100, Math.max(8, (wh.outstanding / maxOutstanding) * 100));
              const isHighRisk = wh.overdueAmount > 0;

              return (
                <div 
                  key={wh.warehouse} 
                  onClick={() => onSelectWarehouse && onSelectWarehouse(wh.warehouse)}
                  className="group cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors flex items-center gap-2">
                      <span>{wh.warehouse}</span>
                      <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">({wh.city})</span>
                    </span>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-slate-500 dark:text-slate-400">Total: {formatINR(wh.totalSales, true)}</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                        Due: {formatINR(wh.outstanding)}
                      </span>
                    </div>
                  </div>

                  {/* Dual Bar: Received vs Outstanding */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                    {/* Paid portion */}
                    <div 
                      className="bg-emerald-500/80 h-full transition-all" 
                      style={{ width: `${wh.totalSales > 0 ? (wh.paidAmount / wh.totalSales) * 100 : 0}%` }}
                      title={`Paid: ${formatINR(wh.paidAmount)}`}
                    />
                    {/* Overdue / Outstanding portion */}
                    <div 
                      className={`h-full transition-all ${isHighRisk ? 'bg-amber-500' : 'bg-sky-500'}`} 
                      style={{ width: `${barWidth}%` }}
                      title={`Outstanding: ${formatINR(wh.outstanding)}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Paid Amount</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>Outstanding / Overdue</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Click warehouse to filter invoices</span>
        </div>
      </div>

      {/* Chart 2: Payment Realization & Status Distribution */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs flex flex-col justify-between transition-colors">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Invoice Settlement Status</h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{summary.totalInvoicesCount} Invoices</span>
          </div>

          {/* Segmented Visual Bar */}
          <div className="h-5 w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex my-4 p-0.5 border border-slate-200 dark:border-slate-700/50">
            {paidPct > 0 && (
              <div 
                style={{ width: `${paidPct}%` }} 
                className="bg-emerald-500 h-full rounded-xs"
                title={`Fully Paid: ${summary.totalPaidInvoicesCount} (${paidPct}%)`}
              />
            )}
            {partialPct > 0 && (
              <div 
                style={{ width: `${partialPct}%` }} 
                className="bg-amber-500 h-full mx-0.5 rounded-xs"
                title={`Partially Paid: ${summary.totalPartialInvoicesCount} (${partialPct}%)`}
              />
            )}
            {unpaidPct > 0 && (
              <div 
                style={{ width: `${unpaidPct}%` }} 
                className="bg-red-500/80 h-full rounded-xs"
                title={`Unpaid: ${summary.totalUnpaidInvoicesCount} (${unpaidPct}%)`}
              />
            )}
          </div>

          {/* Metrics breakdown list */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-800 dark:text-slate-200">Fully Settled</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">{summary.totalPaidInvoicesCount}</span>
                <span className="text-slate-400 dark:text-slate-500 ml-1.5">({paidPct}%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-800 dark:text-slate-200">Partially Paid</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-amber-600 dark:text-amber-400 font-medium tabular-nums">{summary.totalPartialInvoicesCount}</span>
                <span className="text-slate-400 dark:text-slate-500 ml-1.5">({partialPct}%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-slate-800 dark:text-slate-200">Awaiting Payment</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-red-600 dark:text-red-400 font-medium tabular-nums">{summary.totalUnpaidInvoicesCount}</span>
                <span className="text-slate-400 dark:text-slate-500 ml-1.5">({unpaidPct}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Summary Footnote */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Realized Collection</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold tabular-nums">
            {formatINR(summary.totalPaidAmount)}
          </span>
        </div>
      </div>

    </div>
  );
};
