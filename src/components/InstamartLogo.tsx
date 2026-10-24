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
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#fef08a" />
          </linearGradient>

          <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Base Card Background */}
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

        {/* Receipt / Invoice Silhouette */}
        <path
          d="M26 24C26 21.7909 27.7909 20 30 20H70C72.2091 20 74 21.7909 74 24V76L66 71L58 76L50 71L42 76L34 71L26 76V24Z"
          fill="rgba(15, 23, 42, 0.28)"
        />

        {/* Quick Commerce Lightning Bolt */}
        <path
          d="M54 22L32 50H48L44 76L68 46H52L54 22Z"
          fill="url(#boltGrad)"
          stroke="#0f172a"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Financial Rupee Emblem */}
        <circle 
          cx="72" 
          cy="72" 
          r="15" 
          fill="url(#emeraldGrad)" 
          stroke="#0f172a" 
          strokeWidth="2.5"
        />
        <text 
          x="72" 
          y="77" 
          fontFamily="system-ui, -apple-system, sans-serif" 
          fontWeight="900" 
          fontSize="14" 
          fill="#ffffff" 
          textAnchor="middle"
        >
          ₹
        </text>
      </svg>
    </div>
  );
};
