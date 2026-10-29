import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  CropRect,
  ImageInfo,
  ActiveTool,
  ResizeHandle,
  GridConfig,
  formatDefaultCropName,
} from '../types/crop';
import {
  clampCrop,
  normalizeRect,
  resizeCrop,
} from '../utils/cropMath';
import { calculateGridCrops } from '../utils/gridGenerator';

interface ImageWorkspaceProps {
  imageInfo: ImageInfo;
  crops: CropRect[];
  selectedCropIds: Set<string>;
  onSelectCrop: (id: string, isMulti: boolean) => void;
  onUpdateCrop: (crop: CropRect, commitToHistory: boolean) => void;
  onAddCrop: (crop: CropRect) => void;
  activeTool: ActiveTool;
  gridConfig: GridConfig;
  showGridPreview: boolean;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  pan: { x: number; y: number };
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  onCursorMove: (coords: { x: number; y: number } | null) => void;
  namingFormat?: import('../types/crop').NamingFormat;
  namingPrefix?: string;
}

type InteractionMode =
  | { type: 'none' }
  | { type: 'pan'; startX: number; startY: number; initialPan: { x: number; y: number } }
  | { type: 'draw'; startX: number; startY: number; currentX: number; currentY: number }
  | { type: 'move'; cropId: string; initialCrop: CropRect; startImgX: number; startImgY: number }
  | { type: 'resize'; cropId: string; handle: ResizeHandle; initialCrop: CropRect; startImgX: number; startImgY: number };

export const ImageWorkspace: React.FC<ImageWorkspaceProps> = ({
  imageInfo,
  crops,
  selectedCropIds,
  onSelectCrop,
  onUpdateCrop,
  onAddCrop,
  activeTool,
  gridConfig,
  showGridPreview,
  zoom,
  setZoom,
  pan,
  setPan,
  onCursorMove,
  namingFormat = 'number',
  namingPrefix = 'asset',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [interaction, setInteraction] = useState<InteractionMode>({ type: 'none' });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  const imgW = imageInfo.width;
  const imgH = imageInfo.height;

  // Convert client viewport coordinates to original image pixel coordinates
  const clientToImageCoords = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const localX = clientX - rect.left - pan.x;
      const localY = clientY - rect.top - pan.y;
      const imgX = Math.round(localX / zoom);
      const imgY = Math.round(localY / zoom);
      return {
        x: Math.max(0, Math.min(imgW, imgX)),
        y: Math.max(0, Math.min(imgH, imgY)),
      };
    },
    [pan, zoom, imgW, imgH]
  );

  // Wheel zoom centered on cursor
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.min(10.0, Math.max(0.1, zoom * zoomFactor));

    // Keep point under cursor invariant
    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Keyboard Space key for quick pan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !(e.target instanceof HTMLInputElement)) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Pointer down interaction handler
  const handlePointerDown = (e: React.PointerEvent) => {
    // If middle click or space pressed or clicked directly on workspace background in select mode
    if (e.button === 1 || isSpacePressed) {
      e.preventDefault();
      setInteraction({
        type: 'pan',
        startX: e.clientX,
        startY: e.clientY,
        initialPan: { ...pan },
      });
      return;
    }

    if (e.button !== 0) return; // Only primary button

    const imgCoords = clientToImageCoords(e.clientX, e.clientY);

    if (activeTool === 'manual') {
      e.preventDefault();
      setInteraction({
        type: 'draw',
        startX: imgCoords.x,
        startY: imgCoords.y,
        currentX: imgCoords.x,
        currentY: imgCoords.y,
      });
    } else if (activeTool === 'select') {
      // Clicked on background: start pan or clear selection
      setInteraction({
        type: 'pan',
        startX: e.clientX,
        startY: e.clientY,
        initialPan: { ...pan },
      });
    }
  };

  // Pointer move handler
  const handlePointerMove = (e: React.PointerEvent) => {
    const imgCoords = clientToImageCoords(e.clientX, e.clientY);
    onCursorMove(imgCoords);

    if (interaction.type === 'pan') {
      const dx = e.clientX - interaction.startX;
      const dy = e.clientY - interaction.startY;
      setPan({
        x: interaction.initialPan.x + dx,
        y: interaction.initialPan.y + dy,
      });
    } else if (interaction.type === 'draw') {
      setInteraction({
        ...interaction,
        currentX: imgCoords.x,
        currentY: imgCoords.y,
      });
    } else if (interaction.type === 'move') {
      const dx = imgCoords.x - interaction.startImgX;
      const dy = imgCoords.y - interaction.startImgY;
      const raw = {
        ...interaction.initialCrop,
        x: interaction.initialCrop.x + dx,
        y: interaction.initialCrop.y + dy,
      };
      const clamped = clampCrop(raw, imgW, imgH);
      onUpdateCrop({ ...interaction.initialCrop, ...clamped }, false);
    } else if (interaction.type === 'resize') {
      const dx = imgCoords.x - interaction.startImgX;
      const dy = imgCoords.y - interaction.startImgY;
      const resized = resizeCrop(
        interaction.initialCrop,
        interaction.handle,
        dx,
        dy,
        imgW,
        imgH
      );
      onUpdateCrop({ ...interaction.initialCrop, ...resized }, false);
    }
  };

  // Pointer up handler
  const handlePointerUp = () => {
    if (interaction.type === 'draw') {
      const rect = normalizeRect(
        interaction.startX,
        interaction.startY,
        interaction.currentX,
        interaction.currentY
      );

      // Only create if rectangle meets minimum dimension
      if (rect.width >= 4 && rect.height >= 4) {
        const clamped = clampCrop(rect, imgW, imgH);
        const newCrop: CropRect = {
          id: `crop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: formatDefaultCropName(crops.length + 1, namingFormat, namingPrefix),
          x: clamped.x,
          y: clamped.y,
          width: clamped.width,
          height: clamped.height,
          selected: true,
        };
        onAddCrop(newCrop);
      }
    } else if (interaction.type === 'move') {
      // Commit final position to history
      const current = crops.find((c) => c.id === interaction.cropId);
      if (current) {
        onUpdateCrop(current, true);
      }
    } else if (interaction.type === 'resize') {
      // Commit final bounds to history
      const current = crops.find((c) => c.id === interaction.cropId);
      if (current) {
        onUpdateCrop(current, true);
      }
    }

    setInteraction({ type: 'none' });
  };

  // Drag draft crop box preview
  let draftBox: { x: number; y: number; width: number; height: number } | null = null;
  if (interaction.type === 'draw') {
    draftBox = normalizeRect(
      interaction.startX,
      interaction.startY,
      interaction.currentX,
      interaction.currentY
    );
  }

  // Live grid preview boxes
  const previewGridCrops =
    activeTool === 'grid' && showGridPreview
      ? calculateGridCrops(gridConfig, imgW, imgH)
      : [];

  const resizeHandles: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

  const getCursorForHandle = (h: ResizeHandle): string => {
    switch (h) {
      case 'nw':
      case 'se':
        return 'nwse-resize';
      case 'ne':
      case 'sw':
        return 'nesw-resize';
      case 'n':
      case 's':
        return 'ns-resize';
      case 'e':
      case 'w':
        return 'ew-resize';
    }
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        handlePointerUp();
        onCursorMove(null);
      }}
      className={`relative flex-1 w-full h-full overflow-hidden bg-slate-100/90 dark:bg-[#0a0c11] select-none touch-none transition-colors ${
        isSpacePressed || interaction.type === 'pan'
          ? 'cursor-grab active:cursor-grabbing'
          : activeTool === 'manual'
          ? 'cursor-crosshair'
          : 'cursor-default'
      }`}
    >
      {/* Grid Pattern Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25 dark:opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #94a3b8 1px, transparent 1px),
            linear-gradient(to bottom, #94a3b8 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Main Scaled & Panned Canvas Viewport */}
      <div
        className="absolute origin-top-left transition-none"
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          width: imgW,
          height: imgH,
        }}
      >
        {/* Source Image */}
        <img
          src={imageInfo.url}
          alt={imageInfo.name}
          className="absolute inset-0 pointer-events-none shadow-2xl block select-none max-w-none"
          style={{
            width: imgW,
            height: imgH,
            imageRendering: zoom > 2 ? 'pixelated' : 'auto',
          }}
          draggable={false}
        />

        {/* Live Grid Preview Overlay */}
        {previewGridCrops.map((gc, i) => (
          <div
            key={`grid_prev_${i}`}
            className="absolute border border-dashed border-violet-400/70 bg-violet-500/10 pointer-events-none transition-all"
            style={{
              left: gc.x,
              top: gc.y,
              width: gc.width,
              height: gc.height,
            }}
          >
            <span className="absolute top-0 left-0 bg-violet-900/80 text-violet-200 text-[10px] px-1 py-0.5 rounded-br font-mono">
              #{i + 1}
            </span>
          </div>
        ))}

        {/* Draft Crop Drag Preview */}
        {draftBox && (
          <div
            className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
            style={{
              left: draftBox.x,
              top: draftBox.y,
              width: draftBox.width,
              height: draftBox.height,
            }}
          >
            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-blue-950/90 text-blue-200 text-[10px] font-mono font-bold shadow">
              {Math.round(draftBox.width)} × {Math.round(draftBox.height)}
            </div>
          </div>
        )}

        {/* Existing Crop Rectangles */}
        {crops.map((crop, index) => {
          const isSelected = selectedCropIds.has(crop.id);

          return (
            <div
              key={crop.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectCrop(crop.id, e.shiftKey || e.metaKey || e.ctrlKey);
              }}
              onPointerDown={(e) => {
                if (activeTool !== 'select' || e.button !== 0 || isSpacePressed) return;
                e.stopPropagation();

                onSelectCrop(crop.id, e.shiftKey || e.metaKey || e.ctrlKey);

                const imgCoords = clientToImageCoords(e.clientX, e.clientY);
                setInteraction({
                  type: 'move',
                  cropId: crop.id,
                  initialCrop: { ...crop },
                  startImgX: imgCoords.x,
                  startImgY: imgCoords.y,
                });
              }}
              className={`absolute transition-colors ${
                isSelected
                  ? 'border-2 border-blue-600 bg-blue-600/15 ring-2 ring-blue-500/40 z-20 cursor-move'
                  : 'border border-blue-500/80 bg-blue-900/10 hover:border-blue-400 hover:bg-blue-600/15 z-10 cursor-pointer'
              }`}
              style={{
                left: crop.x,
                top: crop.y,
                width: crop.width,
                height: crop.height,
              }}
            >
              {/* Badge Label: Index, Name, Dimensions */}
              <div
                className={`absolute top-0 left-0 -translate-y-full flex items-center gap-1 px-1.5 py-0.5 rounded-t text-[10px] font-mono font-medium shadow-sm pointer-events-none whitespace-nowrap ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-900/90 text-slate-100 border border-slate-700'
                }`}
                style={{
                  // Keep badge readable even when zoomed way out
                  transform: `translateY(-100%) scale(${Math.max(0.6, 1 / Math.sqrt(zoom))})`,
                  transformOrigin: 'bottom left',
                }}
              >
                <span>#{index + 1}</span>
                <span className="font-sans font-semibold max-w-[80px] truncate">
                  {crop.name}
                </span>
                <span className="opacity-80">
                  {crop.width}×{crop.height}
                </span>
              </div>

              {/* 8 Resize Handles for Selected Crop */}
              {isSelected &&
                resizeHandles.map((handle) => {
                  let handleStyle: React.CSSProperties = {
                    position: 'absolute',
                    width: 10 / Math.max(0.5, zoom),
                    height: 10 / Math.max(0.5, zoom),
                    backgroundColor: '#ffffff',
                    border: '2px solid #2563eb',
                    borderRadius: 2,
                    zIndex: 30,
                  };

                  if (handle.includes('n')) handleStyle.top = -5 / Math.max(0.5, zoom);
                  else if (handle.includes('s')) handleStyle.bottom = -5 / Math.max(0.5, zoom);
                  else handleStyle.top = '50%', handleStyle.marginTop = -5 / Math.max(0.5, zoom);

                  if (handle.includes('w')) handleStyle.left = -5 / Math.max(0.5, zoom);
                  else if (handle.includes('e')) handleStyle.right = -5 / Math.max(0.5, zoom);
                  else handleStyle.left = '50%', handleStyle.marginLeft = -5 / Math.max(0.5, zoom);

                  return (
                    <div
                      key={handle}
                      style={{
                        ...handleStyle,
                        cursor: getCursorForHandle(handle),
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const imgCoords = clientToImageCoords(e.clientX, e.clientY);
                        setInteraction({
                          type: 'resize',
                          cropId: crop.id,
                          handle,
                          initialCrop: { ...crop },
                          startImgX: imgCoords.x,
                          startImgY: imgCoords.y,
                        });
                      }}
                    />
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
