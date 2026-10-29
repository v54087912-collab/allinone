import { calculateAspectRatioFit } from '../utils/imageUtilityTools.ts';

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('resize-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('resize-drop-zone') as HTMLElement | null;
  const editorContainer = document.getElementById('resize-editor') as HTMLElement | null;
  const canvas = document.getElementById('resize-canvas') as HTMLCanvasElement | null;
  const widthInput = document.getElementById('resize-width') as HTMLInputElement | null;
  const heightInput = document.getElementById('resize-height') as HTMLInputElement | null;
  const lockAspectBtn = document.getElementById('lock-aspect-btn') as HTMLButtonElement | null;
  const presetSelect = document.getElementById('resize-preset-select') as HTMLSelectElement | null;
  const fitModeSelect = document.getElementById('resize-fit-select') as HTMLSelectElement | null;
  const bgColorSelect = document.getElementById('resize-bg-select') as HTMLSelectElement | null;
  const formatSelect = document.getElementById('resize-format') as HTMLSelectElement | null;
  const qualitySlider = document.getElementById('resize-quality') as HTMLInputElement | null;
  const qualityVal = document.getElementById('resize-quality-val') as HTMLElement | null;
  const downloadBtn = document.getElementById('download-resized-btn') as HTMLButtonElement | null;
  const infoBadge = document.getElementById('resize-info-badge') as HTMLElement | null;

  if (!fileInput || !dropZone || !editorContainer || !canvas || !downloadBtn) return;

  const cvs = canvas;
  const ctx = cvs.getContext('2d');
  let currentImg: HTMLImageElement | null = null;
  let lockAspect = true;
  let originalRatio = 1;

  function loadFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        currentImg = img;
        originalRatio = img.width / img.height;
        if (widthInput) widthInput.value = String(img.width);
        if (heightInput) heightInput.value = String(img.height);
        dropZone?.classList.add('hidden');
        editorContainer?.classList.remove('hidden');
        render();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function render() {
    if (!currentImg || !ctx) return;
    const targetW = Math.max(10, Number(widthInput?.value || currentImg.width));
    const targetH = Math.max(10, Number(heightInput?.value || currentImg.height));
    const fitMode = (fitModeSelect?.value as 'fit' | 'cover' | 'stretch') || 'fit';
    const bg = bgColorSelect?.value || 'transparent';

    cvs.width = targetW;
    cvs.height = targetH;

    ctx.clearRect(0, 0, targetW, targetH);

    if (bg !== 'transparent') {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, targetW, targetH);
    }

    const fit = calculateAspectRatioFit(currentImg.width, currentImg.height, targetW, targetH, fitMode);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      currentImg,
      fit.sx,
      fit.sy,
      fit.sw,
      fit.sh,
      fit.dx,
      fit.dy,
      fit.dw,
      fit.dh
    );

    if (infoBadge) {
      infoBadge.textContent = `Original: ${currentImg.width} × ${currentImg.height} px ➜ Output: ${targetW} × ${targetH} px`;
    }
  }

  dropZone.addEventListener('dragover', (e) => e.preventDefault());
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files.length) loadFile(e.dataTransfer.files[0]);
  });
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files?.length) loadFile(fileInput.files[0]);
  });

  widthInput?.addEventListener('input', () => {
    if (lockAspect && currentImg && heightInput) {
      const w = Number(widthInput.value);
      heightInput.value = String(Math.round(w / originalRatio));
    }
    render();
  });

  heightInput?.addEventListener('input', () => {
    if (lockAspect && currentImg && widthInput) {
      const h = Number(heightInput.value);
      widthInput.value = String(Math.round(h * originalRatio));
    }
    render();
  });

  lockAspectBtn?.addEventListener('click', () => {
    lockAspect = !lockAspect;
    lockAspectBtn.classList.toggle('text-blue-600', lockAspect);
    lockAspectBtn.classList.toggle('bg-blue-50', lockAspect);
    lockAspectBtn.classList.toggle('dark:bg-blue-900/30', lockAspect);
  });

  presetSelect?.addEventListener('change', () => {
    if (!currentImg) return;
    const val = presetSelect.value;
    if (val === 'custom') return;

    if (val.startsWith('scale-')) {
      const pct = Number(val.replace('scale-', '')) / 100;
      if (widthInput) widthInput.value = String(Math.round(currentImg.width * pct));
      if (heightInput) heightInput.value = String(Math.round(currentImg.height * pct));
    } else {
      const [w, h] = val.split('x').map(Number);
      if (widthInput) widthInput.value = String(w);
      if (heightInput) heightInput.value = String(h);
    }
    render();
  });

  [fitModeSelect, bgColorSelect].forEach((ctrl) => {
    ctrl?.addEventListener('change', render);
  });

  qualitySlider?.addEventListener('input', () => {
    if (qualityVal) qualityVal.textContent = `${qualitySlider.value}%`;
  });

  downloadBtn.addEventListener('click', () => {
    if (!canvas) return;
    const format = formatSelect?.value || 'image/png';
    const quality = Number(qualitySlider?.value || 90) / 100;
    const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const link = document.createElement('a');
        link.download = `resized-${canvas.width}x${canvas.height}.${ext}`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      },
      format,
      quality
    );
  });
});
