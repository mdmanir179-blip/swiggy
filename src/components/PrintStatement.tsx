import React from 'react';
import { InvoiceRecord, FinancialSummary, PaymentRecord } from '../types';
import { formatINR } from '../utils/currency';

interface PrintStatementProps {
  invoices: InvoiceRecord[];
  payments: PaymentRecord[];
  summary: FinancialSummary;
}

export const PrintStatement: React.FC<PrintStatementProps> = ({
  invoices,
  payments,
  summary
}) => {
  const sampleInv = invoices[0] || {} as InvoiceRecord;

  return (
    <div className="hidden print:block p-8 bg-white text-slate-900 text-xs font-sans">
      
      {/* Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-950 uppercase">
            Instamart Vendor Payment Statement
          </h1>
          <p className="text-slate-600 text-xs mt-1">
            Reconciled Accounts & Remittance Summary
          </p>
        </div>
        <div className="text-right text-[11px] text-slate-600">
          <div>Generated On: {new Date().toLocaleDateString('en-IN')}</div>
          <div>Currency: Indian Rupee (INR - ₹)</div>
        </div>
      </div>

      {/* Parties Information */}
      <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 border border-slate-200 rounded mb-6">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500">Customer Entity</span>
          <div className="font-bold text-sm text-slate-900">{sampleInv.organizationName || 'SCOOTSY LOGISTICS PRIVATE LIMITED'}</div>
          <div className="text-slate-600 text-xs">Instamart B2B Quick Commerce Supply</div>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500">Vendor Entity</span>
          <div className="font-bold text-sm text-slate-900">{sampleInv.vendorName || 'The Brothers and Co'}</div>
          <div className="font-mono text-xs text-slate-700">Vendor Code: {sampleInv.vendorCode}</div>
          <div className="font-mono text-xs text-slate-700">GSTIN: {sampleInv.gstin} · PAN: {sampleInv.pan}</div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="p-3 border border-slate-200 rounded bg-slate-50">
          <span className="text-slate-500 text-[10px] block">Total Gross Invoiced</span>
          <span className="font-bold font-mono text-sm block mt-1">{formatINR(summary.totalGrossSales)}</span>
        </div>
        <div className="p-3 border border-slate-200 rounded bg-slate-50">
          <span className="text-slate-500 text-[10px] block">Net Payable Amount</span>
          <span className="font-bold font-mono text-sm block mt-1">{formatINR(summary.totalNetPayable)}</span>
        </div>
        <div className="p-3 border border-slate-200 rounded bg-slate-50">
          <span className="text-slate-500 text-[10px] block">Total Realized / Paid</span>
          <span className="font-bold font-mono text-sm text-emerald-700 block mt-1">{formatINR(summary.totalPaidAmount)}</span>
        </div>
        <div className="p-3 border border-slate-200 rounded bg-slate-50">
          <span className="text-slate-500 text-[10px] block">Total Outstanding Balance</span>
          <span className="font-bold font-mono text-sm text-amber-700 block mt-1">{formatINR(summary.totalOutstanding)}</span>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="mb-6">
        <h3 className="font-bold text-xs uppercase mb-2 text-slate-800">Invoices & Settlement Ledger</h3>
        <table className="w-full text-left border-collapse text-[10px]">
          <thead>
            <tr className="bg-slate-100 border-y border-slate-300">
              <th className="py-1.5 px-2">Invoice #</th>
              <th className="py-1.5 px-2">Date</th>
              <th className="py-1.5 px-2">Warehouse</th>
              <th className="py-1.5 px-2">PO #</th>
              <th className="py-1.5 px-2 text-right">Gross (₹)</th>
              <th className="py-1.5 px-2 text-right">Net (₹)</th>
              <th className="py-1.5 px-2 text-right">Paid (₹)</th>
              <th className="py-1.5 px-2 text-right">Balance (₹)</th>
              <th className="py-1.5 px-2">Due Date</th>
              <th className="py-1.5 px-2">Last Payment Date</th>
              <th className="py-1.5 px-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono">
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="py-1 px-2 font-semibold">{inv.invoiceNumber}</td>
                <td className="py-1 px-2">{inv.invoiceAccountingDate}</td>
                <td className="py-1 px-2 font-sans">{inv.warehouseName}</td>
                <td className="py-1 px-2">{inv.poNumber}</td>
                <td className="py-1 px-2 text-right">{formatINR(inv.invoicesRecorded || inv.grossGrnAmount)}</td>
                <td className="py-1 px-2 text-right font-bold">{formatINR(inv.netPayableAmount)}</td>
                <td className="py-1 px-2 text-right text-emerald-800">{formatINR(inv.paymentAmount)}</td>
                <td className="py-1 px-2 text-right font-bold">{formatINR(inv.outstandingPayment)}</td>
                <td className="py-1 px-2">{inv.dueDate || '—'}</td>
                <td className="py-1 px-2 font-bold text-emerald-800">{inv.lastPaymentDate || '—'}</td>
                <td className="py-1 px-2 font-sans capitalize">{inv.paymentStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Notes */}
      <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-500 flex justify-between">
        <span>Instamart Payment Tracker · Autonomous Vendor Accounting</span>
        <span>Reconciled with bank remittance reference records</span>
      </div>

    </div>
  );
};
