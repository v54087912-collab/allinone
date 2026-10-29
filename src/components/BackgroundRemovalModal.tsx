import React from 'react';
import {
  Wand2,
  X,
  Check,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { BackgroundRemovalConfig } from '../types/crop';

interface BackgroundRemovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  bgConfig: BackgroundRemovalConfig;
  setBgConfig: React.Dispatch<React.SetStateAction<BackgroundRemovalConfig>>;
}

export const BackgroundRemovalModal: React.FC<BackgroundRemovalModalProps> = ({
  isOpen,
  onClose,
  bgConfig,
  setBgConfig,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#181b26] border border-slate-200 dark:border-slate-700/80 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">White Background Removal</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Client-side pixel color processing</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 text-xs">
          {/* Main Enable Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#12151d] border border-slate-200 dark:border-slate-800">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block text-sm mb-0.5">
                Remove White Background
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-xs">
                Generates transparent PNG exports
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBgConfig({ ...bgConfig, enabled: !bgConfig.enabled })}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                bgConfig.enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  bgConfig.enabled ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {bgConfig.enabled && (
            <>
              {/* Algorithm Mode Selection */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Processing Mode
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setBgConfig({ ...bgConfig, mode: 'edge-flood' })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      bgConfig.mode === 'edge-flood'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#12151d] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold mb-1">
                      <span>Edge-Connected Flood Fill</span>
                      {bgConfig.mode === 'edge-flood' && (
                        <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Recommended. Only erases outer white regions connected to crop borders.
                      Preserves internal white elements (e.g. eyes, white shirts, badges).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBgConfig({ ...bgConfig, mode: 'all-white' })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      bgConfig.mode === 'all-white'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#12151d] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold mb-1">
                      <span>All White Pixels (Global Threshold)</span>
                      {bgConfig.mode === 'all-white' && (
                        <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Replaces every pixel within tolerance everywhere across the crop rectangle.
                    </p>
                  </button>
                </div>
              </div>

              {/* Tolerance Slider */}
              <div className="space-y-2 bg-slate-50 dark:bg-[#12151d] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    White Color Tolerance
                  </label>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/50">
                    {bgConfig.tolerance}%
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="80"
                  value={bgConfig.tolerance}
                  onChange={(e) =>
                    setBgConfig({ ...bgConfig, tolerance: parseInt(e.target.value) || 1 })
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
                  <span>Strict (Pure White)</span>
                  <span>Moderate (25-35%)</span>
                  <span>Loose (Near White)</span>
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-200/90 flex items-start gap-2 text-[11px] leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                <span>
                  Threshold-based color filtering runs in browser canvas memory without modifying the original source image. Very pale pastel highlights or soft anti-aliased edges may be influenced by higher tolerance values.
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/70 dark:bg-[#12151d]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
