import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const InstamartLogo: React.FC<LogoProps> = ({ className = 'w-9 h-9', size = 36 }) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full drop-shadow-sm" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Brand Gradients */}
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

        {/* Outer Rounded Container with subtle border */}
        <rect 
          x="4" 
          y="4" 
          width="92" 
          height="92" 
          rx="22" 
          fill="url(#imCardGrad)" 
        />
        <rect 
          x="4" 
          y="4" 
          width="92" 
          height="92" 
          rx="22" 
          stroke="rgba(255, 255, 255, 0.3)" 
          strokeWidth="3" 
        />

        {/* Receipt / Invoice Outline shape in background */}
        <path
          d="M26 24C26 21.7909 27.7909 20 30 20H70C72.2091 20 74 21.7909 74 24V76L66 71L58 76L50 71L42 76L34 71L26 76V24Z"
          fill="rgba(15, 23, 42, 0.25)"
        />

        {/* Swift Commerce Lightning Bolt (Instamart Speed Symbol) */}
        <path
          d="M54 22L32 50H48L44 76L68 46H52L54 22Z"
          fill="url(#boltGrad)"
          stroke="#0f172a"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Currency & Growth Badge (₹ Indicator in bottom corner) */}
        <circle 
          cx="72" 
          cy="72" 
          r="16" 
          fill="url(#emeraldGrad)" 
          stroke="#0f172a" 
          strokeWidth="2.5"
        />
        <text 
          x="72" 
          y="77.5" 
          fontFamily="system-ui, -apple-system, sans-serif" 
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
