import { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

interface CatalogThumbnailProps {
  url: string;
  alt?: string;
  width?: number;
  onClick?: () => void;
}

export default function CatalogThumbnail({ url, alt = 'Catalog first page', width = 56, onClick }: CatalogThumbnailProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        if (cancelled) return;
        const page = await pdf.getPage(1);
        if (cancelled) return;
        const viewport = page.getViewport({ scale: 1 });
        const targetWidth = width * 2;
        const scale = targetWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(scaledViewport.width);
        canvas.height = Math.ceil(scaledViewport.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('no 2d context');
        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
        if (cancelled) return;
        setDataUrl(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error('CatalogThumbnail render failed:', err);
        if (!cancelled) setFailed(true);
      }
    };
    render();
    return () => { cancelled = true; };
  }, [url, width]);

  if (failed) {
    return (
      <span
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width, height: width * 1.3, background: 'var(--bg-light)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          fontSize: '0.6rem', color: 'var(--text-muted)',
        }}
      >
        PDF
      </span>
    );
  }

  if (!dataUrl) {
    return (
      <span
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width, height: width * 1.3, background: 'var(--bg-light)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          fontSize: '0.6rem', color: 'var(--text-muted)',
        }}
      >
        ...
      </span>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={alt}
      onClick={onClick}
      style={{
        width,
        height: 'auto',
        objectFit: 'contain',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => { if (onClick) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; } }}
      onMouseLeave={(e) => { if (onClick) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; } }}
    />
  );
}
