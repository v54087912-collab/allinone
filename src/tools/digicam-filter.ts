document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('digi-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('digi-drop-zone') as HTMLElement | null;
  const editorContainer = document.getElementById('digi-editor') as HTMLElement | null;
  const canvas = document.getElementById('digi-canvas') as HTMLCanvasElement | null;
  const presetSelect = document.getElementById('digi-preset-select') as HTMLSelectElement | null;
  const bloomSlider = document.getElementById('digi-bloom-slider') as HTMLInputElement | null;
  const satSlider = document.getElementById('digi-sat-slider') as HTMLInputElement | null;
  const sharpSlider = document.getElementById('digi-sharp-slider') as HTMLInputElement | null;
  const noiseSlider = document.getElementById('digi-noise-slider') as HTMLInputElement | null;
  const timestampCheck = document.getElementById('digi-timestamp-check') as HTMLInputElement | null;
  const downloadBtn = document.getElementById('download-digi-btn') as HTMLButtonElement | null;

  if (!fileInput || !dropZone || !editorContainer || !canvas || !downloadBtn) return;

  const cvs = canvas;
  const ctx = cvs.getContext('2d');
  let currentImg: HTMLImageElement | null = null;

  function loadFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        currentImg = img;
        dropZone?.classList.add('hidden');
        editorContainer?.classList.remove('hidden');
        applyPreset();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function applyPreset() {
    const p = presetSelect?.value || 'canon';
    if (p === 'canon') {
      if (bloomSlider) bloomSlider.value = '40';
      if (satSlider) satSlider.value = '30';
      if (sharpSlider) sharpSlider.value = '35';
      if (noiseSlider) noiseSlider.value = '20';
    } else if (p === 'sony') {
      if (bloomSlider) bloomSlider.value = '55';
      if (satSlider) satSlider.value = '45';
      if (sharpSlider) sharpSlider.value = '50';
      if (noiseSlider) noiseSlider.value = '25';
    } else if (p === 'coolpix') {
      if (bloomSlider) bloomSlider.value = '30';
      if (satSlider) satSlider.value = '20';
      if (sharpSlider) sharpSlider.value = '40';
      if (noiseSlider) noiseSlider.value = '35';
    } else if (p === 'flash') {
      if (bloomSlider) bloomSlider.value = '65';
      if (satSlider) satSlider.value = '50';
      if (sharpSlider) sharpSlider.value = '60';
      if (noiseSlider) noiseSlider.value = '30';
    }
    render();
  }

  function render() {
    if (!currentImg || !ctx) return;
    cvs.width = currentImg.width;
    cvs.height = currentImg.height;

    const bloom = Number(bloomSlider?.value || 40) / 100;
    const satBoost = Number(satSlider?.value || 30) / 100;
    const noise = Number(noiseSlider?.value || 20) / 100;
    const sharp = Number(sharpSlider?.value || 35) / 100;
    const withTimestamp = timestampCheck?.checked ?? true;

    // Base draw with CSS filter for saturation & contrast boost
    ctx.save();
    const satVal = 100 + satBoost * 60;
    ctx.filter = `saturate(${satVal}%) contrast(115%)`;
    ctx.drawImage(currentImg, 0, 0);
    ctx.restore();

    // Bloom effect using screen composite
    if (bloom > 0) {
      const bloomCanvas = document.createElement('canvas');
      bloomCanvas.width = cvs.width;
      bloomCanvas.height = cvs.height;
      const bCtx = bloomCanvas.getContext('2d');
      if (bCtx) {
        bCtx.drawImage(cvs, 0, 0);
        bCtx.filter = `blur(${Math.max(4, cvs.width * 0.015)}px) brightness(130%)`;
        bCtx.drawImage(cvs, 0, 0);

        ctx.save();
        ctx.globalAlpha = bloom * 0.45;
        ctx.globalCompositeOperation = 'screen';
        ctx.drawImage(bloomCanvas, 0, 0);
        ctx.restore();
      }
    }

    // CCD Pixel Noise & Sharpness
    const imgData = ctx.getImageData(0, 0, cvs.width, cvs.height);
    const data = imgData.data;
    const len = data.length;

    let seed = 98765;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed / 2147483647) - 0.5;
    };

    const noiseStrength = noise * 30;
    const contrastMult = 1 + sharp * 0.2;

    for (let i = 0; i < len; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Subtle dynamic range crushing (Y2K compact flash look)
      r = ((r - 128) * contrastMult) + 128;
      g = ((g - 128) * contrastMult) + 128;
      b = ((b - 128) * contrastMult) + 128;

      if (noiseStrength > 0) {
        const n = rnd() * noiseStrength;
        r += n;
        g += n * 0.9;
        b += n * 1.2; // Slight blue-channel CCD digital noise
      }

      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }
    ctx.putImageData(imgData, 0, 0);

    // Optional 2000s Yellow Timestamp
    if (withTimestamp) {
      ctx.save();
      const fontSize = Math.max(16, Math.round(cvs.width * 0.032));
      ctx.font = `bold ${fontSize}px "Courier New", monospace`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#ffb300';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      const margin = Math.round(cvs.width * 0.03);
      ctx.fillText("'04 08 15", cvs.width - margin, cvs.height - margin);
      ctx.restore();
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

  presetSelect?.addEventListener('change', applyPreset);
  [bloomSlider, satSlider, sharpSlider, noiseSlider, timestampCheck].forEach((ctrl) => {
    ctrl?.addEventListener('input', render);
    ctrl?.addEventListener('change', render);
  });

  downloadBtn.addEventListener('click', () => {
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.download = `digicam-photo-${Date.now()}.jpg`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }, 'image/jpeg', 0.95);
  });
});
