import { useEffect, useState } from 'react';

const cache = new Map<string, string>();

const DARK_BG = '#2b2b2b';
const LIGHT_BG = '#f1ede6';

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

async function computeContrastBg(url: string): Promise<string> {
  const cached = cache.get(url);
  if (cached) return cached;
  try {
    const img = await loadImage(url);
    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    let total = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 10) continue;
      total += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
      count++;
    }
    const brightness = count > 0 ? total / count : 0.5;
    const bg = brightness >= 0.5 ? DARK_BG : LIGHT_BG;
    cache.set(url, bg);
    return bg;
  } catch {
    return LIGHT_BG;
  }
}

export function useContrastBg(url: string | undefined | null): string {
  const [bg, setBg] = useState<string>(() => (url ? cache.get(url) ?? LIGHT_BG : LIGHT_BG));
  useEffect(() => {
    if (!url) {
      setBg(LIGHT_BG);
      return;
    }
    const cached = cache.get(url);
    if (cached) {
      setBg(cached);
      return;
    }
    let active = true;
    computeContrastBg(url).then((b) => {
      if (active) setBg(b);
    });
    return () => { active = false; };
  }, [url]);
  return bg;
}
