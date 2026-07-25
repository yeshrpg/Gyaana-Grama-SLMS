import { useEffect, useRef, useState } from 'react';
import { Scan } from 'lucide-react';

const FIELD_LIMITS = {
  accessionId: 10,
  title: 60,
  author: 40,
  publisher: 30,
  year: 4,
  genre: 20,
};

function parseBarcode(raw) {
  const trimmed = raw.trim();
  const parts = trimmed.split('|');
  if (parts.length !== 6) return { valid: false, error: `Expected 6 pipe-separated fields, got ${parts.length}` };
  const [accessionId, title, author, publisher, year, genre] = parts;
  if (!accessionId.startsWith('GG-')) return { valid: false, error: 'Accession ID must start with GG-' };
  if (!/^\d{4}$/.test(year)) return { valid: false, error: 'Year must be a 4-digit number' };
  const fields = { accessionId, title, author, publisher, year, genre };
  for (const [key, limit] of Object.entries(FIELD_LIMITS)) {
    if (fields[key].length > limit) return { valid: false, error: `${key} exceeds ${limit} char limit (got ${fields[key].length})` };
  }
  return { valid: true, fields };
}

export default function BarcodeScanner({ onScan, placeholder = 'Focus here and scan barcode...', label = 'Scanner Input', autoFocus = false }) {
  const inputRef = useRef(null);
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && value.trim()) {
      const result = parseBarcode(value.trim());
      onScan(result, value.trim());
      setValue('');
    }
  };

  const handleManualSubmit = () => {
    if (!value.trim()) return;
    const result = parseBarcode(value.trim());
    onScan(result, value.trim());
    setValue('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: 8,
        border: `1px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
        padding: '8px 12px',
        background: 'var(--bg-card)',
        transition: 'all 150ms',
        boxShadow: focused ? '0 0 0 2px rgba(245,166,35,0.15)' : 'none',
      }}>
        <Scan size={16} color={focused ? 'var(--accent)' : 'var(--text-muted)'} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: 'transparent',
            fontSize: 13,
            color: 'var(--text-secondary)',
            border: 'none',
            outline: 'none',
            fontFamily: "'Courier New', monospace",
          }}
        />
        {value && (
          <button
            type="button"
            onClick={handleManualSubmit}
            style={{
              fontSize: 11,
              color: 'var(--accent)',
              padding: '2px 8px',
              borderRadius: 4,
              border: '1px solid rgba(245,166,35,0.3)',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            Enter
          </button>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Scanner fires on Enter key. Manual entry supported.</div>
    </div>
  );
}

export { parseBarcode };
