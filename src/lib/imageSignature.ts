/*
 * Browser-based image signature extraction.
 * Analyzes an image via canvas to produce a compact numeric fingerprint
 * capturing dominant colors, brightness, and texture features.
 * No external AI service required.
 */

export interface ImageSignature {
  /** 8 RGB color buckets (R*4 + G*2 + B*2 = 8 bins), normalized 0-1 */
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

const SIGNATURE_SIZE = 48;

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
 * Compute a color bucket index from RGB values.
 * 2 red bins x 2 green bins x 2 blue bins = 8 buckets.
 */
function colorBucket(r: number, g: number, b: number): number {
  const ri = r < 128 ? 0 : 1;
  const gi = g < 128 ? 0 : 1;
  const bi = b < 128 ? 0 : 1;
  return ri * 4 + gi * 2 + bi;
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

    const colorHistogram = new Array(8).fill(0);
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

      colorHistogram[colorBucket(r, g, b)]++;

      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      totalBrightness += brightness;
      const brightBin = Math.min(7, Math.floor(brightness * 8));
      brightnessHistogram[brightBin]++;
    }

    // Normalize histograms
    for (let i = 0; i < 8; i++) {
      colorHistogram[i] /= totalPixels;
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
 * Weighted: color histogram 50%, brightness histogram 25%, edge density 15%, color variance 10%.
 */
export function computeSimilarity(a: ImageSignature, b: ImageSignature): number {
  // Color histogram intersection (1 = identical, 0 = no overlap)
  let colorInter = 0;
  for (let i = 0; i < 8; i++) {
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
    colorInter * 0.50 +
    brightInter * 0.25 +
    edgeSim * 0.15 +
    varSim * 0.10;

  return Math.round(Math.max(0, Math.min(1, score)) * 100);
}

/**
 * Serialize a signature to a plain array for database storage.
 */
export function serializeSignature(sig: ImageSignature): number[] {
  return [
    ...sig.colorHistogram,
    sig.brightness,
    ...sig.brightnessHistogram,
    sig.edgeDensity,
    sig.colorVariance,
  ];
}

/**
 * Deserialize a signature from a plain array (from database).
 */
export function deserializeSignature(arr: number[]): ImageSignature {
  return {
    colorHistogram: arr.slice(0, 8),
    brightness: arr[8],
    brightnessHistogram: arr.slice(9, 17),
    edgeDensity: arr[17],
    colorVariance: arr[18],
  };
}
