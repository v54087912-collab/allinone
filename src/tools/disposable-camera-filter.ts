document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('disp-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('disp-drop-zone') as HTMLElement | null;
  const editorContainer = document.getElementById('disp-editor') as HTMLElement | null;
  const canvas = document.getElementById('disp-canvas') as HTMLCanvasElement | null;
  const presetSelect = document.getElementById('disp-preset-select') as HTMLSelectElement | null;
  const grainSlider = document.getElementById('disp-grain-slider') as HTMLInputElement | null;
  const leakSlider = document.getElementById('disp-leak-slider') as HTMLInputElement | null;
  const warmthSlider = document.getElementById('disp-warmth-slider') as HTMLInputElement | null;
  const vignetteSlider = document.getElementById('disp-vignette-slider') as HTMLInputElement | null;
  const leakPosSelect = document.getElementById('disp-leak-pos') as HTMLSelectElement | null;
  const downloadBtn = document.getElementById('download-disp-btn') as HTMLButtonElement | null;
  const compareToggle = document.getElementById('compare-toggle-btn') as HTMLButtonElement | null;

  if (!fileInput || !dropZone || !editorContainer || !canvas || !downloadBtn) return;

  const cvs = canvas;
  const ctx = cvs.getContext('2d');
  let currentImg: HTMLImageElement | null = null;
  let showOriginal = false;

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
    const p = presetSelect?.value || 'fuji';
    if (p === 'fuji') {
      if (grainSlider) grainSlider.value = '35';
      if (leakSlider) leakSlider.value = '40';
      if (warmthSlider) warmthSlider.value = '25';
      if (vignetteSlider) vignetteSlider.value = '45';
    } else if (p === 'kodak') {
      if (grainSlider) grainSlider.value = '45';
      if (leakSlider) leakSlider.value = '60';
      if (warmthSlider) warmthSlider.value = '50';
      if (vignetteSlider) vignetteSlider.value = '55';
    } else if (p === 'lomo') {
      if (grainSlider) grainSlider.value = '60';
      if (leakSlider) leakSlider.value = '70';
      if (warmthSlider) warmthSlider.value = '10';
      if (vignetteSlider) vignetteSlider.value = '75';
    } else if (p === 'expired') {
      if (grainSlider) grainSlider.value = '75';
      if (leakSlider) leakSlider.value = '80';
      if (warmthSlider) warmthSlider.value = '-20';
      if (vignetteSlider) vignetteSlider.value = '60';
    }
    render();
  }

  function render() {
    if (!currentImg || !ctx) return;
    cvs.width = currentImg.width;
    cvs.height = currentImg.height;

    if (showOriginal) {
      ctx.drawImage(currentImg, 0, 0);
      return;
    }

    // Step 1: Draw base image
    ctx.drawImage(currentImg, 0, 0);

    const grainAmount = Number(grainSlider?.value || 35) / 100;
    const leakAmount = Number(leakSlider?.value || 40) / 100;
    const warmth = Number(warmthSlider?.value || 25);
    const vignetteAmount = Number(vignetteSlider?.value || 45) / 100;

    // Step 2: Pixel adjustments for color tone & grain
    const imgData = ctx.getImageData(0, 0, cvs.width, cvs.height);
    const data = imgData.data;
    const len = data.length;

    // Fast noise generator
    let seed = 12345;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed / 2147483647) - 0.5;
    };

    const grainStrength = grainAmount * 45;

    for (let i = 0; i < len; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Lift blacks (faded film shadows)
      r = r + (255 - r) * 0.05 + 10;
      g = g + (255 - g) * 0.05 + 8;
      b = b + (255 - b) * 0.05 + 12;

      // Warmth shift (Kodak/Fuji tone)
      r += warmth * 0.5;
      b -= warmth * 0.4;

      // Film Grain
      if (grainStrength > 0) {
        const noise = rnd() * grainStrength;
        r += noise;
        g += noise;
        b += noise;
      }

      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }
    ctx.putImageData(imgData, 0, 0);

    // Step 3: Flash Vignette
    if (vignetteAmount > 0) {
      const radius = Math.hypot(cvs.width, cvs.height) / 2;
      const vigGrad = ctx.createRadialGradient(
        cvs.width / 2,
        cvs.height / 2,
        radius * (1 - vignetteAmount * 0.6),
        cvs.width / 2,
        cvs.height / 2,
        radius
      );
      vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
      vigGrad.addColorStop(1, `rgba(15,10,5,${vignetteAmount * 0.75})`);

      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, cvs.width, cvs.height);
    }

    // Step 4: Light Leak
    if (leakAmount > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const leakPos = leakPosSelect?.value || 'right';

      let leakGrad: CanvasGradient;
      if (leakPos === 'right') {
        leakGrad = ctx.createRadialGradient(
          cvs.width,
          cvs.height * 0.4,
          10,
          cvs.width,
          cvs.height * 0.4,
          cvs.width * 0.65
        );
      } else if (leakPos === 'left') {
        leakGrad = ctx.createRadialGradient(
          0,
          cvs.height * 0.5,
          10,
          0,
          cvs.height * 0.5,
          cvs.width * 0.65
        );
      } else {
        leakGrad = ctx.createRadialGradient(
          cvs.width * 0.5,
          0,
          10,
          cvs.width * 0.5,
          0,
          cvs.height * 0.7
        );
      }

      leakGrad.addColorStop(0, `rgba(255, 120, 20, ${leakAmount * 0.85})`);
      leakGrad.addColorStop(0.3, `rgba(255, 60, 40, ${leakAmount * 0.6})`);
      leakGrad.addColorStop(0.7, `rgba(240, 20, 80, ${leakAmount * 0.25})`);
      leakGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = leakGrad;
      ctx.fillRect(0, 0, cvs.width, cvs.height);
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
  [grainSlider, leakSlider, warmthSlider, vignetteSlider, leakPosSelect].forEach((ctrl) => {
    ctrl?.addEventListener('input', render);
    ctrl?.addEventListener('change', render);
  });

  compareToggle?.addEventListener('mousedown', () => {
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
      link.download = `disposable-camera-${Date.now()}.jpg`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }, 'image/jpeg', 0.95);
  });
});
