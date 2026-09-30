import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { loadProducts } from '../../lib/data';
import { supabase } from '../../lib/supabase';
import {
  extractSignature,
  computeSimilarity,
  serializeSignature,
  deserializeSignature,
  type ImageSignature,
} from '../../lib/imageSignature';
import type { Product } from '../../types';
import { Upload, Search, ImageIcon, X, Loader2 } from 'lucide-react';

interface OutletContextType {
  openWhatsApp: (product?: Product | null) => void;
}

interface MatchResult {
  product: Product;
  score: number;
}

export default function VisualSearchPage() {
  const { openWhatsApp } = useOutletContext<OutletContextType>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [computingSignatures, setComputingSignatures] = useState(false);
  const [signatureProgress, setSignatureProgress] = useState(0);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedSignature, setUploadedSignature] = useState<ImageSignature | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load products on mount, then auto-compute missing signatures
  useEffect(() => {
    (async () => {
      const prods = await loadProducts();
      setProducts(prods);
      setLoadingProducts(false);

      // Auto-compute signatures for products missing one
      const missing = prods.filter(
        (p) => !p.visual_signature && p.image_urls && p.image_urls.length > 0,
      );
      if (missing.length > 0) {
        setComputingSignatures(true);
        let computed = 0;
        for (const prod of missing) {
          const imgUrl = prod.image_urls![0];
          const sig = await extractSignature(imgUrl);
          if (sig) {
            const serialized = serializeSignature(sig);
            try {
              await supabase.rpc('update_product_signature', {
                p_product_id: prod.id,
                p_signature: serialized,
              });
            } catch (e) {
              console.error('Failed to save signature for', prod.sku, e);
            }
            computed++;
            setSignatureProgress(computed);
            // Update local state so we don't recompute
            setProducts((prev) =>
              prev.map((p) =>
                p.id === prod.id ? { ...p, visual_signature: serialized } : p,
              ),
            );
          }
        }
        setComputingSignatures(false);
      }
    })();
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
      setAnalyzing(true);
      setHasSearched(false);
      setResults([]);

      const sig = await extractSignature(url);
      setUploadedSignature(sig);
      setAnalyzing(false);

      if (sig) {
        // Wait for products to be loaded
        const prods = products.length > 0 ? products : await loadProducts();
        const matches: MatchResult[] = prods
          .filter((p) => p.visual_signature)
          .map((p) => ({
            product: p,
            score: computeSimilarity(sig, deserializeSignature(p.visual_signature!)),
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 12);

        setResults(matches);
        setHasSearched(true);
      }
    },
    [products],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    if (uploadedImage) URL.revokeObjectURL(uploadedImage);
    setUploadedImage(null);
    setUploadedSignature(null);
    setResults([]);
    setHasSearched(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const stockStyle = (status: string | null) => {
    if (status === 'Out of Stock') return { color: 'var(--danger)' };
    if (status === 'Limited Stock') return { color: 'var(--warning)' };
    return { color: 'var(--success)' };
  };

  const matchBadgeColor = (score: number) => {
    if (score >= 70) return { bg: 'var(--success-light)', color: 'var(--success)' };
    if (score >= 40) return { bg: 'var(--warning-light)', color: 'var(--accent-dark)' };
    return { bg: 'var(--bg-light)', color: 'var(--text-muted)' };
  };

  return (
    <div className="container section fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1>Visual Search</h1>
        <p className="text-muted mt-2">
          Upload a photo of any tile or product and we'll find the closest matches from our catalog.
        </p>
      </div>

      {/* Upload Zone */}
      {!uploadedImage && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2.5px dashed ${dragOver ? 'var(--accent)' : 'var(--border-strong)'}`,
            borderRadius: 'var(--radius)',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.25s',
            background: dragOver ? 'var(--accent-light)' : 'var(--bg-white)',
            boxShadow: 'var(--shadow-card)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = dragOver ? 'var(--accent)' : 'var(--border-strong)'; }}
        >
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'var(--accent-light)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem', transition: 'transform 0.25s',
          }}>
            <Upload size={32} />
          </div>
          <h3 style={{ marginBottom: '0.5rem' }}>Drop an image here</h3>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            or click to browse — JPG, PNG, WebP supported
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

      {/* Uploaded Image Preview + Results */}
      {uploadedImage && (
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Preview panel */}
          <div style={{ width: '280px', flexShrink: 0 }}>
            <div style={{
              position: 'relative',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card)',
            }}>
              <img src={uploadedImage} alt="Uploaded" style={{ width: '100%', display: 'block' }} />
              <button
                onClick={reset}
                style={{
                  position: 'absolute', top: '0.5rem', right: '0.5rem',
                  background: 'rgba(26,26,26,0.7)', color: '#fff',
                  border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(26,26,26,0.9)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(26,26,26,0.7)'; }}
              >
                <X size={16} />
              </button>
            </div>
            {analyzing && (
              <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <Loader2 size={18} className="spinner" style={{ animation: 'spin 0.8s linear infinite', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Analyzing image...
              </div>
            )}
            {!analyzing && uploadedSignature && (
              <div style={{ marginTop: '0.75rem' }}>
                <button className="btn btn-outline btn-block" onClick={reset} style={{ fontSize: '0.85rem' }}>
                  <Search size={15} /> Search Another
                </button>
              </div>
            )}
          </div>

          {/* Results panel */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {loadingProducts || computingSignatures ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                {computingSignatures ? (
                  <>
                    <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite' }} />
                    <p style={{ marginTop: '0.75rem' }}>
                      Preparing product signatures... {signatureProgress > 0 && `(${signatureProgress} done)`}
                    </p>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      This happens once so future searches are instant.
                    </p>
                  </>
                ) : (
                  <p>Loading products...</p>
                )}
              </div>
            ) : analyzing ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite' }} />
                <p style={{ marginTop: '0.75rem' }}>Finding similar products...</p>
              </div>
            ) : hasSearched && results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <ImageIcon size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                <p>No similar products found. Try a different image.</p>
              </div>
            ) : results.length > 0 ? (
              <>
                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                    {results.length} match{results.length === 1 ? '' : 'es'} found
                  </p>
                </div>
                <div className="grid grid-cols-3">
                  {results.map((match, idx) => {
                    const p = match.product;
                    const images = p.image_urls || [];
                    const imgSrc = images.length > 0 ? images[0] : '/placeholder.png';
                    const badge = matchBadgeColor(match.score);

                    return (
                      <div
                        key={p.id}
                        style={{
                          background: 'var(--bg-white)',
                          borderRadius: 'var(--radius)',
                          overflow: 'hidden',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s',
                          animation: `fadeInSlow 0.4s ease-out ${Math.min(idx * 0.05, 0.4)}s both`,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = 'var(--shadow-hover)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <Link to={`/product/${p.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
                          <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '1', background: 'var(--bg-light)' }}>
                            <span style={{
                              position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 1,
                              background: badge.bg, color: badge.color, fontSize: '0.7rem', fontWeight: 700,
                              padding: '0.25rem 0.625rem', borderRadius: 'var(--radius-full)',
                              letterSpacing: '0.03em',
                            }}>
                              {match.score}% match
                            </span>
                            <img
                              src={imgSrc}
                              alt={p.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)' }}
                              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                            />
                          </div>
                          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                            {p.brand && <span className="badge badge-warning mb-2" style={{ alignSelf: 'flex-start' }}>{p.brand}</span>}
                            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{p.name}</h3>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                              {p.sku && <span>SKU: {p.sku}</span>}
                              {p.size && <span> · {p.size}</span>}
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--primary)' }}>
                              ₹{p.price || 0}
                              <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: 'var(--text-muted)' }}> / {p.unit || 'unit'}</span>
                            </div>
                            <p style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: 'auto', paddingTop: '0.5rem', ...stockStyle(p.stock_status) }}>
                              {p.stock_status || 'In Stock'}
                            </p>
                          </div>
                        </Link>
                        <div style={{ padding: '0 1rem 1rem', display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-whatsapp" style={{ flex: 1, padding: '0.5rem' }} onClick={() => openWhatsApp(p)}>
                            Quote
                          </button>
                          <Link to={`/product/${p.id}`} className="btn btn-primary" style={{ flex: 1, padding: '0.5rem' }}>
                            Details
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Initial state hint when no image uploaded */}
      {!uploadedImage && !loadingProducts && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          {computingSignatures ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite', marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Preparing product signatures... {signatureProgress > 0 && `(${signatureProgress} done)`}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <ImageIcon size={32} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: '0.85rem' }}>
                {products.length} products ready for visual search
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
