import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { differenceInDays, format, parseISO } from 'date-fns';
import { Search, BookOpen, User, Calendar, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { Badge } from '../../components/UI/Badge';
import { Table } from '../../components/UI/Table';
import { useToast } from '../../components/UI/Toast';
import { useDebounce } from '../../hooks/useDebounce';

export default function ReturnBook() {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const debouncedMemberSearch = useDebounce(memberSearchTerm, 300);
  const [memberResults, setMemberResults] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [activeLoans, setActiveLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);

  const [finePerDay, setFinePerDay] = useState(1);
  const [fineAmount, setFineAmount] = useState(0);
  const [daysOverdue, setDaysOverdue] = useState(0);
  const [finePaid, setFinePaid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch fine settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      const result = await window.api.settings.get('fine_per_day');
      if (result.success && result.data) {
        setFinePerDay(parseFloat(result.data.value) || 1);
      }
    };
    fetchSettings();
  }, []);

  // Search members
  useEffect(() => {
    const searchMembers = async () => {
      if (!debouncedMemberSearch) {
        setMemberResults([]);
        return;
      }
      setIsLoading(true);
      const result = await window.api.members.search(debouncedMemberSearch);
      if (result.success) {
        const active = result.data.filter(m => m.is_active);
        if (active.length > 0) {
          const countResult = await window.api.transactions.getMemberLoanCounts(active.map(m => m.id));
          if (countResult.success) {
            active.forEach(m => m.activeLoanCount = countResult.data[m.id] || 0);
          }
        }
        setMemberResults(active);
      } else {
        showToast({ message: t('returnBookPage.toast.searchError'), type: 'error' });
      }
      setIsLoading(false);
    };
    searchMembers();
  }, [debouncedMemberSearch, t, showToast]);

  // Fetch active loans when member is selected
  const handleSelectMember = async (member) => {
    setSelectedMember(member);
    setIsLoading(true);
    const result = await window.api.transactions.getByMember(member.id, false); // false = exclude returned
    if (result.success) {
      setActiveLoans(result.data);
      if (result.data.length === 0) {
        showToast({ message: t('returnBookPage.toast.noActiveLoans'), type: 'warning' });
      } else {
        setCurrentStep(2);
      }
    } else {
      showToast({ message: t('returnBookPage.toast.fetchLoansError'), type: 'error' });
    }
    setIsLoading(false);
  };

  // Handle selecting a loan to return
  const handleSelectLoan = (loan) => {
    setSelectedLoan(loan);
    
    const today = new Date();
    const dueDate = parseISO(loan.due_date);
    const overdueDays = differenceInDays(today, dueDate);

    if (overdueDays > 0) {
      setDaysOverdue(overdueDays);
      setFineAmount(overdueDays * finePerDay);
    } else {
      setDaysOverdue(0);
      setFineAmount(0);
    }
    setFinePaid(false);
    setCurrentStep(3);
  };

  const handleConfirmReturn = async () => {
    if (!selectedLoan) return;
    setIsSubmitting(true);

    const result = await window.api.transactions.return(
      selectedLoan.id,
      fineAmount,
      finePaid ? 1 : 0
    );

    if (result.success) {
      const overdueMsg = daysOverdue > 0
        ? ` — Book returned after due date. Overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}.`
        : '';
      const fineMsg = fineAmount > 0 
        ? (finePaid ? ` Fine ₹${fineAmount} collected ✓` : ` Fine ₹${fineAmount} pending`)
        : '';
      showToast({
        message: `${t('returnBookPage.toast.success')}${overdueMsg}${fineMsg}`,
        type: daysOverdue > 0 ? 'warning' : 'success'
      });
      // Reset state
      setCurrentStep(1);
      setSelectedMember(null);
      setSelectedLoan(null);
      setMemberSearchTerm('');
      setMemberResults([]);
    } else {
      showToast({ message: result.error || t('returnBookPage.toast.failed'), type: 'error' });
    }
    setIsSubmitting(false);
  };

  const loanColumns = [
    { key: 'title', label: t('bookTitle'), render: (_, row) => (
      <div className="font-medium text-white font-kannada">
        {row.title_kn || row.title}
      </div>
    )},
    { key: 'accession_id', label: t('accessionId') || 'Accession ID', render: (value) => <span className="font-mono text-accent">{value}</span> },
    { key: 'issue_date', label: t('issueDate'), render: (value) => format(parseISO(value), 'dd-MM-yyyy') },
    { key: 'due_date', label: t('dueDate'), render: (value, row) => {
      const isOverdue = differenceInDays(new Date(), parseISO(value)) > 0;
      return <span className={isOverdue ? 'text-danger font-semibold' : 'text-white'}>{format(parseISO(value), 'dd-MM-yyyy')}</span>;
    }},
    { key: 'status', label: t('status'), render: (_, row) => {
      const isOverdue = differenceInDays(new Date(), parseISO(row.due_date)) > 0;
      return isOverdue ? <Badge variant="danger">{t('overdue')}</Badge> : <Badge variant="warning">{t('issued')}</Badge>;
    }},
    { key: 'id', label: t('actions'), render: (_, row) => (
      <Button size="sm" onClick={() => handleSelectLoan(row)}>{t('returnBookPage.select') || 'Select'}</Button>
    )},
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen className="text-accent" />
          <span>{t('returnBookPage.title') || 'Return Book'}</span>
          <span className="text-gray-400  text-lg ml-2">
            (ಪುಸ್ತಕ ವಾಪಸ್ ಪಡೆಯಿರಿ)
          </span>
        </h1>
        {currentStep > 1 && (
          <Button
            variant="ghost"
            onClick={() => {
              setCurrentStep(currentStep - 1);
              if (currentStep === 2) setSelectedMember(null);
              if (currentStep === 3) setSelectedLoan(null);
            }}
            className="flex items-center gap-1"
          >
            <ArrowLeft size={16} /> {t('common.back') || 'Back'}
          </Button>
        )}
      </div>

      {/* Step Progress Indicator */}
      <div className="flex items-center justify-between mb-8 bg-card-bg border border-border rounded-xl p-4">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`flex-1 flex flex-col items-center ${
              currentStep === step ? 'text-accent' : 'text-gray-400'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-1 border-2 ${
                currentStep === step
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-app-bg text-gray-400'
              }`}
            >
              {step}
            </div>
            <span className="text-xs font-medium">
              {step === 1 && (t('returnBookPage.step1') || 'Select Member')}
              {step === 2 && (t('returnBookPage.step2') || 'Select Book')}
              {step === 3 && (t('returnBookPage.step3') || 'Confirm Return')}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Select Member */}
      {currentStep === 1 && (
        <div className="bg-card-bg border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {t('returnBookPage.findMember') || 'Find Member with Active Loans'}
          </h2>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder={t('returnBookPage.searchPlaceholder') || 'Search by Member Name or ID...'}
              value={memberSearchTerm}
              onChange={(e) => setMemberSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-gray-400">{t('common.loading') || 'Loading...'}</div>
          ) : memberResults.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {memberResults.map((member) => (
                <div
                  key={member.id}
                  onClick={() => handleSelectMember(member)}
                  className="flex items-center justify-between p-4 bg-app-bg hover:border-accent border border-border rounded-lg cursor-pointer transition-all"
                >
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2 font-kannada">
                      <User size={16} className="text-accent" />
                      {member.name_kn || member.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      ID: <span className="font-mono text-accent">{member.member_id}</span>
                      {member.phone && ` | Phone: ${member.phone}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {member.activeLoanCount > 0 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-400 border border-amber-700/40">
                        {member.activeLoanCount} active
                      </span>
                    )}
                    <Button size="sm">{t('returnBookPage.select') || 'Select'}</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            debouncedMemberSearch && (
              <div className="text-center py-8 text-gray-400">
                {t('returnBookPage.noMembersFound') || 'No active members found.'}
              </div>
            )
          )}
        </div>
      )}

      {/* Step 2: Select Book */}
      {currentStep === 2 && selectedMember && (
        <div className="bg-card-bg border border-border rounded-xl p-6">
          <div className="mb-6 p-4 bg-app-bg border border-border rounded-lg flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">
                {t('returnBookPage.selectedMember') || 'Selected Member'}
              </div>
              <div className="text-lg font-bold text-white flex items-center gap-2 mt-1 font-kannada">
                <User className="text-accent" size={18} />
                {selectedMember.name_kn || selectedMember.name}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400">ID</span>
              <div className="font-mono text-accent font-bold">{selectedMember.member_id}</div>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-white mb-4">
            {t('returnBookPage.selectBookToReturn') || 'Select Book to Return'}
          </h2>

          {activeLoans.length > 0 ? (
            <Table columns={loanColumns} data={activeLoans} />
          ) : (
            <div className="text-center py-8 text-gray-400">
              {t('returnBookPage.noActiveLoans') || 'No active loans found for this member.'}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Fine Calculation & Confirm */}
      {currentStep === 3 && selectedMember && selectedLoan && (
        <div className="space-y-6">
          {/* ISSUED STATUS BANNER */}
          <div className="flex items-center gap-4 p-4 bg-amber-900/20 border border-amber-700/40 rounded-xl">
            <BookOpen size={32} className="text-accent shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Currently Issued</div>
              <div className="font-bold text-white text-base font-kannada truncate">
                {selectedLoan.title_kn || selectedLoan.title}
              </div>
              <div className="text-xs text-gray-400 font-mono mt-0.5">{selectedLoan.accession_id}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-gray-400 mb-0.5">Issued to</div>
              <div className="font-semibold text-white font-kannada">{selectedMember.name_kn || selectedMember.name}</div>
              <div className="text-xs font-mono text-accent">{selectedMember.member_id}</div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-card-bg border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              {t('returnBookPage.returnSummary') || 'Return Summary'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-gray-400 uppercase">{t('member') || 'Member'}</span>
                  <div className="font-semibold text-white mt-1 font-kannada">{selectedMember.name_kn || selectedMember.name}</div>
                  <div className="text-xs text-gray-400 font-mono">{selectedMember.member_id}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-400 uppercase">{t('book') || 'Book'}</span>
                  <div className="font-semibold text-white mt-1 font-kannada">{selectedLoan.title_kn || selectedLoan.title}</div>
                  <div className="text-xs text-gray-400 font-mono">{selectedLoan.accession_id}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-xs text-gray-400 uppercase">{t('issueDate') || 'Issue Date'}</span>
                  <div className="font-semibold text-white mt-1">
                    {format(parseISO(selectedLoan.issue_date), 'dd-MM-yyyy')}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-400 uppercase">{t('dueDate') || 'Due Date'}</span>
                  <div className="font-semibold text-white mt-1">
                    {format(parseISO(selectedLoan.due_date), 'dd-MM-yyyy')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fine Calculation Panel */}
          <div className="bg-card-bg border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              {t('returnBookPage.fineCalculation') || 'Fine Calculation'}
            </h2>

            {daysOverdue > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-red-900/30 border border-red-800/40 rounded-lg text-danger">
                  <AlertTriangle size={24} />
                  <div>
                    <div className="font-bold">
                      {t('returnBookPage.overdueWarning', { days: daysOverdue }) || `Overdue by ${daysOverdue} days!`}
                    </div>
                    <div className="text-sm opacity-90">
                      {t('returnBookPage.fineRateInfo', { rate: finePerDay }) || `Fine rate: ₹${finePerDay} per day`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-app-bg border border-border rounded-lg">
                  <div>
                    <span className="text-sm text-gray-400">{t('returnBookPage.totalFine') || 'Total Fine Amount'}</span>
                    <div className="text-2xl font-bold text-accent mt-1">₹{fineAmount.toFixed(2)}</div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={finePaid}
                      onChange={(e) => setFinePaid(e.target.checked)}
                      className="w-5 h-5 rounded border-border text-accent focus:ring-accent bg-app-bg"
                    />
                    <span className="text-sm font-medium text-white">
                      {t('returnBookPage.markPaid') || 'Mark Fine as Paid'}
                    </span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-green-900/30 border border-green-800/40 rounded-lg text-success">
                <CheckCircle size={24} />
                <div>
                  <div className="font-bold">{t('returnBookPage.onTime') || 'Returned on time!'}</div>
                  <div className="text-sm opacity-90">{t('returnBookPage.noFine') || 'No fine is applicable.'}</div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4">
            <Button
              variant="secondary"
              onClick={() => {
                setCurrentStep(2);
                setSelectedLoan(null);
              }}
              disabled={isSubmitting}
            >
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={handleConfirmReturn}
              isLoading={isSubmitting}
              className="px-8"
            >
              {t('returnBookPage.confirmReturn') || 'Confirm Return'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
