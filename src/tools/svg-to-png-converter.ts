document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('svg-file-input') as HTMLInputElement | null;
  const dropZone = document.getElementById('svg-drop-zone') as HTMLElement | null;
  const editorContainer = document.getElementById('svg-editor') as HTMLElement | null;
  const canvas = document.getElementById('svg-render-canvas') as HTMLCanvasElement | null;
  const scaleSelect = document.getElementById('svg-scale-select') as HTMLSelectElement | null;
  const bgSelect = document.getElementById('svg-bg-select') as HTMLSelectElement | null;
  const widthInput = document.getElementById('svg-custom-w') as HTMLInputElement | null;
  const heightInput = document.getElementById('svg-custom-h') as HTMLInputElement | null;
  const downloadBtn = document.getElementById('download-svg-png-btn') as HTMLButtonElement | null;
  const dimDisplay = document.getElementById('svg-png-dims') as HTMLElement | null;

  if (!fileInput || !dropZone || !editorContainer || !canvas || !downloadBtn) return;

  const cvs = canvas;
  const ctx = cvs.getContext('2d');
  let currentSvgText = '';
  let nativeW = 300;
  let nativeH = 300;

  function parseSvgDimensions(svgText: string): { w: number; h: number } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');
    if (!svgEl) return { w: 300, h: 300 };

    let w = parseFloat(svgEl.getAttribute('width') || '');
    let h = parseFloat(svgEl.getAttribute('height') || '');

    if (isNaN(w) || isNaN(h)) {
      const viewBox = svgEl.getAttribute('viewBox');
      if (viewBox) {
        const parts = viewBox.split(/\s+|,/).map(Number);
        if (parts.length === 4) {
          w = parts[2];
          h = parts[3];
        }
      }
    }

    return {
      w: !isNaN(w) && w > 0 ? w : 300,
      h: !isNaN(h) && h > 0 ? h : 300
    };
  }

  function render() {
    if (!currentSvgText || !ctx) return;
    const scale = Number(scaleSelect?.value || 2);
    let targetW = Math.round(nativeW * scale);
    let targetH = Math.round(nativeH * scale);

    if (widthInput && Number(widthInput.value) > 0) {
      targetW = Number(widthInput.value);
    }
    if (heightInput && Number(heightInput.value) > 0) {
      targetH = Number(heightInput.value);
    }

    cvs.width = targetW;
    cvs.height = targetH;

    const bg = bgSelect?.value || 'transparent';
    ctx.clearRect(0, 0, targetW, targetH);
    if (bg !== 'transparent') {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, targetW, targetH);
    }

    const blob = new Blob([currentSvgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      ctx.drawImage(img, 0, 0, targetW, targetH);
      URL.revokeObjectURL(url);
      if (dimDisplay) {
        dimDisplay.textContent = `${targetW} × ${targetH} px`;
      }
    };
    img.src = url;
  }

  function loadSvg(content: string) {
    currentSvgText = content;
    const dims = parseSvgDimensions(content);
    nativeW = dims.w;
    nativeH = dims.h;
    if (widthInput) widthInput.value = '';
    if (heightInput) heightInput.value = '';
    dropZone?.classList.add('hidden');
    editorContainer?.classList.remove('hidden');
    render();
  }

  dropZone.addEventListener('dragover', (e) => e.preventDefault());
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files.length) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => loadSvg(ev.target?.result as string);
      reader.readAsText(file);
    }
  });
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files?.length) {
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => loadSvg(ev.target?.result as string);
      reader.readAsText(file);
    }
  });

  [scaleSelect, bgSelect].forEach((ctrl) => {
    ctrl?.addEventListener('change', render);
  });
  [widthInput, heightInput].forEach((ctrl) => {
    ctrl?.addEventListener('input', render);
  });

  downloadBtn.addEventListener('click', () => {
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.download = `rendered-vector-${canvas.width}x${canvas.height}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }, 'image/png');
  });
});
