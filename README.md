# QuickPic Studio 🎨

> **100% In-Browser, Private Image Utilities Suite**  
> Bulk Image Cropper & Sprite Slicer • AI Background Remover • Batch Image Compressor  
> Zero server uploads, zero API keys required, completely offline-capable.

---

## 🚀 Overview

**QuickPic Studio** is a client-side suite of high-performance image processing tools designed for designers, game developers, photographers, and e-commerce merchants. Every single operation — from multi-rectangle image cropping and AI background extraction to multi-threaded image compression — runs locally inside your browser via HTML5 Canvas, Web Workers, and WebAssembly (WASM). Your photos and sensitive assets never touch a remote server.

---

## ✨ Features & Tools

### 1. ✂️ MultiCrop Studio (`/bulk-image-crop.html` & `/multicrop.html`)
- **Multiple Crop Areas per Image**: Define dozens of crop boxes on a single canvas with sub-pixel drag handles.
- **Uniform Grid / Sprite Sheet Slicing**: Slices 2D game sprite sheets, RPG character walk cycles, and tile sets with configurable rows, columns, gaps, and margins.
- **Automatic Object Detection**: Scans high-contrast sprite boundaries and groups pixels automatically.
- **Interactive Asset Gallery Sidebar**: Rename, reorder, duplicate, batch rename with sequential numbering, and inspect crop dimensions.
- **Background Removal Integration**: Toggle real-time transparent white/color knockouts.
- **Batch Export**: Download individual assets or package all crops into an organized `.zip` file.

### 2. 🪄 AI Background Remover (`/remove-background.html`)
- **100% In-Browser AI Inference**: Uses ONNX Runtime WebAssembly (`ort-wasm-simd-threaded.wasm`) to detect subjects and erase backgrounds.
- **Web Worker Offloading**: Model inference runs in a dedicated background worker to keep the main thread responsive.
- **Queue Pipeline**: Process images sequentially with automatic memory cleanup after every operation.
- **Backdrop Replacement**: Instant transparent PNG, Amazon pure white (`#FFFFFF`), solid studio colors, or modern gradients.
- **Resolution Control**: Automatic image downscaling options (1024px, 1500px, 2048px, or full original) for memory efficiency.

### 3. 🗜️ Batch Image Compressor (`/compress-image.html`)
- **Dual Compression Engines**: Target file size mode (e.g. strict <50KB, <100KB, <200KB) with binary search optimization, or manual quality sliders.
- **Format Conversion**: Convert between JPEG, PNG, and WebP on the fly.
- **Smart Downscaling**: Preset max dimension bounds (1920px Full HD, 1280px, 800px) or percentage scaling.
- **Live Comparison**: Interactive before/after split sliders with savings indicators and single or bulk ZIP export.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Bundler**: [Vite 8](https://vitejs.dev/)
- **AI Inference**: [ONNX Runtime Web](https://onnxruntime.ai/) + `@imgly/background-removal`
- **ZIP Packaging**: [JSZip](https://stuk.github.io/jszip/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Hosting Target**: [Cloudflare Pages](https://pages.cloudflare.com/)

---

## 💻 Local Development

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm or pnpm or bun

### Setup & Run
```bash
# 1. Clone repository
git clone <your-repo-url>
cd quickpic-studio

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Visit `http://localhost:3000/` in your browser.

### Test & Build
```bash
# Run unit test suite (41 passing tests)
npm test

# Type-check TypeScript
npm run lint

# Compile production bundle for Cloudflare Pages
npm run build
```

---

## 🌐 Deploy to Cloudflare Pages

This project is pre-configured and 100% deployment-ready for **Cloudflare Pages**.

### Method 1: Git Integration (Recommended)
1. Push this repository to **GitHub** or **GitLab**.
2. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your repository.
4. Set the build settings:
   - **Framework preset**: `None` / `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Click **Save and Deploy**.

### Method 2: Direct Deploy via Wrangler CLI
```bash
# 1. Build the production output
npm run build

# 2. Deploy directly to Cloudflare Pages
npx wrangler pages deploy dist --project-name=quickpic-studio
```

### Pre-Configured Cloudflare Features
- **`public/_headers`**: Injects modern `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: credentialless` headers for high-performance WASM SIMD execution, along with strict security and caching policies.
- **`public/_redirects`**: Clean URL routing so pages like `/bulk-image-crop` and `/remove-background` resolve cleanly without requiring `.html` extensions.
- **`public/sitemap.xml` & `public/robots.txt`**: Complete search engine indexing definitions for fast SEO pickup.

---

## 🔒 Privacy Guarantee

Unlike traditional cloud image converters, **QuickPic Studio** does not have a backend server or database:
- Zero images or metadata leave your computer.
- Works offline once assets are cached.
- Safe for confidential documents, IDs, medical photos, and proprietary graphics.

---

## 📄 License

MIT License. Free to use, modify, and distribute.
