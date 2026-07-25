import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart2, BookOpen, Users, TrendingUp, Calendar, Download } from 'lucide-react';

const genreColors = {
  Fiction: '#3B82F6',
  'Non-Fiction': '#8B5CF6',
  Science: '#22C55E',
  History: '#F59E0B',
  default: '#6B7280',
};

const pillStyle = (color) => ({
  fontSize: 10,
  padding: '2px 8px',
  borderRadius: 12,
  background: `${color}26`,
  color,
});

export default function Reports() {
  const { t } = useTranslation();
  const api = window.api;
  const [stats, setStats] = useState({ totalBooks: 0, totalMembers: 0, monthlyIssues: 0, overdueCount: 0 });
  const [genreData, setGenreData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsResult, genreResult, txResult] = await Promise.all([
        api.stats.getDashboard(),
        api.reports.getGenreBreakdown(),
        api.reports.getTransactionLog(50),
      ]);

      if (statsResult?.success) {
        setStats({
          totalBooks: statsResult.data.totalBooks || 0,
          totalMembers: statsResult.data.totalMembers || 0,
          monthlyIssues: statsResult.data.issuedToday || 0,
          overdueCount: statsResult.data.overdueCount || 0,
        });
      }

      if (genreResult?.success) setGenreData(genreResult.data || []);
      if (txResult?.success) setTransactions(txResult.data || []);
    } catch (err) {
      console.error('Reports: fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const totalGenreCount = genreData.reduce((sum, g) => sum + g.count, 0);

  const exportCSV = () => {
    const header = 'Date,Book,Member,Action,Due Date\n';
    const rows = transactions.map(t =>
      `"${t.issue_date || ''}","${t.book_title || ''}","${t.member_name || ''}","${t.status === 'returned' ? 'Returned' : 'Issued'}","${t.due_date || ''}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `library_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statCards = [
    { label: t('dashboard.totalBooks'), value: stats.totalBooks, icon: BookOpen, border: '#3B82F6' },
    { label: t('dashboard.totalMembers'), value: stats.totalMembers, icon: Users, border: '#22C55E' },
    { label: t('dashboard.issuedBooks'), value: stats.monthlyIssues, icon: TrendingUp, border: '#F59E0B' },
    { label: t('dashboard.overdueBooks'), value: stats.overdueCount, icon: BarChart2, border: '#EF4444' },
  ];

  return (
    <div style={{ background: 'var(--bg-primary)', padding: 24, minHeight: '100%' }}>
      {/* Stat row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              flex: 1,
              background: 'var(--bg-card)',
              borderRadius: 8,
              padding: '14px 18px',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'white' }}>
              {loading ? '-' : card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Genre breakdown */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600, color: 'white' }}>
          Books by Genre
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Genre', 'Count', '% of Total', 'Bar'].map(h => (
                <th key={h} style={{ padding: '10px 20px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'left', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {genreData.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No books found</td></tr>
            ) : genreData.map((row, i) => {
              const gColor = genreColors[row.genre] || genreColors.default;
              const pct = totalGenreCount > 0 ? ((row.count / totalGenreCount) * 100).toFixed(1) : 0;
              return (
                <tr key={row.genre || i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 20px' }}>
                    <span style={pillStyle(gColor)}>{row.genre || 'Unknown'}</span>
                  </td>
                  <td style={{ padding: '10px 20px', color: 'white', fontSize: 13 }}>{row.count}</td>
                  <td style={{ padding: '10px 20px', color: 'var(--text-secondary)', fontSize: 13 }}>{pct}%</td>
                  <td style={{ padding: '10px 20px' }}>
                    <div style={{ background: 'var(--border)', borderRadius: 3, height: 6, width: '100%', maxWidth: 200 }}>
                      <div style={{ background: gColor, borderRadius: 3, height: 6, width: `${pct}%`, transition: 'width 300ms' }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Transaction log */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden', marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Transaction Log</div>
          <button
            type="button"
            onClick={exportCSV}
            style={{ border: '1px solid var(--accent)', color: 'var(--accent)', fontSize: 12, padding: '5px 12px', borderRadius: 5, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={12} /> Export CSV
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Date', 'Book', 'Member', 'Action', 'Due Date'].map(h => (
                <th key={h} style={{ padding: '10px 20px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'left', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No transactions recorded yet</td></tr>
            ) : transactions.map((t, i) => {
              const isReturned = t.status === 'returned';
              return (
                <tr key={t.id || i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 20px', color: 'var(--text-secondary)', fontSize: 12 }}>{t.issue_date || '-'}</td>
                  <td style={{ padding: '10px 20px', color: 'white', fontSize: 13 }}>{t.book_title_kn || t.book_title}</td>
                  <td style={{ padding: '10px 20px', color: 'var(--text-secondary)', fontSize: 13 }}>{t.member_name_kn || t.member_name}</td>
                  <td style={{ padding: '10px 20px' }}>
                    <span style={{ ...pillStyle(isReturned ? '#22C55E' : '#F59E0B'), fontSize: 10 }}>
                      {isReturned ? 'Returned' : 'Issued'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 20px', color: 'var(--text-secondary)', fontSize: 12 }}>{t.due_date || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
