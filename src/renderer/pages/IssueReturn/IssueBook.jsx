import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '../../components/UI/Input';
import { Button } from '../../components/UI/Button';
import { useToast } from '../../components/UI/Toast';
import {
  User, BookOpen, Search, ArrowRight, ArrowLeft, CalendarDays, CheckCircle, Clock, Info
} from 'lucide-react';
import { addDays, format } from 'date-fns';
import { useDebounce } from '../../hooks/useDebounce';
import { Badge } from '../../components/UI/Badge';

export default function IssueBook() {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [bookSearchTerm, setBookSearchTerm] = useState('');
  const debouncedMemberSearchTerm = useDebounce(memberSearchTerm, 300);
  const debouncedBookSearchTerm = useDebounce(bookSearchTerm, 300);

  const [memberSearchResults, setMemberSearchResults] = useState([]);
  const [bookSearchResults, setBookSearchResults] = useState([]);

  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);

  const [loanDays, setLoanDays] = useState(14);
  const issueDate = new Date();
  const defaultDueDate = format(addDays(issueDate, loanDays), 'yyyy-MM-dd');
  const [customDueDate, setCustomDueDate] = useState(defaultDueDate);

  const [membersLoading, setMembersLoading] = useState(false);
  const [booksLoading, setBooksLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchLoanDays = async () => {
      const result = await window.api.settings.get('loan_days');
      if (result.success && result.data) {
        const days = parseInt(result.data.value, 10);
        setLoanDays(days);
        setCustomDueDate(format(addDays(issueDate, days), 'yyyy-MM-dd'));
      } else {
        console.error('Failed to fetch loan days from settings:', result.error);
        showToast({ message: t('issueBookPage.toast.fetchLoanDaysError', { error: result.error }), type: 'error' });
      }
    };
    fetchLoanDays();
  }, [showToast, t]);

  // Search members
  useEffect(() => {
    let cancelled = false;
    const searchMembers = async () => {
      if (!debouncedMemberSearchTerm) {
        setMemberSearchResults([]);
        return;
      }
      setMembersLoading(true);
      try {
        const result = await window.api.members.search(debouncedMemberSearchTerm);
        if (cancelled) return;
        if (result.success) {
          setMemberSearchResults(result.data.filter(member => member.is_active));
        } else {
          showToast({ message: t('issueBookPage.toast.memberSearchError', { error: result.error }), type: 'error' });
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Member search failed:', err);
        showToast({ message: t('issueBookPage.toast.memberSearchError', { error: err.message }), type: 'error' });
      }
      setMembersLoading(false);
    };
    searchMembers();
    return () => { cancelled = true; };
  }, [debouncedMemberSearchTerm, showToast, t]);

  // Search books
  useEffect(() => {
    let cancelled = false;
    const searchBooks = async () => {
      if (!debouncedBookSearchTerm) {
        setBookSearchResults([]);
        return;
      }
      setBooksLoading(true);
      try {
        const result = await window.api.books.search(debouncedBookSearchTerm, null, null, 'available');
        if (cancelled) return;
        if (result.success) {
          setBookSearchResults(result.data.filter(book => book.available_copies > 0));
        } else {
          showToast({ message: t('issueBookPage.toast.bookSearchError', { error: result.error }), type: 'error' });
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Book search failed:', err);
        showToast({ message: t('issueBookPage.toast.bookSearchError', { error: err.message }), type: 'error' });
      }
      setBooksLoading(false);
    };
    searchBooks();
    return () => { cancelled = true; };
  }, [debouncedBookSearchTerm, showToast, t]);

  const handleIssueBook = async () => {
    if (!selectedMember || !selectedBook) {
      showToast({ message: t('issueBookPage.toast.selectBothError'), type: 'error' });
      return;
    }
    if (selectedBook.available_copies < 1) {
      showToast({ message: 'No available copies of this book.', type: 'error' });
      return;
    }
    if (!customDueDate) {
      showToast({ message: 'Please set a due date.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await window.api.transactions.issue(
        selectedBook.id,      // book DB id (integer)
        selectedMember.id,    // member DB id (integer)
        customDueDate         // 'yyyy-MM-dd' string
      );

      if (result.success) {
        showToast({
          message: t('issueBookPage.toast.issueSuccess', { memberName: selectedMember.name }),
          type: 'success',
        });
        // Reset form to step 1
        setCurrentStep(1);
        setSelectedMember(null);
        setSelectedBook(null);
        setMemberSearchTerm('');
        setBookSearchTerm('');
        setMemberSearchResults([]);
        setBookSearchResults([]);
        setCustomDueDate(format(addDays(new Date(), loanDays), 'yyyy-MM-dd'));
      } else {
        showToast({
          message: t('issueBookPage.toast.issueError', { error: result.error }),
          type: 'error',
        });
      }
    } catch (error) {
      console.error("Error issuing book:", error);
      showToast({ message: t('issueBookPage.toast.issueError', { error: error.message }), type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = (stepNum, stepTitle) => (
    <div
      className={`flex-1 flex flex-col items-center cursor-pointer transition-colors duration-200 ${
        currentStep === stepNum ? 'text-accent' : 'text-gray-400 hover:text-white'
      }`}
      onClick={() => {
        // Allow navigating to previous steps if valid
        if (stepNum < currentStep) {
          setCurrentStep(stepNum);
        } else if (stepNum === 2 && selectedMember) {
            setCurrentStep(stepNum);
        } else if (stepNum === 3 && selectedMember && selectedBook) {
            setCurrentStep(stepNum);
        }
      }}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg ${
          currentStep === stepNum ? 'bg-accent text-app-bg' : 'bg-border text-gray-400'
        }`}
      >
        {stepNum}
      </div>
      <span className="mt-2 text-sm">{stepTitle}</span>
    </div>
  );

  return (
    <div className="p-6 bg-card-bg rounded-xl shadow-lg h-full flex flex-col">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <ArrowRight className="w-6 h-6 text-accent" /> {t('issueBook')}
      </h2>

      {/* Step Indicator */}
      <div className="flex justify-around items-center mb-8 border-b border-border pb-4">
        {renderStepIndicator(1, t('issueBookPage.step1SelectMember'))}
        <div className={`h-1 w-8 bg-border rounded-full ${currentStep > 1 ? 'bg-accent' : ''}`} />
        {renderStepIndicator(2, t('issueBookPage.step2SelectBook'))}
        <div className={`h-1 w-8 bg-border rounded-full ${currentStep > 2 ? 'bg-accent' : ''}`} />
        {renderStepIndicator(3, t('issueBookPage.step3Confirm'))}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        {/* Step 1: Select Member */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-accent" /> {t('issueBookPage.step1SelectMember')}
            </h3>
            <Input
              label={t('searchMember')}
              placeholder={t('issueBookPage.searchMemberPlaceholder')}
              icon={<Search />}
              value={memberSearchTerm}
              onChange={(e) => setMemberSearchTerm(e.target.value)}
              autoFocus
            />

            {membersLoading && debouncedMemberSearchTerm && (
              <p className="text-gray-400 text-center">{t('common.loading')}</p>
            )}

            {!membersLoading && debouncedMemberSearchTerm && memberSearchResults.length === 0 && (
              <p className="text-gray-400 text-center">{t('issueBookPage.noMembersFound', { searchTerm: debouncedMemberSearchTerm })}</p>
            )}

            {!selectedMember ? (
              <div className="space-y-2 max-h-60 overflow-y-auto border border-border rounded-lg p-2">
                {memberSearchResults.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-border rounded-md cursor-pointer hover:bg-card-bg transition-colors"
                    onClick={() => setSelectedMember(member)}
                  >
                    <div>
                      <p className="font-medium text-white font-kannada">{member.name_kn || member.name}</p>
                    </div>
                    <Badge variant="default" className="text-sm">{member.member_id}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card-bg p-4 rounded-xl border border-accent relative">
                <Badge variant="warning" className="absolute top-3 right-3">{t('issueBookPage.selectedMember')}</Badge>
                <h4 className="font-semibold text-white text-lg flex items-center gap-2 mb-2 font-kannada">
                  <User className="w-5 h-5 text-accent" /> {selectedMember.name_kn || selectedMember.name}
                </h4>
                <p className="text-gray-400 flex items-center gap-2"><Info className="w-4 h-4" /> {t('memberId')}: {selectedMember.member_id}</p>
                {selectedMember.phone && <p className="text-gray-400 flex items-center gap-2"><Info className="w-4 h-4" /> {t('phone')}: {selectedMember.phone}</p>}
                <Button variant="ghost" size="sm" onClick={() => setSelectedMember(null)} className="mt-3 text-sm">
                  <ArrowLeft className="w-4 h-4 mr-2" /> {t('issueBookPage.changeMember')}
                </Button>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="primary"
                onClick={() => setCurrentStep(2)}
                disabled={!selectedMember || membersLoading}
              >
                {t('issueBookPage.nextStep')} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Select Book */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent" /> {t('issueBookPage.step2SelectBook')}
            </h3>
            <Input
              label={t('searchBook')}
              placeholder={t('issueBookPage.searchBookPlaceholder')}
              icon={<Search />}
              value={bookSearchTerm}
              onChange={(e) => setBookSearchTerm(e.target.value)}
              autoFocus
            />

            {booksLoading && debouncedBookSearchTerm && (
              <p className="text-gray-400 text-center">{t('common.loading')}</p>
            )}

            {!booksLoading && debouncedBookSearchTerm && bookSearchResults.length === 0 && (
              <p className="text-gray-400 text-center">{t('issueBookPage.noBooksFound', { searchTerm: debouncedBookSearchTerm })}</p>
            )}

            {!selectedBook ? (
              <div className="space-y-2 max-h-60 overflow-y-auto border border-border rounded-lg p-2">
                {bookSearchResults.map((book) => (
                  <div
                    key={book.id}
                    className={`flex items-center justify-between p-3 rounded-md transition-colors ${
                      book.available_copies > 0
                        ? 'bg-border cursor-pointer hover:bg-card-bg'
                        : 'bg-red-900/20 cursor-not-allowed opacity-60'
                    }`}
                    onClick={() => book.available_copies > 0 && setSelectedBook(book)}
                  >
                    <div>
                      <p className="font-medium text-white font-kannada">{book.title_kn || book.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{book.author_kn || book.author}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-sm">{book.accession_id}</Badge>
                      <Badge
                        variant={book.available_copies > 0 ? 'success' : 'danger'}
                        className="text-sm"
                      >
                        {book.available_copies > 0 ? `${book.available_copies} avail` : 'Issued'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card-bg p-4 rounded-xl border border-accent relative">
                <Badge variant="warning" className="absolute top-3 right-3">{t('issueBookPage.selectedBook')}</Badge>
                <h4 className="font-semibold text-white text-lg flex items-center gap-2 mb-2 font-kannada">
                  <BookOpen className="w-5 h-5 text-accent" /> {selectedBook.title_kn || selectedBook.title}
                </h4>
                <p className="text-gray-400 flex items-center gap-2"><Info className="w-4 h-4" /> {t('accessionId')}: {selectedBook.accession_id}</p>
                <p className="text-gray-400 flex items-center gap-2"><Info className="w-4 h-4" /> {t('availableCopies')}: {selectedBook.available_copies}</p>
                <Button variant="ghost" size="sm" onClick={() => setSelectedBook(null)} className="mt-3 text-sm">
                  <ArrowLeft className="w-4 h-4 mr-2" /> {t('issueBookPage.changeBook')}
                </Button>
              </div>
            )}

            <div className="flex justify-between gap-3 mt-6">
              <Button variant="ghost" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> {t('issueBookPage.previousStep')}
              </Button>
              <Button
                variant="primary"
                onClick={() => setCurrentStep(3)}
                disabled={!selectedBook || booksLoading}
              >
                {t('issueBookPage.nextStep')} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm Issue */}
        {currentStep === 3 && selectedMember && selectedBook && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-accent" /> {t('issueBookPage.step3Confirm')}
            </h3>

            <div className="bg-card-bg p-6 rounded-xl border border-border space-y-4">
              <p className="text-gray-400 font-medium mb-3 border-b border-border pb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" /> {t('issueBookPage.summary')}
              </p>
              <div>
                <span className="text-gray-400">{t('issueBookPage.member')}: </span>
                <span className="font-semibold text-white font-kannada">{selectedMember.name_kn || selectedMember.name}</span>
                <Badge variant="default" className="ml-2">{selectedMember.member_id}</Badge>
              </div>
              <div>
                <span className="text-gray-400">{t('issueBookPage.book')}: </span>
                <span className="font-semibold text-white font-kannada">{selectedBook.title_kn || selectedBook.title}</span>
                <Badge variant="default" className="ml-2">{selectedBook.accession_id}</Badge>
              </div>
              <div>
                <span className="text-gray-400">{t('issueDate')}: </span>
                <span className="font-semibold text-white flex items-center gap-1">
                  <CalendarDays className="w-4 h-4" /> {format(issueDate, 'dd-MMM-yyyy')}
                </span>
              </div>
              <div>
                <span className="text-gray-400">{t('dueDate')}: </span>
                <div className="flex items-center gap-2 mt-1">
                  <CalendarDays className="w-4 h-4 text-accent" />
                  <input
                    type="date"
                    value={customDueDate}
                    onChange={(e) => setCustomDueDate(e.target.value)}
                    className="bg-app-bg border border-border rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-accent"
                    min={format(issueDate, 'yyyy-MM-dd')}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-3 mt-6">
              <Button variant="ghost" onClick={() => setCurrentStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> {t('issueBookPage.previousStep')}
              </Button>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => {
                  setCurrentStep(1);
                  setSelectedMember(null);
                  setSelectedBook(null);
                  setMemberSearchTerm('');
                  setBookSearchTerm('');
                }} disabled={isSubmitting}>
                  {t('cancel')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleIssueBook}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('common.issuing') : t('confirmIssue')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
