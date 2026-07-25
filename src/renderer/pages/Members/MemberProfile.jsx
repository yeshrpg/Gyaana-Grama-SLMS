import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/UI/Modal';
import { Button } from '../../components/UI/Button';
import { Table } from '../../components/UI/Table';
import { Badge } from '../../components/UI/Badge';
import { useToast } from '../../components/UI/Toast';
import {
  User, Phone, MapPin, NotebookPen, Calendar, CheckCircle, Clock, BookOpen, DollarSign, ListCollapse
} from 'lucide-react';
import { format } from 'date-fns';

export function MemberProfile({ isOpen, onClose, memberId }) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [memberData, setMemberData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [outstandingFines, setOutstandingFines] = useState(0);

  useEffect(() => {
    const fetchMemberDetails = async () => {
      if (!memberId) {
        setIsLoading(false);
        setMemberData(null);
        setTransactions([]);
        setOutstandingFines(0);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const memberResult = await window.api.members.getById(memberId);
        if (memberResult.success) {
          setMemberData(memberResult.data);
        } else {
          setError(memberResult.error);
          showToast({ message: t('memberProfile.toast.fetchMemberError', { error: memberResult.error }), type: 'error' });
        }

        const transactionsResult = await window.api.transactions.getByMember(memberId, true); // true to include returned
        if (transactionsResult.success) {
          setTransactions(transactionsResult.data);
          // Calculate outstanding fines: sum of fine_amount for transactions where status is 'issued' (meaning not returned)
          // or 'overdue' and fine_paid is false/0.
          // Assuming `transactions.getByMember` returns `fine_paid` and `status` correctly.
          const calculatedFines = transactionsResult.data.reduce((sum, t) => {
            // Only consider if transaction is issued/overdue and fine_paid is not true
            if (t.status !== 'returned' && t.fine_paid === 0 && t.fine_amount > 0) {
              return sum + t.fine_amount;
            }
            return sum;
          }, 0);
          setOutstandingFines(calculatedFines);

        } else {
          showToast({ message: t('memberProfile.toast.fetchTransactionsError', { error: transactionsResult.error }), type: 'error' });
          console.error("Failed to fetch member transactions:", transactionsResult.error);
          setTransactions([]);
          setOutstandingFines(0);
        }

      } catch (err) {
        setError(err.message);
        showToast({ message: t('memberProfile.toast.fetchError', { error: err.message }), type: 'error' });
        console.error("Error fetching member profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchMemberDetails();
    } else {
      // Reset state when modal closes
      setMemberData(null);
      setTransactions([]);
      setIsLoading(true);
      setError(null);
      setOutstandingFines(0);
    }
  }, [isOpen, memberId, t, showToast]);

  if (!isOpen) return null;

  const transactionColumns = [
    { key: 'title', label: t('bookTitle'), render: (_, row) => (
      <div>
        <span className="font-medium text-white font-kannada">{row.title_kn || row.title}</span>
      </div>
    )},
    { key: 'accession_id', label: t('accessionId'), render: (value) => value },
    { key: 'issue_date', label: t('issueDate'), render: (value) => format(new Date(value), 'dd-MMM-yyyy') },
    { key: 'due_date', label: t('dueDate'), render: (value) => format(new Date(value), 'dd-MMM-yyyy') },
    { key: 'status', label: t('status'), render: (_, row) => {
      let badgeVariant = 'default';
      let badgeText = '';
      if (row.return_date) {
        badgeVariant = 'success';
        badgeText = t('returned');
      } else if (new Date(row.due_date) < new Date()) {
        badgeVariant = 'danger';
        badgeText = t('overdue');
      } else {
        badgeVariant = 'warning';
        badgeText = t('issued');
      }
      return <Badge variant={badgeVariant}>{badgeText}</Badge>;
    }},
    { key: 'return_date', label: t('returnDate'), render: (value) => value ? format(new Date(value), 'dd-MMM-yyyy') : t('common.active') },
    { key: 'fine_amount', label: t('fineAmount'), render: (value, row) => {
      if (row.fine_amount > 0) {
        return `₹${row.fine_amount.toFixed(2)} ${row.fine_paid ? t('common.paid') : t('common.pending')}`;
      }
      return t('noFine');
    }},
  ];

  return (
    <Modal open={isOpen} onClose={onClose} title={t('memberProfile.title')}>
      {isLoading && (
        <div className="p-6 text-center text-gray-400">
          {t('common.loading')}
        </div>
      )}
      {error && (
        <div className="p-6 text-center text-danger">
          {t('common.errorOccurred', { error })}
        </div>
      )}
      {!isLoading && !error && memberData && (
        <div className="space-y-6 p-4 sm:p-6 bg-card-bg rounded-xl">
          {/* Member Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <h3 className="col-span-full text-xl font-semibold text-accent mb-4 border-b border-border pb-2 flex items-center gap-2">
              <User className="w-5 h-5" /> {t('memberDetails')}
            </h3>

            {/* Member ID */}
            <div className="flex flex-col">
              <span className="text-gray-400 text-sm">{t('memberId')}</span>
              <span className="text-white font-mono text-lg">{memberData.member_id}</span>
            </div>

            {/* Name (EN) */}
            <div className="flex flex-col">
              <span className="text-gray-400 text-sm">{t('memberName_en')}</span>
              <span className="text-white text-lg">{memberData.name}</span>
            </div>

            {/* Name (KN) */}
            <div className="flex flex-col">
              <span className="text-gray-400 text-sm">{t('memberName_kn')}</span>
              <span className="text-white  text-[1.15rem]">{memberData.name_kn || t('common.notProvided')}</span>
            </div>

            {/* Phone */}
            <div className="flex flex-col">
              <span className="text-gray-400 text-sm">{t('phone')}</span>
              <span className="text-white text-lg flex items-center gap-1">
                {memberData.phone ? <Phone className="w-4 h-4 text-gray-400" /> : null}
                {memberData.phone || t('common.notProvided')}
              </span>
            </div>

            {/* Joined Date */}
            <div className="flex flex-col">
              <span className="text-gray-400 text-sm">{t('joinedDate')}</span>
              <span className="text-white text-lg flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                {memberData.joined_date ? format(new Date(memberData.joined_date), 'dd-MMM-yyyy') : t('common.notProvided')}
              </span>
            </div>

            {/* Active Status */}
            <div className="flex flex-col">
              <span className="text-gray-400 text-sm">{t('status')}</span>
              <Badge variant={memberData.is_active ? 'success' : 'danger'}>
                {memberData.is_active ? t('active') : t('inactive')}
              </Badge>
            </div>

            {/* Address (EN) */}
            <div className="flex flex-col col-span-1 md:col-span-2">
              <span className="text-gray-400 text-sm">{t('address_en')}</span>
              <span className="text-white text-lg whitespace-pre-wrap">
                {memberData.address || t('common.notProvided')}
              </span>
            </div>

            {/* Address (KN) */}
            <div className="flex flex-col col-span-1 md:col-span-2">
              <span className="text-gray-400 text-sm">{t('address_kn')}</span>
              <span className="text-white  text-[1.15rem] whitespace-pre-wrap">
                {memberData.address_kn || t('common.notProvided')}
              </span>
            </div>

            {/* Notes */}
            <div className="flex flex-col col-span-1 md:col-span-2">
              <span className="text-gray-400 text-sm">{t('notes')}</span>
              <span className="text-white text-lg whitespace-pre-wrap">
                {memberData.notes || t('common.noNotes')}
              </span>
            </div>
          </div>

          {/* Outstanding Fines */}
          <div className="mt-8 border-t border-border pt-6">
            <h3 className="text-xl font-semibold text-accent mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" /> {t('outstandingFines')}
            </h3>
            <div className={`text-2xl font-bold ${outstandingFines > 0 ? 'text-accent' : 'text-success'} flex items-center gap-2`}>
              {outstandingFines > 0 ? (
                <>
                  <Clock className="w-6 h-6" /> ₹{outstandingFines.toFixed(2)} {t('common.pending')}
                </>
              ) : (
                <>
                  <CheckCircle className="w-6 h-6" /> {t('noFines')}
                </>
              )}
            </div>
          </div>


          {/* Issue History */}
          <div className="mt-8 border-t border-border pt-6">
            <h3 className="text-xl font-semibold text-accent mb-4 flex items-center gap-2">
              <ListCollapse className="w-5 h-5" /> {t('issueHistory')}
            </h3>
            {transactions.length > 0 ? (
              <Table
                columns={transactionColumns}
                data={transactions}
              />
            ) : (
              <div className="text-center text-gray-400 p-8">
                <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p>{t('noBooksIssuedToMember')}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-border mt-6">
            <Button variant="ghost" onClick={onClose}>
              {t('close')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
