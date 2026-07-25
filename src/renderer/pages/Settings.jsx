import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Lock, BookOpen, Clock, Shield, Database, Download, RefreshCw, Upload } from 'lucide-react';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import { useToast } from '../components/UI/Toast';
import useLanguage from '../hooks/useLanguage';

function SettingsCard({ icon: Icon, title, description, children }) {
  return (
    <div className="bg-card-bg rounded-xl border border-border p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="h-4 w-4 text-accent" />
        </div>
        <div>
          <h2 className="text-white font-semibold">{title}</h2>
          {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const { language, toggleLanguage, isKannada } = useLanguage();
  const api = window.api;

  const [libraryName, setLibraryName] = useState('');
  const [contact, setContact] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loanDays, setLoanDays] = useState(14);
  const [finePerDay, setFinePerDay] = useState(1);
  const [backupInfo, setBackupInfo] = useState({ path: '', count: 0, lastBackup: '' });
  const [backingUp, setBackingUp] = useState(false);

  const fetchBackupInfo = useCallback(async () => {
    if (!api) return;
    try {
      const result = await api.backup.getFolderInfo();
      if (result.success) {
        setBackupInfo(result.data);
      }
    } catch (_) {}
  }, [api]);

  useEffect(() => {
    setLibraryName(localStorage.getItem('gg_library_name') || '');
    setContact(localStorage.getItem('gg_contact') || '');
    setLoanDays(parseInt(localStorage.getItem('gg_loan_days'), 10) || 14);
    setFinePerDay(parseInt(localStorage.getItem('gg_fine_per_day'), 10) || 1);
    fetchBackupInfo();
  }, [fetchBackupInfo]);

  const handleSaveLibrary = () => {
    localStorage.setItem('gg_library_name', libraryName);
    localStorage.setItem('gg_contact', contact);
    success('Library settings saved');
  };

  const handleChangePin = () => {
    const savedPin = localStorage.getItem('gg_pin') || '1234';
    if (currentPin !== savedPin) {
      success('Current PIN is incorrect');
      return;
    }
    if (!/^\d{4}$/.test(newPin)) {
      success('New PIN must be 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      success('New PIN and confirm PIN do not match');
      return;
    }
    localStorage.setItem('gg_pin', newPin);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    success('PIN changed successfully');
  };

  const handleSaveLoan = () => {
    localStorage.setItem('gg_loan_days', loanDays.toString());
    localStorage.setItem('gg_fine_per_day', finePerDay.toString());
    success('Loan settings saved');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-white text-xl font-bold">{t('settings.title')}</h1>

      <SettingsCard
        icon={BookOpen}
        title={t('settings.library')}
        description={t('settings.libraryDesc')}
      >
        <div className="space-y-4">
          <Input
            label={t('settings.libraryName')}
            value={libraryName}
            onChange={(e) => setLibraryName(e.target.value)}
            placeholder="Gyaana Grama Library"
          />
          <Input
            label={t('settings.contactNumber')}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="9876543210"
          />
          <div className="flex justify-end">
            <Button onClick={handleSaveLibrary} size="sm">{t('common.save')}</Button>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Clock}
        title={t('settings.loanRules')}
        description={t('settings.loanRulesDesc')}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('settings.loanDays')}
              type="number"
              value={loanDays}
              onChange={(e) => setLoanDays(parseInt(e.target.value, 10) || 14)}
              min={1}
              max={365}
            />
            <Input
              label={t('settings.finePerDay')}
              type="number"
              value={finePerDay}
              onChange={(e) => setFinePerDay(parseInt(e.target.value, 10) || 1)}
              min={0}
              max={100}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveLoan} size="sm">{t('common.save')}</Button>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Shield}
        title={t('settings.security')}
        description={t('settings.securityDesc')}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input
              label={t('settings.currentPin')}
              type="password"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              placeholder="Current"
              maxLength={4}
            />
            <Input
              label={t('settings.newPin')}
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="New PIN"
              maxLength={4}
            />
            <Input
              label={t('settings.confirmPin')}
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="Confirm"
              maxLength={4}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleChangePin} size="sm">{t('settings.changePin')}</Button>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Globe}
        title={t('settings.language')}
        description={t('settings.languageDesc')}
      >
        <div className="flex items-center justify-between">
          <span className="text-gray-300 text-sm">
            {t('settings.current')}: <span className="font-medium text-white">{isKannada ? 'ಕನ್ನಡ' : 'English'}</span>
          </span>
          <Button variant="ghost" size="sm" onClick={toggleLanguage}>
            {t('settings.switchTo')} {isKannada ? 'English' : 'ಕನ್ನಡ'}
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Database}
        title={t('settings.backup')}
        description={t('settings.backupDesc')}
      >
        <div className="space-y-3">
          <div className="text-sm text-gray-500">
            <span>{t('settings.backups')}: <span className="text-gray-300 font-medium">{backupInfo.count || 0}</span></span>
            {backupInfo.path && <p className="text-xs text-gray-600 mt-0.5 truncate" title={backupInfo.path}>{backupInfo.path}</p>}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" loading={backingUp} icon={<Download className="h-4 w-4" />}
              onClick={async () => {
                setBackingUp(true);
                try {
                  if (api) {
                    const r = await api.backup.runNow();
                    if (r.success) {
                      success('Backup created successfully');
                      fetchBackupInfo();
                    } else {
                      error(r.error || 'Backup failed');
                    }
                  }
                } catch (err) {
                  error(err.message);
                } finally {
                  setBackingUp(false);
                }
              }}>
              {t('settings.backupNow')}
            </Button>
            <Button variant="ghost" size="sm" icon={<RefreshCw className="h-4 w-4" />}
              onClick={async () => {
                if (api) {
                  const r = await api.backup.restore();
                  if (r.success) {
                    success('Restore complete. Reloading...');
                    setTimeout(() => window.location.reload(), 1500);
                  } else if (r.error && !r.error.includes('cancelled')) {
                    error(r.error);
                  }
                }
              }}>
              {t('settings.restore')}
            </Button>
          </div>
        </div>
      </SettingsCard>

      {/* Import Books Database */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', padding: 20, marginTop: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 4 }}>
          Barcode Pipeline — Import Books
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          Import books digitized by the mobile app Gyaana Grama SLMS. Select the .db SQLite file exported from the Android device.
        </div>
        <button
          type="button"
          onClick={async () => {
            if (!api) return;
            try {
              const result = await api.importBooksDB();
              if (result.success) {
                success(`Imported ${result.count} books from ${result.range}`);
              } else {
                error(result.error || 'Import failed');
              }
            } catch (err) {
              error(err.message);
            }
          }}
          style={{
            background: 'transparent',
            border: '1px solid var(--accent)',
            color: 'var(--accent)',
            fontSize: 13,
            padding: '8px 16px',
            borderRadius: 6,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 150ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245,166,35,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Upload size={14} /> Select .db File
        </button>
      </div>

      <SettingsCard
        icon={BookOpen}
        title={t('settings.about')}
        description={t('settings.aboutDesc')}
      >
        <div className="space-y-1 text-sm text-gray-500">
          <p>{t('settings.version')}: <span className="text-gray-300">v1.0.0</span></p>
          <p>{t('settings.builtFor')}</p>
          <p className="text-xs mt-2">{t('settings.madeWith')}</p>
        </div>
      </SettingsCard>
    </div>
  );
}
