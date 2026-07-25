import './i18n/index.js';
import './styles/globals.css';
import './styles/themes.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ToastProvider } from './components/UI/Toast';

const root = createRoot(document.getElementById('root'));
root.render(
  <ToastProvider>
    <App />
  </ToastProvider>
);
