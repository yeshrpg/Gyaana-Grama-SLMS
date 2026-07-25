import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function useLanguage() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const saved = localStorage.getItem('gg_language');
    if (saved && saved !== i18n.language) {
      i18n.changeLanguage(saved);
    }
  }, [i18n]);

  const language = i18n.language;
  const isKannada = language === 'kn';

  const toggleLanguage = () => {
    const next = isKannada ? 'en' : 'kn';
    i18n.changeLanguage(next);
    localStorage.setItem('gg_language', next);
  };

  return { t, language, toggleLanguage, isKannada };
}