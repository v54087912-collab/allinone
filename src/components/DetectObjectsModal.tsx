import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  ScanEye,
  Sliders,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { BackgroundRemovalConfig, CropRect, ImageInfo } from '../types/crop';
import {
  detectObjectsFromPixels,
  convertDetectedBoxesToCrops,
  DetectedBox,
} from '../utils/objectDetection';
import { generateCropThumbnail } from '../utils/exportUtils';

interface DetectObjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageInfo: ImageInfo;
  existingCropCount: number;
  onApplyCrops: (crops: CropRect[], replaceExisting: boolean) => void;
  bgConfig: BackgroundRemovalConfig;
}

export const DetectObjectsModal: React.FC<DetectObjectsModalProps> = ({
  isOpen,
  onClose,
  imageInfo,
  existingCropCount,
  onApplyCrops,
  bgConfig,
}) => {
  // Detection parameters
  const [threshold, setThreshold] = useState<number>(35);
  const [minSize, setMinSize] = useState<number>(14);
  const [padding, setPadding] = useState<number>(4);
  const [mergeDistance, setMergeDistance] = useState<number>(8);
  const [bgMode, setBgMode] = useState<'auto' | 'white' | 'black' | 'transparent'>('auto');
  const [prefix, setPrefix] = useState<string>('sprite');
  const [replaceExisting, setReplaceExisting] = useState<boolean>(true);

  // Cached image pixel buffer
  const [pixelBuffer, setPixelBuffer] = useState<{
    data: Uint8ClampedArray;
    width: number;
    height: number;
  } | null>(null);

  // Detected bounding boxes
  const [detectedBoxes, setDetectedBoxes] = useState<DetectedBox[]>([]);
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Extract pixel buffer from HTMLImageElement once when opened
  useEffect(() => {
    if (!isOpen || !imageInfo.element) return;

    try {
      const img = imageInfo.element;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      setPixelBuffer({
        data: imgData.data,
        width: canvas.width,
        height: canvas.height,
      });
    } catch {
      // ignore
    }
  }, [isOpen, imageInfo]);

  // Run detection when parameters change
  useEffect(() => {
    if (!pixelBuffer) return;

    setIsProcessing(true);
    const timer = setTimeout(() => {
      try {
        const boxes = detectObjectsFromPixels(pixelBuffer, {
          threshold,
          minWidth: minSize,
          minHeight: minSize,
          minArea: minSize * minSize * 0.7,
          padding,
          mergeDistance,
          bgMode,
        });

        setDetectedBoxes(boxes);
      } finally {
        setIsProcessing(false);
      }
    }, 40);

    return () => clearTimeout(timer);
  }, [pixelBuffer, threshold, minSize, padding, mergeDistance, bgMode]);

  // Generate preview thumbnails for detected boxes
  useEffect(() => {
    if (!isOpen || !imageInfo.element || detectedBoxes.length === 0) {
      setThumbnails(new Map());
      return;
    }

    const newThumbs = new Map<string, string>();
    const img = imageInfo.element;

    detectedBoxes.slice(0, 16).forEach((box) => {
      try {
        const dummyCrop: CropRect = {
          id: box.id,
          name: box.id,
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
        };
        const url = generateCropThumbnail(img, dummyCrop, 80, bgConfig);
        newThumbs.set(box.id, url);
      } catch {
        // ignore
      }
    });

    setThumbnails(newThumbs);
  }, [isOpen, imageInfo, detectedBoxes, bgConfig]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (detectedBoxes.length === 0) return;
    const crops = convertDetectedBoxesToCrops(detectedBoxes, prefix.trim() || 'object', 1);
    onApplyCrops(crops, replaceExisting);
    onClose();
  };

  const handleResetDefaults = () => {
    setThreshold(35);
    setMinSize(14);
    setPadding(4);
    setMergeDistance(8);
    setBgMode('auto');
    setPrefix('sprite');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="detect-objects-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-[#141722] border border-slate-200 dark:border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200">
        {/* Header */}
        <div className="p-3 sm:p-4 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#11131c]">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <ScanEye className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 id="detect-objects-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Automatic Object Detection
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 font-mono">
                  {detectedBoxes.length} {detectedBoxes.length === 1 ? 'object' : 'objects'}
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1 sm:line-clamp-none">
                Uses threshold-based contrast scanning to automatically detect and group sprite boundaries.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Close object detection dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Split configuration vs live preview */}
        <div className="flex-1 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800 min-h-0">
          {/* Left Column: Sliders & Detection Options (5 cols) */}
          <div className="lg:col-span-5 p-4 sm:p-5 lg:overflow-y-auto space-y-4">
            {/* Background Model Assumption */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Background Type
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-[#0e1017] p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                {[
                  { id: 'auto', label: 'Auto Detect' },
                  { id: 'white', label: 'White / Light' },
                  { id: 'black', label: 'Black / Dark' },
                  { id: 'transparent', label: 'Transparent' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBgMode(item.id as any)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center cursor-pointer ${
                      bgMode === item.id
                        ? 'bg-blue-600 text-white font-semibold shadow'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Threshold / Sensitivity */}
            <div className="p-3.5 bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Contrast Threshold</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{threshold}</span>
              </div>
              <input
                type="range"
                min="10"
                max="120"
                step="2"
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Sensitive (10)</span>
                <span>Balanced (35)</span>
                <span>Strict (120)</span>
              </div>
            </div>

            {/* Min Size & Padding */}
            <div className="p-3.5 bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-3">
              {/* Min Size */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Min Object Size</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{minSize} px</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="64"
                  step="2"
                  value={minSize}
                  onChange={(e) => setMinSize(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block">
                  Filters out isolated pixel dust and background artifacts.
                </span>
              </div>

              {/* Padding */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Boundary Padding</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">+{padding} px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={padding}
                  onChange={(e) => setPadding(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block">
                  Expands detected rectangle around outer sprite edges.
                </span>
              </div>

              {/* Merge Distance */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Group / Merge Gap</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{mergeDistance} px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="1"
                  value={mergeDistance}
                  onChange={(e) => setMergeDistance(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block">
                  Merges nearby disconnected parts (e.g. floating weapons or detached hats).
                </span>
              </div>
            </div>

            {/* Naming Prefix & Replacement Options */}
            <div className="p-3.5 bg-slate-50 dark:bg-[#171b26] border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Crop Naming Prefix
                </label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="e.g. sprite, item, icon..."
                  className="w-full px-3 py-1.5 bg-white dark:bg-[#10131c] border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {existingCropCount > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Existing Crops ({existingCropCount})
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReplaceExisting(true)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        replaceExisting
                          ? 'bg-blue-600 text-white font-semibold shadow'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Replace Existing
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplaceExisting(false)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        !replaceExisting
                          ? 'bg-blue-600 text-white font-semibold shadow'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Append to Existing
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Detection Results (7 cols) */}
          <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col min-h-[280px] lg:h-full bg-slate-50/60 dark:bg-[#11141e] overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Detected Boundaries
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                  {detectedBoxes.length} items
                </span>
              </div>

              {isProcessing && (
                <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 animate-pulse">
                  <span>Analyzing image...</span>
                </div>
              )}
            </div>

            {/* Results Grid / List */}
            <div className="flex-1 overflow-y-auto py-3 pr-1">
              {detectedBoxes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-400 mb-3">
                    <ScanEye className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">No Objects Detected</p>
                  <p className="text-xs text-slate-500 max-w-[260px]">
                    Try adjusting the contrast threshold lower or reducing the minimum object size to catch faint pixels.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {detectedBoxes.map((box, idx) => {
                    const thumb = thumbnails.get(box.id);
                    return (
                      <div
                        key={box.id}
                        className="p-2 rounded-xl bg-white dark:bg-[#161924] border border-slate-200 dark:border-slate-800/80 shadow-xs flex flex-col gap-1.5 group hover:border-blue-400 dark:hover:border-slate-700 transition-colors"
                      >
                        {/* Thumbnail View */}
                        <div className="w-full h-20 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center overflow-hidden relative">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={`Object ${idx + 1}`}
                              className="max-w-full max-h-full object-contain pointer-events-none"
                            />
                          ) : (
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-600">
                              {box.width}×{box.height}
                            </span>
                          )}
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-white/90 dark:bg-black/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                            #{idx + 1}
                          </span>
                        </div>

                        {/* Dimensions & Name */}
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono text-slate-900 dark:text-white font-semibold truncate">
                            {prefix}_{String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px]">
                            {box.width}×{box.height}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Status Info */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
              <span>
                Found <strong className="text-slate-800 dark:text-slate-300 font-mono">{detectedBoxes.length}</strong> objects across {imageInfo.width}×{imageInfo.height} px
              </span>
              <span className="hidden sm:inline">
                {replaceExisting && existingCropCount > 0
                  ? `Will replace current ${existingCropCount} crops`
                  : 'Ready to crop'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 px-4 sm:px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11131c] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Settings</span>
            <span className="sm:hidden">Reset</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={detectedBoxes.length === 0}
              className="px-3 sm:px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-600/20 flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">Apply Detected Crops ({detectedBoxes.length})</span>
              <span className="sm:hidden">Apply ({detectedBoxes.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
