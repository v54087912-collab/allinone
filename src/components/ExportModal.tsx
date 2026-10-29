import React, { useState } from 'react';
import {
  Download,
  X,
  FileArchive,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { BackgroundRemovalConfig, CropRect, ImageInfo } from '../types/crop';
import { createZipArchive, downloadBlob, exportSingleCropPng } from '../utils/exportUtils';
import { generateUniqueFilenames } from '../utils/cropMath';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageInfo: ImageInfo;
  crops: CropRect[];
  selectedCropIds: Set<string>;
  bgConfig: BackgroundRemovalConfig;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  imageInfo,
  crops,
  selectedCropIds,
  bgConfig,
}) => {
  const [exportScope, setExportScope] = useState<'all' | 'selected'>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; filename: string }>({
    current: 0,
    total: 0,
    filename: '',
  });
  const [exportSuccess, setExportSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetCrops =
    exportScope === 'selected' && selectedCropIds.size > 0
      ? crops.filter((c) => selectedCropIds.has(c.id))
      : crops;

  const filenameMap = generateUniqueFilenames(targetCrops);

  const handleExportZip = async () => {
    if (!imageInfo.element || targetCrops.length === 0) return;

    setIsExporting(true);
    setExportSuccess(false);
    setErrorMsg(null);

    try {
      const zipBlob = await createZipArchive(
        imageInfo.element,
        targetCrops,
        bgConfig,
        (current, total, filename) => {
          setProgress({ current, total, filename });
        }
      );

      const zipName = `${imageInfo.name.replace(/\.[^/.]+$/, '')}_multicrop_assets.zip`;
      downloadBlob(zipBlob, zipName);
      setExportSuccess(true);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to generate ZIP archive');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#181b26] border border-slate-200 dark:border-slate-700/80 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Export Assets</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Original pixel resolution PNG &amp; ZIP</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Scope Selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">Which assets to export?</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  exportScope === 'all'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-slate-900 dark:text-white shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#12151d] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs mb-0.5">All Assets</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{crops.length} total crops</div>
              </button>

              <button
                type="button"
                disabled={selectedCropIds.size === 0}
                onClick={() => setExportScope('selected')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  selectedCropIds.size === 0
                    ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#12151d]'
                    : exportScope === 'selected'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-slate-900 dark:text-white shadow-xs cursor-pointer'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#12151d] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer'
                }`}
              >
                <div className="font-bold text-xs mb-0.5">Selected Only</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {selectedCropIds.size} asset{selectedCropIds.size === 1 ? '' : 's'}
                </div>
              </button>
            </div>
          </div>

          {/* Export Details Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#12151d] border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>Target Asset Count:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">{targetCrops.length} files</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>Image Format:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">PNG (Lossless)</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>Resolution Quality:</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">1:1 Original Source Pixels</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>Transparency:</span>
              <span className="font-medium text-blue-600 dark:text-blue-300">
                {bgConfig.enabled ? `Enabled (${bgConfig.tolerance}% tolerance)` : 'Disabled (Preserve Background)'}
              </span>
            </div>
          </div>

          {/* Preview File List */}
          <div className="space-y-1.5">
            <span className="text-slate-600 dark:text-slate-400 block font-medium">Archive Manifest Preview:</span>
            <div className="max-h-32 overflow-y-auto rounded-lg bg-slate-50 dark:bg-[#12151d] border border-slate-200 dark:border-slate-800 p-2 space-y-1 font-mono text-[11px]">
              {targetCrops.map((c) => (
                <div key={c.id} className="flex justify-between items-center text-slate-600 dark:text-slate-400 px-1 py-0.5">
                  <span className="text-slate-800 dark:text-slate-200 truncate">{filenameMap.get(c.id)}</span>
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] shrink-0">
                    {c.width}×{c.height} px
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar when exporting */}
          {isExporting && (
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
              <div className="flex justify-between items-center text-xs text-blue-800 dark:text-blue-200">
                <span className="flex items-center gap-2 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                  Generating ZIP archive...
                </span>
                <span className="font-mono">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-150"
                  style={{
                    width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Processing {progress.filename}
              </div>
            </div>
          )}

          {/* Success Message */}
          {exportSuccess && !isExporting && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Archive generated and downloaded successfully!</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/70 dark:bg-[#12151d]">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleExportZip}
            disabled={isExporting || targetCrops.length === 0}
            className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition-all cursor-pointer ${
              !isExporting && targetCrops.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <FileArchive className="w-4 h-4" />
                <span>Download ZIP ({targetCrops.length} Assets)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
