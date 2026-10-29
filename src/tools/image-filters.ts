document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('filter-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('filter-drop-zone') as HTMLElement | null;
  const editorContainer = document.getElementById('filter-editor') as HTMLElement | null;
  const canvas = document.getElementById('filter-canvas') as HTMLCanvasElement | null;
  const presetsContainer = document.getElementById('filter-presets') as HTMLElement | null;
  const brightnessSlider = document.getElementById('f-brightness') as HTMLInputElement | null;
  const contrastSlider = document.getElementById('f-contrast') as HTMLInputElement | null;
  const saturationSlider = document.getElementById('f-saturation') as HTMLInputElement | null;
  const hueSlider = document.getElementById('f-hue') as HTMLInputElement | null;
  const sepiaSlider = document.getElementById('f-sepia') as HTMLInputElement | null;
  const graySlider = document.getElementById('f-gray') as HTMLInputElement | null;
  const blurSlider = document.getElementById('f-blur') as HTMLInputElement | null;
  const vignetteSlider = document.getElementById('f-vignette') as HTMLInputElement | null;
  const resetBtn = document.getElementById('reset-filters-btn') as HTMLButtonElement | null;
  const downloadBtn = document.getElementById('download-filtered-btn') as HTMLButtonElement | null;
  const compareBtn = document.getElementById('compare-filter-btn') as HTMLButtonElement | null;

  if (!fileInput || !dropZone || !editorContainer || !canvas || !downloadBtn) return;

  const cvs = canvas;
  const ctx = cvs.getContext('2d');
  let currentImg: HTMLImageElement | null = null;
  let showOriginal = false;

  const PRESETS: Record<string, { b: number; c: number; s: number; h: number; sep: number; gr: number; bl: number; vig: number }> = {
    original: { b: 100, c: 100, s: 100, h: 0, sep: 0, gr: 0, bl: 0, vig: 0 },
    vivid: { b: 105, c: 125, s: 145, h: 0, sep: 0, gr: 0, bl: 0, vig: 15 },
    warm: { b: 105, c: 110, s: 120, h: 15, sep: 25, gr: 0, bl: 0, vig: 20 },
    nordic: { b: 100, c: 115, s: 80, h: 190, sep: 0, gr: 0, bl: 0, vig: 25 },
    vintage: { b: 95, c: 90, s: 85, h: 25, sep: 40, gr: 0, bl: 0, vig: 40 },
    sepia: { b: 100, c: 100, s: 90, h: 0, sep: 80, gr: 0, bl: 0, vig: 30 },
    cyberpunk: { b: 110, c: 140, s: 170, h: 290, sep: 0, gr: 0, bl: 0, vig: 45 },
    dramatic_bw: { b: 110, c: 160, s: 0, h: 0, sep: 0, gr: 100, bl: 0, vig: 50 },
    polaroid: { b: 110, c: 95, s: 110, h: 10, sep: 20, gr: 0, bl: 0, vig: 35 },
    teal_orange: { b: 105, c: 130, s: 130, h: 30, sep: 15, gr: 0, bl: 0, vig: 30 },
    golden_hour: { b: 115, c: 110, s: 130, h: 20, sep: 30, gr: 0, bl: 0, vig: 20 },
    noir: { b: 90, c: 180, s: 0, h: 0, sep: 0, gr: 100, bl: 0, vig: 70 }
  };

  function setSliderValues(vals: { b: number; c: number; s: number; h: number; sep: number; gr: number; bl: number; vig: number }) {
    if (brightnessSlider) brightnessSlider.value = String(vals.b);
    if (contrastSlider) contrastSlider.value = String(vals.c);
    if (saturationSlider) saturationSlider.value = String(vals.s);
    if (hueSlider) hueSlider.value = String(vals.h);
    if (sepiaSlider) sepiaSlider.value = String(vals.sep);
    if (graySlider) graySlider.value = String(vals.gr);
    if (blurSlider) blurSlider.value = String(vals.bl);
    if (vignetteSlider) vignetteSlider.value = String(vals.vig);
    render();
  }

  function render() {
    if (!currentImg || !ctx) return;
    cvs.width = currentImg.width;
    cvs.height = currentImg.height;

    if (showOriginal) {
      ctx.filter = 'none';
      ctx.drawImage(currentImg, 0, 0);
      return;
    }

    const b = Number(brightnessSlider?.value || 100);
    const c = Number(contrastSlider?.value || 100);
    const s = Number(saturationSlider?.value || 100);
    const h = Number(hueSlider?.value || 0);
    const sep = Number(sepiaSlider?.value || 0);
    const gr = Number(graySlider?.value || 0);
    const bl = Number(blurSlider?.value || 0);
    const vig = Number(vignetteSlider?.value || 0) / 100;

    ctx.save();
    ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%) hue-rotate(${h}deg) sepia(${sep}%) grayscale(${gr}%) blur(${bl}px)`;
    ctx.drawImage(currentImg, 0, 0);
    ctx.restore();

    if (vig > 0) {
      const radius = Math.hypot(cvs.width, cvs.height) / 2;
      const vigGrad = ctx.createRadialGradient(
        cvs.width / 2,
        cvs.height / 2,
        radius * (1 - vig * 0.7),
        cvs.width / 2,
        cvs.height / 2,
        radius
      );
      vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vigGrad.addColorStop(1, `rgba(0,0,0,${vig * 0.8})`);
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, cvs.width, cvs.height);
    }
  }

  function loadFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        currentImg = img;
        dropZone?.classList.add('hidden');
        editorContainer?.classList.remove('hidden');
        render();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
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

  presetsContainer?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-preset]') as HTMLElement | null;
    if (!btn) return;
    const presetKey = btn.getAttribute('data-preset') || 'original';
    if (PRESETS[presetKey]) {
      setSliderValues(PRESETS[presetKey]);
    }
  });

  [
    brightnessSlider,
    contrastSlider,
    saturationSlider,
    hueSlider,
    sepiaSlider,
    graySlider,
    blurSlider,
    vignetteSlider
  ].forEach((ctrl) => {
    ctrl?.addEventListener('input', render);
    ctrl?.addEventListener('change', render);
  });

  resetBtn?.addEventListener('click', () => {
    setSliderValues(PRESETS.original);
  });

  compareBtn?.addEventListener('mousedown', () => {
    showOriginal = true;
    render();
  });
  window.addEventListener('mouseup', () => {
    if (showOriginal) {
      showOriginal = false;
      render();
    }
  });

  downloadBtn.addEventListener('click', () => {
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.download = `filtered-photo-${Date.now()}.jpg`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }, 'image/jpeg', 0.95);
  });
});
