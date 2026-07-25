import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import kn from './kn.json';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, kn: { translation: kn } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Async update language from settings (non-blocking)
try {
  const savedLang = localStorage.getItem('gg_language');
  if (savedLang === 'kn' || savedLang === 'en') {
    i18n.changeLanguage(savedLang);
  }
} catch (_) {}

export default i18n;
