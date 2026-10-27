import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const InstamartLogo: React.FC<LogoProps> = ({ className = 'w-8 h-8 sm:w-9 sm:h-9', size }) => {
  const dimension = size ? `${size}px` : undefined;

  return (
    <div 
      className={`shrink-0 inline-flex items-center justify-center rounded-xl overflow-hidden shadow-xs select-none ${className}`} 
      style={dimension ? { width: dimension, height: dimension, minWidth: dimension, minHeight: dimension } : undefined}
    >
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full block" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="imCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff5200" />
            <stop offset="50%" stopColor="#ff4500" />
            <stop offset="100%" stopColor="#d93800" />
          </linearGradient>

          <linearGradient id="sheetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>

          <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffe600" />
            <stop offset="100%" stopColor="#ffa800" />
          </linearGradient>

          <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>

        {/* Squircle Badge Background */}
        <rect 
          x="3" 
          y="3" 
          width="94" 
          height="94" 
          rx="22" 
          fill="url(#imCardGrad)" 
        />
        <rect 
          x="3" 
          y="3" 
          width="94" 
          height="94" 
          rx="22" 
          stroke="rgba(255, 255, 255, 0.4)" 
          strokeWidth="3" 
        />

        {/* Invoice Paper Document */}
        <path
          d="M25 23C25 20.5 27 18 30 18H70C73 18 75 20.5 75 23V75L69 72L63 75L57 72L50 75L43 72L37 75L31 72L25 75V23Z"
          fill="url(#sheetGrad)"
        />

        {/* Ledger Stripes */}
        <rect x="33" y="28" width="34" height="3.5" rx="1.75" fill="#cbd5e1" />
        <rect x="33" y="35" width="24" height="2.8" rx="1.4" fill="#e2e8f0" />
        <rect x="33" y="41" width="28" height="2.8" rx="1.4" fill="#e2e8f0" />
        <rect x="33" y="47" width="20" height="2.8" rx="1.4" fill="#e2e8f0" />

        {/* Quick Commerce Lightning Bolt */}
        <path
          d="M56 22L36 50H50L45 74L68 44H54L56 22Z"
          fill="url(#boltGrad)"
          stroke="#b45309"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Financial Rupee Emblem */}
        <circle 
          cx="71" 
          cy="71" 
          r="14" 
          fill="url(#badgeGrad)" 
          stroke="#ffffff" 
          strokeWidth="2" 
        />
        <text 
          x="71" 
          y="76" 
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
          fontWeight="900" 
          fontSize="15" 
          fill="#ffffff" 
          textAnchor="middle"
        >
          ₹
        </text>
      </svg>
    </div>
  );
};
