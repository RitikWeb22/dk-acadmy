import React from 'react';

export const TrophyHeroIllustration: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 320 220"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ overflow: 'visible', width: '100%', height: 'auto', maxWidth: '320px' }}
  >
    <defs>
      {/* Background Soft Blue Glow */}
      <radialGradient id="blueDomeGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.35" />
        <stop offset="60%" stopColor="#BFDBFE" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#EFF6FF" stopOpacity="0" />
      </radialGradient>

      {/* Gold Gradients */}
      <linearGradient id="goldCupGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="25%" stopColor="#F59E0B" />
        <stop offset="60%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>

      <linearGradient id="goldCupShine" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
        <stop offset="50%" stopColor="#FDE68A" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
      </linearGradient>

      <linearGradient id="goldHandles" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#92400E" />
      </linearGradient>

      <linearGradient id="goldLeaves" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FCD34D" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>

      <filter id="trophySoftShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#B45309" floodOpacity="0.18" />
      </filter>

      <filter id="ribbonShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.08" />
      </filter>
    </defs>

    {/* Soft Glow */}
    <circle cx="160" cy="100" r="95" fill="url(#blueDomeGlow)" />

    {/* Neoclassical Academic Building / Dome Outline (Right/Behind) */}
    <g opacity="0.4" stroke="#93C5FD" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      {/* Dome */}
      <path d="M220 70 Q245 42 270 70" />
      <path d="M226 70 C226 50 264 50 264 70" />
      <line x1="245" y1="36" x2="245" y2="44" />
      {/* Pillars */}
      <line x1="222" y1="70" x2="222" y2="95" />
      <line x1="233" y1="70" x2="233" y2="95" />
      <line x1="245" y1="70" x2="245" y2="95" />
      <line x1="257" y1="70" x2="257" y2="95" />
      <line x1="268" y1="70" x2="268" y2="95" />
      {/* Steps */}
      <line x1="216" y1="95" x2="274" y2="95" />
      <line x1="212" y1="100" x2="278" y2="100" />
      <line x1="208" y1="105" x2="282" y2="105" />
    </g>

    {/* Golden Laurel Wreath (Left & Right) */}
    <g fill="url(#goldLeaves)">
      {/* Left Leaves */}
      <ellipse cx="106" cy="65" rx="5" ry="9" transform="rotate(-35 106 65)" />
      <ellipse cx="100" cy="80" rx="5" ry="9" transform="rotate(-20 100 80)" />
      <ellipse cx="98" cy="98" rx="5" ry="9" transform="rotate(-5 98 98)" />
      <ellipse cx="102" cy="115" rx="5" ry="9" transform="rotate(15 102 115)" />
      <ellipse cx="112" cy="130" rx="5" ry="9" transform="rotate(35 112 130)" />
      <ellipse cx="126" cy="142" rx="5" ry="9" transform="rotate(55 126 142)" />

      {/* Right Leaves */}
      <ellipse cx="214" cy="65" rx="5" ry="9" transform="rotate(35 214 65)" />
      <ellipse cx="220" cy="80" rx="5" ry="9" transform="rotate(20 220 80)" />
      <ellipse cx="222" cy="98" rx="5" ry="9" transform="rotate(5 222 98)" />
      <ellipse cx="218" cy="115" rx="5" ry="9" transform="rotate(-15 218 115)" />
      <ellipse cx="208" cy="130" rx="5" ry="9" transform="rotate(-35 208 130)" />
      <ellipse cx="194" cy="142" rx="5" ry="9" transform="rotate(-55 194 142)" />
    </g>

    {/* Trophy Cup Body & Handles with Shadow */}
    <g filter="url(#trophySoftShadow)">
      {/* Left Handle */}
      <path
        d="M132 58 C110 58 108 90 128 102 C132 104 135 102 135 96 C118 86 122 68 134 68 Z"
        fill="url(#goldHandles)"
      />
      {/* Right Handle */}
      <path
        d="M188 58 C210 58 212 90 192 102 C188 104 185 102 185 96 C202 86 198 68 186 68 Z"
        fill="url(#goldHandles)"
      />

      {/* Cup Rim */}
      <ellipse cx="160" cy="52" rx="34" ry="7" fill="url(#goldCupGrad)" />
      <ellipse cx="160" cy="52" rx="30" ry="5" fill="#B45309" />
      <ellipse cx="160" cy="53" rx="27" ry="4" fill="#78350F" />

      {/* Cup Bowl */}
      <path
        d="M126 53 C126 95 142 120 160 120 C178 120 194 95 194 53 Z"
        fill="url(#goldCupGrad)"
      />
      {/* Bowl Shine Overlay */}
      <path
        d="M130 54 C130 90 142 114 156 117 C146 112 136 90 136 56 Z"
        fill="url(#goldCupShine)"
      />

      {/* Stem */}
      <path d="M154 118 H166 V134 H154 Z" fill="url(#goldCupGrad)" />

      {/* Base */}
      <path d="M144 134 L176 134 L180 146 L140 146 Z" fill="url(#goldCupGrad)" />
      <rect x="136" y="146" width="48" height="6" rx="2" fill="#78350F" />
    </g>

    {/* Star Sparkles */}
    <path d="M132 38 L134 32 L136 38 L142 40 L136 42 L134 48 L132 42 L126 40 Z" fill="#FDE68A" />
    <path d="M192 42 L193.5 38 L195 42 L199 43.5 L195 45 L193.5 49 L192 45 L188 43.5 Z" fill="#FDE68A" />

    {/* Ribbon Banner ("Dream • Prepare • Achieve") */}
    <g filter="url(#ribbonShadow)">
      {/* Ribbon Fold Ends */}
      <path d="M84 158 L98 152 L98 168 L84 174 Z" fill="#E2E8F0" />
      <path d="M236 158 L222 152 L222 168 L236 174 Z" fill="#E2E8F0" />

      {/* Main Ribbon Body */}
      <rect
        x="92"
        y="148"
        width="136"
        height="26"
        rx="5"
        fill="#FFFFFF"
        stroke="#E2E8F0"
        strokeWidth="1.2"
      />

      {/* Ribbon Text */}
      <text
        x="160"
        y="165"
        textAnchor="middle"
        fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
        fontSize="9.5"
        fontWeight="800"
        fill="#10234A"
        letterSpacing="0.04em"
      >
        Dream • Prepare • Achieve
      </text>
    </g>
  </svg>
);

