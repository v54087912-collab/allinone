/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ActiveTool,
  BackgroundRemovalConfig,
  CropRect,
  GridConfig,
  ImageInfo,
  NamingFormat,
} from './types/crop';
import { useUndoRedo } from './hooks/useUndoRedo';
import { clampCrop } from './utils/cropMath';
import { TopNavigation } from './components/TopNavigation';
import { ToolSidebar } from './components/ToolSidebar';
import { ImageWorkspace } from './components/ImageWorkspace';
import { AssetGallery } from './components/AssetGallery';
import { GridCropSettings } from './components/GridCropSettings';
import { BackgroundRemovalModal } from './components/BackgroundRemovalModal';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { CustomRpgSheetModal } from './components/CustomRpgSheetModal';
import { CustomGridSetModal } from './components/CustomGridSetModal';
import { DetectObjectsModal } from './components/DetectObjectsModal';
import { StatusBar } from './components/StatusBar';
import { ImageUploadZone } from './components/ImageUploadZone';
import { StatisticsPanel } from './components/StatisticsPanel';
import { calculateCropStatistics } from './utils/cropStatistics';
import { SAMPLE_SHEETS } from './utils/sampleSheets';
import { Layers, Grid3X3, BarChart3, X } from 'lucide-react';
import { loadSession, saveSession, clearSession } from './utils/sessionStore';

export default function App() {
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');
  const [selectedCropIds, setSelectedCropIds] = useState<Set<string>>(new Set());

  // Right sidebar active tab: 'assets', 'grid', or 'stats'
  const [sidebarTab, setSidebarTab] = useState<'assets' | 'grid' | 'stats'>('assets');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modals state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBgRemovalOpen, setIsBgRemovalOpen] = useState(false);
  const [isCustomRpgOpen, setIsCustomRpgOpen] = useState(false);
  const [isCustomGridSetOpen, setIsCustomGridSetOpen] = useState(false);
  const [isDetectObjectsOpen, setIsDetectObjectsOpen] = useState(false);

  // Settings
  const [defaultPrefix, setDefaultPrefix] = useState('asset');
  const [namingFormat, setNamingFormat] = useState<NamingFormat>('number');

  // White Background Removal configuration (disabled by default)
  const [bgConfig, setBgConfig] = useState<BackgroundRemovalConfig>({
    enabled: false,
    tolerance: 28,
    mode: 'edge-flood',
  });

  // Grid crop generator configuration
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    rows: 2,
    cols: 3,
    autoCalculate: true,
    cellWidth: 100,
    cellHeight: 100,
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 20,
    marginRight: 20,
    gapX: 10,
    gapY: 10,
  });
  const [showGridPreview, setShowGridPreview] = useState(true);

  // Undo/Redo state manager for crops
  const {
    crops,
    setCrops,
    setCropsWithoutHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  } = useUndoRedo([]);

  // Image sheet coverage percentage for status and analytics
  const sheetCoverage = useMemo(() => {
    if (!imageInfo || crops.length === 0) return 0;
    return calculateCropStatistics(crops, imageInfo).coveragePercentage;
  }, [crops, imageInfo]);

  // Zoom and Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number } | null>(null);

  const workspaceContainerRef = useRef<HTMLDivElement>(null);

  // Fit to screen helper
  const fitToScreen = useCallback(() => {
    if (!imageInfo || !workspaceContainerRef.current) return;
    const { clientWidth: containerW, clientHeight: containerH } =
      workspaceContainerRef.current;

    const padding = 60;
    const availableW = Math.max(100, containerW - padding);
    const availableH = Math.max(100, containerH - padding);

    const scaleX = availableW / imageInfo.width;
    const scaleY = availableH / imageInfo.height;
    const fitZoom = Math.min(scaleX, scaleY, 1.5);

    const initialPanX = (containerW - imageInfo.width * fitZoom) / 2;
    const initialPanY = (containerH - imageInfo.height * fitZoom) / 2;

    setZoom(fitZoom);
    setPan({ x: initialPanX, y: initialPanY });
  }, [imageInfo]);

  // When image loads, reset and fit
  const handleImageLoaded = (info: ImageInfo) => {
    // Revoke old object URL if any
    if (imageInfo?.url && imageInfo.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageInfo.url);
    }
    setImageInfo(info);
    resetHistory([]);
    setSelectedCropIds(new Set());
    setActiveTool('select');
  };

  // Return to home screen
  const handleGoHome = useCallback(() => {
    if (crops.length > 0) {
      if (window.confirm('Return to Home screen? Current crops will be cleared.')) {
        if (imageInfo?.url && imageInfo.url.startsWith('blob:')) {
          URL.revokeObjectURL(imageInfo.url);
        }
        clearSession('multicrop_session');
        setImageInfo(null);
        resetHistory([]);
        setSelectedCropIds(new Set());
      }
    } else {
      if (imageInfo?.url && imageInfo.url.startsWith('blob:')) {
        URL.revokeObjectURL(imageInfo.url);
      }
      clearSession('multicrop_session');
      setImageInfo(null);
      resetHistory([]);
      setSelectedCropIds(new Set());
    }
  }, [crops.length, imageInfo, resetHistory]);

  // Restore session from IndexedDB on initial mount
  useEffect(() => {
    let isCancelled = false;
    async function restore() {
      try {
        const saved = await loadSession<any>('multicrop_session');
        if (saved && saved.imageBlob && !isCancelled) {
          const url = URL.createObjectURL(saved.imageBlob);
          const img = new Image();
          img.onload = () => {
            if (isCancelled) return;
            setImageInfo({
              name: saved.imageName || 'saved-image.png',
              width: saved.imageWidth || img.naturalWidth,
              height: saved.imageHeight || img.naturalHeight,
              size: saved.imageBlob.size,
              type: saved.imageType || 'image/png',
              url,
              element: img,
            });
            if (Array.isArray(saved.crops)) {
              resetHistory(saved.crops);
            }
            if (saved.defaultPrefix) setDefaultPrefix(saved.defaultPrefix);
            if (saved.namingFormat) setNamingFormat(saved.namingFormat);
            if (saved.bgConfig) setBgConfig(saved.bgConfig);
            if (saved.gridConfig) setGridConfig(saved.gridConfig);
          };
          img.src = url;
        }
      } catch (err) {
        console.warn('Could not restore multicrop session:', err);
      } finally {
        if (!isCancelled) setIsRestoringSession(false);
      }
    }
    restore();
    return () => {
      isCancelled = true;
    };
  }, [resetHistory]);

  // Persist session to IndexedDB when image or crops change
  useEffect(() => {
    if (isRestoringSession) return;
    if (!imageInfo) return;

    const timer = setTimeout(async () => {
      try {
        let blob: Blob | null = null;
        if (imageInfo.url.startsWith('blob:') || imageInfo.url.startsWith('data:')) {
          const res = await fetch(imageInfo.url);
          blob = await res.blob();
        }

        if (blob) {
          await saveSession('multicrop_session', {
            imageBlob: blob,
            imageName: imageInfo.name,
            imageWidth: imageInfo.width,
            imageHeight: imageInfo.height,
            imageType: imageInfo.type,
            crops,
            defaultPrefix,
            namingFormat,
            bgConfig,
            gridConfig,
          });
        }
      } catch (err) {
        console.warn('Failed to auto-save multicrop session:', err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [imageInfo, crops, defaultPrefix, namingFormat, bgConfig, gridConfig, isRestoringSession]);

  // Load custom-generated RPG sheet into the editor with pre-calculated crops
  const handleLoadCustomSheet = useCallback(
    (info: ImageInfo, autoCrops?: CropRect[]) => {
      if (imageInfo?.url && imageInfo.url.startsWith('blob:')) {
        URL.revokeObjectURL(imageInfo.url);
      }
      setImageInfo(info);
      const initial = autoCrops || [];
      resetHistory(initial);
      setSelectedCropIds(new Set());
      setSidebarTab('assets');
      setActiveTool('select');
      setIsCustomRpgOpen(false);
    },
    [imageInfo, resetHistory]
  );

  useEffect(() => {
    if (imageInfo) {
      // Delay fit to let DOM render container
      const timer = setTimeout(fitToScreen, 50);
      return () => clearTimeout(timer);
    }
  }, [imageInfo, fitToScreen]);

  // Automatically switch tab when grid tool is activated
  useEffect(() => {
    if (activeTool === 'grid') {
      setSidebarTab('grid');
    }
  }, [activeTool]);

  // Crop management operations
  const handleSelectCrop = useCallback((id: string, isMulti: boolean) => {
    setSelectedCropIds((prev) => {
      const next = new Set(isMulti ? prev : []);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedCropIds(new Set(crops.map((c) => c.id)));
  }, [crops]);

  const handleDeselectAll = useCallback(() => {
    setSelectedCropIds(new Set());
  }, []);

  const handleAddCrop = useCallback(
    (newCrop: CropRect) => {
      setCrops((prev) => [...prev, newCrop]);
      setSelectedCropIds(new Set([newCrop.id]));
      setActiveTool('select');
    },
    [setCrops]
  );

  const handleUpdateCrop = useCallback(
    (updatedCrop: CropRect, commitToHistory: boolean) => {
      if (commitToHistory) {
        setCrops((prev) =>
          prev.map((c) => (c.id === updatedCrop.id ? updatedCrop : c))
        );
      } else {
        setCropsWithoutHistory((prev) =>
          prev.map((c) => (c.id === updatedCrop.id ? updatedCrop : c))
        );
      }
    },
    [setCrops, setCropsWithoutHistory]
  );

  const handleDeleteCrops = useCallback(
    (idsToDelete: string[]) => {
      const set = new Set(idsToDelete);
      setCrops((prev) => prev.filter((c) => !set.has(c.id)));
      setSelectedCropIds((prev) => {
        const next = new Set(prev);
        idsToDelete.forEach((id) => next.delete(id));
        return next;
      });
    },
    [setCrops]
  );

  const handleDuplicateCrop = useCallback(
    (cropId: string) => {
      const target = crops.find((c) => c.id === cropId);
      if (!target || !imageInfo) return;

      const offset = 20;
      const raw = {
        x: target.x + offset,
        y: target.y + offset,
        width: target.width,
        height: target.height,
      };
      const clamped = clampCrop(raw, imageInfo.width, imageInfo.height);

      const newName =
        namingFormat === 'number'
          ? String(crops.length + 1)
          : `${target.name}_copy`;

      const newCrop: CropRect = {
        id: `crop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: newName,
        x: clamped.x,
        y: clamped.y,
        width: clamped.width,
        height: clamped.height,
        selected: true,
      };

      setCrops((prev) => [...prev, newCrop]);
      setSelectedCropIds(new Set([newCrop.id]));
    },
    [crops, imageInfo, setCrops]
  );

  const handleRenameCrop = useCallback(
    (id: string, newName: string) => {
      setCrops((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: newName } : c))
      );
    },
    [setCrops]
  );

  const handleBatchRename = useCallback(
    (renames: { id: string; name: string }[]) => {
      const map = new Map(renames.map((r) => [r.id, r.name]));
      setCrops((prev) =>
        prev.map((c) => {
          const newName = map.get(c.id);
          return newName !== undefined ? { ...c, name: newName } : c;
        })
      );
    },
    [setCrops]
  );

  const handleApplyGrid = useCallback(
    (gridCrops: CropRect[], replaceExisting: boolean) => {
      if (replaceExisting) {
        setCrops(gridCrops);
        setSelectedCropIds(new Set());
      } else {
        setCrops((prev) => [...prev, ...gridCrops]);
      }
      setSidebarTab('assets');
      setActiveTool('select');
    },
    [setCrops]
  );

  const handleApplyDetectedCrops = useCallback(
    (detectedCrops: CropRect[], replaceExisting: boolean) => {
      if (replaceExisting) {
        setCrops(detectedCrops);
        setSelectedCropIds(new Set(detectedCrops.map((c) => c.id)));
      } else {
        setCrops((prev) => [...prev, ...detectedCrops]);
        setSelectedCropIds(new Set(detectedCrops.map((c) => c.id)));
      }
      setSidebarTab('assets');
      setActiveTool('select');
    },
    [setCrops]
  );

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(10, z * 1.25));
  const handleZoomOut = () => setZoom((z) => Math.max(0.1, z * 0.8));
  const handleZoom100 = () => {
    if (!imageInfo || !workspaceContainerRef.current) return;
    const { clientWidth: containerW, clientHeight: containerH } =
      workspaceContainerRef.current;
    setZoom(1);
    setPan({
      x: (containerW - imageInfo.width) / 2,
      y: (containerH - imageInfo.height) / 2,
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept shortcuts when editing text inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) redo();
        } else {
          if (canUndo) undo();
        }
      } else if (cmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (canRedo) redo();
      } else if (cmdOrCtrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const firstSelected = Array.from(selectedCropIds)[0];
        if (firstSelected) {
          handleDuplicateCrop(firstSelected);
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedCropIds.size > 0) {
          e.preventDefault();
          handleDeleteCrops(Array.from(selectedCropIds));
        }
      } else if (e.key.toLowerCase() === 'v') {
        setActiveTool('select');
      } else if (e.key.toLowerCase() === 'c') {
        setActiveTool('manual');
      } else if (e.key.toLowerCase() === 'g') {
        setActiveTool('grid');
        setSidebarTab('grid');
      } else if (e.key.toLowerCase() === 'f') {
        fitToScreen();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '1' || e.key === '0') {
        handleZoom100();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    canUndo,
    canRedo,
    undo,
    redo,
    selectedCropIds,
    handleDuplicateCrop,
    handleDeleteCrops,
    fitToScreen,
  ]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (imageInfo?.url && imageInfo.url.startsWith('blob:')) {
        URL.revokeObjectURL(imageInfo.url);
      }
    };
  }, [imageInfo]);

  const hasSelectedCrop = selectedCropIds.size > 0;
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Prevent background scroll when studio is in fullscreen mode
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 flex flex-col h-screen w-screen bg-white dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 overflow-hidden font-sans'
          : 'flex flex-col h-[calc(100dvh-4rem)] sm:h-[760px] md:h-[820px] min-h-[480px] sm:min-h-[540px] w-full bg-white dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 rounded-xl sm:rounded-2xl overflow-hidden font-sans shadow-xl relative border border-slate-200 dark:border-slate-800'
      }
    >
      {/* Top Navigation */}
      <TopNavigation
        hasImage={!!imageInfo}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onNewProject={() => {
          if (crops.length > 0) {
            if (window.confirm('Start a new project? Current crops will be cleared.')) {
              if (imageInfo?.url && imageInfo.url.startsWith('blob:')) {
                URL.revokeObjectURL(imageInfo.url);
              }
              clearSession('multicrop_session');
              setImageInfo(null);
              resetHistory([]);
            }
          } else {
            if (imageInfo?.url && imageInfo.url.startsWith('blob:')) {
              URL.revokeObjectURL(imageInfo.url);
            }
            clearSession('multicrop_session');
            setImageInfo(null);
            resetHistory([]);
          }
        }}
        onGoHome={handleGoHome}
        onOpenCustomRpg={() => setIsCustomRpgOpen(true)}
        onOpenCustomGridSet={() => setIsCustomGridSetOpen(true)}
        onOpenDetectObjects={() => setIsDetectObjectsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBgRemoval={() => setIsBgRemovalOpen(true)}
        cropCount={crops.length}
        selectedCount={selectedCropIds.size}
        bgConfig={bgConfig}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      />

      {/* Main Content Area */}
      {!imageInfo ? (
        <ImageUploadZone
          onImageLoaded={handleImageLoaded}
          onOpenCustomRpg={() => setIsCustomRpgOpen(true)}
        />
      ) : (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Toolbar */}
          <ToolSidebar
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            hasSelectedCrop={hasSelectedCrop}
            onDuplicateSelected={() => {
              const first = Array.from(selectedCropIds)[0];
              if (first) handleDuplicateCrop(first);
            }}
            onDeleteSelected={() => {
              handleDeleteCrops(Array.from(selectedCropIds));
            }}
            onOpenDetectObjects={() => setIsDetectObjectsOpen(true)}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onZoom100={handleZoom100}
            onFitToScreen={fitToScreen}
            zoom={zoom}
          />

          {/* Central Workspace Canvas */}
          <div ref={workspaceContainerRef} className="flex-1 relative overflow-hidden flex flex-col">
            <ImageWorkspace
              imageInfo={imageInfo}
              crops={crops}
              selectedCropIds={selectedCropIds}
              onSelectCrop={handleSelectCrop}
              onUpdateCrop={handleUpdateCrop}
              onAddCrop={handleAddCrop}
              activeTool={activeTool}
              gridConfig={gridConfig}
              showGridPreview={showGridPreview}
              zoom={zoom}
              setZoom={setZoom}
              pan={pan}
              setPan={setPan}
              onCursorMove={setCursorCoords}
              namingFormat={namingFormat}
              namingPrefix={defaultPrefix}
            />

            {/* Mobile Sidebar Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="md:hidden absolute bottom-4 right-4 z-40 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xl flex items-center gap-2 text-xs font-semibold cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Assets ({crops.length})</span>
            </button>
          </div>

          {/* Mobile backdrop */}
          {mobileSidebarOpen && (
            <div
              className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-xs z-30 transition-opacity"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close assets drawer"
            />
          )}

          {/* Right Sidebar (Desktop permanent, Mobile drawer) */}
          <div
            className={`fixed md:relative inset-y-0 right-0 z-40 w-80 max-w-[85vw] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#12151d] flex flex-col transition-transform duration-200 md:translate-x-0 ${
              mobileSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
            }`}
          >
            {/* Sidebar Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f1117] p-1 gap-1">
              <button
                type="button"
                onClick={() => setSidebarTab('assets')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  sidebarTab === 'assets'
                    ? 'bg-white dark:bg-[#181b26] text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Assets ({crops.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSidebarTab('grid');
                  setActiveTool('grid');
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  sidebarTab === 'grid'
                    ? 'bg-white dark:bg-[#181b26] text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Grid</span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab('stats')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  sidebarTab === 'stats'
                    ? 'bg-white dark:bg-[#181b26] text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="View crop statistics & image coverage"
              >
                <BarChart3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Stats</span>
              </button>

              {/* Mobile Close Button */}
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sidebar Tab Content */}
            {sidebarTab === 'assets' ? (
              <AssetGallery
                imageInfo={imageInfo}
                crops={crops}
                selectedCropIds={selectedCropIds}
                onSelectCrop={handleSelectCrop}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onDeleteCrops={handleDeleteCrops}
                onDuplicateCrop={handleDuplicateCrop}
                onRenameCrop={handleRenameCrop}
                onBatchRename={handleBatchRename}
                onOpenExport={() => setIsExportOpen(true)}
                bgConfig={bgConfig}
              />
            ) : sidebarTab === 'grid' ? (
              <GridCropSettings
                imageInfo={imageInfo}
                gridConfig={gridConfig}
                setGridConfig={setGridConfig}
                showGridPreview={showGridPreview}
                setShowGridPreview={setShowGridPreview}
                existingCropCount={crops.length}
                onApplyGrid={handleApplyGrid}
                onClose={() => setSidebarTab('assets')}
                onOpenCustomGridSetModal={() => setIsCustomGridSetOpen(true)}
                namingFormat={namingFormat}
                namingPrefix={defaultPrefix}
              />
            ) : (
              <StatisticsPanel
                imageInfo={imageInfo}
                crops={crops}
                selectedCropIds={selectedCropIds}
                onSelectCrop={handleSelectCrop}
                onSelectAll={handleSelectAll}
              />
            )}
          </div>
        </div>
      )}

      {/* Bottom Status Bar */}
      <StatusBar
        imageInfo={imageInfo}
        zoom={zoom}
        cropCount={crops.length}
        selectedCount={selectedCropIds.size}
        cursorCoords={cursorCoords}
        coveragePercentage={sheetCoverage}
        onOpenStats={() => setSidebarTab('stats')}
      />

      {/* Modals */}
      {imageInfo && (
        <>
          <ExportModal
            isOpen={isExportOpen}
            onClose={() => setIsExportOpen(false)}
            imageInfo={imageInfo}
            crops={crops}
            selectedCropIds={selectedCropIds}
            bgConfig={bgConfig}
          />

          <BackgroundRemovalModal
            isOpen={isBgRemovalOpen}
            onClose={() => setIsBgRemovalOpen(false)}
            bgConfig={bgConfig}
            setBgConfig={setBgConfig}
          />

          <CustomGridSetModal
            isOpen={isCustomGridSetOpen}
            onClose={() => setIsCustomGridSetOpen(false)}
            imageInfo={imageInfo}
            currentGridConfig={gridConfig}
            onApplyGrid={handleApplyGrid}
            onUpdateGridConfig={setGridConfig}
            existingCropCount={crops.length}
            namingFormat={namingFormat}
            defaultPrefix={defaultPrefix}
          />

          <DetectObjectsModal
            isOpen={isDetectObjectsOpen}
            onClose={() => setIsDetectObjectsOpen(false)}
            imageInfo={imageInfo}
            existingCropCount={crops.length}
            onApplyCrops={handleApplyDetectedCrops}
            bgConfig={bgConfig}
          />
        </>
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        defaultPrefix={defaultPrefix}
        setDefaultPrefix={setDefaultPrefix}
        namingFormat={namingFormat}
        setNamingFormat={setNamingFormat}
      />

      <CustomRpgSheetModal
        isOpen={isCustomRpgOpen}
        onClose={() => setIsCustomRpgOpen(false)}
        onLoadCustomSheet={handleLoadCustomSheet}
      />
    </div>
  );
}
