'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';

export default function LocalePage() {
  const locale = useLocale();

  useEffect(() => {
    const token = localStorage.getItem('cvita_token');
    const user = localStorage.getItem('cvita_user');
    if (token && user) {
      window.location.replace(`/${locale}/dashboard`);
    } else {
      window.location.replace(`/${locale}/auth`);
    }
  }, [locale]);

  return null;
}
