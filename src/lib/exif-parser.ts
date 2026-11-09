/**
 * EXIF & Metadata Parser Utility
 * Extracts capture dates, camera tags and infers life stages
 * Works both in the Browser (ArrayBuffer) and in Node.js (Buffer)
 */

export interface ExifMetadataResult {
  hasExif: boolean;
  takenAt: string | null; // ISO string
  year: number | null;
  cameraMake?: string;
  cameraModel?: string;
  orientation?: number;
  stageKey: string;
  stageLabel: string;
  confidence: "exif" | "filename" | "lastModified" | "fallback";
}

export interface LifeStageDefinition {
  key: string;
  label: string;
  era: string;
  ageBadge: string;
  description: string;
  color: string;
}

export const LIFE_STAGES: LifeStageDefinition[] = [
  {
    key: "infancia",
    label: "Primera Infancia",
    era: "2011 — 2015",
    ageBadge: "0 a 4 Años",
    description: "Primeros pasos, risas inocentes y la ternura del hogar.",
    color: "from-pink-500/20 to-amber-500/20 text-rose-700 border-rose-200",
  },
  {
    key: "ninez",
    label: "Niñez Dorada",
    era: "2016 — 2020",
    ageBadge: "5 a 9 Años",
    description: "Juegos, escuela, descubrimientos y amistades entrañables.",
    color: "from-amber-500/20 to-emerald-500/20 text-amber-800 border-amber-200",
  },
  {
    key: "adolescencia",
    label: "Adolescencia & Pasiones",
    era: "2021 — 2024",
    ageBadge: "10 a 13 Años",
    description: "Creciendo con gracia, metas, talentos y sueños que florecen.",
    color: "from-blue-500/20 to-indigo-500/20 text-[#0552AC] border-blue-200",
  },
  {
    key: "pre_xv",
    label: "Sesión Pre-XV",
    era: "2025 — 2026",
    ageBadge: "14 Años",
    description: "Sesiones fotográficas y preparativos para la gran noche.",
    color: "from-[#0552AC]/20 to-[#D4AF37]/30 text-[#001F54] border-[#D4AF37]/40",
  },
  {
    key: "actualidad",
    label: "Hoy: Mis XV Años",
    era: "2026",
    ageBadge: "15 Años",
    description: "El gran día: vestido de quinceañera, vals y una noche inolvidable.",
    color: "from-[#D4AF37]/30 to-amber-300/40 text-[#001F54] border-[#D4AF37]",
  },
];

export function getStageFromYear(year: number | null): { stageKey: string; stageLabel: string } {
  if (!year || isNaN(year)) {
    return { stageKey: "infancia", stageLabel: "Primera Infancia" };
  }

  if (year <= 2015) {
    return { stageKey: "infancia", stageLabel: "Primera Infancia" };
  } else if (year <= 2020) {
    return { stageKey: "ninez", stageLabel: "Niñez" };
  } else if (year <= 2024) {
    return { stageKey: "adolescencia", stageLabel: "Adolescencia" };
  } else if (year === 2025) {
    return { stageKey: "pre_xv", stageLabel: "Sesión Pre-XV" };
  } else {
    return { stageKey: "actualidad", stageLabel: "Hoy: Mis XV Años" };
  }
}

/**
 * Extracts year from a filename if it contains a 4-digit year like 2011..2027
 */
export function extractYearFromFilename(filename: string): number | null {
  // Look for 2011 to 2027 in filename (e.g. IMG_20140510, foto-2016, 2013_bebe)
  const match = filename.match(/\b(201[1-9]|202[0-7])\b/) || filename.match(/(201[1-9]|202[0-7])/);
  if (match) {
    const yr = parseInt(match[1], 10);
    if (!isNaN(yr) && yr >= 2011 && yr <= 2027) {
      return yr;
    }
  }
  return null;
}

export function parseJpegExif(bufferOrArray: ArrayBufferLike | ArrayBuffer | Uint8Array): Partial<ExifMetadataResult> {
  try {
    const dataView =
      bufferOrArray instanceof Uint8Array
        ? new DataView(bufferOrArray.buffer, bufferOrArray.byteOffset, bufferOrArray.byteLength)
        : new DataView(bufferOrArray as ArrayBuffer);

    // Check SOI marker: 0xFFD8
    if (dataView.getUint16(0) !== 0xffd8) {
      return { hasExif: false };
    }

    let offset = 2;
    const length = dataView.byteLength;

    while (offset < length - 4) {
      const marker = dataView.getUint16(offset);
      offset += 2;

      // APP1 marker is 0xFFE1
      if (marker === 0xffe1) {
        const app1Length = dataView.getUint16(offset);
        offset += 2;

        // Check for 'Exif\0\0' (0x457869660000)
        const exifHeader =
          String.fromCharCode(dataView.getUint8(offset)) +
          String.fromCharCode(dataView.getUint8(offset + 1)) +
          String.fromCharCode(dataView.getUint8(offset + 2)) +
          String.fromCharCode(dataView.getUint8(offset + 3));

        if (exifHeader === "Exif") {
          const tiffStart = offset + 6;
          const isLittleEndian = dataView.getUint16(tiffStart) === 0x4949; // 'II'

          // Verify TIFF magic number 42 (0x002A)
          if (dataView.getUint16(tiffStart + 2, isLittleEndian) !== 42) {
            return { hasExif: false };
          }

          const ifd0Offset = dataView.getUint32(tiffStart + 4, isLittleEndian);
          return parseIFD(dataView, tiffStart, tiffStart + ifd0Offset, isLittleEndian);
        }

        offset += app1Length - 2;
      } else if ((marker & 0xff00) === 0xff00 && marker !== 0xffd8 && marker !== 0xffd9) {
        // Other JPEG marker, skip its payload
        const markerLength = dataView.getUint16(offset);
        offset += markerLength;
      } else {
        break;
      }
    }
  } catch (err) {
    // Ignore malformed EXIF gracefully
  }

  return { hasExif: false };
}

function parseIFD(
  dataView: DataView,
  tiffStart: number,
  ifdOffset: number,
  isLittleEndian: boolean
): Partial<ExifMetadataResult> {
  const result: Partial<ExifMetadataResult> = { hasExif: false };

  try {
    if (ifdOffset >= dataView.byteLength - 2) return result;

    const entriesCount = dataView.getUint16(ifdOffset, isLittleEndian);
    let curOffset = ifdOffset + 2;
    let exifSubIFDOffset = 0;

    for (let i = 0; i < entriesCount && curOffset + 12 <= dataView.byteLength; i++) {
      const tag = dataView.getUint16(curOffset, isLittleEndian);
      const type = dataView.getUint16(curOffset + 2, isLittleEndian);
      const count = dataView.getUint32(curOffset + 4, isLittleEndian);

      // Tag 0x010F: Camera Make
      if (tag === 0x010f && type === 2) {
        result.cameraMake = readString(dataView, tiffStart, curOffset + 8, count, isLittleEndian);
      }
      // Tag 0x0110: Camera Model
      if (tag === 0x0110 && type === 2) {
        result.cameraModel = readString(dataView, tiffStart, curOffset + 8, count, isLittleEndian);
      }
      // Tag 0x0112: Orientation
      if (tag === 0x0112) {
        result.orientation = dataView.getUint16(curOffset + 8, isLittleEndian);
      }
      // Tag 0x0132: DateTime
      if (tag === 0x0132 && type === 2 && !result.takenAt) {
        const rawDate = readString(dataView, tiffStart, curOffset + 8, count, isLittleEndian);
        const iso = parseExifDate(rawDate);
        if (iso) result.takenAt = iso;
      }
      // Tag 0x8769: Exif SubIFD Pointer
      if (tag === 0x8769) {
        exifSubIFDOffset = dataView.getUint32(curOffset + 8, isLittleEndian);
      }

      curOffset += 12;
    }

    // Parse Exif SubIFD for DateTimeOriginal (0x9003) and DateTimeDigitized (0x9004)
    if (exifSubIFDOffset > 0 && tiffStart + exifSubIFDOffset < dataView.byteLength - 2) {
      const subOffset = tiffStart + exifSubIFDOffset;
      const subEntries = dataView.getUint16(subOffset, isLittleEndian);
      let subCur = subOffset + 2;

      for (let j = 0; j < subEntries && subCur + 12 <= dataView.byteLength; j++) {
        const tag = dataView.getUint16(subCur, isLittleEndian);
        const type = dataView.getUint16(subCur + 2, isLittleEndian);
        const count = dataView.getUint32(subCur + 4, isLittleEndian);

        // Tag 0x9003: DateTimeOriginal or 0x9004: DateTimeDigitized
        if ((tag === 0x9003 || tag === 0x9004) && type === 2) {
          const rawDate = readString(dataView, tiffStart, subCur + 8, count, isLittleEndian);
          const iso = parseExifDate(rawDate);
          if (iso) {
            result.takenAt = iso;
            break;
          }
        }
        subCur += 12;
      }
    }

    if (result.takenAt) {
      result.hasExif = true;
      const parsedYear = new Date(result.takenAt).getFullYear();
      if (!isNaN(parsedYear)) {
        result.year = parsedYear;
      }
    }
  } catch (err) {
    // Return what was successfully parsed
  }

  return result;
}

function readString(
  dataView: DataView,
  tiffStart: number,
  valOffset: number,
  count: number,
  isLittleEndian: boolean
): string {
  try {
    let strOffset = valOffset;
    if (count > 4) {
      const offsetVal = dataView.getUint32(valOffset, isLittleEndian);
      strOffset = tiffStart + offsetVal;
    }

    let str = "";
    for (let i = 0; i < count && strOffset + i < dataView.byteLength; i++) {
      const code = dataView.getUint8(strOffset + i);
      if (code === 0) break; // null terminator
      str += String.fromCharCode(code);
    }
    return str.trim();
  } catch {
    return "";
  }
}

function parseExifDate(raw: string): string | null {
  if (!raw) return null;
  // Format: "YYYY:MM:DD HH:MM:SS" or "YYYY-MM-DD..."
  const clean = raw.trim();
  const match = clean.match(/^(\d{4})[:\-](\d{2})[:\-](\d{2})[\sT](\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    const [_, y, m, d, hh, mm, ss] = match;
    const date = new Date(Date.UTC(+y, +m - 1, +d, +hh, +mm, +ss));
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  return null;
}

/**
 * Universal metadata extractor for a File/Blob in the browser
 */
export async function analyzeFileMetadata(file: File): Promise<ExifMetadataResult> {
  let exifData: Partial<ExifMetadataResult> = { hasExif: false };

  try {
    const arrayBuffer = await file.slice(0, 128 * 1024).arrayBuffer(); // First 128KB is enough for EXIF
    exifData = parseJpegExif(arrayBuffer);
  } catch {
    // Non-JPEG or unreadable
  }

  // 1. If EXIF date is found
  if (exifData.hasExif && exifData.takenAt && exifData.year) {
    const stage = getStageFromYear(exifData.year);
    return {
      hasExif: true,
      takenAt: exifData.takenAt,
      year: exifData.year,
      cameraMake: exifData.cameraMake,
      cameraModel: exifData.cameraModel,
      orientation: exifData.orientation,
      stageKey: stage.stageKey,
      stageLabel: stage.stageLabel,
      confidence: "exif",
    };
  }

  // 2. Check filename for year pattern (e.g. 2014, 2018)
  const yearFromFilename = extractYearFromFilename(file.name);
  if (yearFromFilename) {
    const approxDate = new Date(Date.UTC(yearFromFilename, 5, 15)).toISOString();
    const stage = getStageFromYear(yearFromFilename);
    return {
      hasExif: false,
      takenAt: approxDate,
      year: yearFromFilename,
      stageKey: stage.stageKey,
      stageLabel: stage.stageLabel,
      confidence: "filename",
    };
  }

  // 3. Fallback to file.lastModified
  if (file.lastModified) {
    const modDate = new Date(file.lastModified);
    const modYear = modDate.getFullYear();
    // Only accept modified year if it seems like a past photo (before current year or within XV range)
    if (modYear >= 2011 && modYear <= 2026) {
      const stage = getStageFromYear(modYear);
      return {
        hasExif: false,
        takenAt: modDate.toISOString(),
        year: modYear,
        stageKey: stage.stageKey,
        stageLabel: stage.stageLabel,
        confidence: "lastModified",
      };
    }
  }

  // 4. Default fallback: Infancia
  const defaultStage = getStageFromYear(2012);
  return {
    hasExif: false,
    takenAt: null,
    year: null,
    stageKey: defaultStage.stageKey,
    stageLabel: defaultStage.stageLabel,
    confidence: "fallback",
  };
}

/**
 * Sorts photos chronologically based on their metadata (takenAt / year)
 */
export function sortPhotosChronologically<T extends { takenAt?: string | null; year?: number | string | null; sortOrder?: number }>(
  photos: T[]
): T[] {
  return [...photos].sort((a, b) => {
    // 1. By takenAt date if both exist
    if (a.takenAt && b.takenAt) {
      const diff = new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime();
      if (!isNaN(diff) && diff !== 0) return diff;
    }

    // 2. By year
    const aYr = Number(a.year) || (a.takenAt ? new Date(a.takenAt).getFullYear() : null);
    const bYr = Number(b.year) || (b.takenAt ? new Date(b.takenAt).getFullYear() : null);

    if (aYr && bYr && aYr !== bYr) {
      return aYr - bYr;
    }
    if (aYr && !bYr) return -1;
    if (!aYr && bYr) return 1;

    // 3. Fallback to sortOrder
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}
