'use client';

import { flowPath } from '@/lib/flow-path';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    if (window.location.hostname === 'c-vita.vercel.app') {
      window.location.replace('https://www.cvzume.com' + window.location.pathname + window.location.search);
      return;
    }

    const savedLang = localStorage.getItem('cvita_language');
    const browserLang = navigator.language.split('-')[0];
    const supportedLocales = ['sv', 'en', 'es', 'tr', 'de'];
    const locale = savedLang && supportedLocales.includes(savedLang)
      ? savedLang
      : supportedLocales.includes(browserLang)
        ? browserLang
        : 'sv';

    const token = localStorage.getItem('cvita_token');
    const user = localStorage.getItem('cvita_user');
    if (token && user) {
      window.location.replace(flowPath(locale));
    } else {
      window.location.replace(`/${locale}`);
    }
  }, []);

  return null;
}
