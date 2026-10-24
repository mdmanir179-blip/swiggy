import React from 'react';
import { FinancialSummary } from '../types';
import { formatINR } from '../utils/currency';
import { 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Receipt, 
  ShieldAlert, 
  Percent
} from 'lucide-react';

interface MetricCardsProps {
  summary: FinancialSummary;
  onFilterOverdue?: () => void;
  onFilterNotDue?: () => void;
  onFilterPaid?: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  summary,
  onFilterOverdue,
  onFilterNotDue,
  onFilterPaid
}) => {
  return (
    <div className="space-y-4">
      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Sales / Gross Invoiced */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Gross Sales</span>
            <Receipt className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono tabular-nums">
            {formatINR(summary.totalGrossSales)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{summary.totalInvoicesCount} Invoices Recorded</span>
            <span className="text-sky-600 dark:text-sky-400 font-mono">Gross Invoiced</span>
          </div>
        </div>

        {/* Card 2: Net Payable Amount */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Payable Amount</span>
            <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono tabular-nums">
            {formatINR(summary.totalNetPayable)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>After Deductions & Returns</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-mono">
              -{formatINR(summary.totalDeductionsCombined, true)}
            </span>
          </div>
        </div>

        {/* Card 3: Total Paid / Realized */}
        <div 
          onClick={onFilterPaid}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs hover:border-emerald-500/50 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Received / Paid</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            {formatINR(summary.totalPaidAmount)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{summary.totalPaidInvoicesCount} Paid · {summary.totalPartialInvoicesCount} Partial</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">
              {summary.paymentRealizationRate}% Realized
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, summary.paymentRealizationRate)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Total Outstanding Balance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Outstanding</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono tabular-nums">
            {formatINR(summary.totalOutstanding)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Pending Clearance</span>
            <span className="text-amber-600 dark:text-amber-400 font-mono">
              {summary.totalInvoicesCount - summary.totalPaidInvoicesCount} Unsettled
            </span>
          </div>
        </div>

      </div>

      {/* Secondary Status & Deduction Breakdown Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Sub-Card 1: Overdue Amount */}
        <div 
          onClick={onFilterOverdue}
          className="bg-red-50/80 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-4 rounded-xl hover:border-red-400 dark:hover:border-red-600/60 cursor-pointer transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between text-red-700 dark:text-red-400 mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>Critical Overdue</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 font-mono font-medium">
              {summary.totalOverdueCount} Invoices
            </span>
          </div>
          <div className="text-xl font-bold text-red-700 dark:text-red-300 font-mono tabular-nums">
            {formatINR(summary.totalOverdueAmount)}
          </div>
          <p className="text-xs text-red-600/90 dark:text-red-400/80 mt-2 flex items-center justify-between">
            <span>Payment date passed 30 days</span>
            <span className="font-mono text-red-800 dark:text-red-300 font-medium">{summary.overdueExposureRate}% of balance</span>
          </p>
        </div>

        {/* Sub-Card 2: Pending (Not Due) */}
        <div 
          onClick={onFilterNotDue}
          className="bg-sky-50/80 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/50 p-4 rounded-xl hover:border-sky-400 dark:hover:border-sky-600/60 cursor-pointer transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between text-sky-700 dark:text-sky-400 mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
              <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Current Pending (Not Due)</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300 font-mono font-medium">
              {summary.totalPendingNotDueCount} Invoices
            </span>
          </div>
          <div className="text-xl font-bold text-sky-700 dark:text-sky-300 font-mono tabular-nums">
            {formatINR(summary.totalPendingNotDueAmount)}
          </div>
          <p className="text-xs text-sky-600/90 dark:text-sky-400/80 mt-2 flex items-center justify-between">
            <span>Within credit term</span>
            <span className="font-mono text-sky-800 dark:text-sky-300 font-medium">Current Cycle</span>
          </p>
        </div>

        {/* Sub-Card 3: Total Deductions & Adjustments */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
              <Percent className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Deductions & Returns</span>
            </div>
            <span className="text-[11px] font-mono text-purple-700 dark:text-purple-300 font-medium">
              {summary.totalGrossSales > 0 ? ((summary.totalDeductionsCombined / summary.totalGrossSales) * 100).toFixed(1) : 0}% of Sales
            </span>
          </div>
          <div className="text-xl font-bold text-purple-700 dark:text-purple-300 font-mono tabular-nums">
            {formatINR(summary.totalDeductionsCombined)}
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 font-mono">
            <span>Returns: {formatINR(summary.totalPurchaseReturns, true)}</span>
            <span>TDS/TCS: {formatINR(summary.totalTdsTcs, true)}</span>
            <span>Promo: {formatINR(summary.totalPromoClaims, true)}</span>
            <span>Debits: {formatINR(summary.totalOtherDebits + summary.totalAdjustments, true)}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
