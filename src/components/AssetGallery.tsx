import React, { useState, useEffect, useRef } from 'react';
import {
  CheckSquare,
  Square,
  Trash2,
  Copy,
  Download,
  Edit2,
  Check,
  Search,
  Layers,
  Sparkles,
  Tag,
} from 'lucide-react';
import { BackgroundRemovalConfig, CropRect, ImageInfo } from '../types/crop';
import { exportSingleCropPng, generateCropThumbnail } from '../utils/exportUtils';
import { BatchRenameModal } from './BatchRenameModal';

interface AssetGalleryProps {
  imageInfo: ImageInfo;
  crops: CropRect[];
  selectedCropIds: Set<string>;
  onSelectCrop: (id: string, isMulti: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDeleteCrops: (ids: string[]) => void;
  onDuplicateCrop: (id: string) => void;
  onRenameCrop: (id: string, newName: string) => void;
  onBatchRename?: (renames: { id: string; name: string }[]) => void;
  onOpenExport: () => void;
  bgConfig: BackgroundRemovalConfig;
}

export const AssetGallery: React.FC<AssetGalleryProps> = ({
  imageInfo,
  crops,
  selectedCropIds,
  onSelectCrop,
  onSelectAll,
  onDeselectAll,
  onDeleteCrops,
  onDuplicateCrop,
  onRenameCrop,
  onBatchRename,
  onOpenExport,
  bgConfig,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isBatchRenameOpen, setIsBatchRenameOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // Update thumbnails efficiently
  useEffect(() => {
    if (!imageInfo.element) return;
    const newThumbnails = new Map<string, string>();

    crops.forEach((crop) => {
      try {
        const thumbUrl = generateCropThumbnail(imageInfo.element!, crop, 140, bgConfig);
        newThumbnails.set(crop.id, thumbUrl);
      } catch {
        // Fallback
      }
    });

    setThumbnails(newThumbnails);
  }, [crops, imageInfo, bgConfig.enabled, bgConfig.tolerance, bgConfig.mode]);

  const startEditing = (crop: CropRect, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(crop.id);
    setEditingName(crop.name);
  };

  const saveEditing = (id: string) => {
    if (editingName.trim()) {
      onRenameCrop(id, editingName.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (id: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEditing(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  const filteredCrops = crops.filter((crop) =>
    crop.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCount = selectedCropIds.size;
  const allSelected = crops.length > 0 && selectedCount === crops.length;

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#12151d] text-slate-800 dark:text-slate-200 select-none overflow-hidden transition-colors">
      {/* Top Header & Search */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900 dark:text-white">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Extracted Assets</span>
            <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              {crops.length}
            </span>
          </div>

          {crops.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBatchRenameOpen(true)}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                title="Batch rename assets"
              >
                <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Batch Rename</span>
              </button>
              <button
                type="button"
                onClick={allSelected ? onDeselectAll : onSelectAll}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                {allSelected ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>Select All</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Search bar */}
        {crops.length > 4 && (
          <div className="relative mt-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#181b26] border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {/* Batch Operations Bar */}
        {selectedCount > 0 && (
          <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-blue-700 dark:text-blue-300 font-medium">
              {selectedCount} asset{selectedCount > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsBatchRenameOpen(true)}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-[#1f2434] dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/80 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                title="Batch rename selected assets"
              >
                <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Rename</span>
              </button>
              <button
                type="button"
                onClick={() => onDeleteCrops(Array.from(selectedCropIds))}
                className="px-2 py-1 rounded text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1 cursor-pointer"
                title="Delete selected crops"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
              <button
                type="button"
                onClick={onOpenExport}
                className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                title="Export selected assets"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Asset List Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {crops.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center text-slate-400 mb-3">
              <Layers className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-300 mb-1">No crops created yet</p>
            <p className="text-xs text-slate-500 max-w-[200px]">
              Use the <span className="text-blue-600 dark:text-blue-400 font-medium">Manual Crop</span> tool to draw rectangles or generate a <span className="text-blue-600 dark:text-blue-400 font-medium">Grid</span>.
            </p>
          </div>
        ) : filteredCrops.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No assets match &quot;{searchQuery}&quot;
          </div>
        ) : (
          filteredCrops.map((crop, index) => {
            const isSelected = selectedCropIds.has(crop.id);
            const thumbUrl = thumbnails.get(crop.id);
            const isEditing = editingId === crop.id;

            return (
              <div
                key={crop.id}
                onClick={() => onSelectCrop(crop.id, false)}
                className={`rounded-xl border p-2.5 transition-all cursor-pointer flex gap-3 items-center group ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#161922] hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#1a1e2b]'
                }`}
              >
                {/* Select Checkbox */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCrop(crop.id, true);
                  }}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                  aria-label={`Select ${crop.name}`}
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>

                {/* Thumbnail with Checkerboard */}
                <div
                  className="w-14 h-14 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 shrink-0 relative overflow-hidden flex items-center justify-center"
                  style={{
                    backgroundImage: bgConfig.enabled
                      ? 'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)'
                      : 'none',
                    backgroundSize: '10px 10px',
                    backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
                  }}
                >
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={crop.name}
                      className="max-w-full max-h-full object-contain pointer-events-none"
                    />
                  ) : (
                    <div className="text-[10px] text-slate-500 font-mono">#{index + 1}</div>
                  )}
                </div>

                {/* Details & Rename Input */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => saveEditing(crop.id)}
                        onKeyDown={(e) => handleKeyDown(crop.id, e)}
                        className="w-full text-xs font-semibold px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-blue-500 rounded text-slate-900 dark:text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => saveEditing(crop.id)}
                        className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                        title="Save name"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate" title={crop.name}>
                        {crop.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => startEditing(crop, e)}
                        className="opacity-70 sm:opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-opacity p-0.5 cursor-pointer"
                        title="Rename asset"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Dimensions & Coordinates */}
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {crop.width} × {crop.height} px
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      ({crop.x}, {crop.y})
                    </span>
                  </div>
                </div>

                {/* Quick Action Icons */}
                <div className="flex items-center gap-0.5 shrink-0 opacity-100 sm:opacity-80 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (imageInfo.element) {
                        exportSingleCropPng(
                          imageInfo.element,
                          crop,
                          `${crop.name}.png`,
                          bgConfig
                        );
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors"
                    title="Download this asset as PNG"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateCrop(crop.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                    title="Duplicate crop"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCrops([crop.id]);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Delete crop"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isBatchRenameOpen && (
        <BatchRenameModal
          isOpen={isBatchRenameOpen}
          onClose={() => setIsBatchRenameOpen(false)}
          imageInfo={imageInfo}
          allCrops={crops}
          selectedCropIds={selectedCropIds}
          onApplyBatchRename={(renames) => {
            if (onBatchRename) {
              onBatchRename(renames);
            } else {
              renames.forEach((r) => onRenameCrop(r.id, r.name));
            }
          }}
          bgConfig={bgConfig}
        />
      )}
    </div>
  );
};

