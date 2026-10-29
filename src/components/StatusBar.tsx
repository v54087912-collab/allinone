import React from 'react';
import { ImageInfo } from '../types/crop';

interface StatusBarProps {
  imageInfo: ImageInfo | null;
  zoom: number;
  cropCount: number;
  selectedCount: number;
  cursorCoords: { x: number; y: number } | null;
  coveragePercentage?: number;
  onOpenStats?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  imageInfo,
  zoom,
  cropCount,
  selectedCount,
  cursorCoords,
  coveragePercentage,
  onOpenStats,
}) => {
  return (
    <footer className="h-7 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f1117] px-2 sm:px-4 flex items-center justify-between text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-slate-400 select-none z-30 shrink-0 transition-colors overflow-x-auto no-scrollbar">
      {/* Left: Image Info & Dimensions */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {imageInfo ? (
          <>
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-sans font-medium truncate max-w-[100px] sm:max-w-[260px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">{imageInfo.name}</span>
            </span>
            <span className="hidden sm:inline text-slate-500 dark:text-slate-400">
              {imageInfo.width} × {imageInfo.height} px
            </span>
            <span className="hidden md:inline text-slate-400 dark:text-slate-500 uppercase">
              {imageInfo.type.replace('image/', '')}
            </span>
          </>
        ) : (
          <span className="text-slate-400">No image loaded</span>
        )}
      </div>

      {/* Center: Cursor Coordinates */}
      <div className="hidden lg:flex items-center gap-3">
        {cursorCoords && imageInfo ? (
          <span className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 shadow-2xs">
            X: {cursorCoords.x} px &nbsp; Y: {cursorCoords.y} px
          </span>
        ) : (
          <span className="text-slate-400">Canvas Ready</span>
        )}
      </div>

      {/* Right: Zoom, Coverage & Crop Counts */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {coveragePercentage !== undefined && cropCount > 0 && (
          <button
            type="button"
            onClick={onOpenStats}
            className="hidden sm:flex items-center gap-1 hover:text-blue-600 dark:hover:text-white transition-colors cursor-pointer text-slate-500 dark:text-slate-400"
            title="Click to view Statistics panel"
          >
            <span>Coverage:</span>
            <strong className="text-blue-600 dark:text-sky-300 font-semibold">{coveragePercentage.toFixed(1)}%</strong>
          </button>
        )}

        <span>
          Crops:{' '}
          <strong className="text-slate-800 dark:text-white">
            {cropCount}
          </strong>
          {selectedCount > 0 && (
            <span className="text-blue-600 dark:text-blue-400 ml-1 font-semibold">
              ({selectedCount} sel)
            </span>
          )}
        </span>
        <span className="bg-white dark:bg-slate-900 px-1.5 sm:px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs">
          {Math.round(zoom * 100)}%
        </span>
      </div>
    </footer>
  );
};
