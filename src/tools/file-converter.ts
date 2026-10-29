/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseCsv, formatCsv, csvToJson } from '../utils/fileUtils';
import { formatJson, jsonToCsv, formatXml } from '../utils/devUtils';
import { showToast } from '../shared/site-shell';

document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
  const sourceFormatSelect = document.getElementById('source-format') as HTMLSelectElement | null;
  const targetFormatSelect = document.getElementById('target-format') as HTMLSelectElement | null;
  const inputText = document.getElementById('input-text') as HTMLTextAreaElement | null;
  const outputText = document.getElementById('output-text') as HTMLTextAreaElement | null;
  const btnConvert = document.getElementById('btn-convert');
  const btnCopy = document.getElementById('btn-copy');
  const btnDownload = document.getElementById('btn-download');
  const btnClear = document.getElementById('btn-clear');
  const fileInfoBadge = document.getElementById('file-info-badge');
  const imagePreviewContainer = document.getElementById('image-preview-container');
  const imagePreview = document.getElementById('image-preview') as HTMLImageElement | null;

  let loadedFile: File | null = null;
  let convertedBlob: Blob | null = null;
  let convertedFileName = 'converted_output';

  // Format mapping
  const FORMAT_EXTS: Record<string, string> = {
    json: 'json',
    csv: 'csv',
    xml: 'xml',
    txt: 'txt',
    base64: 'txt',
    hex: 'txt',
    png: 'png',
    jpeg: 'jpg',
    webp: 'webp',
  };

  const updateTargetOptions = () => {
    if (!sourceFormatSelect || !targetFormatSelect) return;
    const src = sourceFormatSelect.value;
    targetFormatSelect.innerHTML = '';

    const addOpt = (val: string, label: string) => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = label;
      targetFormatSelect.appendChild(opt);
    };

    if (src === 'json') {
      addOpt('csv', 'CSV (Comma Separated)');
      addOpt('xml', 'XML Document');
      addOpt('base64', 'Base64 Encoded String');
    } else if (src === 'csv') {
      addOpt('json', 'JSON (Array of Objects)');
      addOpt('xml', 'XML Document');
      addOpt('tsv', 'TSV (Tab Separated)');
    } else if (src === 'xml') {
      addOpt('json', 'JSON Object');
      addOpt('txt', 'Plain Text Stripped');
    } else if (src === 'base64') {
      addOpt('txt', 'Decoded Plain Text');
      addOpt('hex', 'Hexadecimal String');
    } else if (src === 'hex') {
      addOpt('txt', 'Decoded Text');
      addOpt('base64', 'Base64 Encoded');
    } else if (src === 'png' || src === 'jpeg' || src === 'webp') {
      if (src !== 'png') addOpt('png', 'PNG Image');
      if (src !== 'jpeg') addOpt('jpeg', 'JPEG Image');
      if (src !== 'webp') addOpt('webp', 'WebP Modern Image');
    } else {
      addOpt('json', 'JSON');
      addOpt('csv', 'CSV');
      addOpt('base64', 'Base64');
    }
  };

  sourceFormatSelect?.addEventListener('change', updateTargetOptions);
  updateTargetOptions();

  const handleFile = async (file: File) => {
    loadedFile = file;
    const name = file.name.toLowerCase();
    let detectedFormat = 'txt';

    if (name.endsWith('.json')) detectedFormat = 'json';
    else if (name.endsWith('.csv')) detectedFormat = 'csv';
    else if (name.endsWith('.xml')) detectedFormat = 'xml';
    else if (name.endsWith('.png')) detectedFormat = 'png';
    else if (name.endsWith('.jpg') || name.endsWith('.jpeg')) detectedFormat = 'jpeg';
    else if (name.endsWith('.webp')) detectedFormat = 'webp';

    if (sourceFormatSelect) {
      sourceFormatSelect.value = detectedFormat;
      updateTargetOptions();
    }

    if (fileInfoBadge) {
      fileInfoBadge.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      fileInfoBadge.classList.remove('hidden');
    }

    if (detectedFormat === 'png' || detectedFormat === 'jpeg' || detectedFormat === 'webp') {
      if (imagePreview && imagePreviewContainer) {
        imagePreview.src = URL.createObjectURL(file);
        imagePreviewContainer.classList.remove('hidden');
      }
      if (inputText) inputText.value = `[Image File Loaded: ${file.name}]`;
    } else {
      if (imagePreviewContainer) imagePreviewContainer.classList.add('hidden');
      const text = await file.text();
      if (inputText) inputText.value = text;
    }

    doConvert();
  };

  const doConvert = async () => {
    if (!sourceFormatSelect || !targetFormatSelect) return;
    const src = sourceFormatSelect.value;
    const tgt = targetFormatSelect.value;
    const inVal = inputText?.value || '';

    // Handle Image conversions
    if (['png', 'jpeg', 'webp'].includes(src) && ['png', 'jpeg', 'webp'].includes(tgt) && loadedFile) {
      try {
        const img = new Image();
        img.src = URL.createObjectURL(loadedFile);
        await new Promise((resolve) => (img.onload = resolve));
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const mime = tgt === 'png' ? 'image/png' : tgt === 'webp' ? 'image/webp' : 'image/jpeg';
          canvas.toBlob((blob) => {
            if (blob) {
              convertedBlob = blob;
              convertedFileName = `converted.${FORMAT_EXTS[tgt] || tgt}`;
              if (outputText) outputText.value = `Successfully converted image to ${tgt.toUpperCase()} (${(blob.size / 1024).toFixed(1)} KB).\nClick "Download Converted File" below.`;
              showToast('Image converted successfully', 'success');
            }
          }, mime, 0.92);
        }
        return;
      } catch (e: unknown) {
        showToast('Image conversion failed: ' + String(e), 'error');
        return;
      }
    }

    // Handle Text / Data conversions
    try {
      let result = '';

      if (src === 'json') {
        if (tgt === 'csv') {
          const res = jsonToCsv(inVal);
          if (res.error) throw new Error(res.error);
          result = res.csv;
        } else if (tgt === 'xml') {
          const parsed = JSON.parse(inVal);
          const toXml = (obj: Record<string, unknown>, root: string = 'root'): string => {
            let xml = `<${root}>`;
            for (const [k, v] of Object.entries(obj)) {
              const tag = k.replace(/[^a-zA-Z0-9_]/g, '_');
              if (typeof v === 'object' && v !== null) {
                xml += toXml(v as Record<string, unknown>, tag);
              } else {
                xml += `<${tag}>${String(v)}</${tag}>`;
              }
            }
            xml += `</${root}>`;
            return xml;
          };
          result = formatXml(toXml(parsed)).formatted;
        } else if (tgt === 'base64') {
          result = btoa(unescape(encodeURIComponent(inVal)));
        }
      } else if (src === 'csv') {
        if (tgt === 'json') {
          result = csvToJson(inVal, { outputMode: 'objects' });
        } else if (tgt === 'tsv') {
          const rows = parseCsv(inVal);
          result = formatCsv(rows, '\t');
        } else if (tgt === 'xml') {
          const rows = parseCsv(inVal);
          if (rows.length > 0) {
            const headers = rows[0].map((h, i) => h.trim().replace(/[^a-zA-Z0-9_]/g, '_') || `col_${i + 1}`);
            let xml = '<records>\n';
            rows.slice(1).forEach((r) => {
              xml += '  <record>\n';
              headers.forEach((h, idx) => {
                xml += `    <${h}>${r[idx] || ''}</${h}>\n`;
              });
              xml += '  </record>\n';
            });
            xml += '</records>';
            result = xml;
          }
        }
      } else if (src === 'xml') {
        if (tgt === 'txt') {
          result = inVal.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        } else if (tgt === 'json') {
          result = JSON.stringify({ rawXml: inVal }, null, 2);
        }
      } else if (src === 'base64') {
        if (tgt === 'txt') {
          result = decodeURIComponent(escape(atob(inVal.trim())));
        } else if (tgt === 'hex') {
          const bin = atob(inVal.trim());
          result = Array.from(bin).map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
        }
      } else if (src === 'hex') {
        const cleanHex = inVal.replace(/[^0-9a-fA-F]/g, '');
        let bin = '';
        for (let i = 0; i < cleanHex.length; i += 2) {
          bin += String.fromCharCode(parseInt(cleanHex.slice(i, i + 2), 16));
        }
        if (tgt === 'txt') result = bin;
        else if (tgt === 'base64') result = btoa(bin);
      }

      if (outputText) outputText.value = result;
      convertedBlob = new Blob([result], { type: 'text/plain;charset=utf-8' });
      convertedFileName = `converted.${FORMAT_EXTS[tgt] || tgt}`;
      showToast('Converted successfully', 'success');
    } catch (err: unknown) {
      if (outputText) outputText.value = `Error: ${String(err)}`;
      showToast('Conversion error: ' + String(err), 'error');
    }
  };

  btnConvert?.addEventListener('click', doConvert);

  btnCopy?.addEventListener('click', () => {
    if (!outputText || !outputText.value) return;
    navigator.clipboard.writeText(outputText.value);
    showToast('Copied to clipboard', 'success');
  });

  btnDownload?.addEventListener('click', () => {
    if (!convertedBlob && outputText?.value) {
      convertedBlob = new Blob([outputText.value], { type: 'text/plain;charset=utf-8' });
    }
    if (!convertedBlob) {
      showToast('No converted file to download', 'warning');
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(convertedBlob);
    a.download = convertedFileName;
    a.click();
    showToast(`Downloaded ${convertedFileName}`, 'success');
  });

  btnClear?.addEventListener('click', () => {
    if (inputText) inputText.value = '';
    if (outputText) outputText.value = '';
    if (fileInfoBadge) fileInfoBadge.classList.add('hidden');
    if (imagePreviewContainer) imagePreviewContainer.classList.add('hidden');
    loadedFile = null;
    convertedBlob = null;
    showToast('Cleared input & output', 'info');
  });

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
