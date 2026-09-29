import React from 'react';

interface MitWpuLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'circular' | 'banner';
  showText?: boolean;
  inverted?: boolean;
  className?: string;
  subtitle?: string;
}

const SIZE_MAP = {
  xs: { img: 'w-7 h-7', banner: 'h-7', text: 'text-xs', sub: 'text-[9px]' },
  sm: { img: 'w-9 h-9', banner: 'h-9', text: 'text-sm', sub: 'text-[10px]' },
  md: { img: 'w-12 h-12', banner: 'h-11', text: 'text-base', sub: 'text-xs' },
  lg: { img: 'w-16 h-16', banner: 'h-14', text: 'text-lg', sub: 'text-xs' },
  xl: { img: 'w-24 h-24', banner: 'h-20', text: 'text-xl', sub: 'text-sm' },
};

export const MitWpuLogo: React.FC<MitWpuLogoProps> = ({
  size = 'md',
  variant = 'circular',
  showText = false,
  inverted = false,
  className = '',
  subtitle,
}) => {
  const currentSize = SIZE_MAP[size] || SIZE_MAP.md;

  if (variant === 'banner') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <img
          src="/mit-wpu-banner.svg"
          alt="Dr. Vishwanath Karad MIT World Peace University Pune"
          className={`${currentSize.banner} w-auto object-contain max-w-full rounded-md bg-white p-1 shadow-2xs`}
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`relative ${currentSize.img} shrink-0 rounded-full bg-white p-0.5 shadow-xs overflow-hidden flex items-center justify-center`}
      >
        <img
          src="/mit-wpu-logo.svg"
          alt="MIT-WPU World Peace Dome Seal"
          className="w-full h-full object-contain"
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-tight select-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight font-heading ${currentSize.text} ${
                inverted ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'
              }`}
            >
              MIT-WPU
            </span>
            <span className="text-[10px] font-bold text-red-600 dark:text-red-400">
              PUNE
            </span>
          </div>
          <span
            className={`font-medium ${currentSize.sub} ${
              inverted ? 'text-zinc-300' : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            {subtitle || 'World Peace University · Pune'}
          </span>
        </div>
      )}
    </div>
  );
};
