import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useDB from '../hooks/useDB';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import { ChevronRight, Info, BookOpen, Database } from 'lucide-react';
import { useToast } from '../components/UI/Toast';
import KannadaKeyboard from '../components/UI/VirtualKeyboard';

const CatalogueMode = () => {
  const { t } = useTranslation();
  const db = useDB();
  const { success, error } = useToast();

  const [bookCount, setBookCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    title_kn: '',
    author: '',
    author_kn: '',
    genre: 'Fiction',
    language: 'Kannada',
    publisher: '',
    year: '',
    total_copies: 1,
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const titleEnRef = useRef(null);
  const [keyboardTarget, setKeyboardTarget] = useState(null);
  const [showKeyboard, setShowKeyboard] = useState(false);

  const genres = ['Fiction', 'Non-Fiction', 'Poetry', 'History', 'Science', 'Religion', 'Children', 'Reference', 'Other'];
  const languages = ['Kannada', 'English', 'Hindi', 'Other'];

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseInt(value, 10)) : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = t('memberForm.validation.nameRequired');
    }
    if (formData.year && (!/^\d{4}$/.test(formData.year) || parseInt(formData.year, 10) > new Date().getFullYear())) {
      newErrors.year = t('validation.invalidYear');
    }
    if (formData.total_copies < 1) {
      newErrors.total_copies = t('validation.minOneCopy');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (!validate()) {
      error(t('common.validationError'));
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        title: formData.title,
        author: formData.author,
        publisher: formData.publisher,
        year: formData.year,
        category: formData.genre,
        total_copies: formData.total_copies,
      };
      await db.Books.addBook(data);
      setBookCount((prev) => prev + 1);
      success(t('bookAdded'));
      setFormData({
        title: '',
        title_kn: '',
        author: '',
        author_kn: '',
        genre: 'Fiction',
        language: 'Kannada',
        publisher: '',
        year: '',
        total_copies: 1,
        notes: '',
      });
      titleEnRef.current?.focus();
      setErrors({});
    } catch (err) {
      console.error('Failed to add book in catalogue mode:', err);
      error(err.message || t('books.toast.addError'));
    } finally {
      setIsSaving(false);
    }
  }, [formData, db, success, error, t]);

  const handleImportAndroid = async () => {
    setImporting(true);
    setImportMsg(null);
    try {
      const result = await window.api.importAndroidDb();
      if (result.cancelled) return;
      if (result.error) {
        setImportMsg({ type: 'error', text: result.error });
        return;
      }
      setImportMsg({ type: 'success', text: `Import complete: ${result.added} books added, ${result.merged} duplicates merged` });
    } catch (err) {
      setImportMsg({ type: 'error', text: err.message || 'Import failed' });
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    if (!importMsg) return;
    const timer = setTimeout(() => setImportMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [importMsg]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
    }, [handleSubmit]);

  useEffect(() => {
    titleEnRef.current?.focus();
  }, []);

  const handleKbInsert = (char) => {
    if (!keyboardTarget) return;
    setFormData(prev => ({
      ...prev,
      [keyboardTarget]: (prev[keyboardTarget] || '') + char,
    }));
  };

  const handleKbBackspace = () => {
    if (!keyboardTarget) return;
    setFormData(prev => ({
      ...prev,
      [keyboardTarget]: (prev[keyboardTarget] || '').slice(0, -1),
    }));
  };

  const handleKbClear = () => {
    if (!keyboardTarget) return;
    setFormData(prev => ({ ...prev, [keyboardTarget]: '' }));
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">{t('catalogueMode')}</h1>
        <div className="flex items-center space-x-2">
          {importMsg && (
            <div style={{
              fontSize: 13, padding: '6px 12px', borderRadius: 6,
              color: importMsg.type === 'success' ? '#22C55E' : '#EF4444',
              background: importMsg.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${importMsg.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}>{importMsg.text}</div>
          )}
          <button type="button" onClick={handleImportAndroid} disabled={importing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: '1px solid rgba(245,166,35,0.3)',
              background: 'rgba(245,166,35,0.08)',
              color: importing ? 'var(--text-muted)' : 'var(--accent)',
              cursor: importing ? 'default' : 'pointer',
              opacity: importing ? 0.5 : 1,
              transition: 'all 150ms',
            }}
          >
            <Database size={15} />
            {importing ? 'Importing...' : 'Import from Android'}
          </button>
          <span className="text-gray-400 text-lg">{t('thisSession')}:</span>
          <span className="text-accent text-4xl font-extrabold">{bookCount}</span>
          <span className="text-gray-400 text-lg">{t('booksAdded')}</span>
        </div>
      </div>

      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          ref={titleEnRef}
          label={t('title_en')}
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          error={errors.title}
        />
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <label className="block text-gray-300 text-sm mb-1">{t('title_kn')}</label>
            <button type="button" onClick={() => { setKeyboardTarget('title_kn'); setShowKeyboard(true); }}
              className="px-1.5 py-0.5 text-xs rounded bg-hover border border-border text-accent hover:bg-accent hover:text-app-bg transition-colors"
            >ಕ</button>
          </div>
          <Input
            name="title_kn"
            value={formData.title_kn}
            onChange={handleChange}
            className="font-kannada"
            style={{ fontFamily: "'Noto Sans Kannada', sans-serif" }}
          />
        </div>

        <Input
          label={t('author_en')}
          name="author"
          value={formData.author}
          onChange={handleChange}
          placeholder="Author (English)"
        />
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <label className="block text-gray-300 text-sm mb-1">{t('author_kn')}</label>
            <button type="button" onClick={() => { setKeyboardTarget('author_kn'); setShowKeyboard(true); }}
              className="px-1.5 py-0.5 text-xs rounded bg-hover border border-border text-accent hover:bg-accent hover:text-app-bg transition-colors"
            >ಕ</button>
          </div>
          <Input
            name="author_kn"
            value={formData.author_kn}
            onChange={handleChange}
            className="font-kannada"
            style={{ fontFamily: "'Noto Sans Kannada', sans-serif" }}
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="genre" className="block text-gray-400 text-sm mb-1">
            {t('genre')}
          </label>
          <select
            id="genre"
            name="genre"
            value={formData.genre}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-card-bg border border-gray-700 rounded-lg text-white outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
          >
            {genres.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label htmlFor="language" className="block text-gray-400 text-sm mb-1">
            {t('language')}
          </label>
          <select
            id="language"
            name="language"
            value={formData.language}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-card-bg border border-gray-700 rounded-lg text-white outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        <Input
          label={t('publisher')}
          name="publisher"
          value={formData.publisher}
          onChange={handleChange}
        />
        <Input
          label={t('year')}
          name="year"
          type="number"
          value={formData.year}
          onChange={handleChange}
          error={errors.year}
          placeholder="2024"
        />

        <Input
          label={t('totalCopies')}
          name="total_copies"
          type="number"
          value={formData.total_copies}
          onChange={handleChange}
          min="1"
          required
          error={errors.total_copies}
        />

        <Input
          label={t('notes')}
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Notes..."
        />
      </div>

      <div className="flex items-center justify-between mt-8 p-4 bg-card-bg rounded-xl border border-gray-800">
        <div className="flex items-center text-gray-400 text-sm">
          <Info className="w-4 h-4 mr-2 text-accent" />
          {t('catalogueTip')}
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => { window.location.hash = '#/books'; }} variant="ghost">
            {t('doneCataloguing')}
            <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
          <Button onClick={handleSubmit} loading={isSaving}>
            {t('saveAndNext')}
          </Button>
        </div>
      </div>

      {showKeyboard && keyboardTarget && (
        <KannadaKeyboard onInsert={handleKbInsert} onBackspace={handleKbBackspace} onClear={handleKbClear} onClose={() => { setShowKeyboard(false); setKeyboardTarget(null); }} />
      )}
    </div>
  );
};

export default CatalogueMode;