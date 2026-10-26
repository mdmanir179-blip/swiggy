import React, { useState, useEffect } from 'react';
import { InvoiceRecord } from '../types';
import { formatINR } from '../utils/currency';
import { PlusCircle, X, Calendar, FileText, CreditCard, Check, Calculator } from 'lucide-react';

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
  defaultVendorName = '',
  defaultVendorCode = ''
}) => {
  const getTodayFormatted = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  // Form states - Completely empty by default
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [grnNumber, setGrnNumber] = useState('');
  const [warehouseName, setWarehouseName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  
  // Amounts (stored as string | number so empty displays blank, not 0)
  const [grossAmount, setGrossAmount] = useState<string | number>('');
  const [tdsTcs, setTdsTcs] = useState<string | number>('');
  const [purchaseReturn, setPurchaseReturn] = useState<string | number>('');
  const [promoClaims, setPromoClaims] = useState<string | number>('');
  const [otherDebits, setOtherDebits] = useState<string | number>('');
  const [otherAdjustments, setOtherAdjustments] = useState<string | number>('');
  
  // Payment
  const [paymentStatus, setPaymentStatus] = useState<string>('Unpaid');
  const [paymentAmount, setPaymentAmount] = useState<string | number>('');
  const [lastPaymentDate, setLastPaymentDate] = useState<string>('');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [creditPeriod, setCreditPeriod] = useState<string | number>('');

  // Parsed numerical values for live arithmetic
  const parsedGross = typeof grossAmount === 'number' ? grossAmount : parseFloat(grossAmount) || 0;
  const parsedTds = typeof tdsTcs === 'number' ? tdsTcs : parseFloat(tdsTcs) || 0;
  const parsedReturn = typeof purchaseReturn === 'number' ? purchaseReturn : parseFloat(purchaseReturn) || 0;
  const parsedPromo = typeof promoClaims === 'number' ? promoClaims : parseFloat(promoClaims) || 0;
  const parsedDebits = typeof otherDebits === 'number' ? otherDebits : parseFloat(otherDebits) || 0;
  const parsedAdjustments = typeof otherAdjustments === 'number' ? otherAdjustments : parseFloat(otherAdjustments) || 0;
  const parsedPaid = typeof paymentAmount === 'number' ? paymentAmount : parseFloat(paymentAmount) || 0;

  const totalDeductions = parsedTds + parsedReturn + parsedPromo + parsedDebits + parsedAdjustments;
  const netPayable = Math.max(0, parsedGross - totalDeductions);
  const outstanding = Math.max(0, netPayable - parsedPaid);

  useEffect(() => {
    if (initialInvoice && isOpen) {
      // Editing existing invoice
      setInvoiceNumber(initialInvoice.invoiceNumber || '');
      setInvoiceDate(initialInvoice.invoiceAccountingDate || '');
      setPoNumber(initialInvoice.poNumber || '');
      setGrnNumber(initialInvoice.grnNumber || '');
      setWarehouseName(initialInvoice.warehouseName || '');
      setCity(initialInvoice.city || '');
      setState(initialInvoice.state || '');
      setGrossAmount(initialInvoice.invoicesRecorded || initialInvoice.grossGrnAmount || '');
      setTdsTcs(initialInvoice.tdsTcs || '');
      setPurchaseReturn(initialInvoice.purchaseReturnAmount || '');
      setPromoClaims(initialInvoice.brandDiscountPromoClaims || '');
      setOtherDebits(initialInvoice.otherDebitAmount || '');
      setOtherAdjustments(initialInvoice.otherAdjustments || '');
      setPaymentStatus(initialInvoice.paymentStatus || 'Unpaid');
      setPaymentAmount(initialInvoice.paymentAmount || '');
      setLastPaymentDate(initialInvoice.lastPaymentDate || '');
      setPaymentRef(initialInvoice.paymentReferenceNo || '');
      setDueDate(initialInvoice.dueDate || '');
      setCreditPeriod(initialInvoice.creditPeriod || '');
    } else if (isOpen) {
      // Adding new invoice: ALWAYS EMPTY BY DEFAULT
      setInvoiceNumber('');
      setInvoiceDate('');
      setPoNumber('');
      setGrnNumber('');
      setWarehouseName('');
      setCity('');
      setState('');
      setGrossAmount('');
      setTdsTcs('');
      setPurchaseReturn('');
      setPromoClaims('');
      setOtherDebits('');
      setOtherAdjustments('');
      setPaymentStatus('Unpaid');
      setPaymentAmount('');
      setLastPaymentDate('');
      setPaymentRef('');
      setDueDate('');
      setCreditPeriod('');
    }
  }, [initialInvoice, isOpen]);

  // Handle status change
  const handleStatusChange = (newStatus: string) => {
    setPaymentStatus(newStatus);
    if (newStatus === 'Paid') {
      if (netPayable > 0) {
        setPaymentAmount(netPayable);
      }
      if (!lastPaymentDate) setLastPaymentDate(getTodayFormatted());
    } else if (newStatus === 'Unpaid') {
      setPaymentAmount('');
      setLastPaymentDate('');
      setPaymentRef('');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) {
      alert('Please enter an Invoice Number');
      return;
    }
    if (parsedGross <= 0) {
      alert('Gross Amount must be greater than 0');
      return;
    }

    const calculatedOverdueStatus = outstanding <= 0 
      ? 'No due' 
      : 'Not Due';

    const parsedCreditDays = typeof creditPeriod === 'number' ? creditPeriod : parseInt(creditPeriod, 10) || 0;

    const newInvoice: InvoiceRecord = {
      id: initialInvoice?.id || `inv-manual-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      organizationName: initialInvoice?.organizationName || 'SCOOTSY LOGISTICS PRIVATE LIMITED',
      vendorName: initialInvoice?.vendorName || defaultVendorName || 'Vendor',
      vendorCode: initialInvoice?.vendorCode || defaultVendorCode || 'MANUAL',
      gstin: initialInvoice?.gstin || '',
      pan: initialInvoice?.pan || '',
      warehouseName: warehouseName.trim(),
      city: city.trim() || (warehouseName.includes('(') ? warehouseName.split('(')[1]?.replace(')', '') : 'Direct'),
      state: state.trim() || 'India',
      statusOfInvoice: 'Posted',
      poNumber: poNumber.trim(),
      poDate: invoiceDate.trim(),
      poAmount: parsedGross,
      grnNumber: grnNumber.trim(),
      grnDate: invoiceDate.trim(),
      grossGrnAmount: parsedGross,
      invoiceNumber: invoiceNumber.trim(),
      invoiceAccountingDate: invoiceDate.trim(),
      invoicesRecorded: parsedGross,
      tdsTcs: parsedTds,
      purchaseReturnAmount: parsedReturn,
      brandDiscountPromoClaims: parsedPromo,
      otherDebitAmount: parsedDebits,
      otherAdjustments: parsedAdjustments,
      totalDeductions,
      netPayableAmount: netPayable,
      otherAdjustmentDate: parsedAdjustments > 0 ? invoiceDate.trim() : '',
      invoiceStatus: 'Reconciled',
      paymentAmount: parsedPaid,
      paymentReferenceNo: paymentRef.trim(),
      outstandingPayment: outstanding,
      dueDate: dueDate.trim(),
      creditPeriod: parsedCreditDays,
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
                Enter invoice details manually into the ledger
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
            <span className="font-mono font-bold text-slate-900 dark:text-white">{formatINR(parsedGross)}</span>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold">Invoice Date (DD-MM-YYYY) *</label>
                  <button
                    type="button"
                    onClick={() => setInvoiceDate(getTodayFormatted())}
                    className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    Set Today
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  placeholder="DD-MM-YYYY"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1">Warehouse Name</label>
                <input
                  type="text"
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  placeholder="Select or enter warehouse..."
                  list="common-warehouses-list"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                />
                <datalist id="common-warehouses-list">
                  {COMMON_WAREHOUSES.map((wh) => (
                    <option key={wh} value={wh} />
                  ))}
                </datalist>
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
                  placeholder="DD-MM-YYYY"
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
                  onChange={(e) => setGrossAmount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
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
                  onChange={(e) => setTdsTcs(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
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
                  onChange={(e) => setPurchaseReturn(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
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
                  onChange={(e) => setPromoClaims(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
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
                  onChange={(e) => setOtherDebits(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
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
                  onChange={(e) => setOtherAdjustments(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
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
                  max={netPayable || undefined}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    Last Payment Date
                  </label>
                  <button
                    type="button"
                    onClick={() => setLastPaymentDate(getTodayFormatted())}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Set Today
                  </button>
                </div>
                <input
                  type="text"
                  value={lastPaymentDate}
                  onChange={(e) => setLastPaymentDate(e.target.value)}
                  placeholder="DD-MM-YYYY"
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
                  onChange={(e) => setCreditPeriod(e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0)}
                  placeholder="0"
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
