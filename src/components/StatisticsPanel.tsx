import React, { useMemo } from 'react';
import {
  BarChart3,
  Layers,
  Maximize2,
  PieChart,
  Percent,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Ratio,
  Sliders,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { CropRect, ImageInfo } from '../types/crop';
import { calculateCropStatistics, formatArea } from '../utils/cropStatistics';

interface StatisticsPanelProps {
  imageInfo: ImageInfo | null;
  crops: CropRect[];
  selectedCropIds: Set<string>;
  onSelectCrop?: (id: string, isMulti: boolean) => void;
  onSelectAll?: () => void;
}

export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
  imageInfo,
  crops,
  selectedCropIds,
  onSelectCrop,
  onSelectAll,
}) => {
  const stats = useMemo(() => {
    return calculateCropStatistics(crops, imageInfo, selectedCropIds);
  }, [crops, imageInfo, selectedCropIds]);

  if (!imageInfo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 bg-white dark:bg-[#12151d]">
        <BarChart3 className="w-10 h-10 mb-3 text-slate-400 dark:text-slate-600 opacity-60" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No Image Loaded</p>
        <p className="text-xs text-slate-500 mt-1">
          Load an image sheet to view coverage and dimensional statistics.
        </p>
      </div>
    );
  }

  if (crops.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 bg-white dark:bg-[#12151d]">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700/60 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 shadow-sm">
          <BarChart3 className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No Crops Created Yet</p>
        <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
          Create crops manually or generate a grid to inspect area coverage, averages, and distribution metrics.
        </p>
      </div>
    );
  }

  const coverageClamped = Math.min(100, Math.max(0, stats.coveragePercentage));
  const uncroppedPercentage = Math.max(0, 100 - coverageClamped);

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#12151d] text-slate-800 dark:text-slate-200 select-none overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11131c] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">Sheet Statistics</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Coverage & geometry analytics</p>
            </div>
          </div>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
            {stats.imageWidth} × {stats.imageHeight} px
          </span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
        {/* Top 3 Core KPIs */}
        <div className="grid grid-cols-1 gap-2.5">
          {/* 1. Total Number of Crops */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161924] border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:border-blue-300 dark:hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Total Crops
              </span>
              {stats.selectedCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 font-mono">
                  {stats.selectedCount} selected
                </span>
              )}
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                {stats.totalCrops}
              </div>
              <div className="text-right text-[11px] text-slate-500 dark:text-slate-400">
                {stats.totalCrops === 1 ? '1 active asset' : `${stats.totalCrops} active assets`}
              </div>
            </div>
          </div>

          {/* 2. Average Crop Area */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161924] border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:border-blue-300 dark:hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Average Crop Area
              </span>
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 px-1.5 py-0.5 rounded">
                ~{Math.round(stats.averageWidth)} × {Math.round(stats.averageHeight)} px
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                {formatArea(stats.averageArea)}
                <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-normal ml-1">px²</span>
              </div>
              <div className="text-right text-[11px] text-slate-500 dark:text-slate-400">
                Total: <strong className="text-slate-700 dark:text-slate-200 font-mono">{formatArea(stats.totalCropArea)} px²</strong>
              </div>
            </div>
          </div>

          {/* 3. Total Image Coverage Percentage */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161924] border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:border-blue-300 dark:hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                Total Image Coverage
              </span>
              <span className="text-[10px] font-mono text-blue-700 dark:text-sky-300 bg-blue-50 dark:bg-sky-950/50 border border-blue-200 dark:border-sky-800/50 px-1.5 py-0.5 rounded">
                {stats.coveragePercentage.toFixed(1)}%
              </span>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                {stats.coveragePercentage.toFixed(1)}%
              </div>
              <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {formatArea(stats.totalCropArea)} / {formatArea(stats.imageArea)} px²
              </div>
            </div>

            {/* Coverage Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 flex overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-300 rounded-l-full"
                style={{ width: `${coverageClamped}%` }}
                title={`Cropped coverage: ${coverageClamped.toFixed(1)}%`}
              />
              <div
                className="h-full bg-slate-100 dark:bg-slate-800/80 transition-all duration-300"
                style={{ width: `${uncroppedPercentage}%` }}
                title={`Uncropped area: ${uncroppedPercentage.toFixed(1)}%`}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              <span className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                Cropped ({coverageClamped.toFixed(1)}%)
              </span>
              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
                Remaining ({uncroppedPercentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Overlap Indicator Warning if crops overlap */}
        {stats.hasOverlap && (
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs flex items-start gap-2 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-semibold text-amber-900 dark:text-amber-200">Overlapping crops detected:</span>{' '}
              {formatArea(stats.overlapArea)} px² ({stats.overlapPercentage.toFixed(1)}% of image) is shared between two or more crop boundaries.
            </div>
          </div>
        )}

        {/* Selected Crops Breakdown (when active) */}
        {stats.selectedCount > 0 && (
          <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Selected Crops ({stats.selectedCount})
              </span>
              <span className="text-[10px] font-mono text-blue-700 dark:text-blue-300">
                {((stats.selectedCount / stats.totalCrops) * 100).toFixed(0)}% of crops
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="p-2 rounded-lg bg-white dark:bg-[#141724] border border-blue-200 dark:border-blue-900/40">
                <div className="text-slate-500 dark:text-slate-400 text-[10px]">Selected Area</div>
                <div className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                  {formatArea(stats.selectedTotalArea)} px²
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-[#141724] border border-blue-200 dark:border-blue-900/40">
                <div className="text-slate-500 dark:text-slate-400 text-[10px]">Selection Coverage</div>
                <div className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                  {stats.selectedCoveragePercentage.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Min & Max Extrema */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block px-1">
            Size Extremes
          </span>

          <div className="grid grid-cols-2 gap-2">
            {/* Smallest Crop */}
            {stats.minAreaCrop && (
              <div
                onClick={() => onSelectCrop && onSelectCrop(stats.minAreaCrop!.crop.id, false)}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#161924] border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-slate-700 cursor-pointer transition-colors group"
                title="Click to select smallest crop"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                  <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                    <ArrowDownRight className="w-3 h-3 text-blue-600 dark:text-sky-400" />
                    Smallest
                  </span>
                  <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500">
                    {stats.minAreaCrop.crop.width}×{stats.minAreaCrop.crop.height}
                  </span>
                </div>
                <div className="font-mono font-bold text-xs text-slate-900 dark:text-white truncate" title={stats.minAreaCrop.crop.name}>
                  {stats.minAreaCrop.crop.name}
                </div>
                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                  {formatArea(stats.minAreaCrop.area)} px²
                </div>
              </div>
            )}

            {/* Largest Crop */}
            {stats.maxAreaCrop && (
              <div
                onClick={() => onSelectCrop && onSelectCrop(stats.maxAreaCrop!.crop.id, false)}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#161924] border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-slate-700 cursor-pointer transition-colors group"
                title="Click to select largest crop"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                  <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                    <ArrowUpRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Largest
                  </span>
                  <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500">
                    {stats.maxAreaCrop.crop.width}×{stats.maxAreaCrop.crop.height}
                  </span>
                </div>
                <div className="font-mono font-bold text-xs text-slate-900 dark:text-white truncate" title={stats.maxAreaCrop.crop.name}>
                  {stats.maxAreaCrop.crop.name}
                </div>
                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                  {formatArea(stats.maxAreaCrop.area)} px²
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Aspect Ratio Distribution */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161924] border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Ratio className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Shape Distribution
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Aspect ratios</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <div className="p-2 rounded-lg bg-white dark:bg-[#11131c] border border-slate-200 dark:border-slate-800/80 text-center">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Square (1:1)</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                {stats.aspectRatioCounts.square}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-white dark:bg-[#11131c] border border-slate-200 dark:border-slate-800/80 text-center">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Landscape</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                {stats.aspectRatioCounts.landscape}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-white dark:bg-[#11131c] border border-slate-200 dark:border-slate-800/80 text-center">
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Portrait</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                {stats.aspectRatioCounts.portrait}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Sheet Properties */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161924] border border-slate-200 dark:border-slate-800 text-xs space-y-2">
          <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
            Image Sheet Metrics
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800/80 text-[11px]">
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Total Image Pixels</span>
              <span className="font-mono text-slate-700 dark:text-slate-200">{formatArea(stats.imageArea)} px²</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Total Harvested Area</span>
              <span className="font-mono text-slate-700 dark:text-slate-200">{formatArea(stats.totalCropArea)} px²</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Uncropped Background</span>
              <span className="font-mono text-slate-700 dark:text-slate-200">
                {formatArea(Math.max(0, stats.imageArea - (stats.coveragePercentage / 100) * stats.imageArea))} px²
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
