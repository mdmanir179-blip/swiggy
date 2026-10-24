import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalInvoices: number;
  totalPayments: number;
}

export const ClearDataModal: React.FC<ClearDataModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalInvoices,
  totalPayments
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-150 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Clear Current Dataset?
          </h3>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            This will permanently remove all{' '}
            <strong className="text-slate-900 dark:text-slate-200">{totalInvoices} invoice(s)</strong>
            {totalPayments > 0 && (
              <>
                {' '}and <strong className="text-slate-900 dark:text-slate-200">{totalPayments} payment record(s)</strong>
              </>
            )}{' '}
            from this browser. You will return to the blank upload screen.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 rounded-lg transition-colors shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Yes, Clear All Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
