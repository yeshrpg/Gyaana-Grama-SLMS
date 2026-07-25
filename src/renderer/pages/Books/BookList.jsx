import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, BookOpen, LayoutList, LayoutGrid, Eye, Edit2 } from 'lucide-react';
import useDB from '../../hooks/useDB';
import useDebounce from '../../hooks/useDebounce';
import Table from '../../components/UI/Table';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Badge from '../../components/UI/Badge';
import Modal from '../../components/UI/Modal';
import BookForm from './BookForm';
import { useToast } from '../../components/UI/Toast';
import KannadaKeyboard from '../../components/UI/VirtualKeyboard';

export default function BookList({ onNavigate }) {
  const { t } = useTranslation();
  const db = useDB();
  const { success, error } = useToast();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState(null);

  const PAGE_SIZE = 20;
  const [viewMode, setViewMode] = useState('table');
  const [showKeyboard, setShowKeyboard] = useState(false);

  // Read ?q= from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash;
    const qIndex = hash.indexOf('?q=');
    if (qIndex !== -1) {
      const q = decodeURIComponent(hash.slice(qIndex + 3));
      if (q) setSearch(q);
    }
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const data = await db.Books.getBooks(debouncedSearch);
      setBooks(data);
      setTotalPages(Math.ceil(data.length / PAGE_SIZE));
    } catch (err) {
      console.error('BookList: fetch error:', err);
      error(err.message || 'Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Client-side filter on top of server results
  const filteredBooks = useMemo(() => {
    if (!debouncedSearch) return books;
    const lower = debouncedSearch.toLowerCase();
    return books.filter(b =>
      (b.title || '').toLowerCase().includes(lower) ||
      (b.title_kn || '').toLowerCase().includes(lower) ||
      (b.author || '').toLowerCase().includes(lower) ||
      (b.author_kn || '').toLowerCase().includes(lower) ||
      (b.accession_id || '').toLowerCase().includes(lower) ||
      (b.publisher || '').toLowerCase().includes(lower) ||
      (b.genre || '').toLowerCase().includes(lower) ||
      (b.language || '').toLowerCase().includes(lower) ||
      (b.isbn || '').toLowerCase().includes(lower) ||
      (b.notes || '').toLowerCase().includes(lower)
    );
  }, [books, debouncedSearch]);

  // Recompute totalPages based on filteredBooks
  const displayTotalPages = Math.ceil(filteredBooks.length / PAGE_SIZE);

  const handleKbInsert = (char) => setSearch(prev => prev + char);
  const handleKbBackspace = () => setSearch(prev => prev.slice(0, -1));
  const handleKbClear = () => setSearch('');

  const handleFormSubmit = async (formData) => {
    try {
      if (editingBook) {
        await db.Books.updateBook(editingBook.id, formData);
        success(t('books.toast.updateSuccess'));
      } else {
        await db.Books.addBook(formData);
        success(t('books.toast.addSuccess'));
      }
      setShowForm(false);
      setEditingBook(null);
      fetchBooks();
    } catch (err) {
      error(err.message || 'Failed to save book');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingBook(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('books.deleteConfirm'))) return;
    try {
      await db.Books.deleteBook(id);
      success(t('books.toast.deleteSuccess'));
      fetchBooks();
    } catch (err) {
      error(err.message || 'Failed to delete book');
    }
  };

  const paginatedBooks = filteredBooks.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const columns = [
    { key: 'accession_id', label: t('books.accession'), width: '120px' },
    { key: 'title', label: t('books.bookTitle'), render: (_, row) => (
      <span className="font-kannada">{row.title_kn || row.title}</span>
    )},
    { key: 'author', label: t('books.author'), render: (_, row) => (
      <span className="font-kannada">{row.author_kn || row.author}</span>
    )},
    { key: 'genre', label: t('books.category') },
    {
      key: 'status',
      label: t('status'),
      width: '110px',
      render: (value) => {
        const variant = value === 'available' ? 'success' : value === 'issued' ? 'warning' : 'danger';
        return <Badge variant={variant}>{value}</Badge>;
      },
    },
    {
      key: 'actions',
      label: t('books.actions'),
      width: '100px',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setEditingBook(row); setShowForm(true); }}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-hover rounded-lg transition-colors duration-150"
            title={t('common.edit')}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
            className="p-1.5 text-gray-400 hover:text-danger hover:bg-red-900/20 rounded-lg transition-colors duration-150"
            title={t('common.delete')}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-xl font-bold">{t('books.title')}</h1>
        <Button onClick={() => { setEditingBook(null); setShowForm(true); }} icon={<Plus className="h-4 w-4" />}>
          {t('books.add')}
        </Button>
      </div>

      <div className="max-w-md" style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <Input
            placeholder={t('books.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <button type="button" onClick={() => setShowKeyboard(v => !v)}
          style={{ padding: '8px 10px', fontSize: 12, background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--accent)', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >ಕ</button>
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 4, marginTop: -12, marginBottom: 4 }}>
        {[
          { mode: 'table', icon: LayoutList },
          { mode: 'grid', icon: LayoutGrid },
        ].map(({ mode, icon: Icon }) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            style={{
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: viewMode === mode ? 'var(--accent)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 150ms',
            }}
          >
            <Icon size={15} color={viewMode === mode ? 'black' : 'var(--text-secondary)'} />
          </button>
        ))}
      </div>

      {viewMode === 'table' ? (
        <>
        <Table
        columns={columns}
        data={paginatedBooks}
        loading={loading}
        emptyMessage={
          <div className="flex flex-col items-center py-8">
            <BookOpen className="h-12 w-12 text-gray-600 mb-3" />
            <p className="text-gray-500">{debouncedSearch ? `No books found for '${debouncedSearch}'` : t('books.noBooks')}</p>
            {debouncedSearch && (
              <button type="button" onClick={() => setSearch('')} className="text-accent text-sm mt-2 bg-transparent border-none cursor-pointer">
                Clear search
              </button>
            )}
          </div>
        }
      />

      {displayTotalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {t('common.pageInfo', { page, totalPages: displayTotalPages, count: filteredBooks.length })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              icon={<ChevronLeft className="h-4 w-4" />}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === displayTotalPages}
              icon={<ChevronRight className="h-4 w-4" />}
            />
          </div>
        </div>
      )}
      </>
      ) : (
        <>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          {paginatedBooks.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
              {debouncedSearch ? `No books found for '${debouncedSearch}'` : t('books.noBooks')}
              {debouncedSearch && (
                <div><button type="button" onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', marginTop: 8, fontSize: 12 }}>Clear search</button></div>
              )}
            </div>
          ) : paginatedBooks.map((book) => {
            const gColor = ({ Fiction: '#3B82F6', 'Non-Fiction': '#8B5CF6', Science: '#22C55E', History: '#F59E0B' })[book.genre] || '#6B7280';
            return (
              <div
                key={book.id}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'border-color 150ms',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(245,166,35,0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                onClick={() => { setEditingBook(book); setShowForm(true); }}
              >
                <div style={{ height: 6, background: gColor }} />
                <div style={{ padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'white', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {book.title_kn || book.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {book.author_kn || book.author}
                  </div>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: 12, color: 'var(--accent)', marginTop: 6 }}>
                    {book.accession_id}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: `${gColor}26`, color: gColor }}>
                    {book.genre || '-'}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}
                      onClick={(e) => { e.stopPropagation(); setEditingBook(book); setShowForm(true); }}>
                      <Eye size={14} />
                    </button>
                    <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}
                      onClick={(e) => { e.stopPropagation(); setEditingBook(book); setShowForm(true); }}>
                      <Edit2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      {displayTotalPages > 1 && (
        <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
          <p className="text-sm text-gray-500">
            {t('common.pageInfo', { page, totalPages: displayTotalPages, count: filteredBooks.length })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              icon={<ChevronLeft className="h-4 w-4" />}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.min(displayTotalPages, p + 1))}
              disabled={page === displayTotalPages}
              icon={<ChevronRight className="h-4 w-4" />}
            />
          </div>
        </div>
      )}
      </>
      )}

      <Modal
        open={showForm}
        onClose={handleFormCancel}
        title={editingBook ? t('books.edit') : t('books.add')}
        size="lg"
      >
        <BookForm
          initialData={editingBook}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      </Modal>

      {showKeyboard && (
        <KannadaKeyboard
          onInsert={handleKbInsert}
          onBackspace={handleKbBackspace}
          onClear={handleKbClear}
          onClose={() => setShowKeyboard(false)}
        />
      )}
    </div>
  );
}
