import React from 'react';
import {
  MousePointer,
  Crop,
  Grid3X3,
  Copy,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  ScanEye,
} from 'lucide-react';
import { ActiveTool } from '../types/crop';

interface ToolSidebarProps {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  hasSelectedCrop: boolean;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onOpenDetectObjects?: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoom100: () => void;
  onFitToScreen: () => void;
  zoom: number;
}

export const ToolSidebar: React.FC<ToolSidebarProps> = ({
  activeTool,
  setActiveTool,
  hasSelectedCrop,
  onDuplicateSelected,
  onDeleteSelected,
  onOpenDetectObjects,
  onZoomIn,
  onZoomOut,
  onZoom100,
  onFitToScreen,
  zoom,
}) => {
  return (
    <aside className="w-12 sm:w-14 border-r border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#12151d] flex flex-col items-center py-2 sm:py-3 gap-1 select-none z-20 shrink-0 overflow-y-auto overflow-x-hidden no-scrollbar transition-colors">
      {/* Primary Tool Group */}
      <div className="flex flex-col gap-1 w-full px-1 sm:px-2 items-center">
        <button
          type="button"
          onClick={() => setActiveTool('select')}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
            activeTool === 'select'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-[#1a1e2b]'
          }`}
          title="Select & Move Tool (V)"
          aria-label="Select Tool"
        >
          <MousePointer className="w-4 h-4" />
          <span className="hidden sm:block absolute left-12 ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-700 shadow-xl">
            Select / Move (V)
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTool('manual')}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
            activeTool === 'manual'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-[#1a1e2b]'
          }`}
          title="Manual Crop Tool (C)"
          aria-label="Manual Crop Tool"
        >
          <Crop className="w-4 h-4" />
          <span className="hidden sm:block absolute left-12 ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-700 shadow-xl">
            Manual Crop (C)
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTool('grid')}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
            activeTool === 'grid'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-[#1a1e2b]'
          }`}
          title="Grid Crop Tool (G)"
          aria-label="Grid Crop Tool"
        >
          <Grid3X3 className="w-4 h-4" />
          <span className="hidden sm:block absolute left-12 ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-700 shadow-xl">
            Grid Generator (G)
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenDetectObjects}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all cursor-pointer relative group text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-slate-200/70 dark:hover:bg-[#1a1e2b]"
          title="Detect Objects - Auto-detect high-contrast sprites"
          aria-label="Detect Objects"
        >
          <ScanEye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:block absolute left-12 ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-700 shadow-xl">
            Detect Objects
          </span>
        </button>
      </div>

      <div className="w-5 sm:w-7 h-[1px] bg-slate-200 dark:bg-slate-800 my-1 sm:my-2 shrink-0" />

      {/* Selected Crop Actions */}
      <div className="flex flex-col gap-1 w-full px-1 sm:px-2 items-center">
        <button
          type="button"
          onClick={onDuplicateSelected}
          disabled={!hasSelectedCrop}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all relative group ${
            hasSelectedCrop
              ? 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-[#1a1e2b] cursor-pointer'
              : 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
          }`}
          title="Duplicate Selected Crop (Ctrl+D)"
          aria-label="Duplicate Selected Crop"
        >
          <Copy className="w-4 h-4" />
          <span className="hidden sm:block absolute left-12 ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-700 shadow-xl">
            Duplicate (Ctrl+D)
          </span>
        </button>

        <button
          type="button"
          onClick={onDeleteSelected}
          disabled={!hasSelectedCrop}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all relative group ${
            hasSelectedCrop
              ? 'text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer'
              : 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
          }`}
          title="Delete Selected Crop (Del)"
          aria-label="Delete Selected Crop"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:block absolute left-12 ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-700 shadow-xl">
            Delete Selected (Del)
          </span>
        </button>
      </div>

      <div className="w-5 sm:w-7 h-[1px] bg-slate-200 dark:bg-slate-800 my-1 sm:my-2 shrink-0" />

      {/* View & Zoom Controls */}
      <div className="flex flex-col gap-1 w-full px-1 sm:px-2 items-center mt-auto pb-1">
        <button
          type="button"
          onClick={onZoomIn}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-[#1a1e2b] transition-all cursor-pointer relative group"
          title="Zoom In (+)"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
          <span className="hidden sm:block absolute left-12 ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-700 shadow-xl">
            Zoom In (+)
          </span>
        </button>

        <button
          type="button"
          onClick={onZoomOut}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-[#1a1e2b] transition-all cursor-pointer relative group"
          title="Zoom Out (-)"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
          <span className="hidden sm:block absolute left-12 ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-700 shadow-xl">
            Zoom Out (-)
          </span>
        </button>

        <button
          type="button"
          onClick={onZoom100}
          className="w-9 sm:w-10 h-7 sm:h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-[#1a1e2b] transition-all cursor-pointer relative group"
          title="Zoom to 100%"
          aria-label="Zoom 100%"
        >
          {Math.round(zoom * 100)}%
          <span className="hidden sm:block absolute left-12 ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-700 shadow-xl">
            Actual Size (100%)
          </span>
        </button>

        <button
          type="button"
          onClick={onFitToScreen}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-[#1a1e2b] transition-all cursor-pointer relative group"
          title="Fit to Screen"
          aria-label="Fit to Screen"
        >
          <Maximize2 className="w-4 h-4" />
          <span className="hidden sm:block absolute left-12 ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-slate-700 shadow-xl">
            Fit to Screen (F)
          </span>
        </button>
      </div>
    </aside>
  );
};
