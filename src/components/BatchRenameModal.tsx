import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Tag,
  Check,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Search,
  ListOrdered,
  Layers,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { BackgroundRemovalConfig, CropRect, ImageInfo } from '../types/crop';
import { generateCropThumbnail } from '../utils/exportUtils';
import {
  BatchRenameConfig,
  BatchRenameMode,
  BatchRenameSortOrder,
  CaseTransform,
  DEFAULT_BATCH_RENAME_CONFIG,
  generateBatchNames,
} from '../utils/batchRename';

interface BatchRenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageInfo: ImageInfo;
  allCrops: CropRect[];
  selectedCropIds: Set<string>;
  onApplyBatchRename: (renames: { id: string; name: string }[]) => void;
  bgConfig: BackgroundRemovalConfig;
}

export const BatchRenameModal: React.FC<BatchRenameModalProps> = ({
  isOpen,
  onClose,
  imageInfo,
  allCrops,
  selectedCropIds,
  onApplyBatchRename,
  bgConfig,
}) => {
  // Option to rename only selected crops or all crops
  const hasSelection = selectedCropIds.size > 0 && selectedCropIds.size < allCrops.length;
  const [scope, setScope] = useState<'selected' | 'all'>(hasSelection ? 'selected' : 'all');

  const [config, setConfig] = useState<BatchRenameConfig>({
    ...DEFAULT_BATCH_RENAME_CONFIG,
  });

  const [previewThumbnails, setPreviewThumbnails] = useState<Map<string, string>>(new Map());

  // Reset scope when modal opens
  useEffect(() => {
    if (isOpen) {
      setScope(selectedCropIds.size > 0 ? 'selected' : 'all');
    }
  }, [isOpen, selectedCropIds.size]);

  // Determine which crops to rename
  const targetCrops = useMemo(() => {
    if (scope === 'selected' && selectedCropIds.size > 0) {
      return allCrops.filter((c) => selectedCropIds.has(c.id));
    }
    return allCrops;
  }, [allCrops, selectedCropIds, scope]);

  // Generate previews using pure logic
  const previews = useMemo(() => {
    return generateBatchNames(targetCrops, config);
  }, [targetCrops, config]);

  // Check for any duplicate new names
  const hasConflicts = useMemo(() => {
    return previews.some((p) => p.hasConflict);
  }, [previews]);

  // Generate thumbnails for preview list
  useEffect(() => {
    if (!isOpen || !imageInfo.element || targetCrops.length === 0) return;

    const map = new Map<string, string>();
    targetCrops.forEach((c) => {
      try {
        const thumb = generateCropThumbnail(imageInfo.element!, c, 80, bgConfig);
        map.set(c.id, thumb);
      } catch {
        // ignore
      }
    });
    setPreviewThumbnails(map);
  }, [isOpen, imageInfo, targetCrops, bgConfig]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (previews.length === 0) return;
    const renames = previews.map((p) => ({
      id: p.id,
      name: p.newName,
    }));
    onApplyBatchRename(renames);
    onClose();
  };

  const prefixPresets = ['sprite', 'icon', 'item', 'tile', 'character', 'card', 'frame'];

  const insertToken = (token: string) => {
    setConfig((prev) => ({
      ...prev,
      template: `${prev.template}${token}`,
    }));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-rename-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-[#141722] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-[#11131c]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 id="batch-rename-title" className="text-base font-bold text-white flex items-center gap-2">
                Batch Rename Assets
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-950/80 text-violet-300 border border-violet-800/60 font-mono">
                  {targetCrops.length} {targetCrops.length === 1 ? 'item' : 'items'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Apply sequential patterns, prefixes, find-and-replace, or custom templates to selected assets.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close batch rename modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scope selector (if selection exists) */}
        {selectedCropIds.size > 0 && selectedCropIds.size < allCrops.length && (
          <div className="px-6 py-2.5 bg-[#171a27] border-b border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Assets to Rename:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScope('selected')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  scope === 'selected'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Selected Only ({selectedCropIds.size})
              </button>
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  scope === 'all'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                All Assets ({allCrops.length})
              </button>
            </div>
          </div>
        )}

        {/* Main Content: Split into Configuration Form and Live Preview */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* Left Column: Pattern Configuration (5 cols) */}
          <div className="lg:col-span-6 p-5 overflow-y-auto space-y-4">
            {/* Pattern Mode Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Naming Pattern Mode
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-[#0e1017] p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, mode: 'prefix-sequence' }))}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center cursor-pointer ${
                    config.mode === 'prefix-sequence'
                      ? 'bg-violet-600 text-white font-semibold shadow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  Prefix + Sequence
                </button>
                <button
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, mode: 'sequence-only' }))}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center cursor-pointer ${
                    config.mode === 'sequence-only'
                      ? 'bg-violet-600 text-white font-semibold shadow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  Sequence Only
                </button>
                <button
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, mode: 'find-replace' }))}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center cursor-pointer ${
                    config.mode === 'find-replace'
                      ? 'bg-violet-600 text-white font-semibold shadow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  Find & Replace
                </button>
                <button
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, mode: 'custom-template' }))}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center cursor-pointer ${
                    config.mode === 'custom-template'
                      ? 'bg-violet-600 text-white font-semibold shadow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  Custom Template
                </button>
              </div>
            </div>

            {/* Pattern-specific inputs */}
            {config.mode === 'prefix-sequence' && (
              <div className="space-y-3 p-3.5 bg-[#171b26] border border-slate-800/80 rounded-xl">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">Prefix</label>
                    <span className="text-[11px] text-slate-500">e.g. &quot;sprite&quot;</span>
                  </div>
                  <input
                    type="text"
                    value={config.prefix}
                    onChange={(e) => setConfig((prev) => ({ ...prev, prefix: e.target.value }))}
                    placeholder="Enter prefix..."
                    className="w-full px-3 py-1.5 bg-[#10131c] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                  {/* Preset chips */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {prefixPresets.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, prefix: p }))}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          config.prefix === p
                            ? 'bg-violet-600 border-violet-500 text-white'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Separator</label>
                    <select
                      value={config.separator}
                      onChange={(e) => setConfig((prev) => ({ ...prev, separator: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-[#10131c] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="_">Underscore (_)</option>
                      <option value="-">Dash (-)</option>
                      <option value=".">Dot (.)</option>
                      <option value="">None</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Optional Suffix</label>
                    <input
                      type="text"
                      value={config.suffix}
                      onChange={(e) => setConfig((prev) => ({ ...prev, suffix: e.target.value }))}
                      placeholder="e.g. idle"
                      className="w-full px-2.5 py-1.5 bg-[#10131c] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {config.mode === 'sequence-only' && (
              <div className="space-y-3 p-3.5 bg-[#171b26] border border-slate-800/80 rounded-xl">
                <p className="text-xs text-slate-400">
                  Items will be named purely as sequential numbers (e.g., <code className="text-violet-400 font-mono">01, 02, 03</code>).
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Optional Suffix</label>
                    <input
                      type="text"
                      value={config.suffix}
                      onChange={(e) => setConfig((prev) => ({ ...prev, suffix: e.target.value }))}
                      placeholder="e.g. idle"
                      className="w-full px-2.5 py-1.5 bg-[#10131c] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Separator</label>
                    <select
                      value={config.separator}
                      onChange={(e) => setConfig((prev) => ({ ...prev, separator: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-[#10131c] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="_">Underscore (_)</option>
                      <option value="-">Dash (-)</option>
                      <option value=".">Dot (.)</option>
                      <option value="">None</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {config.mode === 'find-replace' && (
              <div className="space-y-3 p-3.5 bg-[#171b26] border border-slate-800/80 rounded-xl">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Find text</label>
                  <input
                    type="text"
                    value={config.findText}
                    onChange={(e) => setConfig((prev) => ({ ...prev, findText: e.target.value }))}
                    placeholder="Text to replace (e.g. 'crop_')..."
                    className="w-full px-3 py-1.5 bg-[#10131c] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Replace with</label>
                  <input
                    type="text"
                    value={config.replaceText}
                    onChange={(e) => setConfig((prev) => ({ ...prev, replaceText: e.target.value }))}
                    placeholder="New replacement text..."
                    className="w-full px-3 py-1.5 bg-[#10131c] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={config.caseSensitive}
                    onChange={(e) => setConfig((prev) => ({ ...prev, caseSensitive: e.target.checked }))}
                    className="rounded bg-slate-800 border-slate-700 text-violet-500 focus:ring-0"
                  />
                  <span>Match case sensitive</span>
                </label>
              </div>
            )}

            {config.mode === 'custom-template' && (
              <div className="space-y-3 p-3.5 bg-[#171b26] border border-slate-800/80 rounded-xl">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">Template String</label>
                    <span className="text-[11px] text-slate-500 font-mono">&#123;prefix&#125;_&#123;index&#125;</span>
                  </div>
                  <input
                    type="text"
                    value={config.template}
                    onChange={(e) => setConfig((prev) => ({ ...prev, template: e.target.value }))}
                    placeholder="{prefix}_{index}_{w}x{h}"
                    className="w-full px-3 py-1.5 bg-[#10131c] border border-slate-700 rounded-lg text-xs font-mono text-violet-300 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1 font-medium">Click token to insert:</span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { token: '{prefix}', label: '+ {prefix}' },
                      { token: '{index}', label: '+ {index}' },
                      { token: '{name}', label: '+ {original}' },
                      { token: '{w}x{h}', label: '+ {w}x{h}' },
                      { token: '_{index}', label: '+ _{index}' },
                    ].map((item) => (
                      <button
                        key={item.token}
                        type="button"
                        onClick={() => insertToken(item.token)}
                        className="text-[10px] px-2 py-0.5 rounded bg-violet-950/60 hover:bg-violet-900 border border-violet-800/60 text-violet-300 font-mono cursor-pointer transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Prefix value</label>
                    <input
                      type="text"
                      value={config.prefix}
                      onChange={(e) => setConfig((prev) => ({ ...prev, prefix: e.target.value }))}
                      placeholder="sprite"
                      className="w-full px-2.5 py-1.5 bg-[#10131c] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Optional Suffix</label>
                    <input
                      type="text"
                      value={config.suffix}
                      onChange={(e) => setConfig((prev) => ({ ...prev, suffix: e.target.value }))}
                      placeholder="e.g. anim"
                      className="w-full px-2.5 py-1.5 bg-[#10131c] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sequence & Numbering Settings (applicable to sequence modes) */}
            {config.mode !== 'find-replace' && (
              <div className="p-3.5 bg-[#171b26] border border-slate-800/80 rounded-xl space-y-3">
                <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ListOrdered className="w-3.5 h-3.5 text-violet-400" />
                  <span>Numbering & Padding</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Start At</label>
                    <input
                      type="number"
                      value={config.startIndex}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          startIndex: parseInt(e.target.value, 10) || 0,
                        }))
                      }
                      className="w-full px-2 py-1 bg-[#10131c] border border-slate-700 rounded-lg text-xs text-white text-center focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Step</label>
                    <input
                      type="number"
                      min="1"
                      value={config.step}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          step: Math.max(1, parseInt(e.target.value, 10) || 1),
                        }))
                      }
                      className="w-full px-2 py-1 bg-[#10131c] border border-slate-700 rounded-lg text-xs text-white text-center focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Zero Padding</label>
                    <select
                      value={config.padDigits}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          padDigits: parseInt(e.target.value, 10),
                        }))
                      }
                      className="w-full px-2 py-1 bg-[#10131c] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value={0}>None (1, 2...)</option>
                      <option value={2}>2 Digits (01, 02...)</option>
                      <option value={3}>3 Digits (001, 002...)</option>
                      <option value={4}>4 Digits (0001, 0002...)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Sorting Order & Case formatting */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#171b26] border border-slate-800/80 rounded-xl">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Sequence Order</label>
                <select
                  value={config.sortOrder}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      sortOrder: e.target.value as BatchRenameSortOrder,
                    }))
                  }
                  className="w-full px-2.5 py-1.5 bg-[#10131c] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="spatial-row">Grid: Top to Bottom (Row-by-Row)</option>
                  <option value="spatial-col">Grid: Left to Right (Column-by-Col)</option>
                  <option value="gallery">Gallery Selection Order</option>
                  <option value="name-asc">Alphabetical (Current Name)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Case Format</label>
                <select
                  value={config.caseTransform}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      caseTransform: e.target.value as CaseTransform,
                    }))
                  }
                  className="w-full px-2.5 py-1.5 bg-[#10131c] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="none">Original Case</option>
                  <option value="lowercase">lowercase</option>
                  <option value="uppercase">UPPERCASE</option>
                  <option value="snake">snake_case</option>
                  <option value="kebab">kebab-case</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: Live Preview Table (7 cols) */}
          <div className="lg:col-span-6 p-5 flex flex-col h-full bg-[#11141e] overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Preview
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                  {previews.length} {previews.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {hasConflicts && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/40 border border-amber-800/60 px-2.5 py-0.5 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Duplicate names detected</span>
                </div>
              )}
            </div>

            {/* Scrollable Previews List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-1.5 pr-1">
              {previews.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-10">
                  <Layers className="w-8 h-8 mb-2 opacity-50" />
                  <span>No assets to rename</span>
                </div>
              ) : (
                previews.map((item) => {
                  const thumb = previewThumbnails.get(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-2 rounded-xl border text-xs transition-colors ${
                        item.hasConflict
                          ? 'border-amber-700/60 bg-amber-950/20'
                          : 'border-slate-800/80 bg-[#161924] hover:border-slate-700'
                      }`}
                    >
                      {/* Number Index */}
                      <span className="w-6 text-[11px] font-mono text-slate-500 text-center shrink-0">
                        #{item.sequenceIndex}
                      </span>

                      {/* Small Thumbnail */}
                      <div className="w-9 h-9 rounded bg-slate-900 border border-slate-700/80 flex items-center justify-center overflow-hidden shrink-0">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={item.originalName}
                            className="max-w-full max-h-full object-contain pointer-events-none"
                          />
                        ) : (
                          <div className="text-[9px] text-slate-600 font-mono">
                            {item.crop.width}x{item.crop.height}
                          </div>
                        )}
                      </div>

                      {/* Old Name */}
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-slate-400 text-[11px]" title={item.originalName}>
                          {item.originalName}
                        </div>
                      </div>

                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

                      {/* New Name */}
                      <div className="flex-1 min-w-0 text-right">
                        <div
                          className={`font-semibold font-mono text-[11px] truncate ${
                            item.hasConflict ? 'text-amber-300' : 'text-violet-300'
                          }`}
                          title={item.newName}
                        >
                          {item.newName}
                        </div>
                      </div>

                      {item.hasConflict && (
                        <span title="Duplicate name warning" className="shrink-0">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Pattern summary info */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
              <span>
                First asset:{' '}
                <strong className="text-slate-300 font-mono">
                  {previews[0]?.newName || 'None'}
                </strong>
              </span>
              <span>
                Last asset:{' '}
                <strong className="text-slate-300 font-mono">
                  {previews[previews.length - 1]?.newName || 'None'}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-800 bg-[#11131c] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => setConfig({ ...DEFAULT_BATCH_RENAME_CONFIG })}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Settings</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={previews.length === 0}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-violet-900/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply Rename ({previews.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
