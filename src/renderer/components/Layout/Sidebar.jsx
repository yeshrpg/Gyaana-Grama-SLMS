import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  BarChart2,
  Settings,
  Scan,
} from 'lucide-react';

const sections = [
  {
    label: 'MAIN',
    items: [
      { icon: LayoutDashboard, label: 'nav.dashboard', path: '#/dashboard' },
      { icon: BookOpen, label: 'nav.books', path: '#/books' },
      { icon: Users, label: 'nav.members', path: '#/members' },
    ],
  },
  {
    label: 'CIRCULATION',
    items: [
      { icon: ArrowUpRight, label: 'nav.issue', path: '#/issue' },
      { icon: ArrowDownLeft, label: 'nav.return', path: '#/return' },
      { icon: Scan, label: 'nav.barcode', path: '#/barcode' },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { icon: BarChart2, label: 'nav.reports', path: '#/reports' },
      { icon: Settings, label: 'nav.settings', path: '#/settings' },
    ],
  },
];

export default function Sidebar({ currentPath, onNavigate }) {
  const { t } = useTranslation();

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        background: 'var(--bg-sidebar)',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border)',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Brand */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 14,
              height: 14,
              background: 'var(--accent)',
              borderRadius: 4,
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>Gyaana Grama</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Library</div>
          </div>
        </div>
      </div>

      {/* Nav sections */}
      <nav style={{ flex: 1, overflowY: 'auto', paddingTop: 4 }}>
        {sections.map((section) => (
          <div key={section.label}>
            <div
              style={{
                padding: '16px 16px 6px',
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {section.label}
            </div>
            {section.items.map(({ icon: Icon, label, path }) => {
              const isActive = currentPath === path;
              return (
                <button
                  key={path}
                  type="button"
                  onClick={() => onNavigate(path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    padding: '8px 12px',
                    margin: '1px 0',
                    borderRadius: 6,
                    cursor: 'pointer',
                    border: 'none',
                    borderLeft: isActive ? '2px solid var(--sidebar-active-border)' : '2px solid transparent',
                    background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    fontSize: 13,
                    transition: 'all 150ms',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Icon size={16} color={isActive ? 'var(--accent)' : 'var(--text-muted)'} />
                  <span>{t(label)}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          fontSize: 11,
          color: 'var(--text-muted)',
        }}
      >
        v1.0.0
      </div>
    </aside>
  );
}
