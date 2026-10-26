import React, { useState, useEffect } from 'react';
import { InvoiceRecord } from '../types';
import { formatINR } from '../utils/currency';
import { PlusCircle, X, Calendar, FileText, Building2, CreditCard, Check, Calculator } from 'lucide-react';

interface AddInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveInvoice: (invoice: InvoiceRecord) => void;
  initialInvoice?: InvoiceRecord | null;
  defaultVendorName?: string;
  defaultVendorCode?: string;
}

const COMMON_WAREHOUSES = [
  'BLR-KRP-01 (Bengaluru)',
  'DEL-OKH-02 (New Delhi)',
  'BOM-BND-01 (Mumbai)',
  'HYD-HIT-01 (Hyderabad)',
  'CCU-NEW-01 (Kolkata)',
  'MAA-AMB-01 (Chennai)',
  'PNQ-HIN-01 (Pune)',
  'AMD-CHA-01 (Ahmedabad)',
];

export const AddInvoiceModal: React.FC<AddInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSaveInvoice,
  initialInvoice,
  defaultVendorName = 'The Brothers and Co',
  defaultVendorCode = '1N96368405'
}) => {
  const getTodayFormatted = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const getFutureDateFormatted = (daysAhead: number = 30) => {
    const future = new Date();
    future.setDate(future.getDate() + daysAhead);
    const dd = String(future.getDate()).padStart(2, '0');
    const mm = String(future.getMonth() + 1).padStart(2, '0');
    const yyyy = future.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  // Form states
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(getTodayFormatted());
  const [poNumber, setPoNumber] = useState('');
  const [grnNumber, setGrnNumber] = useState('');
  const [warehouseName, setWarehouseName] = useState('BLR-KRP-01 (Bengaluru)');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  
  // Amounts
  const [grossAmount, setGrossAmount] = useState<number>(0);
  const [tdsTcs, setTdsTcs] = useState<number>(0);
  const [purchaseReturn, setPurchaseReturn] = useState<number>(0);
  const [promoClaims, setPromoClaims] = useState<number>(0);
  const [otherDebits, setOtherDebits] = useState<number>(0);
  const [otherAdjustments, setOtherAdjustments] = useState<number>(0);
  
  // Payment
  const [paymentStatus, setPaymentStatus] = useState<string>('Unpaid');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [lastPaymentDate, setLastPaymentDate] = useState<string>('');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [dueDate, setDueDate] = useState(getFutureDateFormatted(30));
  const [creditPeriod, setCreditPeriod] = useState<number>(30);

  // Computed live
  const totalDeductions = tdsTcs + purchaseReturn + promoClaims + otherDebits + otherAdjustments;
  const netPayable = Math.max(0, grossAmount - totalDeductions);
  const outstanding = Math.max(0, netPayable - paymentAmount);

  useEffect(() => {
    if (initialInvoice && isOpen) {
      setInvoiceNumber(initialInvoice.invoiceNumber || '');
      setInvoiceDate(initialInvoice.invoiceAccountingDate || getTodayFormatted());
      setPoNumber(initialInvoice.poNumber || '');
      setGrnNumber(initialInvoice.grnNumber || '');
      setWarehouseName(initialInvoice.warehouseName || 'BLR-KRP-01 (Bengaluru)');
      setCity(initialInvoice.city || '');
      setState(initialInvoice.state || '');
      setGrossAmount(initialInvoice.invoicesRecorded || initialInvoice.grossGrnAmount || 0);
      setTdsTcs(initialInvoice.tdsTcs || 0);
      setPurchaseReturn(initialInvoice.purchaseReturnAmount || 0);
      setPromoClaims(initialInvoice.brandDiscountPromoClaims || 0);
      setOtherDebits(initialInvoice.otherDebitAmount || 0);
      setOtherAdjustments(initialInvoice.otherAdjustments || 0);
      setPaymentStatus(initialInvoice.paymentStatus || 'Unpaid');
      setPaymentAmount(initialInvoice.paymentAmount || 0);
      setLastPaymentDate(initialInvoice.lastPaymentDate || '');
      setPaymentRef(initialInvoice.paymentReferenceNo || '');
      setDueDate(initialInvoice.dueDate || getFutureDateFormatted(30));
      setCreditPeriod(initialInvoice.creditPeriod || 30);
    } else if (isOpen) {
      // New invoice defaults
      setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
      setInvoiceDate(getTodayFormatted());
      setPoNumber(`PO-${Date.now().toString().slice(-6)}`);
      setGrnNumber(`GRN-${Date.now().toString().slice(-6)}`);
      setGrossAmount(25000);
      setTdsTcs(250);
      setPurchaseReturn(0);
      setPromoClaims(0);
      setOtherDebits(0);
      setOtherAdjustments(0);
      setPaymentStatus('Unpaid');
      setPaymentAmount(0);
      setLastPaymentDate('');
      setPaymentRef('');
      setDueDate(getFutureDateFormatted(30));
      setCreditPeriod(30);
    }
  }, [initialInvoice, isOpen]);

  // Handle status change
  const handleStatusChange = (newStatus: string) => {
    setPaymentStatus(newStatus);
    if (newStatus === 'Paid') {
      setPaymentAmount(netPayable);
      if (!lastPaymentDate) setLastPaymentDate(getTodayFormatted());
      if (!paymentRef) setPaymentRef(`UTR${Date.now().toString().slice(-8)}`);
    } else if (newStatus === 'Unpaid') {
      setPaymentAmount(0);
      setLastPaymentDate('');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) {
      alert('Please enter an Invoice Number');
      return;
    }
    if (grossAmount <= 0) {
      alert('Gross Amount must be greater than 0');
      return;
    }

    const calculatedOverdueStatus = outstanding <= 0 
      ? 'No due' 
      : 'Not Due';

    const newInvoice: InvoiceRecord = {
      id: initialInvoice?.id || `inv-manual-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      organizationName: initialInvoice?.organizationName || 'SCOOTSY LOGISTICS PRIVATE LIMITED',
      vendorName: initialInvoice?.vendorName || defaultVendorName,
      vendorCode: initialInvoice?.vendorCode || defaultVendorCode,
      gstin: initialInvoice?.gstin || '19BRXPA0554J1ZF',
      pan: initialInvoice?.pan || 'BRXPA0554J',
      warehouseName,
      city: city || warehouseName.split('(')[1]?.replace(')', '') || 'Direct',
      state: state || 'State',
      statusOfInvoice: 'Posted',
      poNumber: poNumber || 'PO-MANUAL',
      poDate: invoiceDate,
      poAmount: grossAmount,
      grnNumber: grnNumber || 'GRN-MANUAL',
      grnDate: invoiceDate,
      grossGrnAmount: grossAmount,
      invoiceNumber: invoiceNumber.trim(),
      invoiceAccountingDate: invoiceDate.trim(),
      invoicesRecorded: grossAmount,
      tdsTcs,
      purchaseReturnAmount: purchaseReturn,
      brandDiscountPromoClaims: promoClaims,
      otherDebitAmount: otherDebits,
      otherAdjustments,
      totalDeductions,
      netPayableAmount: netPayable,
      otherAdjustmentDate: otherAdjustments > 0 ? invoiceDate : '',
      invoiceStatus: 'Reconciled',
      paymentAmount,
      paymentReferenceNo: paymentRef.trim(),
      outstandingPayment: outstanding,
      dueDate: dueDate.trim(),
      creditPeriod,
      overdueStatus: calculatedOverdueStatus,
      paymentStatus: paymentStatus as any,
      lastPaymentDate: lastPaymentDate.trim()
    };

    onSaveInvoice(newInvoice);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 transition-colors my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {initialInvoice ? 'Edit Invoice Record' : 'Manual Invoice Data Entry'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manually record or edit an invoice in the active Instamart ledger
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

        {/* Live Calculation Preview Banner */}
        <div className="px-5 py-3 bg-slate-100 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 grid grid-cols-4 gap-2 text-center text-xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Gross Sales</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{formatINR(grossAmount)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Deductions</span>
            <span className="font-mono font-bold text-slate-600 dark:text-slate-400">-{formatINR(totalDeductions)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Net Payable</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatINR(netPayable)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Balance Due</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{formatINR(outstanding)}</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-800 dark:text-slate-200 max-h-[72vh] overflow-y-auto">
          
          {/* Section 1: Core Invoice Info */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>1. Invoice Identification</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold mb-1">Invoice Number *</label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. TBC/26-27/001"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1">Invoice Date (DD-MM-YYYY) *</label>
                <input
                  type="text"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  placeholder="e.g. 15-10-2026"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1">Warehouse Name *</label>
                <select
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                >
                  {COMMON_WAREHOUSES.map((wh) => (
                    <option key={wh} value={wh}>{wh}</option>
                  ))}
                  <option value="Direct Fulfillment Center">Direct Fulfillment Center</option>
                  <option value="Other Regional Hub">Other Regional Hub</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1">PO Number</label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="e.g. VIAPO74796"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1">GRN Number</label>
                <input
                  type="text"
                  value={grnNumber}
                  onChange={(e) => setGrnNumber(e.target.value)}
                  placeholder="e.g. VIA000094455"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1">Payment Due Date</label>
                <input
                  type="text"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder="e.g. 15-11-2026"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Financials & Deductions */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" />
              <span>2. Financial Breakdown (INR ₹)</span>
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[11px] font-semibold mb-1 text-slate-900 dark:text-white">
                  Gross Invoiced Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  value={grossAmount}
                  onChange={(e) => setGrossAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-amber-400/50 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  TDS / TCS (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tdsTcs}
                  onChange={(e) => setTdsTcs(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Purchase Returns (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={purchaseReturn}
                  onChange={(e) => setPurchaseReturn(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Brand Promo Claims (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={promoClaims}
                  onChange={(e) => setPromoClaims(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Other Debit Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={otherDebits}
                  onChange={(e) => setOtherDebits(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Other Adjustments (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={otherAdjustments}
                  onChange={(e) => setOtherAdjustments(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Payment Status & Last Payment Date */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              <span>3. Payment Status & Last Payment Date</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold mb-1">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold"
                >
                  <option value="Unpaid">Unpaid (Full balance pending)</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Paid">Paid (Full settlement)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1">Paid Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={netPayable}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1 text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                  <span>Last Payment Date *</span>
                  <span className="text-[10px] font-normal">Shows in PDF</span>
                </label>
                <input
                  type="text"
                  value={lastPaymentDate}
                  onChange={(e) => setLastPaymentDate(e.target.value)}
                  placeholder="e.g. 15-10-2026"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-emerald-500/50 rounded-lg text-xs font-mono font-semibold"
                />
              </div>

              <div className="col-span-1 sm:col-span-2">
                <label className="block text-[11px] font-semibold mb-1">Bank Reference / UTR Number</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. HSBCN520261026 or CMS000091823"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1">Credit Days</label>
                <input
                  type="number"
                  min="0"
                  value={creditPeriod}
                  onChange={(e) => setCreditPeriod(parseInt(e.target.value, 10) || 30)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>{initialInvoice ? 'Save Changes' : 'Add to Ledger'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
