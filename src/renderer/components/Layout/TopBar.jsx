import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Search, Bell, Plus } from 'lucide-react';
import { format } from 'date-fns';
import NotificationsPanel from '../NotificationsPanel';

export default function TopBar({ title, onLockScreen, onNavigate, onAddBook }) {
  const { i18n } = useTranslation();
  const searchRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const api = window.api;

  useEffect(() => {
    api?.getOverdueCount?.().then(count => setNotifCount(count || 0)).catch(() => {});
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const handleSearchKey = (e) => {
    if (e.key === 'Escape') { setSearchOpen(false); setSearchVal(''); }
    if (e.key === 'Enter' && searchVal.trim()) {
      window.location.hash = `#/books?q=${encodeURIComponent(searchVal.trim())}`;
      setSearchOpen(false);
    }
  };

  const today = format(new Date(), 'EEEE, d MMMM yyyy');

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
      }}
    >
      {/* Left: title + date */}
      <div>
        <div style={{ color: 'white', fontSize: 16, fontWeight: 600 }}>{title}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{today}</div>
      </div>

      {/* Center: inline search */}
      {searchOpen && (
        <div style={{ flex: 1, maxWidth: 400, margin: '0 24px' }}>
          <input
            ref={searchRef}
            type="text"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            onKeyDown={handleSearchKey}
            placeholder="Search books, members..."
            style={{
              width: '100%',
              background: 'var(--bg-card)',
              border: '1px solid var(--accent)',
              borderRadius: 6,
              padding: '6px 12px',
              color: 'white',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
      )}

      {/* Right: controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Language pill toggle */}
        <div
          style={{
            display: 'flex',
            borderRadius: 20,
            border: '1px solid var(--border)',
            overflow: 'hidden',
            fontSize: 11,
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (i18n.language !== 'en') {
                i18n.changeLanguage('en');
                try { localStorage.setItem('gg_language', 'en'); } catch (_) {}
              }
            }}
            style={{
              padding: '4px 10px',
              border: 'none',
              cursor: 'pointer',
              background: i18n.language === 'en' ? 'var(--accent)' : 'transparent',
              color: i18n.language === 'en' ? 'black' : 'var(--text-secondary)',
              fontWeight: 600,
              transition: 'all 150ms',
            }}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => {
              if (i18n.language !== 'kn') {
                i18n.changeLanguage('kn');
                try { localStorage.setItem('gg_language', 'kn'); } catch (_) {}
              }
            }}
            style={{
              padding: '4px 10px',
              border: 'none',
              cursor: 'pointer',
              background: i18n.language === 'kn' ? 'var(--accent)' : 'transparent',
              color: i18n.language === 'kn' ? 'black' : 'var(--text-secondary)',
              fontWeight: 600,
              transition: 'all 150ms',
            }}
          >
            ಕನ್ನಡ
          </button>
        </div>

        {/* Search icon */}
        <button
          type="button"
          onClick={() => setSearchOpen(v => !v)}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: searchOpen ? '1px solid var(--accent)' : '1px solid var(--border)',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = searchOpen ? 'var(--accent)' : 'var(--border)'; }}
        >
          <Search size={15} color={searchOpen ? 'var(--accent)' : 'var(--text-secondary)'} />
        </button>

        {/* Bell icon */}
        <button
          type="button"
          onClick={() => setNotifOpen(true)}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '1px solid var(--border)',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <Bell size={15} color="var(--text-secondary)" />
          {notifCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              background: '#EF4444', color: 'white',
              fontSize: 9, fontWeight: 700,
              width: 14, height: 14, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </button>

        {/* Add Book button */}
        <button
          type="button"
          onClick={onAddBook}
          style={{
            background: 'var(--accent)',
            color: 'black',
            fontSize: 12,
            fontWeight: 600,
            padding: '6px 14px',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
        >
          <Plus size={14} /> Add Book
        </button>

        {/* Lock */}
        <button
          type="button"
          onClick={onLockScreen}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '1px solid var(--border)',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <Lock size={15} color="var(--text-secondary)" />
        </button>
      </div>

      <NotificationsPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </header>
  );
}
