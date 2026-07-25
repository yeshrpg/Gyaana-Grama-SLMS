import React, { useState, useEffect } from 'react';
import { ToastProvider } from './components/UI/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const BookList = React.lazy(() => import('./pages/Books/BookList'));
const MemberList = React.lazy(() => import('./pages/Members/MemberList'));
const IssueBook = React.lazy(() => import('./pages/IssueReturn/IssueBook'));
const ReturnBook = React.lazy(() => import('./pages/IssueReturn/ReturnBook'));
const CatalogueMode = React.lazy(() => import('./pages/CatalogueMode'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Barcode = React.lazy(() => import('./pages/Barcode'));
const PINScreen = React.lazy(() => import('./pages/PINScreen'));

const pageMap = {
  '#/dashboard': { title: 'Dashboard', component: Dashboard },
  '#/books': { title: 'Books', component: BookList },
  '#/members': { title: 'Members', component: MemberList },
  '#/issue': { title: 'Issue Book', component: IssueBook },
  '#/return': { title: 'Return Book', component: ReturnBook },
  '#/catalogue': { title: 'Catalogue Mode', component: CatalogueMode },
  '#/barcode': { title: 'Barcode Scanner', component: Barcode },
  '#/reports': { title: 'Reports', component: Reports },
  '#/settings': { title: 'Settings', component: Settings },
};

const fallback = (
  <div className="text-gray-400 p-8 text-center">Loading...</div>
);

export default function App() {
  const [locked, setLocked] = useState(true);
  const [currentPath, setCurrentPath] = useState('#/dashboard');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash && pageMap[hash]) {
        setCurrentPath(hash);
      } else if (!hash || hash === '#') {
        window.location.hash = '#/dashboard';
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (path) => {
    window.location.hash = path;
  };

  const route = pageMap[currentPath] || pageMap['#/dashboard'];
  const PageComponent = route.component;

  return (
    <ToastProvider>
      <React.Suspense fallback={fallback}>
        {locked ? (
          <PINScreen onUnlock={() => setLocked(false)} />
        ) : (
            <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
              <Sidebar currentPath={currentPath} onNavigate={handleNavigate} />
              <div className="flex flex-col flex-1" style={{ marginLeft: 'var(--sidebar-width)' }}>
                <TopBar
                  title={route.title}
                  onLockScreen={() => setLocked(true)}
                  onNavigate={handleNavigate}
                  onAddBook={() => handleNavigate('#/books')}
                />
                <main className="flex-1 overflow-y-auto p-6">
                <React.Suspense fallback={fallback}>
                  <ErrorBoundary>
                    <PageComponent onNavigate={handleNavigate} />
                  </ErrorBoundary>
                </React.Suspense>
              </main>
            </div>
          </div>
        )}
      </React.Suspense>
    </ToastProvider>
  );
}