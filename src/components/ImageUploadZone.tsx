import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react';
import { ImageInfo } from '../types/crop';
import { SAMPLE_SHEETS } from '../utils/sampleSheets';

interface ImageUploadZoneProps {
  onImageLoaded: (info: ImageInfo) => void;
  onOpenCustomRpg?: () => void;
}

export const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  onImageLoaded,
  onOpenCustomRpg,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setErrorMessage(null);
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

    if (!validTypes.includes(file.type.toLowerCase()) && !/\.(png|jpe?g|webp)$/i.test(file.name)) {
      setErrorMessage('Unsupported file format. Please upload a PNG, JPEG, or WebP image.');
      return;
    }

    setIsLoading(true);
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      setIsLoading(false);
      onImageLoaded({
        name: file.name,
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: file.size,
        type: file.type || 'image/png',
        url: objectUrl,
        element: img,
      });
    };

    img.onerror = () => {
      setIsLoading(false);
      URL.revokeObjectURL(objectUrl);
      setErrorMessage('Failed to read image file. Please try another image.');
    };

    img.src = objectUrl;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSampleSelect = (sheetId: string) => {
    const sample = SAMPLE_SHEETS.find((s) => s.id === sheetId);
    if (!sample) return;

    setIsLoading(true);
    setErrorMessage(null);

    const dataUrl = sample.getDataUrl();
    const img = new Image();

    img.onload = () => {
      setIsLoading(false);
      onImageLoaded({
        name: `${sample.id}.png`,
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: Math.round(dataUrl.length * 0.75),
        type: 'image/png',
        url: dataUrl,
        element: img,
      });
    };

    img.onerror = () => {
      setIsLoading(false);
      setErrorMessage('Could not load sample sheet.');
    };

    img.src = dataUrl;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 text-slate-800 dark:text-slate-200 overflow-y-auto transition-colors">
      <div className="max-w-2xl w-full">
        {/* Header Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-700/50 text-blue-700 dark:text-blue-300 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            100% Client-Side Pixel Processing
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
            Multi<span className="text-blue-600 dark:text-blue-400">Crop</span> Asset Extractor
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
            Extract multiple individual assets from sprite sheets, sticker packs, and photo grids.
            Zero upload to servers, full original resolution PNG &amp; ZIP export.
          </p>
        </div>

        {/* Dropzone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700/80 hover:border-blue-500 bg-slate-50/50 dark:bg-[#161922] hover:bg-blue-50/20 dark:hover:bg-[#1a1e2b]'
          }`}
          role="button"
          tabIndex={0}
          aria-label="Upload an image sheet"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                processFile(e.target.files[0]);
              }
            }}
          />

          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
            <Upload className="w-8 h-8" />
          </div>

          <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-1">
            {isLoading ? 'Processing Image...' : 'Drop your image sheet here'}
          </p>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4">
            or <span className="text-blue-600 dark:text-blue-400 underline font-medium">browse files</span> from your computer
          </p>

          <div className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#0f1117] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
            Supports PNG, JPEG, WebP • No file size limits
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-200 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Custom RPG Generator Option */}
        {onOpenCustomRpg && (
          <div className="mt-6">
            <button
              type="button"
              onClick={onOpenCustomRpg}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-slate-50 dark:from-blue-950/70 dark:via-[#1e1b4b]/60 dark:to-[#161922] border border-blue-200 dark:border-blue-700/60 hover:border-blue-500 hover:shadow-lg text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-600/10 dark:bg-blue-600/30 border border-blue-300 dark:border-blue-500/50 flex items-center justify-center text-blue-600 dark:text-blue-300 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-200">
                      Custom RPG Item Sprites (2x3 Grid)
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-sm">
                      Generator
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Pick custom weapons, shields, potions, colors &amp; load directly into MultiCrop
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-flex text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-700/50 group-hover:bg-blue-600 group-hover:text-white transition-all">
                Design Sheet &rarr;
              </span>
            </button>
          </div>
        )}

        {/* Built-in Sample Sheets for Instant Test */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center mb-3">
            Or test instantly with a preset asset sheet:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SAMPLE_SHEETS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSampleSelect(sample.id)}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-white dark:bg-[#161922] hover:bg-slate-50 dark:hover:bg-[#1e2333] border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-600/60 text-left transition-colors cursor-pointer group shadow-xs"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300">
                    {sample.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{sample.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
