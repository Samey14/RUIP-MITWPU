import React from 'react';
import { WifiOff, HardDrive } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline }) => {
  if (isOnline) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/70 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-amber-900 dark:text-amber-200 text-xs transition-all">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Offline Field Mode:</strong> Expenses and vouchers are saved locally in your browser and will persist without an internet connection.
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono-tabular text-amber-700 dark:text-amber-300">
          <HardDrive className="w-3 h-3" />
          <span>Local Storage Active</span>
        </div>
      </div>
    </div>
  );
};
