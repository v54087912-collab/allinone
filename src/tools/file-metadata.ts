/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { identifyFileSignature } from '../utils/fileUtils';
import { showToast } from '../shared/site-shell';

document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
  const metadataContainer = document.getElementById('metadata-container');

  const metaFilename = document.getElementById('meta-filename');
  const metaFilesize = document.getElementById('meta-filesize');
  const metaMime = document.getElementById('meta-mime');
  const metaLastModified = document.getElementById('meta-last-modified');
  const metaDetectedFormat = document.getElementById('meta-detected-format');
  const metaCategory = document.getElementById('meta-category');
  const metaMagicHex = document.getElementById('meta-magic-hex');
  const metaDescription = document.getElementById('meta-description');

  const hexDumpPre = document.getElementById('hex-dump-pre');
  const previewTextPre = document.getElementById('preview-text-pre');
  const previewTextContainer = document.getElementById('preview-text-container');
  const previewImage = document.getElementById('preview-image') as HTMLImageElement | null;
  const previewImageContainer = document.getElementById('preview-image-container');

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  };

  const handleFile = async (file: File) => {
    try {
      showToast('Reading file headers...', 'info');

      // Basic metadata
      if (metaFilename) metaFilename.textContent = file.name;
      if (metaFilesize) metaFilesize.textContent = `${formatBytes(file.size)} (${file.size.toLocaleString()} bytes)`;
      if (metaMime) metaMime.textContent = file.type || 'Unknown MIME type';
      if (metaLastModified) {
        const d = new Date(file.lastModified);
        metaLastModified.textContent = `${d.toLocaleDateString()} ${d.toLocaleTimeString()} (${d.toISOString()})`;
      }

      // Read first 256 bytes for magic bytes and hex dump
      const slice = file.slice(0, 256);
      const buffer = await slice.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      const sig = identifyFileSignature(bytes);
      if (metaDetectedFormat) metaDetectedFormat.textContent = sig.format;
      if (metaCategory) metaCategory.textContent = sig.category;
      if (metaMagicHex) metaMagicHex.textContent = sig.magicHex;
      if (metaDescription) metaDescription.textContent = sig.description;

      // Generate Hex Dump
      if (hexDumpPre) {
        let dump = '';
        for (let i = 0; i < bytes.length; i += 16) {
          const offset = i.toString(16).padStart(8, '0');
          const chunk = bytes.slice(i, i + 16);
          const hexPart = Array.from(chunk)
            .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
            .join(' ')
            .padEnd(48, ' ');

          const asciiPart = Array.from(chunk)
            .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
            .join('');

          dump += `${offset}  ${hexPart}  |${asciiPart}|\n`;
        }
        hexDumpPre.textContent = dump;
      }

      // Image Preview if applicable
      const isImg = file.type.startsWith('image/') || ['PNG', 'JPEG / JPG', 'GIF', 'WEBP', 'BMP', 'ICO'].includes(sig.format);
      if (isImg && previewImage && previewImageContainer) {
        previewImage.src = URL.createObjectURL(file);
        previewImageContainer.classList.remove('hidden');
      } else if (previewImageContainer) {
        previewImageContainer.classList.add('hidden');
      }

      // Text Preview if applicable
      if (sig.category.startsWith('Text') || ['JSON', 'XML / HTML', 'Plain Text'].includes(sig.format)) {
        const textSlice = await file.slice(0, 4096).text();
        if (previewTextPre && previewTextContainer) {
          previewTextPre.textContent = textSlice;
          previewTextContainer.classList.remove('hidden');
        }
      } else if (previewTextContainer) {
        previewTextContainer.classList.add('hidden');
      }

      if (metadataContainer) metadataContainer.classList.remove('hidden');
      showToast('File metadata analyzed', 'success');
    } catch (err: unknown) {
      showToast('Failed to inspect file: ' + String(err), 'error');
    }
  };

  fileInput?.addEventListener('change', (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files[0]) handleFile(files[0]);
  });

  dropZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-blue-500');
  });

  dropZone?.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-blue-500');
  });

  dropZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-blue-500');
    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });
});
