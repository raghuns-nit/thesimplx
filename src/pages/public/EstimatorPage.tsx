import { useState } from 'react';
import { Calculator } from 'lucide-react';

export default function EstimatorPage() {
  const [roomL, setRoomL] = useState('');
  const [roomB, setRoomB] = useState('');
  const [roomUnit, setRoomUnit] = useState('feet');
  const [tileL, setTileL] = useState('');
  const [tileB, setTileB] = useState('');
  const [tileUnit, setTileUnit] = useState('mm');
  const [result, setResult] = useState<{
    area: string;
    exact: string;
    wastage: string;
    total: string;
  } | null>(null);

  const toMM: Record<string, number> = {
    mm: 1,
    cm: 10,
    inch: 25.4,
    feet: 304.8,
  };

  const calculate = (e: React.FormEvent) => {
    e.preventDefault();

    const rL = parseFloat(roomL);
    const rB = parseFloat(roomB);
    const tL = parseFloat(tileL);
    const tB = parseFloat(tileB);

    if (!rL || !rB || !tL || !tB) return;

    const rLmm = rL * toMM[roomUnit];
    const rBmm = rB * toMM[roomUnit];
    const tLmm = tL * toMM[tileUnit];
    const tBmm = tB * toMM[tileUnit];

    const roomArea = rLmm * rBmm;
    const tileArea = tLmm * tBmm;
    const exact = roomArea / tileArea;
    const wastage = exact * 0.1;
    const total = Math.ceil(exact + wastage);
    const areaSqFt = (roomArea / (304.8 * 304.8)).toFixed(2);

    setResult({
      area: `${areaSqFt} Sq.Ft`,
      exact: exact.toFixed(1),
      wastage: `${wastage.toFixed(1)} (10%)`,
      total: `${total} Pieces`,
    });
  };

  return (
    <div className="container section fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <Calculator size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
        <h1>Tile Quantity Estimator</h1>
        <p className="text-muted mt-2">Calculate how many tiles you need for any room</p>
      </div>

      <form onSubmit={calculate} style={{
        background: 'var(--bg-white)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '2rem',
      }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Room Dimensions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>Length</label>
            <input type="number" value={roomL} onChange={(e) => setRoomL(e.target.value)} placeholder="e.g., 12" step="0.01" />
          </div>
          <div className="form-group">
            <label>Breadth</label>
            <input type="number" value={roomB} onChange={(e) => setRoomB(e.target.value)} placeholder="e.g., 10" step="0.01" />
          </div>
          <div className="form-group">
            <label>Unit</label>
            <select value={roomUnit} onChange={(e) => setRoomUnit(e.target.value)}>
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="inch">inch</option>
              <option value="feet">feet</option>
            </select>
          </div>
        </div>

        <h3 style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>Tile Dimensions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>Length</label>
            <input type="number" value={tileL} onChange={(e) => setTileL(e.target.value)} placeholder="e.g., 600" step="0.01" />
          </div>
          <div className="form-group">
            <label>Breadth</label>
            <input type="number" value={tileB} onChange={(e) => setTileB(e.target.value)} placeholder="e.g., 600" step="0.01" />
          </div>
          <div className="form-group">
            <label>Unit</label>
            <select value={tileUnit} onChange={(e) => setTileUnit(e.target.value)}>
              <option value="mm">mm</option>
              <option value="cm">cm</option>
              <option value="inch">inch</option>
              <option value="feet">feet</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-block mt-4" style={{ padding: '1rem' }}>
          Calculate Tiles Needed
        </button>
      </form>

      {result && (
        <div className="fade-in" style={{
          marginTop: '1.5rem',
          background: 'var(--bg-white)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '2rem',
        }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Results</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--bg-light)', borderRadius: 'var(--radius-sm)' }}>
              <p className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Room Area</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{result.area}</p>
            </div>
            <div style={{ padding: '1rem', background: 'var(--bg-light)', borderRadius: 'var(--radius-sm)' }}>
              <p className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exact Tiles</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{result.exact}</p>
            </div>
            <div style={{ padding: '1rem', background: 'var(--accent-light)', borderRadius: 'var(--radius-sm)' }}>
              <p className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wastage (10%)</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-dark)' }}>{result.wastage}</p>
            </div>
            <div style={{ padding: '1rem', background: '#dcfce7', borderRadius: 'var(--radius-sm)' }}>
              <p className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total to Buy</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>{result.total}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
