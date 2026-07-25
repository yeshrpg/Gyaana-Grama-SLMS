import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import useDB from '../../hooks/useDB';
import { useToast } from '../../components/UI/Toast';
import KannadaKeyboard from '../../components/UI/VirtualKeyboard';

export default function MemberForm({ initialData, onSubmit, onCancel }) {
  const { t } = useTranslation();
  const db = useDB();
  const { success, error } = useToast();
  const isEdit = !!initialData;
  const [keyboardTarget, setKeyboardTarget] = useState(null);
  const [showKeyboard, setShowKeyboard] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    name_kn: '',
    phone: '',
    email: '',
    member_id: '',
    address: '',
    address_kn: '',
    join_date: new Date().toISOString().split('T')[0],
    membership_type: 'regular',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        name_kn: initialData.name_kn || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        member_id: initialData.member_id || '',
        address: initialData.address || '',
        address_kn: initialData.address_kn || '',
        join_date: initialData.join_date || new Date().toISOString().split('T')[0],
        membership_type: initialData.membership_type || 'regular',
        notes: initialData.notes || '',
      });
    }
  }, [initialData]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('validation.required');
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.invalidEmail');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      error(err.message || t('memberForm.toast.saveError'));
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
        <h3 className="text-gray-300 font-semibold text-sm mb-3 border-b border-gray-700 pb-1">{t('memberForm.personalInfo')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('memberForm.nameEn')}
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
          />
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <label className="block text-gray-300 text-sm mb-1">{t('memberForm.nameKn')}</label>
              <button type="button" onClick={() => { setKeyboardTarget('name_kn'); setShowKeyboard(true); }}
                className="px-1.5 py-0.5 text-xs rounded bg-hover border border-border text-accent hover:bg-accent hover:text-app-bg transition-colors"
              >ಕ</button>
            </div>
            <Input
              name="name_kn"
              value={formData.name_kn}
              onChange={handleChange}
              className="font-kannada"
              style={{ fontFamily: "'Noto Sans Kannada', sans-serif" }}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-gray-300 font-semibold text-sm mb-3 border-b border-gray-700 pb-1">{t('memberForm.contactDetails')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('memberForm.phone')}
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder={t('memberForm.phonePlaceholder')}
          />
          <Input
            label={t('memberForm.email')}
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            type="email"
            placeholder={t('memberForm.emailPlaceholder')}
          />
        </div>
      </div>

      <div>
        <h3 className="text-gray-300 font-semibold text-sm mb-3 border-b border-gray-700 pb-1">{t('memberForm.addressSection')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('memberForm.addressEn')}
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <label className="block text-gray-300 text-sm mb-1">{t('memberForm.addressKn')}</label>
              <button type="button" onClick={() => { setKeyboardTarget('address_kn'); setShowKeyboard(true); }}
                className="px-1.5 py-0.5 text-xs rounded bg-hover border border-border text-accent hover:bg-accent hover:text-app-bg transition-colors"
              >ಕ</button>
            </div>
            <Input
              name="address_kn"
              value={formData.address_kn}
              onChange={handleChange}
              className="font-kannada"
              style={{ fontFamily: "'Noto Sans Kannada', sans-serif" }}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-gray-300 font-semibold text-sm mb-3 border-b border-gray-700 pb-1">{t('memberForm.membershipDetails')}</h3>
        <div className="grid grid-cols-3 gap-4">
          <Input
            label={t('memberForm.memberId')}
            name="member_id"
            value={formData.member_id}
            onChange={handleChange}
            placeholder={t('memberForm.memberCodePlaceholder')}
          />
          <Input
            label={t('memberForm.membershipType')}
            name="membership_type"
            value={formData.membership_type}
            onChange={handleChange}
            placeholder={t('memberForm.membershipTypePlaceholder')}
          />
          <Input
            label={t('memberForm.joinDate')}
            name="join_date"
            value={formData.join_date}
            onChange={handleChange}
            type="date"
          />
        </div>
      </div>

      <Input
        label={t('memberForm.notes')}
        name="notes"
        value={formData.notes}
        onChange={handleChange}
        placeholder={t('memberForm.notesPlaceholder')}
      />

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {isEdit ? t('memberForm.update') : t('memberForm.add')}
        </Button>
      </div>

      {showKeyboard && keyboardTarget && (
        <KannadaKeyboard onInsert={handleKbInsert} onBackspace={handleKbBackspace} onClear={handleKbClear} onClose={() => { setShowKeyboard(false); setKeyboardTarget(null); }} />
      )}
    </form>
  );
}
