import React from 'react';

export interface KairoLogoProps {
  id?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  layout?: 'horizontal' | 'stacked' | 'icon-only';
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
  useImage?: boolean;
}

export const KairoLogo: React.FC<KairoLogoProps> = ({
  id = 'kairo-official-brand-logo',
  size = 'md',
  layout = 'horizontal',
  showText = true,
  showTagline = true,
  className = '',
  useImage = false,
}) => {
  // Dimensions mapping
  const iconDimensions = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-24 h-24',
    custom: '',
  }[size] || 'w-10 h-10';

  const titleSizes = {
    xs: 'text-base tracking-tight',
    sm: 'text-lg tracking-wider',
    md: 'text-xl tracking-wider',
    lg: 'text-3xl tracking-widest',
    xl: 'text-5xl tracking-widest',
    custom: 'text-xl',
  }[size] || 'text-xl';

  const taglineSizes = {
    xs: 'text-[8px] tracking-wide',
    sm: 'text-[9px] tracking-wider',
    md: 'text-[10px] tracking-wider',
    lg: 'text-xs tracking-widest',
    xl: 'text-sm tracking-widest',
    custom: 'text-[10px]',
  }[size] || 'text-[10px]';

  // The official SVG Emblem of KAIRO
  const EmblemSvg = (
    <svg
      viewBox="0 0 400 340"
      className={`${iconDimensions} flex-shrink-0 select-none drop-shadow-sm transition-transform duration-200 group-hover:scale-105`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="kairoStemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4c2882" />
          <stop offset="45%" stopColor="#673ab7" />
          <stop offset="100%" stopColor="#3b1d6e" />
        </linearGradient>

        <linearGradient id="kairoWingGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5c389e" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        <linearGradient id="kairoBookLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>

        <linearGradient id="kairoBookRight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        <linearGradient id="kairoHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="55%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#fb7185" />
        </linearGradient>

        <linearGradient id="kairoSakuraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fda4af" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>

        <filter id="kairoHeartGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <g id="kairo-mark-group">
        {/* Open Book Base - Left Page */}
        <path
          d="M 200 280 C 170 285, 120 288, 70 270 C 60 266, 50 273, 52 284 C 54 294, 62 298, 74 302 C 120 318, 170 310, 200 298 Z"
          fill="url(#kairoBookLeft)"
        />
        <path
          d="M 200 287 C 165 292, 115 293, 76 280 C 85 284, 135 303, 200 293 Z"
          fill="#3b82f6"
          opacity="0.65"
        />

        {/* Open Book Base - Right Page */}
        <path
          d="M 200 280 C 230 285, 280 288, 330 270 C 340 266, 350 273, 348 284 C 346 294, 338 298, 326 302 C 280 318, 230 310, 200 298 Z"
          fill="url(#kairoBookRight)"
        />
        <path
          d="M 200 287 C 235 292, 285 293, 324 280 C 315 284, 265 303, 200 293 Z"
          fill="#38bdf8"
          opacity="0.75"
        />

        {/* Book Spine Center */}
        <ellipse cx="200" cy="294" rx="14" ry="4" fill="#673ab7" />

        {/* Stylized 'K' - Left Vertical Upright Stem */}
        <path
          d="M 125 78 C 120 78, 108 76, 98 72 C 94 70, 92 74, 94 77 C 98 83, 108 92, 115 97 L 115 272 C 108 277, 98 285, 94 291 C 92 294, 94 298, 98 296 C 110 292, 125 290, 140 290 C 155 290, 170 292, 182 296 C 186 298, 188 294, 186 291 C 182 285, 172 277, 165 272 L 165 97 C 172 92, 182 83, 186 77 C 188 74, 186 70, 182 72 C 170 76, 155 78, 140 78 Z"
          fill="url(#kairoStemGrad)"
        />

        {/* Stylized 'K' - Upper Diagonal Arm (Swoop Wing) */}
        <path
          d="M 148 185 C 165 160, 205 110, 265 80 C 285 70, 305 68, 316 71 C 319 72, 319 76, 316 78 C 300 88, 265 115, 235 155 C 205 195, 180 215, 155 218 Z"
          fill="url(#kairoWingGrad)"
        />

        {/* Stylized 'K' - Lower Diagonal Leg */}
        <path
          d="M 172 178 C 190 190, 215 215, 238 245 C 255 268, 275 282, 305 288 C 310 289, 311 294, 307 296 C 290 302, 260 298, 235 280 C 208 260, 185 230, 160 205 Z"
          fill="url(#kairoWingGrad)"
          opacity="0.95"
        />

        {/* Central Radiant Magenta Pink Heart */}
        <g transform="translate(195, 165) scale(0.96)" filter="url(#kairoHeartGlow)">
          <path
            d="M 0 8 C -14 -12, -32 -4, -32 14 C -32 28, -12 44, 0 54 C 12 44, 32 28, 32 14 C 32 -4, 14 -12, 0 8 Z"
            fill="url(#kairoHeartGrad)"
          />
          <path
            d="M -8 6 C -18 -6, -26 -1, -26 12 C -26 18, -18 26, -10 32 C -13 24, -14 16, -12 10 C -11 7, -9 6, -8 6 Z"
            fill="#ffffff"
            opacity="0.5"
          />
        </g>

        {/* Sakura (Cherry Blossom) Flower */}
        <g transform="translate(292, 105) scale(0.85)">
          <path d="M 0 0 C -6 -14, -8 -26, 0 -30 C 8 -26, 6 -14, 0 0 Z" fill="url(#kairoSakuraGrad)" />
          <path d="M 0 0 C 10 -12, 24 -14, 28 -7 C 26 2, 12 6, 0 0 Z" fill="url(#kairoSakuraGrad)" />
          <path d="M 0 0 C 14 6, 22 18, 16 25 C 9 26, 2 14, 0 0 Z" fill="url(#kairoSakuraGrad)" />
          <path d="M 0 0 C -4 14, -14 24, -22 20 C -24 12, -12 4, 0 0 Z" fill="url(#kairoSakuraGrad)" />
          <path d="M 0 0 C -14 4, -26 -4, -25 -13 C -18 -18, -8 -8, 0 0 Z" fill="url(#kairoSakuraGrad)" />
          <circle cx="0" cy="0" r="4.5" fill="#fbcfe8" />
          <circle cx="0" cy="0" r="2.5" fill="#db2777" />
        </g>

        {/* Fluttering Cherry Blossom Petals */}
        <path
          d="M 324 140 C 330 134, 338 136, 340 142 C 342 148, 334 154, 328 152 C 322 150, 320 144, 324 140 Z"
          fill="#f47fa5"
          opacity="0.9"
          transform="rotate(-15 330 145)"
        />
        <path
          d="M 305 180 C 312 174, 320 178, 320 184 C 320 190, 310 196, 304 192 C 298 188, 300 182, 305 180 Z"
          fill="#fb7185"
          opacity="0.95"
          transform="rotate(25 312 185)"
        />
        <path
          d="M 285 220 C 290 216, 296 218, 298 223 C 300 228, 294 233, 289 231 C 284 229, 282 224, 285 220 Z"
          fill="#fda4af"
          opacity="0.85"
          transform="rotate(-35 290 225)"
        />
      </g>
    </svg>
  );

  const ImageEmblem = (
    <img
      src="/kairo-logo.jpg"
      alt="KAIRO Official Logo"
      referrerPolicy="no-referrer"
      className={`${iconDimensions} object-contain rounded-xl select-none group-hover:scale-105 transition-transform`}
    />
  );

  const LogoMark = useImage ? ImageEmblem : EmblemSvg;

  if (layout === 'icon-only' || !showText) {
    return (
      <div id={id} className={`inline-flex items-center justify-center ${className}`}>
        {LogoMark}
      </div>
    );
  }

  if (layout === 'stacked') {
    return (
      <div id={id} className={`flex flex-col items-center text-center ${className}`}>
        {LogoMark}
        <span className={`font-black font-display text-[#1e1435] mt-2 ${titleSizes}`}>
          K A I R O
        </span>
        {showTagline && (
          <div className={`flex items-center justify-center gap-1.5 font-extrabold uppercase mt-1 ${taglineSizes}`}>
            <span className="text-[#2d2247]">STORIES.</span>
            <span className="text-[#ec4899]">FANDOMS.</span>
            <span className="text-[#0284c7]">HEARTS.</span>
          </div>
        )}
      </div>
    );
  }

  // Default: horizontal layout
  return (
    <div id={id} className={`flex items-center gap-2.5 ${className}`}>
      {LogoMark}
      <div className="flex flex-col text-left leading-none">
        <span className={`font-black font-display text-[#1e1435] group-hover:text-[#9e3b5f] transition-colors ${titleSizes}`}>
          KAIRO
        </span>
        {showTagline && (
          <div className={`flex items-center gap-1 font-extrabold uppercase mt-1 tracking-wider ${taglineSizes}`}>
            <span className="text-[#3a2c52]">STORIES.</span>
            <span className="text-[#ec4899]">FANDOMS.</span>
            <span className="text-[#0284c7]">HEARTS.</span>
          </div>
        )}
      </div>
    </div>
  );
};
