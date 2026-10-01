import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { loadProducts, loadCategories } from '../../lib/data';
import { supabase } from '../../lib/supabase';
import {
  extractSignature,
  computeSimilarity,
  serializeSignature,
  deserializeSignature,
  SIGNATURE_VERSION,
  type ImageSignature,
  type SimilarityWeights,
} from '../../lib/imageSignature';
import type { Product, Category } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { Upload, Search, ImageIcon, X, Loader2, Tag, Camera, CheckCircle2, AlertCircle } from 'lucide-react';

interface OutletContextType {
  openWhatsApp: (product?: Product | null) => void;
}

interface MatchResult {
  product: Product;
  score: number;
}

const DEFAULT_VISUAL_SEARCH = {
  threshold: 50,
  maxResults: 12,
  weights: { color: 70, brightness: 15, texture: 10, variance: 5 } satisfies SimilarityWeights,
};
const MAX_IMAGE_SIZE_MB = 10;

export default function VisualSearchPage() {
  const { openWhatsApp } = useOutletContext<OutletContextType>();
  const { settings } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [computingSignatures, setComputingSignatures] = useState(false);
  const [signatureProgress, setSignatureProgress] = useState(0);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedSignature, setUploadedSignature] = useState<ImageSignature | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchedCategory, setSearchedCategory] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const narrowViewport = typeof window !== 'undefined' && window.innerWidth <= 1024;
  const visualThreshold = settings?.visual_search_threshold ?? DEFAULT_VISUAL_SEARCH.threshold;
  const visualMaxResults = settings?.visual_search_max_results ?? DEFAULT_VISUAL_SEARCH.maxResults;
  const similarityWeights: SimilarityWeights = {
    color: settings?.visual_search_color_weight ?? DEFAULT_VISUAL_SEARCH.weights.color,
    brightness: settings?.visual_search_brightness_weight ?? DEFAULT_VISUAL_SEARCH.weights.brightness,
    texture: settings?.visual_search_texture_weight ?? DEFAULT_VISUAL_SEARCH.weights.texture,
    variance: settings?.visual_search_variance_weight ?? DEFAULT_VISUAL_SEARCH.weights.variance,
  };

  // Load products and categories on mount, then auto-compute missing/stale signatures
  useEffect(() => {
    (async () => {
      const [prods, cats] = await Promise.all([loadProducts(), loadCategories()]);
      setProducts(prods);
      setCategories(cats);
      setLoadingProducts(false);

      // Auto-compute signatures for products missing one or with stale version
      const missing = prods.filter((p) => {
        if (!p.image_urls || p.image_urls.length === 0) return false;
        if (!p.visual_signature) return true;
        const sig = deserializeSignature(p.visual_signature);
        return sig === null;
      });
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

  const runSearch = useCallback(
    (sig: ImageSignature, categoryFilter: string) => {
      const prods = products;
      const matches: MatchResult[] = prods
        .filter((p) => {
          if (!p.visual_signature) return false;
          if (categoryFilter && p.category_id !== categoryFilter) return false;
          const deserialized = deserializeSignature(p.visual_signature);
          if (!deserialized) return false;
          return true;
        })
        .map((p) => {
          const deserialized = deserializeSignature(p.visual_signature!);
          if (!deserialized) return null;
          return {
            product: p,
            score: computeSimilarity(sig, deserialized, similarityWeights),
          };
        })
        .filter((m): m is MatchResult => m !== null)
        .filter((m) => m.score >= visualThreshold)
        .sort((a, b) => b.score - a.score)
        .slice(0, visualMaxResults);

      setResults(matches);
      setHasSearched(true);
      setSearchedCategory(categoryFilter);
    },
    [products, similarityWeights.color, similarityWeights.brightness, similarityWeights.texture, similarityWeights.variance, visualThreshold, visualMaxResults],
  );

  const handleFile = useCallback(
    async (file: File) => {
      const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!supportedTypes.includes(file.type)) {
        setUploadError('Please choose a JPG, PNG, or WebP image.');
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        setUploadError(`Please choose an image smaller than ${MAX_IMAGE_SIZE_MB} MB.`);
        return;
      }
      setUploadError('');
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
      setAnalyzing(true);
      setHasSearched(false);
      setResults([]);
      setSelectedCategory('');

      const sig = await extractSignature(url);
      setUploadedSignature(sig);
      setAnalyzing(false);
    },
    [],
  );

  const handleCategorySearch = () => {
    if (!uploadedSignature) return;
    runSearch(uploadedSignature, selectedCategory);
  };

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
    setSelectedCategory('');
    setSearchedCategory('');
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const stockStyle = (status: string | null) => {
    if (status === 'Out of Stock') return { color: 'var(--danger)' };
    if (status === 'Limited Stock') return { color: 'var(--warning)' };
    return { color: 'var(--success)' };
  };

  const matchBadgeColor = (score: number) => {
    if (score >= 70) return { bg: 'var(--success-light)', color: 'var(--success)' };
    if (score >= 50) return { bg: 'var(--warning-light)', color: 'var(--accent-dark)' };
    return { bg: 'var(--bg-light)', color: 'var(--text-muted)' };
  };

  const searchedCategoryName = categories.find((c) => c.id === searchedCategory)?.name || 'All Categories';

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
        <>
          {isMobile && (
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <button
                className="btn btn-accent"
                onClick={() => cameraInputRef.current?.click()}
                style={{ flex: 1, padding: '0.875rem 1rem', fontSize: '0.95rem' }}
              >
                <Camera size={20} /> Take Photo
              </button>
              <button
                className="btn btn-outline"
                onClick={() => fileInputRef.current?.click()}
                style={{ flex: 1, padding: '0.875rem 1rem', fontSize: '0.95rem' }}
              >
                <Upload size={20} /> Upload Image
              </button>
            </div>
          )}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2.5px dashed ${dragOver ? 'var(--accent)' : 'var(--border-strong)'}`,
              borderRadius: 'var(--radius)',
              padding: isMobile ? '2.5rem 1.5rem' : '3.5rem 2rem',
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
            <h3 style={{ marginBottom: '0.5rem' }}>{isMobile ? 'Tap to browse' : 'Drop an image here'}</h3>
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>
              {isMobile ? 'JPG, PNG, WebP supported' : 'or click to browse — JPG, PNG, WebP supported'}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Supported file formats: JPG, PNG, WebP · Max size: {MAX_IMAGE_SIZE_MB} MB</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '0.75rem' }}>Your image is used only for this search session and will be deleted automatically afterward.</p>
          </div>
          {uploadError && (
            <p role="alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.75rem' }}><AlertCircle size={15} /> {uploadError}</p>
          )}
          <div style={{ marginTop: '1.5rem', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.35rem' }}>For better tile matches</h3>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>Use a clear, well-lit photo where the tile pattern fills most of the frame.</p>
            <div className="visual-search-examples">
              <figure><img src="/visual-search-tile-clear.webp" alt="Clear straight-on tile photo example" /><figcaption><CheckCircle2 size={15} /> Clear and straight-on</figcaption></figure>
              <figure><img src="/visual-search-tile-angle.webp" alt="Well-lit angled tile photo example" /><figcaption><CheckCircle2 size={15} /> Well-lit tile sample</figcaption></figure>
              <figure><img src="/visual-search-tile-cluttered.webp" alt="Cluttered tile photo example" /><figcaption><AlertCircle size={15} /> Avoid clutter</figcaption></figure>
              <figure><img src="/visual-search-tile-dark.webp" alt="Dark tile photo example" /><figcaption><AlertCircle size={15} /> Avoid dark blur</figcaption></figure>
            </div>
          </div>
        </>

      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

      {/* Uploaded Image Preview + Category Picker + Results */}
      {uploadedImage && (
        <div className="visual-search-workspace" style={{ display: 'flex', flexDirection: narrowViewport ? 'column' : undefined, gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap', width: '100%', minWidth: 0 }}>
          {/* Preview panel */}
          <div className="visual-search-preview" style={{ width: narrowViewport ? '100%' : '280px', maxWidth: narrowViewport ? '420px' : undefined, flexShrink: 0 }}>
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
                <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite', marginRight: '0.5rem', verticalAlign: 'middle' }} />
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

          {/* Right panel: category picker + results */}
          <div className="visual-search-controls" style={{ flex: 1, minWidth: 0, width: narrowViewport ? '100%' : undefined }}>
            {/* Category Picker */}
            {!analyzing && uploadedSignature && !hasSearched && (
              <div style={{
                background: 'var(--bg-white)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-card)',
                marginBottom: '1.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Tag size={18} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ margin: 0, fontSize: '1.05rem' }}>What are you looking for?</h3>
                </div>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Select a category to narrow your search, or search across all categories.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  <button
                    onClick={() => setSelectedCategory('')}
                    style={{
                      padding: '0.625rem 1.25rem',
                      borderRadius: 'var(--radius-full)',
                      border: `2px solid ${selectedCategory === '' ? 'var(--accent)' : 'var(--border-strong)'}`,
                      background: selectedCategory === '' ? 'var(--accent-light)' : 'var(--bg-white)',
                      color: selectedCategory === '' ? 'var(--accent)' : 'var(--text-main)',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{
                        padding: '0.625rem 1.25rem',
                        borderRadius: 'var(--radius-full)',
                        border: `2px solid ${selectedCategory === cat.id ? 'var(--accent)' : 'var(--border-strong)'}`,
                        background: selectedCategory === cat.id ? 'var(--accent-light)' : 'var(--bg-white)',
                        color: selectedCategory === cat.id ? 'var(--accent)' : 'var(--text-main)',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
                <button
                  className="btn btn-accent"
                  onClick={handleCategorySearch}
                  disabled={loadingProducts || computingSignatures}
                  style={{ width: '100%', padding: '0.75rem' }}
                >
                  <Search size={18} /> Find Matching Products
                </button>
                {(loadingProducts || computingSignatures) && (
                  <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                    {computingSignatures
                      ? `Preparing product signatures... (${signatureProgress} done)`
                      : 'Loading products...'}
                  </p>
                )}
              </div>
            )}

            {/* Change category bar after results */}
            {hasSearched && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                background: 'var(--bg-white)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-card)',
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Searching in:
                </span>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    if (uploadedSignature) runSearch(uploadedSignature, e.target.value);
                  }}
                  style={{
                    width: 'auto',
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Results */}
            {hasSearched && (
              <>
                {results.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <ImageIcon size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                    <p>No matches found in {searchedCategoryName} with at least {visualThreshold}% similarity.</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      Try a different category or a clearer photo of the product.
                    </p>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                      <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                        {results.length} match{results.length === 1 ? '' : 'es'} found in {searchedCategoryName}
                        {' '}({visualThreshold}%+ similarity)
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
                )}
              </>
            )}
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
