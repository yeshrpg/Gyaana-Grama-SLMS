import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Delete } from 'lucide-react';

export default function PINScreen({ onUnlock }) {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [correctPIN, setCorrectPIN] = useState(() => localStorage.getItem('gg_pin') || '1234');

  useEffect(() => {
    const saved = localStorage.getItem('gg_pin');
    if (saved) setCorrectPIN(saved);
  }, []);

  const handleKey = useCallback((key) => {
    if (error) return;

    if (key === 'clear') {
      setPin('');
    } else if (key === 'backspace') {
      setPin((p) => p.slice(0, -1));
    } else if (pin.length < 4) {
      const newPin = pin + key;
      setPin(newPin);
      if (newPin.length === 4) {
        if (newPin === correctPIN) {
          onUnlock();
        } else {
          setError(true);
          setErrorMsg(t('pin.wrong'));
          setTimeout(() => {
            setError(false);
            setErrorMsg('');
            setPin('');
          }, 1200);
        }
      }
    }
  }, [pin, error, correctPIN, onUnlock]);

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['clear', '0', 'backspace'],
  ];

  return (
    <div className="fixed inset-0 bg-app-bg flex flex-col items-center justify-center z-50 select-none">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .shake { animation: shake 0.4s ease-in-out; }
      `}</style>

      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center mb-4">
          <BookOpen className="h-8 w-8 text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-white">{t('appName')}</h1>
        <p className="text-sm text-gray-400 mt-1">{t('appSubtitle')}</p>
        <p className="text-xs text-gray-600 mt-0.5">{t('appKannada')}</p>
      </div>

      <div className={`flex gap-3 mb-8 ${error ? 'shake' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`
              w-4 h-4 rounded-full transition-all duration-150
              ${pin.length > i ? 'bg-accent shadow-lg shadow-accent/30' : 'bg-border'}
            `}
          />
        ))}
      </div>

      {errorMsg && (
        <p className="text-danger text-sm mb-4 transition-opacity duration-150">{errorMsg}</p>
      )}

      <div className="grid grid-cols-3 gap-3">
        {keys.map((row, rowIndex) =>
          row.map((key, colIndex) => {
            if (key === 'clear') {
              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleKey('clear')}
                  className="w-[72px] h-[56px] rounded-xl bg-transparent border border-border text-gray-400 text-xs font-medium transition-all duration-150 active:scale-95 hover:bg-card-bg cursor-pointer"
                >
                  {t('pin.clear')}
                </button>
              );
            }
            if (key === 'backspace') {
              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleKey('backspace')}
                  className="w-[72px] h-[56px] rounded-xl bg-transparent border border-border text-gray-400 transition-all duration-150 active:scale-95 hover:bg-card-bg cursor-pointer flex items-center justify-center"
                >
                  <Delete className="h-5 w-5" />
                </button>
              );
            }
            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleKey(key)}
                className="w-[72px] h-[56px] rounded-xl bg-card-bg border border-border text-white text-xl font-semibold transition-all duration-150 active:scale-95 hover:bg-hover cursor-pointer"
              >
                {key}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
