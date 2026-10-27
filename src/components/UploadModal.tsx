import React, { useState, useRef } from 'react';
import { parseUploadedFile, ParseResult } from '../utils/fileParser';
import { InvoiceRecord, PaymentRecord } from '../types';
import { Upload, X, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, FileText } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoicesLoaded: (invoices: InvoiceRecord[], mode: 'replace' | 'append') => void;
  onPaymentsLoaded: (payments: PaymentRecord[], mode: 'replace' | 'append') => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onInvoicesLoaded,
  onPaymentsLoaded
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [uploadMode, setUploadMode] = useState<'replace' | 'append'>('replace');
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    setUploadSuccessMsg(null);
    try {
      const result = await parseUploadedFile(file);
      setParseResult(result);
    } catch (err: any) {
      setParseResult({
        fileType: 'unknown',
        fileName: file.name,
        totalRows: 0,
        errors: [err?.message || 'File processing error']
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleConfirmApply = () => {
    if (!parseResult) return;

    const countInv = parseResult.invoices?.length || 0;
    const countPmt = parseResult.payments?.length || 0;

    if (parseResult.invoices && countInv > 0) {
      onInvoicesLoaded(parseResult.invoices, uploadMode);
    }
    if (parseResult.payments && countPmt > 0) {
      onPaymentsLoaded(parseResult.payments, uploadMode);
    }

    if (countInv > 0 && countPmt > 0) {
      setUploadSuccessMsg(`Successfully saved ${countInv} invoices & ${countPmt} payments to Cloud Database (Active across all devices)!`);
    } else if (countInv > 0) {
      setUploadSuccessMsg(`Successfully saved ${countInv} invoices to Cloud Database! Synced across all your devices.`);
    } else if (countPmt > 0) {
      setUploadSuccessMsg(`Successfully saved ${countPmt} payment records to Cloud Database! Synced across all your devices.`);
    }

    setTimeout(() => {
      onClose();
      setParseResult(null);
      setUploadSuccessMsg(null);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/80">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upload Instamart Excel / CSV Report</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          
          {/* Drag and Drop Zone */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragActive 
                ? 'border-amber-500 bg-amber-500/5' 
                : 'border-slate-300 dark:border-slate-700 hover:border-amber-400 bg-slate-50 dark:bg-slate-950/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleInputChange}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-slate-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Upload className="w-6 h-6" />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Click or drag & drop Instamart report here
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  Supports Excel (.xlsx, .xls) and CSV files for Invoice Reports or Payment Reports
                </p>
              </div>
            </div>
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex items-center justify-center gap-2 p-3 bg-slate-100 dark:bg-slate-800/60 rounded-lg text-slate-700 dark:text-slate-300">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
              <span>Analyzing report format and numeric columns...</span>
            </div>
          )}

          {/* Success Message */}
          {uploadSuccessMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{uploadSuccessMsg}</span>
            </div>
          )}

          {/* Parse Result Summary */}
          {parseResult && !isProcessing && (
            <div className="space-y-3">
              {parseResult.errors.length > 0 ? (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-lg text-red-800 dark:text-red-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span>Upload Issue</span>
                  </div>
                  {parseResult.errors.map((e, idx) => (
                    <div key={idx} className="text-[11px]">{e}</div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold text-slate-900 dark:text-slate-200">{parseResult.fileName}</span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-medium">
                      {parseResult.fileType === 'payment_report' ? 'Payment Report (Point 2)' : 'Invoice Report (Point 1)'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    Detected <strong className="text-slate-800 dark:text-slate-200">{parseResult.totalRows}</strong> valid records ready to import.
                  </div>

                  {/* Mode Selection */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Import Mode:</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                        <input
                          type="radio"
                          name="mode"
                          checked={uploadMode === 'replace'}
                          onChange={() => setUploadMode('replace')}
                          className="text-amber-500 focus:ring-amber-400"
                        />
                        <span>Replace existing</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 ml-2">
                        <input
                          type="radio"
                          name="mode"
                          checked={uploadMode === 'append'}
                          onChange={() => setUploadMode('append')}
                          className="text-amber-500 focus:ring-amber-400"
                        />
                        <span>Append to existing</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-end gap-2 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Cancel
          </button>
          {parseResult && parseResult.errors.length === 0 && (
            <button
              onClick={handleConfirmApply}
              className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition-colors shadow-xs"
            >
              Import {parseResult.totalRows} Records
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
