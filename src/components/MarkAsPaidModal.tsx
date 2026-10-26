import React, { useState, useEffect } from 'react';
import { InvoiceRecord } from '../types';
import { formatINR } from '../utils/currency';
import { CheckCircle2, X, Calendar, CreditCard, Building2, AlertCircle } from 'lucide-react';

interface MarkAsPaidModalProps {
  invoice: InvoiceRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: (
    invoiceId: string,
    paidAmount: number,
    paymentDate: string,
    paymentRef: string,
    paymentType: string
  ) => void;
  onRevertToUnpaid?: (invoiceId: string) => void;
}

export const MarkAsPaidModal: React.FC<MarkAsPaidModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onConfirmPayment,
  onRevertToUnpaid
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentType, setPaymentType] = useState<string>('NEFT');

  useEffect(() => {
    if (invoice && isOpen) {
      // Default amount to outstanding balance, or net payable if outstanding is 0
      const defaultAmount = invoice.outstandingPayment > 0 
        ? invoice.outstandingPayment 
        : invoice.netPayableAmount || 0;
      setAmount(defaultAmount);

      // Default payment date: existing lastPaymentDate or today's date formatted DD-MM-YYYY
      if (invoice.lastPaymentDate) {
        setPaymentDate(invoice.lastPaymentDate);
      } else {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        setPaymentDate(`${dd}-${mm}-${yyyy}`);
      }

      setPaymentRef(invoice.paymentReferenceNo || `UTR${Date.now().toString().slice(-8)}`);
      setPaymentType('NEFT');
    }
  }, [invoice, isOpen]);

  if (!isOpen || !invoice) return null;

  const netPayable = invoice.netPayableAmount || 0;
  const currentOutstanding = invoice.outstandingPayment;
  const isAlreadyPaid = invoice.paymentStatus === 'Paid';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Please enter a valid payment amount greater than ₹0.');
      return;
    }
    if (!paymentDate) {
      alert('Please enter a valid Last Payment Date.');
      return;
    }

    onConfirmPayment(
      invoice.id,
      amount,
      paymentDate.trim(),
      paymentRef.trim(),
      paymentType
    );
    onClose();
  };

  const handleRevert = () => {
    if (onRevertToUnpaid) {
      onRevertToUnpaid(invoice.id);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAlreadyPaid ? 'Update Payment Record' : 'Mark Invoice as Paid'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Invoice: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{invoice.invoiceNumber}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Summary Box */}
        <div className="p-4 sm:p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Net Payable</span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                {formatINR(netPayable)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Balance</span>
              <span className="font-mono font-bold text-sm text-red-600 dark:text-red-400">
                {formatINR(currentOutstanding)}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Warehouse</span>
              <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate block">
                {invoice.warehouseName || 'Direct'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Payment Amount */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Amount to Record (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={netPayable * 1.5}
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  required
                />
              </div>
              <div className="flex gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => setAmount(netPayable)}
                  className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium"
                >
                  Full Net (₹{netPayable})
                </button>
                {currentOutstanding > 0 && currentOutstanding !== netPayable && (
                  <button
                    type="button"
                    onClick={() => setAmount(currentOutstanding)}
                    className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium"
                  >
                    Remaining Balance (₹{currentOutstanding})
                  </button>
                )}
              </div>
            </div>

            {/* Last Payment Date */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Last Payment Date (DD-MM-YYYY) *</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">Shows in Software & PDF</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 15-10-2026 or 2026-10-15"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  required
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                This exact date will be displayed under "Last Payment Date" in the ledger table and PDF statement.
              </p>
            </div>

            {/* Bank Reference / UTR Number */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bank Reference No / UTR Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. HSBCN520261026 or UTR12345678"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Channel / Mode
              </label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="NEFT">NEFT (National Electronic Fund Transfer)</option>
                <option value="RTGS">RTGS (Real Time Gross Settlement)</option>
                <option value="IMPS">IMPS (Immediate Payment Service)</option>
                <option value="Portal Settlement">Instamart Portal Settlement</option>
                <option value="Bank Direct Credit">Bank Direct Credit</option>
              </select>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
              {isAlreadyPaid && onRevertToUnpaid && (
                <button
                  type="button"
                  onClick={handleRevert}
                  className="w-full sm:w-auto px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg font-medium transition-colors"
                >
                  Revert to Unpaid
                </button>
              )}
              
              <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Payment</span>
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};
