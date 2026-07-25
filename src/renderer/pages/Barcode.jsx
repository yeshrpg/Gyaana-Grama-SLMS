import { useState, useRef } from 'react';
import { CheckCircle, XCircle, BookPlus, ArrowLeftRight, RotateCcw, User, Hash, BookOpen, Building2, Calendar, Tag, Loader2 } from 'lucide-react';
import BarcodeScanner, { parseBarcode } from '../components/BarcodeScanner';

const STATUS_IDLE = 'idle';
const STATUS_LOADING = 'loading';
const STATUS_SUCCESS = 'success';
const STATUS_ERROR = 'error';

function FieldRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <Icon size={14} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 80, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1, fontFamily: mono ? "'Courier New', monospace" : undefined }}>
        {value || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>}
      </span>
    </div>
  );
}

function StatusBanner({ status, message }) {
  if (status === STATUS_IDLE) return null;
  if (status === STATUS_LOADING) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#93C5FD', fontSize: 13 }}>
      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing...
    </div>
  );
  if (status === STATUS_SUCCESS) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#86EFAC', fontSize: 13 }}>
      <CheckCircle size={14} /> {message}
    </div>
  );
  if (status === STATUS_ERROR) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5', fontSize: 13 }}>
      <XCircle size={14} /> {message}
    </div>
  );
}

// ─── LEFT: Issue / Return ────────────────────────────────────────────────
function IssueReturnColumn() {
  const [scannedBook, setScannedBook] = useState(null);
  const [memberId, setMemberId] = useState('');
  const [memberInfo, setMemberInfo] = useState(null);
  const [memberStatus, setMemberStatus] = useState(STATUS_IDLE);
  const [actionStatus, setActionStatus] = useState(STATUS_IDLE);
  const [actionMessage, setActionMessage] = useState('');
  const [mode, setMode] = useState('issue');
  const memberInputRef = useRef(null);
  const api = window.api;

  const handleBookScan = async (result) => {
    setScannedBook(null);
    setMemberInfo(null);
    setMemberId('');
    setActionStatus(STATUS_IDLE);
    if (!result.valid) {
      setActionStatus(STATUS_ERROR);
      setActionMessage(result.error);
      return;
    }
    const res = await api.barcodeLookupBook(result.fields.accessionId);
    if (!res.success) {
      setActionStatus(STATUS_ERROR);
      setActionMessage(res.message);
      return;
    }
    setScannedBook({ ...result.fields, dbData: res.book });
    setActionStatus(STATUS_IDLE);
    setTimeout(() => memberInputRef.current?.focus(), 100);
  };

  const handleMemberLookup = async () => {
    if (!memberId.trim()) return;
    setMemberStatus(STATUS_LOADING);
    const res = await api.barcodeLookupMember(memberId.trim());
    if (!res.success) {
      setMemberInfo(null);
      setMemberStatus(STATUS_ERROR);
      setActionMessage(res.message);
      return;
    }
    setMemberInfo(res.member);
    setMemberStatus(STATUS_SUCCESS);
  };

  const handleIssue = async () => {
    if (!scannedBook || !memberInfo) return;
    setActionStatus(STATUS_LOADING);
    const res = await api.barcodeIssueBook({ accessionId: scannedBook.accessionId, memberId: memberId.trim() });
    setActionStatus(res.success ? STATUS_SUCCESS : STATUS_ERROR);
    setActionMessage(res.message);
    if (res.success) { setScannedBook(null); setMemberInfo(null); setMemberId(''); }
  };

  const handleReturn = async () => {
    if (!scannedBook) return;
    setActionStatus(STATUS_LOADING);
    const res = await api.barcodeReturnBook({ accessionId: scannedBook.accessionId });
    setActionStatus(res.success ? STATUS_SUCCESS : STATUS_ERROR);
    setActionMessage(res.message);
    if (res.success) setScannedBook(null);
  };

  const handleReset = () => {
    setScannedBook(null); setMemberInfo(null); setMemberId('');
    setActionStatus(STATUS_IDLE); setMemberStatus(STATUS_IDLE);
  };

  const isAvailable = scannedBook?.dbData?.available_copies > 0;

  const modeBtnStyle = (m) => ({
    flex: 1,
    padding: '8px 0',
    fontSize: 13,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: mode === m ? 'var(--accent)' : 'transparent',
    color: mode === m ? 'black' : 'var(--text-muted)',
    transition: 'all 150ms',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Mode Toggle */}
      <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
        {['issue', 'return'].map((m) => (
          <button key={m} type="button" onClick={() => { setMode(m); handleReset(); }} style={modeBtnStyle(m)}>
            {m === 'issue' ? <ArrowLeftRight size={14} /> : <RotateCcw size={14} />}
            {m === 'issue' ? 'Issue Book' : 'Return Book'}
          </button>
        ))}
      </div>

      {/* Step 1: Scan Book */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', color: 'black', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Scan Book Barcode</span>
        </div>
        <BarcodeScanner onScan={handleBookScan} placeholder="Aim scanner at book barcode..." autoFocus />
        {scannedBook && (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid rgba(245,166,35,0.2)', padding: 12, marginTop: 8 }}>
            <FieldRow icon={Hash} label="Accession" value={scannedBook.accessionId} mono />
            <FieldRow icon={BookOpen} label="Title" value={scannedBook.title} />
            <FieldRow icon={User} label="Author" value={scannedBook.author} />
            <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 12, width: 'fit-content', background: isAvailable ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: isAvailable ? '#22C55E' : '#EF4444' }}>
              {isAvailable ? '● Available' : '● Currently Issued'}
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Member ID (issue only) */}
      {mode === 'issue' && scannedBook && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', color: 'black', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Member ID</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 8,
              borderRadius: 8, border: `1px solid ${memberInfo ? '#22C55E' : 'var(--border)'}`,
              padding: '8px 12px', background: memberInfo ? 'rgba(34,197,94,0.04)' : 'var(--bg-secondary)',
            }}>
              <User size={14} color="var(--text-muted)" />
              <input
                ref={memberInputRef}
                type="text"
                value={memberId}
                onChange={(e) => { setMemberId(e.target.value); setMemberInfo(null); setMemberStatus(STATUS_IDLE); }}
                onKeyDown={(e) => e.key === 'Enter' && handleMemberLookup()}
                placeholder="Enter member ID..."
                style={{ flex: 1, background: 'transparent', fontSize: 13, color: 'var(--text-secondary)', border: 'none', outline: 'none' }}
              />
            </div>
            <button type="button" onClick={handleMemberLookup}
              style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.3)', color: 'var(--accent)', fontSize: 12, cursor: 'pointer', transition: 'all 150ms' }}>
              Lookup
            </button>
          </div>
          {memberInfo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.2)', marginTop: 8 }}>
              <CheckCircle size={14} color="#22C55E" />
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{memberInfo.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {memberInfo.member_id || memberInfo.id}</div>
              </div>
            </div>
          )}
          {memberStatus === STATUS_ERROR && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, color: '#EF4444', fontSize: 12 }}>
              <XCircle size={12} /> {actionMessage}
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      {scannedBook && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'issue' ? (
            <button type="button" onClick={handleIssue} disabled={!memberInfo || !isAvailable || actionStatus === STATUS_LOADING}
              style={{ width: '100%', padding: '12px 0', borderRadius: 10, fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--accent)', color: 'black', opacity: (!memberInfo || !isAvailable || actionStatus === STATUS_LOADING) ? 0.4 : 1, transition: 'all 150ms' }}>
              {actionStatus === STATUS_LOADING ? <Loader2 size={15} /> : <ArrowLeftRight size={15} />}
              Issue to {memberInfo?.name || 'Member'}
            </button>
          ) : (
            <button type="button" onClick={handleReturn} disabled={isAvailable || actionStatus === STATUS_LOADING}
              style={{ width: '100%', padding: '12px 0', borderRadius: 10, fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#22C55E', color: 'white', opacity: (isAvailable || actionStatus === STATUS_LOADING) ? 0.4 : 1, transition: 'all 150ms' }}>
              {actionStatus === STATUS_LOADING ? <Loader2 size={15} /> : <RotateCcw size={15} />}
              Confirm Return
            </button>
          )}
          <button type="button" onClick={handleReset}
            style={{ width: '100%', padding: '8px 0', borderRadius: 10, fontSize: 13, color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', transition: 'all 150ms' }}>
            Clear & Reset
          </button>
        </div>
      )}

      <StatusBanner status={actionStatus} message={actionMessage} />
    </div>
  );
}

// ─── RIGHT: Add Book ─────────────────────────────────────────────────────
function AddBookColumn() {
  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState('');
  const [status, setStatus] = useState(STATUS_IDLE);
  const [message, setMessage] = useState('');
  const api = window.api;

  const handleScan = (result) => {
    setStatus(STATUS_IDLE);
    if (!result.valid) {
      setParsed(null);
      setParseError(result.error);
      return;
    }
    setParseError('');
    setParsed(result.fields);
  };

  const handleAddBook = async () => {
    if (!parsed) return;
    setStatus(STATUS_LOADING);
    const res = await api.barcodeAddBook(parsed);
    setStatus(res.success ? STATUS_SUCCESS : STATUS_ERROR);
    setMessage(res.message);
    if (res.success) setParsed(null);
  };

  const handleReset = () => {
    setParsed(null); setParseError(''); setStatus(STATUS_IDLE);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Barcode format hint */}
      <div style={{ borderRadius: 10, border: '1px dashed rgba(245,166,35,0.2)', background: 'rgba(245,166,35,0.04)', padding: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Barcode Format</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'Courier New', monospace" }}>GG-XXXX|Title|Author|Publisher|Year|Genre</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Max 180 chars · 6 pipe-separated fields</div>
      </div>

      {/* Scanner */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', color: 'black', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Scan or Paste Barcode</span>
        </div>
        <BarcodeScanner onScan={handleScan} placeholder="Scan barcode or paste raw string..." />
        {parseError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, color: '#EF4444', fontSize: 12 }}>
            <XCircle size={12} /> {parseError}
          </div>
        )}
      </div>

      {/* Parsed preview */}
      {parsed && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', color: 'black', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Parsed Preview</span>
          </div>
          <FieldRow icon={Hash} label="Accession" value={parsed.accessionId} mono />
          <FieldRow icon={BookOpen} label="Title" value={parsed.title} />
          <FieldRow icon={User} label="Author" value={parsed.author} />
          <FieldRow icon={Building2} label="Publisher" value={parsed.publisher} />
          <FieldRow icon={Calendar} label="Year" value={parsed.year} />
          <FieldRow icon={Tag} label="Genre" value={parsed.genre} />
        </div>
      )}

      {/* Field length bars */}
      {parsed && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Field Lengths</div>
          {[
            { label: 'Accession ID', val: parsed.accessionId, max: 10 },
            { label: 'Title', val: parsed.title, max: 60 },
            { label: 'Author', val: parsed.author, max: 40 },
            { label: 'Publisher', val: parsed.publisher, max: 30 },
            { label: 'Genre', val: parsed.genre, max: 20 },
          ].map(({ label, val, max }) => {
            const pct = Math.min((val.length / max) * 100, 100);
            const warn = pct > 80;
            return (
              <div key={label} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>{label}</span>
                  <span style={warn ? { color: 'var(--accent)' } : {}}>{val.length}/{max}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'var(--border)' }}>
                  <div style={{ height: 4, borderRadius: 2, width: `${pct}%`, background: warn ? 'var(--accent)' : '#22C55E', transition: 'width 300ms' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add button */}
      {parsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button type="button" onClick={handleAddBook} disabled={status === STATUS_LOADING}
            style={{ width: '100%', padding: '12px 0', borderRadius: 10, fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--accent)', color: 'black', opacity: status === STATUS_LOADING ? 0.4 : 1, transition: 'all 150ms' }}>
            {status === STATUS_LOADING ? <Loader2 size={15} /> : <BookPlus size={15} />}
            Add to Library Database
          </button>
          <button type="button" onClick={handleReset}
            style={{ width: '100%', padding: '8px 0', borderRadius: 10, fontSize: 13, color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', transition: 'all 150ms' }}>
            Clear
          </button>
        </div>
      )}

      <StatusBanner status={status} message={message} />
    </div>
  );
}

// ─── PAGE ROOT ───────────────────────────────────────────────────────────
export default function Barcode() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px 20px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Barcode Scanner</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Issue, return, or add books via scanner or manual entry</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 20, background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
          <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>Type/paste barcode</span>
        </div>
      </div>

      {/* Two-column grid */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%' }}>
          {/* LEFT */}
          <div style={{ padding: 24, borderRight: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ padding: 8, borderRadius: 8, background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)' }}>
                <ArrowLeftRight size={16} color="var(--accent)" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Issue / Return</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Circulation transactions</div>
              </div>
            </div>
            <IssueReturnColumn />
          </div>

          {/* RIGHT */}
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ padding: 8, borderRadius: 8, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <BookPlus size={16} color="#3B82F6" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Add Book</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Scan to add to library database</div>
              </div>
            </div>
            <AddBookColumn />
          </div>
        </div>
      </div>
    </div>
  );
}
