'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    if (window.location.hostname === 'c-vita.vercel.app') {
      window.location.replace('https://www.cvzume.com' + window.location.pathname + window.location.search);
      return;
    }

    const savedLang = localStorage.getItem('cvita_language');
    const browserLang = navigator.language.split('-')[0];
    const supportedLocales = ['sv', 'en', 'es', 'tr'];
    const locale = savedLang && supportedLocales.includes(savedLang)
      ? savedLang
      : supportedLocales.includes(browserLang)
        ? browserLang
        : 'sv';

    const token = localStorage.getItem('cvita_token');
    const user = localStorage.getItem('cvita_user');
    if (token && user) {
      window.location.replace(`/${locale}/dashboard`);
    } else {
      window.location.replace(`/${locale}/auth`);
    }
  }, []);

  return null;
}
