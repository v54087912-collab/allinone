import React, { useState, useEffect } from 'react';
import {
  Grid3X3,
  Sliders,
  Check,
  Bookmark,
  Trash2,
  X,
  Layers,
  ArrowRight,
  Maximize2,
  Hash,
  AlertTriangle,
  FolderHeart,
  Plus,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { CropRect, GridConfig, ImageInfo, NamingFormat, CustomGridSet } from '../types/crop';
import { calculateGridCrops } from '../utils/gridGenerator';
import {
  getAllGridSets,
  saveUserCustomGridSet,
  deleteUserCustomGridSet,
  BUILT_IN_GRID_SETS,
} from '../utils/gridPresets';

interface CustomGridSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageInfo: ImageInfo;
  currentGridConfig: GridConfig;
  onApplyGrid: (crops: CropRect[], replaceExisting: boolean) => void;
  onUpdateGridConfig: (newConfig: GridConfig) => void;
  existingCropCount: number;
  namingFormat?: NamingFormat;
  defaultPrefix?: string;
}

export const CustomGridSetModal: React.FC<CustomGridSetModalProps> = ({
  isOpen,
  onClose,
  imageInfo,
  currentGridConfig,
  onApplyGrid,
  onUpdateGridConfig,
  existingCropCount,
  namingFormat = 'number',
  defaultPrefix = 'asset',
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'builder'>('builder');
  const [gridSets, setGridSets] = useState<CustomGridSet[]>([]);
  const [config, setConfig] = useState<GridConfig>({ ...currentGridConfig });
  const [customSetName, setCustomSetName] = useState('');
  const [customSetDesc, setCustomSetDesc] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [showReplaceWarning, setShowReplaceWarning] = useState(false);
  const [uniformMargin, setUniformMargin] = useState(
    config.marginTop === config.marginBottom &&
      config.marginLeft === config.marginRight &&
      config.marginTop === config.marginLeft
  );
  const [uniformGap, setUniformGap] = useState(config.gapX === config.gapY);

  // Load grid sets on modal open
  useEffect(() => {
    if (isOpen) {
      setGridSets(getAllGridSets());
      setConfig({ ...currentGridConfig });
    }
  }, [isOpen, currentGridConfig]);

  if (!isOpen) return null;

  // Calculate preview crops
  const previewCrops = calculateGridCrops(
    config,
    imageInfo.width,
    imageInfo.height,
    existingCropCount,
    namingFormat,
    defaultPrefix
  );

  const handleApplyPreset = (preset: CustomGridSet) => {
    const updated = { ...preset.config };
    setConfig(updated);
    onUpdateGridConfig(updated);
    // If user clicked quick apply on card
    const crops = calculateGridCrops(
      updated,
      imageInfo.width,
      imageInfo.height,
      existingCropCount,
      namingFormat,
      defaultPrefix
    );
    if (existingCropCount > 0) {
      setShowReplaceWarning(true);
    } else {
      onApplyGrid(crops, true);
      onClose();
    }
  };

  const handleLoadIntoBuilder = (preset: CustomGridSet) => {
    const updated = { ...preset.config };
    setConfig(updated);
    onUpdateGridConfig(updated);
    setActiveTab('builder');
  };

  const handleDeleteUserSet = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteUserCustomGridSet(id);
    setGridSets(getAllGridSets());
  };

  const handleSaveCurrentSet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSetName.trim()) return;

    const saved = saveUserCustomGridSet(customSetName, config, customSetDesc);
    setGridSets(getAllGridSets());
    setCustomSetName('');
    setCustomSetDesc('');
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  const handleCommitApply = (replace: boolean) => {
    onApplyGrid(previewCrops, replace);
    onUpdateGridConfig(config);
    setShowReplaceWarning(false);
    onClose();
  };

  const handleApplyClick = () => {
    if (existingCropCount > 0) {
      setShowReplaceWarning(true);
    } else {
      onApplyGrid(previewCrops, true);
      onUpdateGridConfig(config);
      onClose();
    }
  };

  // Helper to update uniform margin
  const setAllMargins = (val: number) => {
    setConfig((prev) => ({
      ...prev,
      marginTop: val,
      marginBottom: val,
      marginLeft: val,
      marginRight: val,
    }));
  };

  // Helper to update uniform gaps
  const setAllGaps = (val: number) => {
    setConfig((prev) => ({
      ...prev,
      gapX: val,
      gapY: val,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-[#12151d] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-3 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 bg-slate-50 dark:bg-[#161a24] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-700/80 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm shrink-0">
              <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white truncate">Custom Grid Set</h2>
                <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/60">
                  Feature
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden xs:block truncate">
                Build custom grid dimensions or load pre-configured grid templates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* View Switcher Tabs */}
            <div className="flex bg-slate-100 dark:bg-[#0f1117] p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('builder')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                  activeTab === 'builder'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="text-[11px] sm:text-xs">Builder</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 sm:gap-1.5 ${
                  activeTab === 'presets'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span className="text-[11px] sm:text-xs">Presets ({gridSets.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-slate-800 dark:text-slate-200">
          {activeTab === 'presets' ? (
            /* PRESETS LIBRARY VIEW */
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Available Grid Sets &amp; Templates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {gridSets.map((set) => {
                    const isCustom = !set.isBuiltIn;
                    const testCrops = calculateGridCrops(
                      set.config,
                      imageInfo.width,
                      imageInfo.height,
                      0,
                      namingFormat,
                      defaultPrefix
                    );

                    return (
                      <div
                        key={set.id}
                        className={`group p-4 rounded-xl border transition-all flex flex-col justify-between ${
                          isCustom
                            ? 'bg-gradient-to-b from-blue-50/50 to-white dark:from-[#1b1c2b] dark:to-[#141620] border-blue-200 dark:border-blue-800/60 hover:border-blue-400 dark:hover:border-blue-500'
                            : 'bg-slate-50 dark:bg-[#161922] border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-700/60 hover:bg-slate-100/60 dark:hover:bg-[#1a1e2b]'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                                {set.name}
                              </span>
                              {isCustom ? (
                                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/80">
                                  Custom
                                </span>
                              ) : (
                                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400">
                                  Preset
                                </span>
                              )}
                            </div>

                            {isCustom && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteUserSet(e, set.id)}
                                className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors cursor-pointer"
                                title="Delete Custom Set"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                            {set.description || 'Configured grid set'}
                          </p>

                          {/* Mini Specs Badge */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-4 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            <span className="px-2 py-0.5 rounded bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-slate-800 text-blue-700 dark:text-blue-300">
                              {set.config.sizingMode === 'fixed-size'
                                ? `${set.config.cellWidth}×${set.config.cellHeight}px`
                                : `${set.config.rows}R × ${set.config.cols}C`}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                              {testCrops.length} crops
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-slate-800">
                              Gap: {set.config.gapX}px
                            </span>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => handleLoadIntoBuilder(set)}
                            className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-[#0f1117] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer text-center"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyPreset(set)}
                            className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <span>Apply</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* BUILDER VIEW */
            <div className="space-y-6">
              {/* Sizing Mode Selection */}
              <div className="bg-slate-50 dark:bg-[#161922] p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Grid Sizing Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, sizingMode: 'rows-cols' })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      (config.sizingMode || 'rows-cols') === 'rows-cols'
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-white'
                        : 'bg-white dark:bg-[#12151d] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">By Rows &amp; Columns</span>
                      {(config.sizingMode || 'rows-cols') === 'rows-cols' && (
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Specify exact number of rows and columns (e.g. 2×3, 4×4) across canvas
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setConfig({ ...config, sizingMode: 'fixed-size', autoCalculate: false })
                    }
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      config.sizingMode === 'fixed-size'
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-white'
                        : 'bg-white dark:bg-[#12151d] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">By Fixed Tile Size (px)</span>
                      {config.sizingMode === 'fixed-size' && (
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Specify exact cell pixel dimensions (e.g. 16×16, 32×32, 64×64)
                    </p>
                  </button>
                </div>
              </div>

              {/* Grid Dimensions & Cell Controls */}
              <div className="bg-slate-50 dark:bg-[#161922] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Grid Dimensions
                  </h3>

                  {/* Quick Preset Chips */}
                  <div className="flex flex-wrap items-center gap-1 text-[11px]">
                    <span className="text-slate-400 dark:text-slate-500 mr-1 hidden sm:inline">Presets:</span>
                    {[
                      { label: '2×2', r: 2, c: 2, mode: 'rows-cols' as const },
                      { label: '2×3 RPG', r: 2, c: 3, mode: 'rows-cols' as const },
                      { label: '3×3', r: 3, c: 3, mode: 'rows-cols' as const },
                      { label: '4×4', r: 4, c: 4, mode: 'rows-cols' as const },
                      { label: '16px', size: 16, mode: 'fixed-size' as const },
                      { label: '32px', size: 32, mode: 'fixed-size' as const },
                      { label: '64px', size: 64, mode: 'fixed-size' as const },
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (p.mode === 'rows-cols') {
                            setConfig({
                              ...config,
                              sizingMode: 'rows-cols',
                              rows: p.r || 2,
                              cols: p.c || 2,
                            });
                          } else {
                            setConfig({
                              ...config,
                              sizingMode: 'fixed-size',
                              cellWidth: p.size || 32,
                              cellHeight: p.size || 32,
                              autoCalculate: false,
                            });
                          }
                        }}
                        className="px-2 py-0.5 rounded-md bg-white dark:bg-[#0f1117] hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-200 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {config.sizingMode === 'fixed-size' ? (
                  /* Fixed Pixel Size Inputs */
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 text-xs mb-1.5 font-medium">
                          Tile Width (px)
                        </label>
                        <input
                          type="number"
                          min="4"
                          max={imageInfo.width}
                          value={config.cellWidth}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              cellWidth: Math.max(4, parseInt(e.target.value) || 4),
                            })
                          }
                          className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 text-xs mb-1.5 font-medium">
                          Tile Height (px)
                        </label>
                        <input
                          type="number"
                          min="4"
                          max={imageInfo.height}
                          value={config.cellHeight}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              cellHeight: Math.max(4, parseInt(e.target.value) || 4),
                            })
                          }
                          className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Rows & Columns Inputs */
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 text-xs mb-1.5 font-medium">
                          Rows
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="64"
                          value={config.rows}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              rows: Math.max(1, parseInt(e.target.value) || 1),
                            })
                          }
                          className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 text-xs mb-1.5 font-medium">
                          Columns
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="64"
                          value={config.cols}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              cols: Math.max(1, parseInt(e.target.value) || 1),
                            })
                          }
                          className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          Auto-fit Cell Dimensions
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Automatically scale cells to fill the available image space
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setConfig({ ...config, autoCalculate: !config.autoCalculate })
                        }
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          config.autoCalculate ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                            config.autoCalculate ? 'left-6' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>

                    {!config.autoCalculate && (
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 text-xs mb-1">
                            Fixed Cell Width (px)
                          </label>
                          <input
                            type="number"
                            min="4"
                            max={imageInfo.width}
                            value={config.cellWidth}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                cellWidth: Math.max(4, parseInt(e.target.value) || 4),
                              })
                            }
                            className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 text-xs mb-1">
                            Fixed Cell Height (px)
                          </label>
                          <input
                            type="number"
                            min="4"
                            max={imageInfo.height}
                            value={config.cellHeight}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                cellHeight: Math.max(4, parseInt(e.target.value) || 4),
                              })
                            }
                            className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Spacing & Margins Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Spacing / Gaps */}
                <div className="bg-slate-50 dark:bg-[#161922] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">Spacing / Gaps (px)</span>
                    <button
                      type="button"
                      onClick={() => setUniformGap(!uniformGap)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 cursor-pointer font-medium"
                    >
                      {uniformGap ? 'Separate X/Y' : 'Uniform Spacing'}
                    </button>
                  </div>

                  {uniformGap ? (
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <span>Uniform Gap</span>
                        <span className="font-mono text-slate-900 dark:text-white">{config.gapX}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="64"
                        value={config.gapX}
                        onChange={(e) => setAllGaps(parseInt(e.target.value) || 0)}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                      <div className="flex items-center gap-1.5 mt-2">
                        {[0, 2, 4, 8, 10, 16].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setAllGaps(g)}
                            className="px-2 py-0.5 rounded bg-white dark:bg-[#12151d] text-[11px] font-mono text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white border border-slate-200 dark:border-slate-800 cursor-pointer"
                          >
                            {g}px
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 text-xs mb-1">Gap X (H)</label>
                        <input
                          type="number"
                          min="0"
                          value={config.gapX}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              gapX: Math.max(0, parseInt(e.target.value) || 0),
                            })
                          }
                          className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 text-xs mb-1">Gap Y (V)</label>
                        <input
                          type="number"
                          min="0"
                          value={config.gapY}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              gapY: Math.max(0, parseInt(e.target.value) || 0),
                            })
                          }
                          className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Outer Margins */}
                <div className="bg-slate-50 dark:bg-[#161922] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">Outer Margins (px)</span>
                    <button
                      type="button"
                      onClick={() => setUniformMargin(!uniformMargin)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 cursor-pointer font-medium"
                    >
                      {uniformMargin ? 'Individual Sides' : 'Uniform Margin'}
                    </button>
                  </div>

                  {uniformMargin ? (
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <span>Padding on all sides</span>
                        <span className="font-mono text-slate-900 dark:text-white">{config.marginTop}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="128"
                        value={config.marginTop}
                        onChange={(e) => setAllMargins(parseInt(e.target.value) || 0)}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                      <div className="flex items-center gap-1.5 mt-2">
                        {[0, 10, 20, 32, 48].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setAllMargins(m)}
                            className="px-2 py-0.5 rounded bg-white dark:bg-[#12151d] text-[11px] font-mono text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white border border-slate-200 dark:border-slate-800 cursor-pointer"
                          >
                            {m}px
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1">Top</label>
                        <input
                          type="number"
                          min="0"
                          value={config.marginTop}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              marginTop: Math.max(0, parseInt(e.target.value) || 0),
                            })
                          }
                          className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1">Bottom</label>
                        <input
                          type="number"
                          min="0"
                          value={config.marginBottom}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              marginBottom: Math.max(0, parseInt(e.target.value) || 0),
                            })
                          }
                          className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1">Left</label>
                        <input
                          type="number"
                          min="0"
                          value={config.marginLeft}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              marginLeft: Math.max(0, parseInt(e.target.value) || 0),
                            })
                          }
                          className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 mb-1">Right</label>
                        <input
                          type="number"
                          min="0"
                          value={config.marginRight}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              marginRight: Math.max(0, parseInt(e.target.value) || 0),
                            })
                          }
                          className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Numbering & Ordering Controls (Honoring numeric naming 1, 2, 3...) */}
              <div className="bg-slate-50 dark:bg-[#161922] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Hash className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Asset Numbering &amp; Order
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 text-xs mb-1">Start Number</label>
                    <input
                      type="number"
                      min="1"
                      value={config.startNumber || 1}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          startNumber: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                      className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 text-xs mb-1">Slice Direction</label>
                    <select
                      value={config.order || 'row-major'}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          order: e.target.value as 'row-major' | 'col-major',
                        })
                      }
                      className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="row-major">Row-first (Left to Right)</option>
                      <option value="col-major">Column-first (Top to Bottom)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 text-xs mb-1">Center in Canvas</label>
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, centerGrid: !config.centerGrid })}
                      className={`w-full py-1.5 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                        config.centerGrid
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 dark:border-blue-600 text-blue-700 dark:text-blue-200'
                          : 'bg-white dark:bg-[#12151d] border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${config.centerGrid ? 'opacity-100' : 'opacity-0'}`} />
                      <span>{config.centerGrid ? 'Centered' : 'Top-Left aligned'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Save As Custom Grid Set Section */}
              <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50 dark:from-blue-950/30 dark:via-[#181b26] dark:to-[#12151d] p-4 rounded-2xl border border-blue-200 dark:border-blue-800/40">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-sm mb-2">
                  <Bookmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Save this Configuration as a Custom Grid Set</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Save this grid setup with your custom dimensions, gaps, and margins to reuse anytime.
                </p>
                <form onSubmit={handleSaveCurrentSet} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="E.g. Inventory Grid 4x5, Weapon Icons 64px..."
                    value={customSetName}
                    onChange={(e) => setCustomSetName(e.target.value)}
                    className="flex-1 bg-white dark:bg-[#0f1117] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!customSetName.trim()}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                      customSetName.trim()
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Save Grid Set</span>
                  </button>
                </form>
                {saveSuccessMsg && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Custom Grid Set saved successfully to presets!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Live Calculation Bar & Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161a24] shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold">
              {previewCrops.length} assets
            </span>
            {previewCrops[0] && (
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                Cell: {previewCrops[0].width} × {previewCrops[0].height} px
              </span>
            )}
            <span className="text-slate-500 dark:text-slate-400 text-xs font-sans">
              Naming: {previewCrops.length > 0 ? `${previewCrops[0].name}, ${previewCrops[1]?.name || '...'}, ${previewCrops[previewCrops.length - 1]?.name}` : 'none'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#0f1117] hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyClick}
              disabled={previewCrops.length === 0}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                previewCrops.length > 0
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Apply Grid ({previewCrops.length} Crops)</span>
            </button>
          </div>
        </div>

        {/* Replace Existing Crops Warning Modal */}
        {showReplaceWarning && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#181b26] border border-slate-200 dark:border-slate-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2.5 text-amber-500 dark:text-amber-400 mb-2 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Existing Crops on Canvas</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                You already have {existingCropCount} crop rectangle{existingCropCount > 1 ? 's' : ''}.
                Do you want to replace them or append the new grid crops?
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleCommitApply(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Replace All Existing Crops
                </button>
                <button
                  type="button"
                  onClick={() => handleCommitApply(false)}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Append New Grid Crops
                </button>
                <button
                  type="button"
                  onClick={() => setShowReplaceWarning(false)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
