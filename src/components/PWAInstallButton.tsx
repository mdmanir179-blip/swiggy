import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Monitor, Smartphone, X, Share, CheckCircle2, Laptop } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  // CRITICAL: All React hooks declared unconditionally at top
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);

  // If already running as an installed desktop or mobile PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowDesktopGuide(true);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowDesktopGuide(true);
    }
  };

  return (
    <>
      {/* Primary Install App Button in Header */}
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 dark:bg-amber-400 dark:hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shadow-xs cursor-pointer select-none"
        title="Install Instamart Payment Tracker as a computer desktop application"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {/* Desktop Computer Installation Modal Guide */}
      {showDesktopGuide && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
          onClick={() => setShowDesktopGuide(false)}
        >
          <div 
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Install on Your Computer
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Run Instamart Payment Tracker as a native desktop app
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDesktopGuide(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
              
              {/* Step 1: Address Bar icon */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    Browser Address Bar Install Icon
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Look at the top right of your browser's address bar (URL bar). Click the <strong>Install / Computer Download icon</strong> (or <strong>⊕</strong> / <strong>App available</strong>).
                  </p>
                </div>
              </div>

              {/* Step 2: Browser menu */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    Alternative: Browser Menu (Chrome / Edge / Brave)
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Click the three dots <strong>(⋮ or ⋯)</strong> on the top right of your browser &rarr; Select <strong>&ldquo;Install Instamart Payment Tracker...&rdquo;</strong> (or <em>Save and share &rarr; Install page as app</em>).
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Desktop App Benefits</span>
                </div>
                <p>
                  Adds a desktop shortcut icon, runs in full-screen windowed mode without browser tabs, works 100% offline, and securely saves all your uploaded sheets.
                </p>
              </div>

            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={async () => {
                  if (isInstallable) {
                    await install();
                    setShowDesktopGuide(false);
                  } else {
                    setShowDesktopGuide(false);
                  }
                }}
                className="w-full rounded-xl bg-amber-400 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-300 transition-colors shadow-xs"
              >
                {isInstallable ? 'Launch Install Prompt' : 'Got It'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Installation Modal Guide */}
      {showIOSGuide && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
          onClick={() => setShowIOSGuide(false)}
        >
          <div 
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Save to iPhone / iPad
                </h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <Share className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <strong>Step 1:</strong> Tap the <strong>Share</strong> button at the bottom of Safari.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <Download className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong>Step 2:</strong> Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>.
                </div>
              </div>

              <p className="text-[11px] text-slate-500 pt-1">
                Once added, the app will run full-screen offline like a native app.
              </p>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-slate-100 dark:bg-slate-800 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
