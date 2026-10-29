import React, { useState, useEffect } from 'react';
import {
  Grid3X3,
  Sliders,
  Check,
  RotateCcw,
  AlertTriangle,
  Eye,
  EyeOff,
  Plus,
  Bookmark,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { CropRect, GridConfig, ImageInfo, NamingFormat, CustomGridSet } from '../types/crop';
import { calculateGridCrops } from '../utils/gridGenerator';
import { getAllGridSets, saveUserCustomGridSet } from '../utils/gridPresets';

interface GridCropSettingsProps {
  imageInfo: ImageInfo;
  gridConfig: GridConfig;
  setGridConfig: React.Dispatch<React.SetStateAction<GridConfig>>;
  showGridPreview: boolean;
  setShowGridPreview: React.Dispatch<React.SetStateAction<boolean>>;
  existingCropCount: number;
  onApplyGrid: (crops: CropRect[], replaceExisting: boolean) => void;
  onClose: () => void;
  onOpenCustomGridSetModal?: () => void;
  namingFormat?: NamingFormat;
  namingPrefix?: string;
}

export const GridCropSettings: React.FC<GridCropSettingsProps> = ({
  imageInfo,
  gridConfig,
  setGridConfig,
  showGridPreview,
  setShowGridPreview,
  existingCropCount,
  onApplyGrid,
  onClose,
  onOpenCustomGridSetModal,
  namingFormat = 'number',
  namingPrefix = 'asset',
}) => {
  const [showReplaceWarning, setShowReplaceWarning] = useState(false);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [availablePresets, setAvailablePresets] = useState<CustomGridSet[]>([]);
  const [uniformMargin, setUniformMargin] = useState(
    gridConfig.marginTop === gridConfig.marginBottom &&
      gridConfig.marginLeft === gridConfig.marginRight &&
      gridConfig.marginTop === gridConfig.marginLeft
  );
  const [uniformGap, setUniformGap] = useState(gridConfig.gapX === gridConfig.gapY);

  useEffect(() => {
    setAvailablePresets(getAllGridSets());
  }, []);

  const previewCrops = calculateGridCrops(
    gridConfig,
    imageInfo.width,
    imageInfo.height,
    existingCropCount,
    namingFormat,
    namingPrefix
  );

  const handleApplyClick = () => {
    if (existingCropCount > 0) {
      setShowReplaceWarning(true);
    } else {
      onApplyGrid(previewCrops, true);
      onClose();
    }
  };

  const handleConfirmApply = (replace: boolean) => {
    onApplyGrid(previewCrops, replace);
    setShowReplaceWarning(false);
    onClose();
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    saveUserCustomGridSet(newPresetName, gridConfig);
    setAvailablePresets(getAllGridSets());
    setNewPresetName('');
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setShowSavePreset(false);
    }, 2000);
  };

  const setAllMargins = (val: number) => {
    setGridConfig({
      ...gridConfig,
      marginTop: val,
      marginBottom: val,
      marginLeft: val,
      marginRight: val,
    });
  };

  const setAllGaps = (val: number) => {
    setGridConfig({
      ...gridConfig,
      gapX: val,
      gapY: val,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#12151d] text-slate-800 dark:text-slate-200 select-none overflow-hidden">
      {/* Panel Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11131c] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Grid3X3 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Custom Grid Set</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Custom matrix &amp; tile generator</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowGridPreview(!showGridPreview)}
            className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              showGridPreview
                ? 'bg-blue-50 dark:bg-blue-900/60 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Toggle Canvas Preview"
          >
            {showGridPreview ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{showGridPreview ? 'Preview' : 'Off'}</span>
          </button>
        </div>
      </div>

      {/* Quick Launch Full Modal Banner */}
      {onOpenCustomGridSetModal && (
        <div className="p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/60 dark:to-[#181b26] border-b border-blue-100 dark:border-blue-900/40 shrink-0">
          <button
            type="button"
            onClick={onOpenCustomGridSetModal}
            className="w-full py-1.5 px-2.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-300 dark:border-blue-500/50 text-blue-700 dark:text-blue-200 hover:text-blue-900 dark:hover:text-white text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
              <span>Open Custom Grid Studio</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-300" />
          </button>
        </div>
      )}

      {/* Form Controls */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 text-xs">
        {/* Preset Selector Dropdown / Chips */}
        <div className="bg-slate-50 dark:bg-[#181b26] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Grid Sets &amp; Presets</span>
            </span>
            <span className="text-[10px] text-slate-500">{availablePresets.length} available</span>
          </div>

          <select
            onChange={(e) => {
              const selected = availablePresets.find((p) => p.id === e.target.value);
              if (selected) {
                setGridConfig({ ...selected.config });
              }
            }}
            defaultValue=""
            className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="" disabled>
              Select a Grid Set Preset...
            </option>
            {availablePresets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.isBuiltIn ? '' : '★ (Custom)'}
              </option>
            ))}
          </select>

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1 pt-1">
            {[
              { label: '2×3 RPG', rows: 2, cols: 3, margin: 20, gap: 10 },
              { label: '2×2', rows: 2, cols: 2, margin: 0, gap: 0 },
              { label: '3×3', rows: 3, cols: 3, margin: 10, gap: 8 },
              { label: '4×4', rows: 4, cols: 4, margin: 0, gap: 0 },
              { label: '32px', size: 32 },
              { label: '64px', size: 64 },
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (chip.size) {
                    setGridConfig({
                      ...gridConfig,
                      sizingMode: 'fixed-size',
                      cellWidth: chip.size,
                      cellHeight: chip.size,
                      autoCalculate: false,
                    });
                  } else {
                    setGridConfig({
                      ...gridConfig,
                      sizingMode: 'rows-cols',
                      rows: chip.rows || 2,
                      cols: chip.cols || 2,
                      marginTop: chip.margin ?? 0,
                      marginBottom: chip.margin ?? 0,
                      marginLeft: chip.margin ?? 0,
                      marginRight: chip.margin ?? 0,
                      gapX: chip.gap ?? 0,
                      gapY: chip.gap ?? 0,
                      autoCalculate: true,
                    });
                  }
                }}
                className="px-2 py-0.5 rounded bg-white dark:bg-[#12151d] text-[10px] font-mono text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-900/40 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sizing Mode: Rows-Cols vs Fixed Size */}
        <div className="bg-slate-50 dark:bg-[#181b26] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Sizing Mode</span>
            <div className="flex bg-slate-200 dark:bg-[#12151d] p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px]">
              <button
                type="button"
                onClick={() => setGridConfig({ ...gridConfig, sizingMode: 'rows-cols' })}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  (gridConfig.sizingMode || 'rows-cols') === 'rows-cols'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Rows×Cols
              </button>
              <button
                type="button"
                onClick={() =>
                  setGridConfig({ ...gridConfig, sizingMode: 'fixed-size', autoCalculate: false })
                }
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  gridConfig.sizingMode === 'fixed-size'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Fixed Tile px
              </button>
            </div>
          </div>

          {gridConfig.sizingMode === 'fixed-size' ? (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Tile Width (px)</label>
                <input
                  type="number"
                  min="4"
                  max={imageInfo.width}
                  value={gridConfig.cellWidth}
                  onChange={(e) =>
                    setGridConfig({
                      ...gridConfig,
                      cellWidth: Math.max(4, parseInt(e.target.value) || 4),
                    })
                  }
                  className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Tile Height (px)</label>
                <input
                  type="number"
                  min="4"
                  max={imageInfo.height}
                  value={gridConfig.cellHeight}
                  onChange={(e) =>
                    setGridConfig({
                      ...gridConfig,
                      cellHeight: Math.max(4, parseInt(e.target.value) || 4),
                    })
                  }
                  className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Rows</label>
                  <input
                    type="number"
                    min="1"
                    max="64"
                    value={gridConfig.rows}
                    onChange={(e) =>
                      setGridConfig({
                        ...gridConfig,
                        rows: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Columns</label>
                  <input
                    type="number"
                    min="1"
                    max="64"
                    value={gridConfig.cols}
                    onChange={(e) =>
                      setGridConfig({
                        ...gridConfig,
                        cols: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Auto Calculate or Custom Dimensions */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Auto-fit Cell Size</span>
                <button
                  type="button"
                  onClick={() =>
                    setGridConfig({ ...gridConfig, autoCalculate: !gridConfig.autoCalculate })
                  }
                  className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${
                    gridConfig.autoCalculate ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full bg-white transition-transform absolute top-0.5 ${
                      gridConfig.autoCalculate ? 'left-4.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {!gridConfig.autoCalculate && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1">Cell Width (px)</label>
                    <input
                      type="number"
                      min="4"
                      max={imageInfo.width}
                      value={gridConfig.cellWidth}
                      onChange={(e) =>
                        setGridConfig({
                          ...gridConfig,
                          cellWidth: Math.max(4, parseInt(e.target.value) || 4),
                        })
                      }
                      className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 mb-1">Cell Height (px)</label>
                    <input
                      type="number"
                      min="4"
                      max={imageInfo.height}
                      value={gridConfig.cellHeight}
                      onChange={(e) =>
                        setGridConfig({
                          ...gridConfig,
                          cellHeight: Math.max(4, parseInt(e.target.value) || 4),
                        })
                      }
                      className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Spacing & Gaps */}
        <div className="bg-slate-50 dark:bg-[#181b26] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Spacing / Gap</span>
            <button
              type="button"
              onClick={() => setUniformGap(!uniformGap)}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-500 cursor-pointer"
            >
              {uniformGap ? 'Separate X/Y' : 'Uniform'}
            </button>
          </div>

          {uniformGap ? (
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                <span>Gap ({gridConfig.gapX}px)</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={gridConfig.gapX}
                onChange={(e) => setAllGaps(parseInt(e.target.value) || 0)}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Gap X (px)</label>
                <input
                  type="number"
                  min="0"
                  value={gridConfig.gapX}
                  onChange={(e) =>
                    setGridConfig({
                      ...gridConfig,
                      gapX: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Gap Y (px)</label>
                <input
                  type="number"
                  min="0"
                  value={gridConfig.gapY}
                  onChange={(e) =>
                    setGridConfig({
                      ...gridConfig,
                      gapY: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Outer Margins */}
        <div className="bg-slate-50 dark:bg-[#181b26] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Outer Margins (px)</span>
            <button
              type="button"
              onClick={() => setUniformMargin(!uniformMargin)}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-500 cursor-pointer"
            >
              {uniformMargin ? 'Individual' : 'Uniform'}
            </button>
          </div>

          {uniformMargin ? (
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                <span>Margin all sides ({gridConfig.marginTop}px)</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={gridConfig.marginTop}
                onChange={(e) => setAllMargins(parseInt(e.target.value) || 0)}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-0.5">Top</label>
                <input
                  type="number"
                  min="0"
                  value={gridConfig.marginTop}
                  onChange={(e) =>
                    setGridConfig({
                      ...gridConfig,
                      marginTop: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-0.5">Bottom</label>
                <input
                  type="number"
                  min="0"
                  value={gridConfig.marginBottom}
                  onChange={(e) =>
                    setGridConfig({
                      ...gridConfig,
                      marginBottom: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-0.5">Left</label>
                <input
                  type="number"
                  min="0"
                  value={gridConfig.marginLeft}
                  onChange={(e) =>
                    setGridConfig({
                      ...gridConfig,
                      marginLeft: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-0.5">Right</label>
                <input
                  type="number"
                  min="0"
                  value={gridConfig.marginRight}
                  onChange={(e) =>
                    setGridConfig({
                      ...gridConfig,
                      marginRight: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Save Current as Custom Preset Section */}
        <div className="bg-slate-50 dark:bg-[#181b26] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
          {!showSavePreset ? (
            <button
              type="button"
              onClick={() => setShowSavePreset(true)}
              className="w-full py-1.5 px-2 rounded-lg bg-white dark:bg-[#12151d] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60 flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
            >
              <Bookmark className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Save as Custom Grid Set</span>
            </button>
          ) : (
            <form onSubmit={handleSavePreset} className="space-y-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">Name your Custom Grid Set</span>
              <input
                type="text"
                placeholder="E.g. Inventory 4x6"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className="w-full bg-white dark:bg-[#12151d] border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <div className="flex gap-1.5">
                <button
                  type="submit"
                  disabled={!newPresetName.trim()}
                  className="flex-1 py-1 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Save Set
                </button>
                <button
                  type="button"
                  onClick={() => setShowSavePreset(false)}
                  className="py-1 px-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-400 text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              {saveSuccess && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Saved to presets!</p>
              )}
            </form>
          )}
        </div>

        {/* Calculated summary badge */}
        <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 flex items-center justify-between font-mono">
          <span>Will generate:</span>
          <span className="font-bold text-blue-950 dark:text-white">{previewCrops.length} assets</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#12151d] shrink-0 space-y-2">
        <button
          type="button"
          onClick={handleApplyClick}
          disabled={previewCrops.length === 0}
          className={`w-full py-2.5 px-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
            previewCrops.length > 0
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>Apply Grid ({previewCrops.length} Crops)</span>
        </button>
      </div>

      {/* Replace Warning Modal */}
      {showReplaceWarning && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181b26] border border-slate-200 dark:border-slate-700 rounded-2xl p-4 max-w-xs w-full shadow-2xl">
            <div className="flex items-center gap-2.5 text-amber-500 dark:text-amber-400 mb-2 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Existing Crops Detected</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              You already have {existingCropCount} crop rectangle{existingCropCount > 1 ? 's' : ''} on the canvas.
              Do you want to replace them or append the new grid?
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleConfirmApply(true)}
                className="w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Replace All Existing Crops
              </button>
              <button
                type="button"
                onClick={() => handleConfirmApply(false)}
                className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Append New Grid Crops
              </button>
              <button
                type="button"
                onClick={() => setShowReplaceWarning(false)}
                className="w-full py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
