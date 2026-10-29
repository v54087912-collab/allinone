/**
 * Generates rich, realistic sample image sheets so users can test immediately.
 */

export interface SampleSheet {
  id: string;
  name: string;
  description: string;
  category: string;
  getDataUrl: () => string;
}

export function createPixelGameSheet(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Clean white background to demonstrate optional white-background removal
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 600, 400);

  // Draw 6 distinct game character/item sprites in a 2x3 grid
  const items = [
    { label: 'Hero Knight', color: '#6366f1', type: 'knight' },
    { label: 'Magic Potion', color: '#ec4899', type: 'potion' },
    { label: 'Gold Coin', color: '#eab308', type: 'coin' },
    { label: 'Wooden Shield', color: '#10b981', type: 'shield' },
    { label: 'Dragon Egg', color: '#f97316', type: 'egg' },
    { label: 'Ancient Key', color: '#06b6d4', type: 'key' },
  ];

  const cols = 3;
  const rows = 2;
  const cellW = 180;
  const cellH = 170;
  const startX = 25;
  const startY = 25;

  items.forEach((item, idx) => {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    const cx = startX + c * (cellW + 10);
    const cy = startY + r * (cellH + 10);

    // Subtle outline / decorative frame
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx, cy, cellW, cellH);

    // Draw sprite object in center
    const objX = cx + cellW / 2;
    const objY = cy + cellH / 2 - 10;

    ctx.save();
    ctx.translate(objX, objY);

    if (item.type === 'knight') {
      // Helmet & armor
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(0, -15, 24, 0, Math.PI * 2);
      ctx.fill();
      // Visor
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-12, -18, 24, 8);
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-10, -16, 20, 4);
      // Armor body
      ctx.fillStyle = '#4f46e5';
      ctx.beginPath();
      ctx.moveTo(-20, 10);
      ctx.lineTo(20, 10);
      ctx.lineTo(15, 35);
      ctx.lineTo(-15, 35);
      ctx.closePath();
      ctx.fill();
    } else if (item.type === 'potion') {
      // Flask neck
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-6, -30, 12, 10);
      // Flask body
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(0, 5, 26, 0, Math.PI * 2);
      ctx.fill();
      // Liquid highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(-8, -2, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.type === 'coin') {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = '#a16207';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 2);
    } else if (item.type === 'shield') {
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.moveTo(0, -32);
      ctx.lineTo(26, -20);
      ctx.lineTo(20, 15);
      ctx.lineTo(0, 35);
      ctx.lineTo(-20, 15);
      ctx.lineTo(-26, -20);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#047857';
      ctx.lineWidth = 4;
      ctx.stroke();
      // Shield emblem
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-4, -15, 8, 30);
      ctx.fillRect(-15, -4, 30, 8);
    } else if (item.type === 'egg') {
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 32, 0, 0, Math.PI * 2);
      ctx.fill();
      // Spots
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(-6, -10, 5, 0, Math.PI * 2);
      ctx.arc(8, 6, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.type === 'key') {
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(0, -18, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -18, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = item.color;
      ctx.fillRect(-4, -4, 8, 36);
      ctx.fillRect(4, 12, 10, 6);
      ctx.fillRect(4, 22, 8, 6);
    }

    ctx.restore();

    // Sprite label
    ctx.fillStyle = '#64748b';
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.label, cx + cellW / 2, cy + cellH - 14);
  });

  return canvas.toDataURL('image/png');
}

export function createModernIconSheet(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 640, 480);

  const icons = [
    { name: 'Heart', color: '#ef4444' },
    { name: 'Star', color: '#f59e0b' },
    { name: 'Bolt', color: '#3b82f6' },
    { name: 'Compass', color: '#10b981' },
    { name: 'Bell', color: '#8b5cf6' },
    { name: 'Crown', color: '#d97706' },
    { name: 'Cloud', color: '#0284c7' },
    { name: 'Flame', color: '#dc2626' },
  ];

  const cols = 4;
  const rows = 2;
  const cellW = 140;
  const cellH = 200;
  const startX = 25;
  const startY = 30;

  icons.forEach((ic, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const x = startX + c * (cellW + 12);
    const y = startY + r * (cellH + 15);

    // Box
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, cellW, cellH);

    const cx = x + cellW / 2;
    const cy = y + cellH / 2 - 12;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = ic.color;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();

    // Inner icon symbol
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((i + 1).toString(), 0, 1);

    ctx.restore();

    ctx.fillStyle = '#475569';
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ic.name, x + cellW / 2, y + cellH - 18);
  });

  return canvas.toDataURL('image/png');
}

export const SAMPLE_SHEETS: SampleSheet[] = [
  {
    id: 'game-sprites',
    name: 'RPG Item Sprites (2x3 Grid)',
    description: '6 game assets with clean boundaries on white background',
    category: 'Game Assets',
    getDataUrl: createPixelGameSheet,
  },
  {
    id: 'modern-icons',
    name: 'Modern UI Icons (2x4 Grid)',
    description: '8 colorful badges & UI elements for web/mobile',
    category: 'UI & Icons',
    getDataUrl: createModernIconSheet,
  },
];
