import { useState, useRef } from 'react';
import { Delete, X as XIcon } from 'lucide-react';

const VOWELS = ['ಅ','ಆ','ಇ','ಈ','ಉ','ಊ','ಋ','ಎ','ಏ','ಐ','ಒ','ಓ','ಔ'];
const MATRAS = ['ಾ','ಿ','ೀ','ು','ೂ','ೃ','ೆ','ೇ','ೈ','ೊ','ೋ','ೌ','ಂ','ಃ','್'];
const KA_VARGA = ['ಕ','ಖ','ಗ','ಘ','ಙ'];
const CHA_VARGA = ['ಚ','ಛ','ಜ','ಝ','ಞ'];
const TA_VARGA = ['ಟ','ಠ','ಡ','ಢ','ಣ'];
const THA_VARGA = ['ತ','ಥ','ದ','ಧ','ನ'];
const PA_VARGA = ['ಪ','ಫ','ಬ','ಭ','ಮ'];
const OTHERS = ['ಯ','ರ','ಲ','ವ','ಶ','ಷ','ಸ','ಹ','ಳ','ಱ'];
const NUMBERS = ['೦','೧','೨','೩','೪','೫','೬','೭','೮','೯'];

const TABS = [
  { id: 'consonants', label: 'ಕ-ಙ', chars: [...KA_VARGA, ...CHA_VARGA, ...TA_VARGA, ...THA_VARGA, ...PA_VARGA, ...OTHERS] },
  { id: 'vowels', label: 'ಅ-ಔ', chars: VOWELS },
  { id: 'matras', label: 'ಾ-್', chars: MATRAS },
  { id: 'numbers', label: '೦-೯', chars: NUMBERS },
];

export default function KannadaKeyboard({ onInsert, onBackspace, onClear, onClose }) {
  const [tab, setTab] = useState('consonants');
  const keyboardRef = useRef(null);

  const currentChars = TABS.find(t => t.id === tab)?.chars || [];

  return (
    <div
      ref={keyboardRef}
      className="fixed bottom-0 left-0 right-0 z-50 bg-card-bg border-t border-border rounded-t-2xl shadow-2xl animate-slideIn"
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                tab === t.id
                  ? 'bg-accent text-app-bg font-semibold'
                  : 'text-gray-400 hover:text-white hover:bg-hover'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-hover">
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="p-3 max-h-48 overflow-y-auto">
        <div className="flex flex-wrap gap-1.5 justify-center">
          {currentChars.map((char) => (
            <button
              key={char}
              type="button"
              onClick={() => onInsert(char)}
              className="w-10 h-10 rounded-lg bg-hover border border-border text-white text-lg hover:bg-accent hover:text-app-bg hover:border-accent transition-colors duration-100 active:scale-95 flex items-center justify-center font-kannada"
            >
              {char}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 border-t border-border">
        <button type="button" onClick={onClear} className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-hover transition-colors">
          Clear
        </button>
        <button type="button" onClick={onBackspace} className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-hover transition-colors flex items-center gap-1">
          <Delete className="h-4 w-4" /> Backspace
        </button>
        <button type="button" onClick={onClose} className="ml-auto px-4 py-2 text-sm bg-accent text-app-bg rounded-lg font-semibold hover:brightness-110 transition-all">
          Done
        </button>
      </div>
    </div>
  );
}
