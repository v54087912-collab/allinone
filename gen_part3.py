import os

PROJECT_DIR = '/home/yugank/zmodd/quickpic-studio---free-in-browser-image-utilities'
TOOLS_DIR = os.path.join(PROJECT_DIR, 'src/tools')

# 10. Favicon Generator Controller
favicon_gen_ts = '''import JSZip from 'jszip';
import { showToast } from '../shared/site-shell.ts';

const SIZES = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'favicon-48x48.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' },
];

export function initFaviconGen(): void {
  const fileInput = document.getElementById('fav-file-input') as HTMLInputElement | null;
  const dropzone = document.getElementById('fav-dropzone');
  const emojiInput = document.getElementById('fav-emoji-input') as HTMLInputElement | null;
  const emojiBtn = document.getElementById('fav-emoji-btn') as HTMLButtonElement | null;
  const preview16 = document.getElementById('preview-fav-16') as HTMLImageElement | null;
  const preview32 = document.getElementById('preview-fav-32') as HTMLImageElement | null;
  const preview180 = document.getElementById('preview-fav-180') as HTMLImageElement | null;
  const downloadZipBtn = document.getElementById('fav-download-zip') as HTMLButtonElement | null;
  const htmlSnippet = document.getElementById('fav-html-snippet') as HTMLTextAreaElement | null;
  const copySnippetBtn = document.getElementById('fav-copy-snippet') as HTMLButtonElement | null;

  let sourceImage: HTMLImageElement | null = null;

  function loadFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        sourceImage = img;
        updatePreviews();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function renderToCanvas(size: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    if (sourceImage) {
      ctx.drawImage(sourceImage, 0, 0, size, size);
    }
    return canvas;
  }

  function updatePreviews() {
    if (!sourceImage) return;

    if (preview16) preview16.src = renderToCanvas(16).toDataURL('image/png');
    if (preview32) preview32.src = renderToCanvas(32).toDataURL('image/png');
    if (preview180) preview180.src = renderToCanvas(180).toDataURL('image/png');

    if (downloadZipBtn) {
      downloadZipBtn.removeAttribute('disabled');
      downloadZipBtn.classList.remove('opacity-50', 'pointer-events-none');
    }
  }

  function loadEmoji(emoji: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.font = '380px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji || '⭐', 256, 276);

    const img = new Image();
    img.onload = () => {
      sourceImage = img;
      updatePreviews();
    };
    img.src = canvas.toDataURL('image/png');
  }

  fileInput?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) loadFile(file);
  });

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-blue-500');
  });

  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-blue-500');
  });

  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-blue-500');
    const file = e.dataTransfer?.files[0];
    if (file) loadFile(file);
  });

  emojiBtn?.addEventListener('click', () => {
    const em = emojiInput?.value.trim() || '🚀';
    loadEmoji(em);
  });

  copySnippetBtn?.addEventListener('click', () => {
    if (!htmlSnippet) return;
    navigator.clipboard.writeText(htmlSnippet.value).then(() => showToast('HTML snippet copied!', 'success'));
  });

  downloadZipBtn?.addEventListener('click', async () => {
    if (!sourceImage) return;

    const zip = new JSZip();

    for (const item of SIZES) {
      const c = renderToCanvas(item.size);
      const dataUrl = c.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1];
      zip.file(item.name, base64, { base64: true });
    }

    // Also include sample favicon.ico as 32px png
    const c32 = renderToCanvas(32);
    zip.file('favicon.ico', c32.toDataURL('image/png').split(',')[1], { base64: true });

    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = 'toolora-favicons.zip';
    a.click();
    showToast('All favicons downloaded as ZIP!', 'success');
  });

  // Default initial emoji
  loadEmoji('⚡');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFaviconGen);
} else {
  initFaviconGen();
}
'''

# 11. Logo Maker Controller
logo_maker_ts = '''import { showToast } from '../shared/site-shell.ts';

export function initLogoMaker(): void {
  const brandInput = document.getElementById('logo-brand') as HTMLInputElement | null;
  const tagInput = document.getElementById('logo-tagline') as HTMLInputElement | null;
  const iconSelect = document.getElementById('logo-icon') as HTMLSelectElement | null;
  const fontSelect = document.getElementById('logo-font') as HTMLSelectElement | null;
  const bgType = document.getElementById('logo-bg-type') as HTMLSelectElement | null;
  const colorPrimary = document.getElementById('logo-primary-color') as HTMLInputElement | null;
  const colorSecondary = document.getElementById('logo-secondary-color') as HTMLInputElement | null;
  const canvas = document.getElementById('logo-canvas') as HTMLCanvasElement | null;
  const downloadPngBtn = document.getElementById('logo-download-png') as HTMLButtonElement | null;

  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  function draw() {
    if (!canvas || !ctx) return;

    const brand = brandInput?.value.trim() || 'VELOCITY';
    const tag = tagInput?.value.trim() || 'NEXT-GEN CLOUD PLATFORM';
    const icon = iconSelect?.value || 'hexagon';
    const font = fontSelect?.value || 'Inter';
    const bg = bgType?.value || 'dark';
    const c1 = colorPrimary?.value || '#3b82f6';
    const c2 = colorSecondary?.value || '#8b5cf6';

    const w = canvas.width;
    const h = canvas.height;

    // Background
    if (bg === 'transparent') {
      ctx.clearRect(0, 0, w, h);
    } else if (bg === 'gradient') {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    } else if (bg === 'light') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);
    }

    // Draw Icon at center-top
    ctx.save();
    ctx.translate(w / 2, 280);

    const grad = ctx.createLinearGradient(-100, -100, 100, 100);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.strokeStyle = grad;
    ctx.lineWidth = 14;

    if (icon === 'hexagon') {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const x = 90 * Math.cos(a);
        const y = 90 * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      // Inner dot
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();
    } else if (icon === 'diamond') {
      ctx.beginPath();
      ctx.moveTo(0, -90);
      ctx.lineTo(90, 0);
      ctx.lineTo(0, 90);
      ctx.lineTo(-90, 0);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
    } else if (icon === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, 85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 40, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Star / Spark
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const r = i % 2 === 0 ? 95 : 40;
        const a = (i * Math.PI) / 4;
        const x = r * Math.cos(a);
        const y = r * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Brand Name
    ctx.textAlign = 'center';
    ctx.fillStyle = bg === 'light' ? '#0f172a' : '#ffffff';
    ctx.font = `bold 68px '${font}', sans-serif`;
    ctx.fillText(brand, w / 2, 480);

    // Tagline
    if (tag) {
      ctx.fillStyle = bg === 'light' ? '#64748b' : '#94a3b8';
      ctx.font = `bold 22px '${font}', sans-serif`;
      ctx.letterSpacing = '4px';
      ctx.fillText(tag.toUpperCase(), w / 2, 530);
      ctx.letterSpacing = '0px';
    }
  }

  [brandInput, tagInput, iconSelect, fontSelect, bgType, colorPrimary, colorSecondary].forEach((el) => {
    el?.addEventListener('input', draw);
    el?.addEventListener('change', draw);
  });

  downloadPngBtn?.addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = `logo-${(brandInput?.value || 'logo').toLowerCase().replace(/\\s+/g, '-')}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
    showToast('High-res logo downloaded!', 'success');
  });

  draw();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLogoMaker);
} else {
  initLogoMaker();
}
'''

# 12. Social Media Resizer Controller
social_resizer_ts = '''import JSZip from 'jszip';
import { SOCIAL_MEDIA_PRESETS, SocialPreset } from '../utils/designUtils.ts';
import { showToast } from '../shared/site-shell.ts';

export function initSocialResizer(): void {
  const fileInput = document.getElementById('sr-file-input') as HTMLInputElement | null;
  const dropzone = document.getElementById('sr-dropzone');
  const fitSelect = document.getElementById('sr-fit-mode') as HTMLSelectElement | null;
  const presetSelect = document.getElementById('sr-preset-select') as HTMLSelectElement | null;
  const previewCanvas = document.getElementById('sr-preview-canvas') as HTMLCanvasElement | null;
  const downloadSingleBtn = document.getElementById('sr-download-single') as HTMLButtonElement | null;
  const downloadAllBtn = document.getElementById('sr-download-all') as HTMLButtonElement | null;
  const dimensionsBadge = document.getElementById('sr-dims-badge');

  let sourceImage: HTMLImageElement | null = null;

  function loadFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        sourceImage = img;
        renderSingle();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function getSelectedPreset(): SocialPreset {
    const idx = parseInt(presetSelect?.value || '0', 10);
    return SOCIAL_MEDIA_PRESETS[idx] || SOCIAL_MEDIA_PRESETS[0];
  }

  function renderPresetToCanvas(preset: SocialPreset): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = preset.width;
    c.height = preset.height;
    const ctx = c.getContext('2d');
    if (!ctx || !sourceImage) return c;

    const fit = fitSelect?.value || 'cover';

    if (fit === 'cover') {
      const scale = Math.max(c.width / sourceImage.width, c.height / sourceImage.height);
      const w = sourceImage.width * scale;
      const h = sourceImage.height * scale;
      const x = (c.width - w) / 2;
      const y = (c.height - h) / 2;
      ctx.drawImage(sourceImage, x, y, w, h);
    } else {
      // Contain with blurred background
      ctx.save();
      ctx.filter = 'blur(30px)';
      ctx.drawImage(sourceImage, -20, -20, c.width + 40, c.height + 40);
      ctx.restore();

      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, 0, c.width, c.height);

      const scale = Math.min(c.width / sourceImage.width, c.height / sourceImage.height);
      const w = sourceImage.width * scale;
      const h = sourceImage.height * scale;
      const x = (c.width - w) / 2;
      const y = (c.height - h) / 2;
      ctx.drawImage(sourceImage, x, y, w, h);
    }
    return c;
  }

  function renderSingle() {
    if (!sourceImage || !previewCanvas) return;
    const preset = getSelectedPreset();
    const rendered = renderPresetToCanvas(preset);

    previewCanvas.width = rendered.width;
    previewCanvas.height = rendered.height;
    const ctx = previewCanvas.getContext('2d');
    ctx?.drawImage(rendered, 0, 0);

    if (dimensionsBadge) {
      dimensionsBadge.textContent = `${preset.platform} ${preset.name} - ${preset.width}x${preset.height}px`;
    }
    downloadSingleBtn?.removeAttribute('disabled');
    downloadAllBtn?.removeAttribute('disabled');
  }

  fileInput?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) loadFile(file);
  });

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-blue-500');
  });
  dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('border-blue-500'));
  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-blue-500');
    const file = e.dataTransfer?.files[0];
    if (file) loadFile(file);
  });

  presetSelect?.addEventListener('change', renderSingle);
  fitSelect?.addEventListener('change', renderSingle);

  downloadSingleBtn?.addEventListener('click', () => {
    if (!previewCanvas) return;
    const preset = getSelectedPreset();
    const a = document.createElement('a');
    a.download = `${preset.platform.toLowerCase()}-${preset.width}x${preset.height}.png`;
    a.href = previewCanvas.toDataURL('image/png');
    a.click();
    showToast('Resized image downloaded!', 'success');
  });

  downloadAllBtn?.addEventListener('click', async () => {
    if (!sourceImage) return;
    const zip = new JSZip();

    for (const p of SOCIAL_MEDIA_PRESETS) {
      const c = renderPresetToCanvas(p);
      const b64 = c.toDataURL('image/png').split(',')[1];
      const filename = `${p.platform.replace(/\\s+/g, '_')}_${p.width}x${p.height}.png`;
      zip.file(filename, b64, { base64: true });
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = 'social-media-pack.zip';
    a.click();
    showToast('Full social media pack downloaded as ZIP!', 'success');
  });

  // Load a demo image so it is immediately interactive
  const demoImg = new Image();
  demoImg.onload = () => {
    sourceImage = demoImg;
    renderSingle();
  };
  demoImg.src = 'https://picsum.photos/1200/800';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSocialResizer);
} else {
  initSocialResizer();
}
'''

# 13. Instagram Post Maker Controller
instagram_post_ts = '''import { showToast } from '../shared/site-shell.ts';

export function initInstagramPost(): void {
  const canvas = document.getElementById('ig-canvas') as HTMLCanvasElement | null;
  const ratioSelect = document.getElementById('ig-ratio') as HTMLSelectElement | null;
  const quoteInput = document.getElementById('ig-quote') as HTMLTextAreaElement | null;
  const authorInput = document.getElementById('ig-author') as HTMLInputElement | null;
  const styleSelect = document.getElementById('ig-style') as HTMLSelectElement | null;
  const bgGrad1 = document.getElementById('ig-bg-1') as HTMLInputElement | null;
  const bgGrad2 = document.getElementById('ig-bg-2') as HTMLInputElement | null;
  const downloadBtn = document.getElementById('ig-download-btn') as HTMLButtonElement | null;

  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  function render() {
    if (!canvas || !ctx) return;

    const isPortrait = ratioSelect?.value === 'portrait';
    canvas.width = 1080;
    canvas.height = isPortrait ? 1350 : 1080;

    const w = canvas.width;
    const h = canvas.height;
    const text = quoteInput?.value || '"Simplicity is about subtracting the obvious and adding the meaningful."';
    const author = authorInput?.value || 'JOHN MAEDA';
    const style = styleSelect?.value || 'gradient';
    const c1 = bgGrad1?.value || '#4f46e5';
    const c2 = bgGrad2?.value || '#7c3aed';

    // Background
    if (style === 'minimal') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);
    } else {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, c1);
      grad.addColorStop(1, c2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // Subtle border
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 20;
    ctx.strokeRect(50, 50, w - 100, h - 100);

    // Quote icon
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = 'bold 120px serif';
    ctx.textAlign = 'center';
    ctx.fillText('“', w / 2, h / 2 - 140);

    // Text Wrap
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';

    const maxW = w - 240;
    const words = text.split(' ');
    let line = '';
    const lines: string[] = [];

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxW && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    const startY = h / 2 - (lines.length * 56) / 2 + 20;
    lines.forEach((l, idx) => {
      ctx.fillText(l.trim(), w / 2, startY + idx * 56);
    });

    // Author
    if (author) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = 'bold 22px sans-serif';
      ctx.letterSpacing = '5px';
      ctx.fillText(author.toUpperCase(), w / 2, startY + lines.length * 56 + 60);
      ctx.letterSpacing = '0px';
    }
  }

  [ratioSelect, quoteInput, authorInput, styleSelect, bgGrad1, bgGrad2].forEach((el) => {
    el?.addEventListener('input', render);
    el?.addEventListener('change', render);
  });

  downloadBtn?.addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = `instagram-post-${Date.now()}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
    showToast('Instagram post downloaded!', 'success');
  });

  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initInstagramPost);
} else {
  initInstagramPost();
}
'''

# 14. YouTube Thumbnail Maker Controller
youtube_thumb_ts = '''import { showToast } from '../shared/site-shell.ts';

export function initYouTubeThumbnail(): void {
  const canvas = document.getElementById('yt-canvas') as HTMLCanvasElement | null;
  const titleInput = document.getElementById('yt-title') as HTMLInputElement | null;
  const subtitleInput = document.getElementById('yt-subtitle') as HTMLInputElement | null;
  const badgeInput = document.getElementById('yt-badge') as HTMLInputElement | null;
  const colorBg = document.getElementById('yt-color-bg') as HTMLInputElement | null;
  const colorHighlight = document.getElementById('yt-color-highlight') as HTMLInputElement | null;
  const downloadBtn = document.getElementById('yt-download-btn') as HTMLButtonElement | null;
  const bgFileInput = document.getElementById('yt-file-input') as HTMLInputElement | null;

  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let uploadedBg: HTMLImageElement | null = null;

  function render() {
    if (!canvas || !ctx) return;
    canvas.width = 1280;
    canvas.height = 720;

    const title = titleInput?.value || 'MAKE $10,000 / MONTH';
    const subtitle = subtitleInput?.value || 'STEP-BY-STEP BLUEPRINT';
    const badge = badgeInput?.value || '2026 GUIDE';
    const bg = colorBg?.value || '#0f172a';
    const highlight = colorHighlight?.value || '#f59e0b';

    // Background
    if (uploadedBg) {
      ctx.drawImage(uploadedBg, 0, 0, 1280, 720);
      // Dark gradient overlay on left for text legibility
      const grad = ctx.createLinearGradient(0, 0, 800, 0);
      grad.addColorStop(0, 'rgba(0,0,0,0.85)');
      grad.addColorStop(1, 'rgba(0,0,0,0.1)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 1280, 720);
      grad.addColorStop(0, bg);
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);
    }

    // Badge
    if (badge) {
      ctx.fillStyle = highlight;
      ctx.beginPath();
      ctx.roundRect(70, 120, 240, 50, 12);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(badge.toUpperCase(), 190, 154);
    }

    // Big Bold Title
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 78px sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;

    const words = title.split(' ');
    let line1 = '';
    let line2 = '';
    for (let i = 0; i < words.length; i++) {
      if (i < Math.ceil(words.length / 2)) {
        line1 += words[i] + ' ';
      } else {
        line2 += words[i] + ' ';
      }
    }

    ctx.fillText(line1.trim(), 70, 270);
    if (line2.trim()) {
      ctx.fillStyle = highlight;
      ctx.fillText(line2.trim(), 70, 360);
    }

    // Subtitle
    if (subtitle) {
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(subtitle.toUpperCase(), 70, 450);
    }

    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  [titleInput, subtitleInput, badgeInput, colorBg, colorHighlight].forEach((el) => {
    el?.addEventListener('input', render);
    el?.addEventListener('change', render);
  });

  bgFileInput?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        uploadedBg = img;
        render();
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  });

  downloadBtn?.addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = 'youtube-thumbnail-1280x720.jpg';
    a.href = canvas.toDataURL('image/jpeg', 0.92);
    a.click();
    showToast('YouTube thumbnail downloaded!', 'success');
  });

  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initYouTubeThumbnail);
} else {
  initYouTubeThumbnail();
}
'''

with open(os.path.join(TOOLS_DIR, 'favicon-gen.ts'), 'w') as f:
    f.write(favicon_gen_ts)
with open(os.path.join(TOOLS_DIR, 'logo-maker.ts'), 'w') as f:
    f.write(logo_maker_ts)
with open(os.path.join(TOOLS_DIR, 'social-resizer.ts'), 'w') as f:
    f.write(social_resizer_ts)
with open(os.path.join(TOOLS_DIR, 'instagram-post.ts'), 'w') as f:
    f.write(instagram_post_ts)
with open(os.path.join(TOOLS_DIR, 'youtube-thumbnail.ts'), 'w') as f:
    f.write(youtube_thumb_ts)

print("Created favicon-gen.ts, logo-maker.ts, social-resizer.ts, instagram-post.ts, youtube-thumbnail.ts")
