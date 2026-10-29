import React from 'react';
import {
  SlidersHorizontal,
  X,
  Keyboard,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPrefix: string;
  setDefaultPrefix: (prefix: string) => void;
  namingFormat: import('../types/crop').NamingFormat;
  setNamingFormat: (format: import('../types/crop').NamingFormat) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  defaultPrefix,
  setDefaultPrefix,
  namingFormat,
  setNamingFormat,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#181b26] border border-slate-200 dark:border-slate-700/80 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Editor Settings</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">MultiCrop Preferences &amp; Shortcuts</p>
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

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Naming Style Selector */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">
              Default Asset File Naming
            </label>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setNamingFormat('number')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  namingFormat === 'number'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#12151d] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-xs">Simple Numbers (Default)</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">1.png, 2.png, 3.png, 4.png...</div>
                </div>
                {namingFormat === 'number' && (
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setNamingFormat('padded')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  namingFormat === 'padded'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#12151d] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-xs">Padded Numbers</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">001.png, 002.png, 003.png...</div>
                </div>
                {namingFormat === 'padded' && (
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setNamingFormat('prefix')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  namingFormat === 'prefix'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#12151d] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-xs">Custom Prefix + Number</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{defaultPrefix}_1.png, {defaultPrefix}_2.png...</div>
                </div>
                {namingFormat === 'prefix' && (
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                )}
              </button>
            </div>
          </div>

          {/* Default Prefix Input when prefix is selected */}
          {namingFormat === 'prefix' && (
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-[#12151d] border border-slate-200 dark:border-slate-800">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Custom Prefix Word
              </label>
              <input
                type="text"
                value={defaultPrefix}
                onChange={(e) => setDefaultPrefix(e.target.value.trim() || 'asset')}
                placeholder="e.g. asset, sprite, item"
                className="w-full bg-white dark:bg-[#181b26] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Privacy & Engine info */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#12151d] border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Privacy &amp; Performance Guarantee</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              All pixel cropping and ZIP compression occur strictly inside your local browser instance via native HTML Canvas APIs and Web Workers. No image data is transmitted to external servers.
            </p>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
              <Keyboard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Keyboard Shortcuts</span>
            </div>

            <div className="bg-slate-50 dark:bg-[#12151d] rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span className="font-sans text-slate-700 dark:text-slate-300">Select Tool</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">V</kbd>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span className="font-sans text-slate-700 dark:text-slate-300">Manual Crop Tool</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">C</kbd>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span className="font-sans text-slate-700 dark:text-slate-300">Grid Generator</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">G</kbd>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span className="font-sans text-slate-700 dark:text-slate-300">Undo / Redo</span>
                <span className="space-x-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Ctrl+Z</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Ctrl+Y</kbd>
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span className="font-sans text-slate-700 dark:text-slate-300">Duplicate Selected</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Ctrl+D</kbd>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span className="font-sans text-slate-700 dark:text-slate-300">Delete Selected</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Del / Backspace</kbd>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span className="font-sans text-slate-700 dark:text-slate-300">Pan Canvas</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Space + Drag</kbd>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span className="font-sans text-slate-700 dark:text-slate-300">Fit to Screen</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">F</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50/70 dark:bg-[#12151d]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm"
          >
            Save &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
