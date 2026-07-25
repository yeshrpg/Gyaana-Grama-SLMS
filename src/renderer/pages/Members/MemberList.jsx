import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import useDB from '../../hooks/useDB';
import useDebounce from '../../hooks/useDebounce';
import Table from '../../components/UI/Table';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Badge from '../../components/UI/Badge';
import Modal from '../../components/UI/Modal';
import MemberForm from './MemberForm';
import { useToast } from '../../components/UI/Toast';
import KannadaKeyboard from '../../components/UI/VirtualKeyboard';

export default function MemberList({ onNavigate }) {
  const { t } = useTranslation();
  const db = useDB();
  const { success, error } = useToast();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const PAGE_SIZE = 20;
  const [showKeyboard, setShowKeyboard] = useState(false);

  // Client-side filter
  const filteredMembers = useMemo(() => {
    if (!debouncedSearch) return members;
    const lower = debouncedSearch.toLowerCase();
    return members.filter(m =>
      (m.name || '').toLowerCase().includes(lower) ||
      (m.name_kn || '').toLowerCase().includes(lower) ||
      (m.phone || '').toLowerCase().includes(lower) ||
      (m.member_id || '').toLowerCase().includes(lower) ||
      (m.email || '').toLowerCase().includes(lower) ||
      (m.address || '').toLowerCase().includes(lower) ||
      (m.address_kn || '').toLowerCase().includes(lower) ||
      (m.membership_type || '').toLowerCase().includes(lower) ||
      (m.notes || '').toLowerCase().includes(lower)
    );
  }, [members, debouncedSearch]);

  const displayTotalPages = Math.ceil(filteredMembers.length / PAGE_SIZE);

  const handleKbInsert = (char) => setSearch(prev => prev + char);
  const handleKbBackspace = () => setSearch(prev => prev.slice(0, -1));
  const handleKbClear = () => setSearch('');

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await db.Members.getMembers(debouncedSearch);
      setMembers(data);
      setTotalPages(Math.ceil(data.length / PAGE_SIZE));
    } catch (err) {
      console.error('MemberList: fetch error:', err);
      error(err.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleFormSubmit = async (formData) => {
    try {
      if (editingMember) {
        await db.Members.updateMember(editingMember.id, formData);
        success(t('members.toast.updateSuccess'));
      } else {
        await db.Members.addMember(formData);
        success(t('members.toast.addSuccess'));
      }
      setShowForm(false);
      setEditingMember(null);
      fetchMembers();
    } catch (err) {
      error(err.message || 'Failed to save member');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingMember(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('members.deleteConfirm'))) return;
    try {
      await db.Members.deleteMember(id);
      success(t('members.deleteSuccess'));
      fetchMembers();
    } catch (err) {
      if (err.message?.includes('active issues') || err.message?.includes('FOREIGN KEY')) {
        error(t('members.cannotDeleteWithIssues'));
      } else {
        error(err.message || 'Failed to delete member');
      }
    }
  };

  const paginatedMembers = filteredMembers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const columns = [
    { key: 'member_id', label: t('members.memberId'), width: '120px' },
    { key: 'name', label: t('members.name'), render: (_, row) => (
      <span className="font-kannada">{row.name_kn || row.name}</span>
    )},
    { key: 'phone', label: t('members.phone'), width: '140px' },
    {
      key: 'membership_type',
      label: t('members.type'),
      width: '120px',
      render: (value) => {
        const variant = value === 'student' ? 'warning' : value === 'staff' ? 'info' : 'default';
        return <Badge variant={variant}>{value?.charAt(0).toUpperCase() + value?.slice(1)}</Badge>;
      },
    },
    {
      key: 'active_issues',
      label: t('members.activeLoans'),
      width: '120px',
      render: (value) => (
        <span className="text-gray-300 hover:text-accent cursor-pointer underline decoration-dotted">
          {value || 0}
        </span>
      ),
    },
    {
      key: 'actions',
      label: t('members.actions'),
      width: '100px',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEditingMember(row); setShowForm(true); }}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-hover rounded-lg transition-colors duration-150"
            title={t('common.edit')}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
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
        <h1 className="text-white text-xl font-bold">{t('members.title')}</h1>
        <Button onClick={() => { setEditingMember(null); setShowForm(true); }} icon={<Plus className="h-4 w-4" />}>
          {t('members.add')}
        </Button>
      </div>

      <div className="max-w-md" style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <Input
            placeholder={t('members.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <button type="button" onClick={() => setShowKeyboard(v => !v)}
          style={{ padding: '8px 10px', fontSize: 12, background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--accent)', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >ಕ</button>
      </div>

      <Table
        columns={columns}
        data={paginatedMembers}
        loading={loading}
        emptyMessage={
          <div className="flex flex-col items-center py-8">
            <Users className="h-12 w-12 text-gray-600 mb-3" />
            <p className="text-gray-500">{debouncedSearch ? `No members found for '${debouncedSearch}'` : t('members.noMembers')}</p>
            {debouncedSearch && (
              <button type="button" onClick={() => setSearch('')} className="text-accent text-sm mt-2 bg-transparent border-none cursor-pointer">
                Clear search
              </button>
            )}
          </div>
        }
      />

      <Modal
        open={showForm}
        onClose={handleFormCancel}
        title={editingMember ? t('members.edit') : t('members.add')}
        size="lg"
      >
        <MemberForm
          initialData={editingMember}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      </Modal>

      {displayTotalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {t('common.pageInfo', { page, totalPages: displayTotalPages, count: filteredMembers.length })}
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
