import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Shuffle,
  Download,
  Check,
  Layers,
  Palette,
  Sliders,
  Play,
} from 'lucide-react';
import {
  RpgItemSlot,
  RpgSheetConfig,
  RPG_AVAILABLE_ITEMS,
  getDefault2x3RpgItems,
  renderCustomRpgSheet,
  RpgItemType,
} from '../utils/customRpgGenerator';
import { CropRect, ImageInfo } from '../types/crop';
import { downloadBlob } from '../utils/exportUtils';

interface CustomRpgSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadCustomSheet: (imageInfo: ImageInfo, autoCrops?: CropRect[]) => void;
}

export const CustomRpgSheetModal: React.FC<CustomRpgSheetModalProps> = ({
  isOpen,
  onClose,
  onLoadCustomSheet,
}) => {
  const [items, setItems] = useState<RpgItemSlot[]>(getDefault2x3RpgItems());
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');
  const [showBorders, setShowBorders] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [autoApplyCrops, setAutoApplyCrops] = useState<boolean>(true);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const config: RpgSheetConfig = {
    rows: 2,
    cols: 3,
    cellWidth: 180,
    cellHeight: 170,
    gap: 10,
    margin: 25,
    backgroundColor,
    showBorders,
    showLabels,
    items,
  };

  // Redraw preview whenever settings change
  useEffect(() => {
    if (!isOpen || !previewCanvasRef.current) return;
    const rendered = renderCustomRpgSheet(config);
    const canvas = previewCanvasRef.current;
    canvas.width = rendered.width;
    canvas.height = rendered.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(rendered, 0, 0);
    }
  }, [isOpen, items, backgroundColor, showBorders, showLabels]);

  if (!isOpen) return null;

  const currentSlot = items[selectedSlotIndex] || items[0];

  const handleUpdateCurrentSlot = (updates: Partial<RpgItemSlot>) => {
    setItems((prev) =>
      prev.map((slot, idx) => (idx === selectedSlotIndex ? { ...slot, ...updates } : slot))
    );
  };

  const handleRandomize = () => {
    const shuffled = [...RPG_AVAILABLE_ITEMS].sort(() => Math.random() - 0.5);
    const newItems: RpgItemSlot[] = [];
    for (let i = 0; i < 6; i++) {
      const pick = shuffled[i % shuffled.length];
      newItems.push({
        id: String(i + 1),
        type: pick.type,
        label: pick.name,
        color: pick.defaultColor,
      });
    }
    setItems(newItems);
  };

  const handleGenerateAndLoad = () => {
    const canvas = renderCustomRpgSheet(config);
    const dataUrl = canvas.toDataURL('image/png');
    const img = new Image();

    img.onload = () => {
      let initialCrops: CropRect[] = [];
      if (autoApplyCrops) {
        // Pre-create exact 2x3 crops matching the cells
        for (let r = 0; r < config.rows; r++) {
          for (let c = 0; c < config.cols; c++) {
            const idx = r * config.cols + c;
            const x = config.margin + c * (config.cellWidth + config.gap);
            const y = config.margin + r * (config.cellHeight + config.gap);
            const slot = items[idx];

            initialCrops.push({
              id: `crop_${Date.now()}_${r}_${c}`,
              name: String(idx + 1),
              x,
              y,
              width: config.cellWidth,
              height: config.cellHeight,
              selected: false,
            });
          }
        }
      }

      onLoadCustomSheet(
        {
          name: 'custom_rpg_sprites_2x3.png',
          width: canvas.width,
          height: canvas.height,
          size: Math.round(dataUrl.length * 0.75),
          type: 'image/png',
          url: dataUrl,
          element: img,
        },
        initialCrops
      );
      onClose();
    };

    img.src = dataUrl;
  };

  const handleDownloadSheet = () => {
    const canvas = renderCustomRpgSheet(config);
    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, 'custom_rpg_sprites_2x3.png');
      }
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-[#181b26] border border-slate-200 dark:border-slate-700/80 rounded-2xl max-w-4xl w-full max-h-[92vh] shadow-2xl overflow-hidden flex flex-col text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-[#141722] gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">Custom RPG Item Sprites</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden xs:block truncate">
                Design custom weapons, armor, potions, and loot sheets to crop
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRandomize}
              className="px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Randomize all 6 item slots"
            >
              <Shuffle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Randomize</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: 2x3 Grid Slots & Selected Slot Editor (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Slot Selector Grid */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Click a slot to customize:</span>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">
                  Slot #{selectedSlotIndex + 1} Selected
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2.5 bg-slate-50 dark:bg-[#12151d] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                {items.map((slot, idx) => {
                  const isSelected = idx === selectedSlotIndex;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlotIndex(idx)}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 relative ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-500/40'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161922] hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span className="absolute top-1 left-1.5 text-[9px] font-mono text-slate-400 dark:text-slate-500">
                        #{idx + 1}
                      </span>
                      <div
                        className="w-4 h-4 rounded-full border border-black/10 dark:border-white/20 mt-1"
                        style={{ backgroundColor: slot.color }}
                      />
                      <span className="text-[11px] font-semibold text-slate-800 dark:text-white truncate max-w-[85px]">
                        {slot.label || `Item ${idx + 1}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Slot Customizer */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#12151d] border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                <span>Customize Slot #{selectedSlotIndex + 1}</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono">{currentSlot.type}</span>
              </div>

              {/* Item Type Picker */}
              <div className="space-y-1">
                <label className="text-slate-500 dark:text-slate-400 block font-medium">Choose Sprite Graphic:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {RPG_AVAILABLE_ITEMS.map((item) => {
                    const isPicked = currentSlot.type === item.type;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() =>
                          handleUpdateCurrentSlot({
                            type: item.type,
                            label: item.name,
                            color: item.defaultColor,
                          })
                        }
                        className={`p-1.5 rounded-md border text-left truncate transition-colors cursor-pointer text-[11px] flex items-center gap-1.5 ${
                          isPicked
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-white font-semibold'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181b26] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.defaultColor }}
                        />
                        <span className="truncate">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Label & Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-1 font-medium">Item Name / Label:</label>
                  <input
                    type="text"
                    value={currentSlot.label}
                    onChange={(e) => handleUpdateCurrentSlot({ label: e.target.value })}
                    className="w-full bg-white dark:bg-[#181b26] border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                    placeholder="Item name"
                  />
                </div>

                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-1 font-medium">Primary Accent Color:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentSlot.color}
                      onChange={(e) => handleUpdateCurrentSlot({ color: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={currentSlot.color}
                      onChange={(e) => handleUpdateCurrentSlot({ color: e.target.value })}
                      className="w-full bg-white dark:bg-[#181b26] border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-800 dark:text-white font-mono uppercase text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sheet Settings */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#12151d] border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
              <div className="font-bold text-slate-800 dark:text-slate-200">Sheet Options</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-500 dark:text-slate-400 block mb-1">Background:</label>
                  <select
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-full bg-white dark:bg-[#181b26] border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-800 dark:text-white text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="#ffffff">White (for Transparency test)</option>
                    <option value="#0f172a">Dark Slate</option>
                    <option value="#000000">Deep Black</option>
                    <option value="transparent">Transparent</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={showBorders}
                      onChange={(e) => setShowBorders(e.target.checked)}
                      className="accent-blue-600 rounded"
                    />
                    <span>Draw Cell Borders</span>
                  </label>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={showLabels}
                      onChange={(e) => setShowLabels(e.target.checked)}
                      className="accent-blue-600 rounded"
                    />
                    <span>Include Text Labels</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Sheet Preview (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Live Sheet Preview (600×400 px)</span>
              <button
                type="button"
                onClick={handleDownloadSheet}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium flex items-center gap-1 cursor-pointer"
                title="Download raw sprite sheet image"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save PNG</span>
              </button>
            </div>

            {/* Checkerboard container for preview */}
            <div
              className="flex-1 min-h-[220px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 p-2 flex items-center justify-center overflow-hidden"
              style={{
                backgroundImage:
                  backgroundColor === 'transparent'
                    ? 'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)'
                    : 'none',
                backgroundSize: '12px 12px',
                backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
              }}
            >
              <canvas
                ref={previewCanvasRef}
                className="max-w-full max-h-[300px] object-contain shadow-md rounded border border-slate-300 dark:border-slate-800"
              />
            </div>

            {/* Auto crops option */}
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-xs">
              <label className="flex items-center gap-2 text-blue-900 dark:text-blue-200 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={autoApplyCrops}
                  onChange={(e) => setAutoApplyCrops(e.target.checked)}
                  className="accent-blue-600 rounded"
                />
                <span>Automatically create 2x3 Crop Rectangles in editor</span>
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-5 leading-normal">
                Generates 6 crops numbered 1, 2, 3, 4, 5, 6 ready for instant editing &amp; export.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#141722] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerateAndLoad}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Load into MultiCrop Editor</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
