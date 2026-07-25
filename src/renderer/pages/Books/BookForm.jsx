import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import useDB from '../../hooks/useDB';
import { useToast } from '../../components/UI/Toast';
import KannadaKeyboard from '../../components/UI/VirtualKeyboard';

export default function BookForm({ initialData, onSubmit, onCancel }) {
  const { t } = useTranslation();
  const db = useDB();
  const { success, error } = useToast();
  const isEdit = !!initialData;
  const [keyboardTarget, setKeyboardTarget] = useState(null);
  const [showKeyboard, setShowKeyboard] = useState(false);

  const [formData, setFormData] = useState({
    accession_id: '',
    title: '',
    title_kn: '',
    author: '',
    author_kn: '',
    publisher: '',
    year: '',
    genre: '',
    language: 'Kannada',
    total_copies: 1,
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        accession_id: initialData.accession_id || '',
        title: initialData.title || '',
        title_kn: initialData.title_kn || '',
        author: initialData.author || '',
        author_kn: initialData.author_kn || '',
        publisher: initialData.publisher || '',
        year: initialData.year || '',
        genre: initialData.genre || '',
        language: initialData.language || 'Kannada',
        total_copies: initialData.total_copies || 1,
        notes: initialData.notes || '',
      });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors = {};
    if (formData.year && !/^\d{4}$/.test(formData.year)) newErrors.year = t('validation.invalidYear');
    if (formData.total_copies < 1) newErrors.total_copies = t('validation.minOneCopy');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    // Keep year and other text-like number fields as strings while typing.
    // total_copies is the only field that must stay a true integer immediately.
    const coerced =
      name === 'total_copies'
        ? value === '' ? 1 : parseInt(value, 10) || 1
        : value;
    setFormData((prev) => ({ ...prev, [name]: coerced }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      error(err.message || t('bookForm.toast.saveError'));
    } finally {
      setSubmitting(false);
    }
  };

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-gray-300 font-semibold text-sm mb-3 border-b border-gray-700 pb-1">{t('bookForm.basicInfo')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('bookForm.titleEn')}
            name="title"
            value={formData.title}
            onChange={handleChange}
            error={errors.title}
          />
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <label className="block text-gray-300 text-sm mb-1">{t('bookForm.titleKn')}</label>
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
        </div>
      </div>

      <div>
        <h3 className="text-gray-300 font-semibold text-sm mb-3 border-b border-gray-700 pb-1">{t('bookForm.authorSection')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('bookForm.authorEn')}
            name="author"
            value={formData.author}
            onChange={handleChange}
          />
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <label className="block text-gray-300 text-sm mb-1">{t('bookForm.authorKn')}</label>
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
        </div>
      </div>

      <div>
        <h3 className="text-gray-300 font-semibold text-sm mb-3 border-b border-gray-700 pb-1">{t('bookForm.publicationDetails')}</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <label className="block text-gray-300 text-sm mb-1">{t('bookForm.publisher')}</label>
              <button type="button" onClick={() => { setKeyboardTarget('publisher'); setShowKeyboard(true); }}
                className="px-1.5 py-0.5 text-xs rounded bg-hover border border-border text-accent hover:bg-accent hover:text-app-bg transition-colors"
              >ಕ</button>
            </div>
            <Input
              name="publisher"
              value={formData.publisher}
              onChange={handleChange}
            />
          </div>
          <Input
            label={t('bookForm.year')}
            name="year"
            value={formData.year}
            onChange={handleChange}
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="2024"
            error={errors.year}
          />
          <Input
            label={t('bookForm.language')}
            name="language"
            value={formData.language}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <h3 className="text-gray-300 font-semibold text-sm mb-3 border-b border-gray-700 pb-1">{t('bookForm.classification')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <label className="block text-gray-300 text-sm mb-1">{t('bookForm.genre')}</label>
              <button type="button" onClick={() => { setKeyboardTarget('genre'); setShowKeyboard(true); }}
                className="px-1.5 py-0.5 text-xs rounded bg-hover border border-border text-accent hover:bg-accent hover:text-app-bg transition-colors"
              >ಕ</button>
            </div>
            <Input
              name="genre"
              value={formData.genre}
              onChange={handleChange}
            />
          </div>
          <Input
            label={t('bookForm.totalCopies')}
            name="total_copies"
            value={formData.total_copies}
            onChange={handleChange}
            type="number"
            min="1"
            error={errors.total_copies}
          />
        </div>
      </div>

      <Input
        label={t('bookForm.accessionId')}
        name="accession_id"
        value={formData.accession_id}
        onChange={handleChange}
      />

      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <label className="block text-gray-300 text-sm mb-1">{t('bookForm.notes')}</label>
          <button type="button" onClick={() => { setKeyboardTarget('notes'); setShowKeyboard(true); }}
            className="px-1.5 py-0.5 text-xs rounded bg-hover border border-border text-accent hover:bg-accent hover:text-app-bg transition-colors"
          >ಕ</button>
        </div>
        <Input
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder={t('bookForm.notesPlaceholder')}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {isEdit ? t('bookForm.update') : t('bookForm.add')}
        </Button>
      </div>

      {showKeyboard && keyboardTarget && (
        <KannadaKeyboard onInsert={handleKbInsert} onBackspace={handleKbBackspace} onClear={handleKbClear} onClose={() => { setShowKeyboard(false); setKeyboardTarget(null); }} />
      )}
    </form>
  );
}
