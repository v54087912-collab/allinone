import React from 'react';
import {
  Undo2,
  Redo2,
  Download,
  SlidersHorizontal,
  FolderOpen,
  Crop,
  Layers,
  Wand2,
  Sparkles,
  Grid3X3,
  ScanEye,
  Home,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { BackgroundRemovalConfig } from '../types/crop';

interface TopNavigationProps {
  hasImage: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onNewProject: () => void;
  onGoHome: () => void;
  onOpenCustomRpg?: () => void;
  onOpenCustomGridSet?: () => void;
  onOpenDetectObjects?: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  onOpenBgRemoval: () => void;
  cropCount: number;
  selectedCount: number;
  bgConfig: BackgroundRemovalConfig;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  hasImage,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onNewProject,
  onGoHome,
  onOpenCustomRpg,
  onOpenCustomGridSet,
  onOpenDetectObjects,
  onOpenExport,
  onOpenSettings,
  onOpenBgRemoval,
  cropCount,
  selectedCount,
  bgConfig,
  isFullscreen,
  onToggleFullscreen,
}) => {
  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#12151d] px-2 sm:px-4 flex items-center justify-between select-none z-30 transition-colors overflow-x-auto no-scrollbar gap-1 sm:gap-2">
      {/* Left: Brand & Title - Click to go back home */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-1.5 sm:gap-2 group cursor-pointer text-left focus:outline-none transition-transform active:scale-95"
          title="MultiCrop Home - Click to return to home"
          aria-label="MultiCrop Home - Return to home screen"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow shrink-0">
            <Crop className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
          </div>
          <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
            <span className="hidden xs:inline">Toolora</span><span className="text-blue-600 dark:text-blue-400">Crop</span>
            <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 hidden md:inline-block">
              Studio
            </span>
          </span>
        </button>

        <a
          href="/index.html"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-[#1a1e2b] dark:hover:bg-[#23283a] border border-slate-200 dark:border-slate-700/60 transition-colors"
          title="Return to Toolora Home"
        >
          <Home className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span className="hidden md:inline">Toolora Suite</span>
        </a>

        {hasImage && (
          <div className="hidden sm:flex items-center gap-2 ml-2">
            <button
              type="button"
              onClick={onNewProject}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-[#1a1e2b] dark:hover:bg-[#23283a] border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
              title="Replace current image or start over"
              aria-label="New Project"
            >
              <FolderOpen className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              New Image
            </button>

            {onOpenCustomRpg && (
              <button
                type="button"
                onClick={onOpenCustomRpg}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-white bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/60 transition-colors cursor-pointer"
                title="Create Custom RPG Item Sprites (2x3 Grid)"
                aria-label="Custom RPG Sprites (2x3 Grid)"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Custom RPG (2x3)
              </button>
            )}

            {onOpenCustomGridSet && (
              <button
                type="button"
                onClick={onOpenCustomGridSet}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/60 transition-colors cursor-pointer"
                title="Open Custom Grid Set Studio"
                aria-label="Custom Grid Set Studio"
              >
                <Grid3X3 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Custom Grid Set</span>
              </button>
            )}

            {onOpenDetectObjects && (
              <button
                type="button"
                onClick={onOpenDetectObjects}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-white bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 transition-colors cursor-pointer"
                title="Detect Objects - Auto-detect high-contrast sprite boundaries"
                aria-label="Detect Objects"
              >
                <ScanEye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Detect Objects</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Center: History & Quick Actions */}
      {hasImage && (
        <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 dark:bg-[#181b26] p-0.5 sm:p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium ${
              canUndo
                ? 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/50'
                : 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Undo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Undo</span>
          </button>

          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium ${
              canRedo
                ? 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/50'
                : 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Shift+Z / Ctrl+Y)"
            aria-label="Redo"
          >
            <Redo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Redo</span>
          </button>

          <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-0.5 sm:mx-1 hidden xs:block" />

          {/* White BG removal quick toggle/configure */}
          <button
            type="button"
            onClick={onOpenBgRemoval}
            className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
              bgConfig.enabled
                ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-200 border border-blue-300 dark:border-blue-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/70'
            }`}
            title="White Background Removal Settings"
            aria-label="White Background Removal Settings"
          >
            <Wand2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden md:inline">BG Transparency</span>
            {bgConfig.enabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>
      )}

      {/* Right: Settings & Export */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {hasImage && (
          <>
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-1.5 sm:p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a1e2b] border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-colors cursor-pointer"
              title="Application Settings"
              aria-label="Application Settings"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenExport}
              disabled={cropCount === 0}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer ${
                cropCount > 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
              title="Export Crops (PNG / ZIP)"
              aria-label="Export Crops"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
              {cropCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-800 text-blue-100 text-[10px] font-bold border border-blue-400/30">
                  {selectedCount > 0 ? `${selectedCount}/${cropCount}` : cropCount}
                </span>
              )}
            </button>
          </>
        )}

        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="hidden sm:inline-flex p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1a1e2b] border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Studio'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Studio'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </header>
  );
};
