import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Users, ArrowUpRight, AlertCircle, Eye, Edit2, Trash2, Calendar } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import useDB from '../hooks/useDB';
import { useToast } from '../components/UI/Toast';

const genreColors = {
  Fiction: '#3B82F6',
  'Non-Fiction': '#8B5CF6',
  Science: '#22C55E',
  History: '#F59E0B',
  default: '#6B7280',
};

export default function Dashboard({ onNavigate }) {
  const { t } = useTranslation();
  const db = useDB();
  const { success, error } = useToast();
  const [stats, setStats] = useState({ totalBooks: 0, issuedBooks: 0, totalMembers: 0, overdueCount: 0 });
  const [recentBooks, setRecentBooks] = useState([]);
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const [statsData, booksData, issuedData, overdueData] = await Promise.all([
        db.Dashboard.getStats(),
        db.Books.getBooks(''),
        db.Issues.getCurrentlyIssued(),
        db.Issues.getOverdueIssues(),
      ]);
      setStats(statsData);
      setRecentBooks(booksData.slice(0, 8));
      setIssuedBooks(issuedData);
      setOverdue(overdueData);
    } catch (err) {
      console.error('Dashboard error:', err);
      error(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const statCards = [
    { label: t('dashboard.totalBooks'), value: stats.totalBooks, icon: BookOpen, color: 'var(--card-books)', border: '#3B82F6' },
    { label: t('dashboard.totalMembers'), value: stats.totalMembers, icon: Users, color: '#22C55E', border: '#22C55E' },
    { label: t('dashboard.issuedBooks'), value: stats.issuedBooks, icon: ArrowUpRight, color: '#F59E0B', border: '#F59E0B' },
    { label: t('dashboard.overdueBooks'), value: stats.overdueCount, icon: AlertCircle, color: '#EF4444', border: '#EF4444' },
  ];

  const pillStyle = (color) => ({
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: 12,
    background: `${color}26`,
    color,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: 16 }}>
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              flex: 1,
              background: 'var(--bg-card)',
              borderRadius: 10,
              padding: '18px 20px',
              borderTop: `3px solid ${card.border}`,
              position: 'relative',
            }}
          >
            <div style={{ position: 'absolute', top: 18, right: 20 }}>
              <card.icon size={20} color={card.color} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'white' }}>
              {loading ? '-' : card.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              +3 this week
            </div>
          </div>
        ))}
      </div>

      {/* Recent Books Table */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{t('dashboard.recentBooks')}</div>
          <button
            type="button"
            onClick={() => onNavigate('#/books')}
            style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {t('dashboard.viewAll')}
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {[t('books.accession'), t('books.bookTitle'), t('books.author'), t('books.category'), t('status'), t('books.actions')].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 16px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    textAlign: 'left',
                    letterSpacing: '0.05em',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentBooks.map((book, i) => {
              const gColor = genreColors[book.genre] || genreColors.default;
              const statusColor = book.status === 'available' ? '#22C55E' : book.status === 'issued' ? '#F59E0B' : '#EF4444';
              return (
                <tr
                  key={book.id || i}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background 150ms',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ padding: '10px 16px', fontFamily: "'Courier New', monospace", color: 'var(--accent)', fontSize: 13 }}>
                    {book.accession_id}
                  </td>
                  <td style={{ padding: '10px 16px', color: 'white', fontSize: 13 }}>
                    {book.title_kn || book.title}
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontSize: 13 }}>
                    {book.author_kn || book.author}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={pillStyle(gColor)}>{book.genre || '-'}</span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={pillStyle(statusColor)}>
                      {book.status === 'available' ? t('books.available') : book.status === 'issued' ? t('issued') : book.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[Eye, Edit2, Trash2].map((Icon, idx) => (
                        <button
                          key={idx}
                          type="button"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 4,
                            color: 'var(--text-secondary)',
                            transition: 'color 150ms',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                        >
                          <Icon size={15} />
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Activity + Overdue Panels */}
      <div style={{ display: 'flex', gap: 16 }}>
        {/* Issued Books */}
        <div style={{ flex: 1.4, background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600, color: 'white', borderBottom: '1px solid var(--border-subtle)' }}>
            {t('dashboard.issuedBooks')} ({issuedBooks.length})
          </div>
          {issuedBooks.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              No books currently issued
            </div>
          ) : (
            issuedBooks.slice(0, 8).map((item, i) => {
              const daysUntilDue = Math.ceil((new Date(item.due_date) - new Date()) / (1000 * 60 * 60 * 24));
              const isOverdue = daysUntilDue < 0;
              return (
                <div
                  key={item.id || i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 20px',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: isOverdue ? 'rgba(239,68,68,0.1)' : 'rgba(245,166,35,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <BookOpen size={15} color={isOverdue ? '#EF4444' : 'var(--accent)'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.book_title_kn || item.book_title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.member_name_kn || item.member_name} · {item.member_id}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: isOverdue ? '#EF4444' : daysUntilDue <= 2 ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }}>
                    {isOverdue ? `${Math.abs(daysUntilDue)}d overdue` : `${daysUntilDue}d`}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Overdue Returns */}
        <div style={{ flex: 1, background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{t('dashboard.overdueReturns')}</span>
            {overdue.length > 0 && (
              <span
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  color: '#EF4444',
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 10,
                }}
              >
                {overdue.length}
              </span>
            )}
          </div>
          {overdue.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              {t('overduePanel.noOverdue')}
            </div>
          ) : (
            overdue.slice(0, 5).map((item, i) => {
              const daysOverdue = Math.ceil(Math.abs(new Date() - new Date(item.due_date)) / (1000 * 60 * 60 * 24));
              return (
                <div
                  key={item.id || i}
                  style={{
                    padding: '10px 20px',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, color: 'white' }}>{item.book_title_kn || item.book_title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.member_name_kn || item.member_name}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#EF4444' }}>
                    {daysOverdue} {t('overduePanel.days')}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
