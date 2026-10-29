/**
 * In-browser Image Metadata & EXIF Parser
 */

export interface ParsedExifData {
  make?: string;
  model?: string;
  lensModel?: string;
  software?: string;
  dateTime?: string;
  exposureTime?: string;
  fNumber?: number;
  iso?: number;
  focalLength?: number;
  flash?: string;
  meteringMode?: string;
  orientation?: number;
  pixelWidth?: number;
  pixelHeight?: number;
  gps?: {
    latitude: number;
    longitude: number;
    altitude?: number;
    mapUrl: string;
  };
  rawTags: Record<string, string | number>;
}

export function formatDmsToDecimal(degrees: number, minutes: number, seconds: number, ref: string): number {
  let decimal = degrees + minutes / 60 + seconds / 3600;
  if (ref === 'S' || ref === 'W') {
    decimal = -decimal;
  }
  return Number(decimal.toFixed(6));
}

export function formatExposureTime(val: number): string {
  if (val <= 0) return '0s';
  if (val >= 1) return `${val.toFixed(1)}s`;
  const denom = Math.round(1 / val);
  return `1/${denom}s`;
}

/**
 * Parses EXIF data from binary ArrayBuffer (JPEG APP1 marker 0xFFE1)
 */
export function parseExifFromArrayBuffer(buffer: ArrayBuffer): ParsedExifData | null {
  const dataView = new DataView(buffer);

  // Check for JPEG SOI (0xFFD8)
  if (dataView.byteLength < 4 || dataView.getUint16(0, false) !== 0xffd8) {
    return null;
  }

  let offset = 2;
  const length = dataView.byteLength;

  while (offset < length - 4) {
    const marker = dataView.getUint16(offset, false);
    offset += 2;

    if (marker === 0xffe1) {
      // APP1 Marker (EXIF)
      const app1Length = dataView.getUint16(offset, false);
      offset += 2;

      // Check for 'Exif\0\0' string
      const exifHeader = String.fromCharCode(
        dataView.getUint8(offset),
        dataView.getUint8(offset + 1),
        dataView.getUint8(offset + 2),
        dataView.getUint8(offset + 3)
      );

      if (exifHeader === 'Exif') {
        const tiffOffset = offset + 6;
        return parseTiffHeader(dataView, tiffOffset);
      }

      offset += app1Length - 2;
    } else if ((marker & 0xff00) === 0xff00) {
      if (marker === 0xffda) break; // SOS (Start of Scan) - stop search
      const sectionLength = dataView.getUint16(offset, false);
      offset += sectionLength;
    } else {
      break;
    }
  }

  return null;
}

function parseTiffHeader(dataView: DataView, tiffOffset: number): ParsedExifData {
  const result: ParsedExifData = { rawTags: {} };
  const byteOrder = dataView.getUint16(tiffOffset, false);
  const isLittleEndian = byteOrder === 0x4949; // 'II' = little endian, 'MM' = big endian

  const firstIFDOffset = dataView.getUint32(tiffOffset + 4, isLittleEndian);
  if (firstIFDOffset < 8) return result;

  let exifSubIFDOffset = 0;
  let gpsIFDOffset = 0;

  // Parse IFD0
  parseIFD(dataView, tiffOffset, tiffOffset + firstIFDOffset, isLittleEndian, (tag, val) => {
    switch (tag) {
      case 0x010f:
        result.make = String(val);
        break;
      case 0x0110:
        result.model = String(val);
        break;
      case 0x0131:
        result.software = String(val);
        break;
      case 0x0132:
        result.dateTime = String(val);
        break;
      case 0x0112:
        result.orientation = Number(val);
        break;
      case 0x8769:
        exifSubIFDOffset = Number(val);
        break;
      case 0x8825:
        gpsIFDOffset = Number(val);
        break;
    }
    result.rawTags[`Tag_0x${tag.toString(16).toUpperCase()}`] = val;
  });

  // Parse ExifSubIFD
  if (exifSubIFDOffset > 0) {
    parseIFD(dataView, tiffOffset, tiffOffset + exifSubIFDOffset, isLittleEndian, (tag, val) => {
      switch (tag) {
        case 0x829a: // ExposureTime
          result.exposureTime = formatExposureTime(Number(val));
          break;
        case 0x829d: // FNumber
          result.fNumber = Number(val);
          break;
        case 0x8827: // ISO
          result.iso = Number(val);
          break;
        case 0x9003: // DateTimeOriginal
          result.dateTime = String(val);
          break;
        case 0x920a: // FocalLength
          result.focalLength = Number(val);
          break;
        case 0xa434: // LensModel
          result.lensModel = String(val);
          break;
        case 0xa002: // PixelXDimension
          result.pixelWidth = Number(val);
          break;
        case 0xa003: // PixelYDimension
          result.pixelHeight = Number(val);
          break;
      }
      result.rawTags[`Exif_0x${tag.toString(16).toUpperCase()}`] = val;
    });
  }

  // Parse GPS IFD
  if (gpsIFDOffset > 0) {
    let latRef = 'N';
    let lonRef = 'E';
    let latDms: [number, number, number] | null = null;
    let lonDms: [number, number, number] | null = null;
    let altitude: number | undefined;

    parseIFD(dataView, tiffOffset, tiffOffset + gpsIFDOffset, isLittleEndian, (tag, val) => {
      if (tag === 0x0001) latRef = String(val).trim();
      if (tag === 0x0002 && Array.isArray(val) && val.length === 3) {
        latDms = [val[0], val[1], val[2]];
      }
      if (tag === 0x0003) lonRef = String(val).trim();
      if (tag === 0x0004 && Array.isArray(val) && val.length === 3) {
        lonDms = [val[0], val[1], val[2]];
      }
      if (tag === 0x0006) altitude = Number(val);
    });

    if (latDms && lonDms) {
      const lat = formatDmsToDecimal(latDms[0], latDms[1], latDms[2], latRef);
      const lon = formatDmsToDecimal(lonDms[0], lonDms[1], lonDms[2], lonRef);
      result.gps = {
        latitude: lat,
        longitude: lon,
        altitude,
        mapUrl: `https://www.google.com/maps?q=${lat},${lon}`,
      };
    }
  }

  return result;
}

function parseIFD(
  dataView: DataView,
  tiffOffset: number,
  ifdOffset: number,
  isLittleEndian: boolean,
  onTag: (tag: number, val: any) => void
): void {
  if (ifdOffset + 2 > dataView.byteLength) return;
  const numEntries = dataView.getUint16(ifdOffset, isLittleEndian);

  for (let i = 0; i < numEntries; i++) {
    const entryOffset = ifdOffset + 2 + i * 12;
    if (entryOffset + 12 > dataView.byteLength) break;

    const tag = dataView.getUint16(entryOffset, isLittleEndian);
    const type = dataView.getUint16(entryOffset + 2, isLittleEndian);
    const count = dataView.getUint32(entryOffset + 4, isLittleEndian);

    const val = readTagValue(dataView, tiffOffset, entryOffset + 8, type, count, isLittleEndian);
    if (val !== undefined) {
      onTag(tag, val);
    }
  }
}

function readTagValue(
  dataView: DataView,
  tiffOffset: number,
  valueOffset: number,
  type: number,
  count: number,
  isLittleEndian: boolean
): any {
  // Types: 1=BYTE, 2=ASCII, 3=SHORT, 4=LONG, 5=RATIONAL, 7=UNDEFINED, 9=SLONG, 10=SRATIONAL
  const typeSizes: Record<number, number> = {
    1: 1,
    2: 1,
    3: 2,
    4: 4,
    5: 8,
    7: 1,
    9: 4,
    10: 8,
  };

  const itemSize = typeSizes[type] || 1;
  const totalSize = itemSize * count;
  const actualOffset = totalSize <= 4 ? valueOffset : tiffOffset + dataView.getUint32(valueOffset, isLittleEndian);

  if (actualOffset + totalSize > dataView.byteLength) return undefined;

  if (type === 2) {
    // ASCII string
    let str = '';
    for (let i = 0; i < count - 1; i++) {
      const charCode = dataView.getUint8(actualOffset + i);
      if (charCode === 0) break;
      str += String.fromCharCode(charCode);
    }
    return str.trim();
  }

  if (type === 3) {
    // SHORT (16-bit)
    if (count === 1) return dataView.getUint16(actualOffset, isLittleEndian);
    const arr: number[] = [];
    for (let i = 0; i < count; i++) {
      arr.push(dataView.getUint16(actualOffset + i * 2, isLittleEndian));
    }
    return arr;
  }

  if (type === 4) {
    // LONG (32-bit)
    if (count === 1) return dataView.getUint32(actualOffset, isLittleEndian);
    const arr: number[] = [];
    for (let i = 0; i < count; i++) {
      arr.push(dataView.getUint32(actualOffset + i * 4, isLittleEndian));
    }
    return arr;
  }

  if (type === 5 || type === 10) {
    // RATIONAL
    const readRational = (off: number) => {
      const num = dataView.getUint32(off, isLittleEndian);
      const den = dataView.getUint32(off + 4, isLittleEndian);
      return den !== 0 ? num / den : 0;
    };

    if (count === 1) return readRational(actualOffset);
    const arr: number[] = [];
    for (let i = 0; i < count; i++) {
      arr.push(readRational(actualOffset + i * 8));
    }
    return arr;
  }

  return undefined;
}
