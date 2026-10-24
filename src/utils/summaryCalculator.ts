import { InvoiceRecord, PaymentRecord, FinancialSummary } from '../types';

export function calculateFinancialSummary(invoices: InvoiceRecord[]): FinancialSummary {
  let totalGrossSales = 0;
  let totalNetPayable = 0;
  let totalPaidAmount = 0;
  let totalOutstanding = 0;
  let totalOverdueAmount = 0;
  let totalOverdueCount = 0;
  let totalPendingNotDueAmount = 0;
  let totalPendingNotDueCount = 0;

  let totalPaidInvoicesCount = 0;
  let totalPartialInvoicesCount = 0;
  let totalUnpaidInvoicesCount = 0;

  let totalTdsTcs = 0;
  let totalPurchaseReturns = 0;
  let totalPromoClaims = 0;
  let totalOtherDebits = 0;
  let totalAdjustments = 0;

  for (const inv of invoices) {
    const recorded = inv.invoicesRecorded || inv.grossGrnAmount || 0;
    const net = inv.netPayableAmount || 0;
    const paid = inv.paymentAmount || 0;
    const outstanding = inv.outstandingPayment || 0;

    totalGrossSales += recorded;
    totalNetPayable += net;
    totalPaidAmount += paid;
    totalOutstanding += outstanding;

    totalTdsTcs += inv.tdsTcs || 0;
    totalPurchaseReturns += inv.purchaseReturnAmount || 0;
    totalPromoClaims += inv.brandDiscountPromoClaims || 0;
    totalOtherDebits += inv.otherDebitAmount || 0;
    totalAdjustments += inv.otherAdjustments || 0;

    // Check payment status
    const pStatus = (inv.paymentStatus || '').toLowerCase();
    if (pStatus === 'paid' || (outstanding <= 0.01 && paid > 0)) {
      totalPaidInvoicesCount++;
    } else if (pStatus === 'partially paid' || (paid > 0 && outstanding > 0)) {
      totalPartialInvoicesCount++;
    } else {
      totalUnpaidInvoicesCount++;
    }

    // Check overdue vs not due
    const oStatus = (inv.overdueStatus || '').toLowerCase();
    if (oStatus.includes('overdue')) {
      totalOverdueAmount += outstanding;
      totalOverdueCount++;
    } else if (oStatus.includes('not due') || oStatus.includes('no due')) {
      if (outstanding > 0) {
        totalPendingNotDueAmount += outstanding;
        totalPendingNotDueCount++;
      }
    } else if (outstanding > 0) {
      totalOverdueAmount += outstanding;
      totalOverdueCount++;
    }
  }

  const totalDeductionsCombined = totalTdsTcs + totalPurchaseReturns + totalPromoClaims + totalOtherDebits + totalAdjustments;
  const paymentRealizationRate = totalNetPayable > 0 ? (totalPaidAmount / totalNetPayable) * 100 : 0;
  const overdueExposureRate = totalOutstanding > 0 ? (totalOverdueAmount / totalOutstanding) * 100 : 0;

  return {
    totalInvoicesCount: invoices.length,
    totalGrossSales: Math.round(totalGrossSales * 100) / 100,
    totalNetPayable: Math.round(totalNetPayable * 100) / 100,
    totalPaidAmount: Math.round(totalPaidAmount * 100) / 100,
    totalOutstanding: Math.round(totalOutstanding * 100) / 100,
    totalOverdueAmount: Math.round(totalOverdueAmount * 100) / 100,
    totalOverdueCount,
    totalPendingNotDueAmount: Math.round(totalPendingNotDueAmount * 100) / 100,
    totalPendingNotDueCount,
    totalPaidInvoicesCount,
    totalPartialInvoicesCount,
    totalUnpaidInvoicesCount,
    totalTdsTcs: Math.round(totalTdsTcs * 100) / 100,
    totalPurchaseReturns: Math.round(totalPurchaseReturns * 100) / 100,
    totalPromoClaims: Math.round(totalPromoClaims * 100) / 100,
    totalOtherDebits: Math.round(totalOtherDebits * 100) / 100,
    totalAdjustments: Math.round(totalAdjustments * 100) / 100,
    totalDeductionsCombined: Math.round(totalDeductionsCombined * 100) / 100,
    paymentRealizationRate: Math.round(paymentRealizationRate * 10) / 10,
    overdueExposureRate: Math.round(overdueExposureRate * 10) / 10
  };
}

export interface WarehouseBreakdown {
  warehouse: string;
  city: string;
  invoiceCount: number;
  totalSales: number;
  netPayable: number;
  paidAmount: number;
  outstanding: number;
  overdueAmount: number;
}

export function getWarehouseBreakdown(invoices: InvoiceRecord[]): WarehouseBreakdown[] {
  const map = new Map<string, WarehouseBreakdown>();

  for (const inv of invoices) {
    const key = inv.warehouseName || 'Direct / Head Office';
    const existing = map.get(key) || {
      warehouse: key,
      city: inv.city || 'Metro Hub',
      invoiceCount: 0,
      totalSales: 0,
      netPayable: 0,
      paidAmount: 0,
      outstanding: 0,
      overdueAmount: 0
    };

    existing.invoiceCount += 1;
    existing.totalSales += inv.invoicesRecorded || 0;
    existing.netPayable += inv.netPayableAmount || 0;
    existing.paidAmount += inv.paymentAmount || 0;
    existing.outstanding += inv.outstandingPayment || 0;
    if ((inv.overdueStatus || '').toLowerCase().includes('overdue')) {
      existing.overdueAmount += inv.outstandingPayment || 0;
    }

    map.set(key, existing);
  }

  return Array.from(map.values()).sort((a, b) => b.outstanding - a.outstanding);
}

export interface AgingBucketSummary {
  name: string;
  amount: number;
  count: number;
  color: string;
}

export function getAgingBuckets(invoices: InvoiceRecord[]): AgingBucketSummary[] {
  let overdue30 = 0;
  let overdue30Count = 0;
  let overdue60 = 0;
  let overdue60Count = 0;
  let overdue90Plus = 0;
  let overdue90PlusCount = 0;
  let notDue = 0;
  let notDueCount = 0;
  let paid = 0;
  let paidCount = 0;

  for (const inv of invoices) {
    if (inv.paymentStatus === 'Paid' || inv.outstandingPayment <= 0.01) {
      paid += inv.netPayableAmount;
      paidCount++;
      continue;
    }

    const isOverdue = (inv.overdueStatus || '').toLowerCase().includes('overdue');
    if (!isOverdue) {
      notDue += inv.outstandingPayment;
      notDueCount++;
      continue;
    }

    // Categorize overdue invoices
    // Use credit period or default buckets
    if (inv.invoiceAccountingDate?.includes('07-2026') || inv.invoiceAccountingDate?.includes('06-2026')) {
      overdue60 += inv.outstandingPayment;
      overdue60Count++;
    } else if (inv.invoiceAccountingDate?.includes('05-2026') || inv.invoiceAccountingDate?.includes('04-2026') || inv.invoiceAccountingDate?.includes('03-2026')) {
      overdue90Plus += inv.outstandingPayment;
      overdue90PlusCount++;
    } else {
      overdue30 += inv.outstandingPayment;
      overdue30Count++;
    }
  }

  return [
    { name: 'Not Due (Current)', amount: Math.round(notDue), count: notDueCount, color: '#38bdf8' },
    { name: '1 - 30 Days Overdue', amount: Math.round(overdue30), count: overdue30Count, color: '#fbbf24' },
    { name: '31 - 60 Days Overdue', amount: Math.round(overdue60), count: overdue60Count, color: '#f97316' },
    { name: '60+ Days Overdue', amount: Math.round(overdue90Plus), count: overdue90PlusCount, color: '#ef4444' },
    { name: 'Fully Settled / Paid', amount: Math.round(paid), count: paidCount, color: '#10b981' }
  ];
}
