/*
 * Browser-based image signature extraction.
 * Analyzes an image via canvas to produce a compact numeric fingerprint
 * capturing dominant colors (HSV space), brightness, and texture features.
 * No external AI service required.
 */

export interface ImageSignature {
  /** 32 HSV color buckets (8 hue x 2 saturation x 2 value), normalized 0-1 */
  colorHistogram: number[];
  /** Average brightness 0-1 */
  brightness: number;
  /** 8 brightness bins, normalized 0-1 */
  brightnessHistogram: number[];
  /** Edge density (texture roughness) 0-1 */
  edgeDensity: number;
  /** Color variance (how varied the colors are) 0-1 */
  colorVariance: number;
}

const SIGNATURE_SIZE = 64;

/** Signature format version — bumped when the algorithm changes so old stored signatures are recomputed */
export const SIGNATURE_VERSION = 2;

/**
 * Load an image from a URL into an HTMLImageElement.
 * Uses crossOrigin="anonymous" so canvas can read pixels from remote images.
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Draw an image to an offscreen canvas at a fixed size and return pixel data.
 */
function getImageData(img: HTMLImageElement, size: number): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, size, size);
  return ctx.getImageData(0, 0, size, size);
}

/**
 * Convert RGB to HSV.
 * Returns h (0-360), s (0-1), v (0-1).
 */
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) {
      h = ((gn - bn) / d) % 6;
    } else if (max === gn) {
      h = (bn - rn) / d + 2;
    } else {
      h = (rn - gn) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return [h, s, v];
}

/**
 * Compute an HSV color bucket index from RGB values.
 * 8 hue bins x 2 saturation bins x 2 value bins = 32 buckets.
 * Low-saturation (near-gray) pixels go to a separate set of achromatic buckets
 * indexed by value only, so grays don't pollute the hue bins.
 */
function hsvBucket(r: number, g: number, b: number): number {
  const [h, s, v] = rgbToHsv(r, g, b);
  // Achromatic: very low saturation — use value-only bins (indices 28-31)
  if (s < 0.15) {
    const vi = v < 0.5 ? 0 : 1;
    return 28 + vi;
  }
  // Chromatic: 8 hue bins x 2 sat bins x 2 value bins = 32 (but we use 0-27)
  const hi = Math.min(7, Math.floor(h / 45));
  const si = s < 0.5 ? 0 : 1;
  const vi = v < 0.5 ? 0 : 1;
  return hi * 4 + si * 2 + vi;
}

/**
 * Extract the visual signature from an image URL.
 */
export async function extractSignature(imageUrl: string): Promise<ImageSignature | null> {
  try {
    const img = await loadImage(imageUrl);
    const data = getImageData(img, SIGNATURE_SIZE);
    const pixels = data.data;
    const totalPixels = SIGNATURE_SIZE * SIGNATURE_SIZE;

    const colorHistogram = new Array(30).fill(0);
    const brightnessHistogram = new Array(8).fill(0);
    let totalBrightness = 0;
    let totalR = 0, totalG = 0, totalB = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      totalR += r;
      totalG += g;
      totalB += b;

      colorHistogram[hsvBucket(r, g, b)]++;

      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      totalBrightness += brightness;
      const brightBin = Math.min(7, Math.floor(brightness * 8));
      brightnessHistogram[brightBin]++;
    }

    // Normalize histograms
    for (let i = 0; i < 30; i++) {
      colorHistogram[i] /= totalPixels;
    }
    for (let i = 0; i < 8; i++) {
      brightnessHistogram[i] /= totalPixels;
    }

    const avgBrightness = totalBrightness / totalPixels;
    const avgR = totalR / totalPixels;
    const avgG = totalG / totalPixels;
    const avgB = totalB / totalPixels;

    // Color variance
    let varSum = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const dr = pixels[i] - avgR;
      const dg = pixels[i + 1] - avgG;
      const db = pixels[i + 2] - avgB;
      varSum += (dr * dr + dg * dg + db * db) / 3;
    }
    const colorVariance = Math.min(1, varSum / (totalPixels * 65025));

    // Edge density via simple gradient magnitude
    let edgeCount = 0;
    const gray: number[] = new Array(totalPixels);
    for (let i = 0, idx = 0; i < pixels.length; i += 4, idx++) {
      gray[idx] = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    }
    for (let y = 0; y < SIGNATURE_SIZE; y++) {
      for (let x = 0; x < SIGNATURE_SIZE; x++) {
        const idx = y * SIGNATURE_SIZE + x;
        if (x === SIGNATURE_SIZE - 1 || y === SIGNATURE_SIZE - 1) continue;
        const right = gray[idx + 1];
        const below = gray[idx + SIGNATURE_SIZE];
        const dx = Math.abs(gray[idx] - right);
        const dy = Math.abs(gray[idx] - below);
        if (dx + dy > 30) edgeCount++;
      }
    }
    const edgeDensity = edgeCount / totalPixels;

    return {
      colorHistogram,
      brightness: avgBrightness,
      brightnessHistogram,
      edgeDensity,
      colorVariance,
    };
  } catch {
    return null;
  }
}

/**
 * Compute similarity between two signatures as a 0-100 percentage.
 * Weighted: color histogram 70%, brightness histogram 15%, edge density 10%, color variance 5%.
 * Color is the dominant factor so opposite colors score very low.
 */
export interface SimilarityWeights {
  color: number;
  brightness: number;
  texture: number;
  variance: number;
}

export function computeSimilarity(a: ImageSignature, b: ImageSignature, weights: SimilarityWeights = {
  color: 70,
  brightness: 15,
  texture: 10,
  variance: 5,
}): number {
  const totalWeight = Math.max(1, weights.color + weights.brightness + weights.texture + weights.variance);
  const colorWeight = weights.color / totalWeight;
  const brightnessWeight = weights.brightness / totalWeight;
  const textureWeight = weights.texture / totalWeight;
  const varianceWeight = weights.variance / totalWeight;
  // Color histogram intersection (1 = identical, 0 = no overlap)
  let colorInter = 0;
  for (let i = 0; i < 30; i++) {
    colorInter += Math.min(a.colorHistogram[i], b.colorHistogram[i]);
  }

  // Brightness histogram intersection
  let brightInter = 0;
  for (let i = 0; i < 8; i++) {
    brightInter += Math.min(a.brightnessHistogram[i], b.brightnessHistogram[i]);
  }

  // Edge density similarity (1 - normalized difference)
  const edgeSim = 1 - Math.abs(a.edgeDensity - b.edgeDensity);

  // Color variance similarity
  const varSim = 1 - Math.abs(a.colorVariance - b.colorVariance);

  const score =
    colorInter * colorWeight +
    brightInter * brightnessWeight +
    edgeSim * textureWeight +
    varSim * varianceWeight;

  return Math.round(Math.max(0, Math.min(1, score)) * 100);
}

/**
 * Serialize a signature to a plain array for database storage.
 * Format: [version, ...30 color, brightness, ...8 brightness, edge, variance]
 */
export function serializeSignature(sig: ImageSignature): number[] {
  return [
    SIGNATURE_VERSION,
    ...sig.colorHistogram,
    sig.brightness,
    ...sig.brightnessHistogram,
    sig.edgeDensity,
    sig.colorVariance,
  ];
}

/**
 * Deserialize a signature from a plain array (from database).
 * Returns null if the version doesn't match (stale signature needs recompute).
 */
export function deserializeSignature(arr: number[]): ImageSignature | null {
  if (!arr || arr.length < 2) return null;
  const version = arr[0];
  if (version !== SIGNATURE_VERSION) return null;
  return {
    colorHistogram: arr.slice(1, 31),
    brightness: arr[31],
    brightnessHistogram: arr.slice(32, 40),
    edgeDensity: arr[40],
    colorVariance: arr[41],
  };
}
