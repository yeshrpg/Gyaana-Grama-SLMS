import { useState, useEffect } from 'react';
import { X, Bell, AlertCircle, BookOpen, AlertTriangle, CheckCircle } from 'lucide-react';

export default function NotificationsPanel({ isOpen, onClose }) {
  const api = window.api;
  const [activeTab, setActiveTab] = useState('all');
  const [overdue, setOverdue] = useState([]);
  const [todayBooks, setTodayBooks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const [overdueResult] = await Promise.all([
          api.transactions.getOverdue(),
        ]);
        setOverdue(overdueResult?.data || overdueResult || []);
        setTodayBooks([]);
      } catch (err) {
        console.error('Notifications: fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [isOpen]);

  const notifications = [];

  overdue.forEach(item => {
    const days = Math.ceil(Math.abs(new Date() - new Date(item.due_date)) / (1000 * 60 * 60 * 24));
    notifications.push({
      id: `overdue-${item.id}`,
      type: 'overdue',
      icon: AlertCircle,
      color: '#EF4444',
      main: `${item.member_name_kn || item.member_name} has not returned ${item.book_title_kn || item.book_title}`,
      sub: `${days} days overdue`,
      date: item.due_date,
    });
  });

  todayBooks.forEach(book => {
    notifications.push({
      id: `new-${book.id}`,
      type: 'new_book',
      icon: BookOpen,
      color: '#3B82F6',
      main: `New book added: ${book.title_kn || book.title}`,
      sub: book.accession_id,
      date: new Date().toISOString(),
    });
  });

  // Check low-stock genres
  const lowStock = {};
  todayBooks.forEach(b => {
    const g = b.genre || 'Unknown';
    lowStock[g] = (lowStock[g] || 0) + 1;
  });
  Object.entries(lowStock).forEach(([genre, count]) => {
    if (count < 2) {
      notifications.push({
        id: `low-${genre}`,
        type: 'low_stock',
        icon: AlertTriangle,
        color: '#F59E0B',
        main: `Low count in ${genre}`,
        sub: `${count} book${count !== 1 ? 's' : ''}`,
        date: new Date().toISOString(),
      });
    }
  });

  notifications.sort((a, b) => new Date(b.date) - new Date(a.date));

  const filtered = activeTab === 'overdue'
    ? notifications.filter(n => n.type === 'overdue')
    : notifications;

  return (
    <>
      {isOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}
          onClick={onClose}
        />
      )}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: 360,
          background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 200ms ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>Notifications</div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {['all', 'overdue'].map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px',
                fontSize: 13,
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === tab ? 'white' : 'var(--text-muted)',
                fontWeight: activeTab === tab ? 600 : 400,
                transition: 'all 150ms',
              }}
            >
              {tab === 'all' ? 'All' : 'Overdue'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Bell size={32} color="var(--text-muted)" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 13, color: 'white', marginBottom: 4 }}>All caught up</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No new notifications</div>
            </div>
          ) : (
            filtered.map(item => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background 150ms',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: `${item.color}1A`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={16} color={item.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.main}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {item.sub}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {item.date ? new Date(item.date).toLocaleDateString() : ''}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <button type="button" style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, cursor: 'pointer' }}>
            Mark all as read
          </button>
        </div>
      </div>
    </>
  );
}
