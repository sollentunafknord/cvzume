import type { Metadata } from 'next';
import AuthClient from './AuthClient';

const BASE_URL = 'https://www.cvzume.com';

const TITLES: Record<string, string> = {
  sv: 'Logga in eller skapa konto — CVzume',
  en: 'Log In or Create Account — CVzume',
  es: 'Iniciar sesión o Crear cuenta — CVzume',
  tr: 'Giriş Yap veya Hesap Oluştur — CVzume',
};

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: TITLES[locale] ?? TITLES.sv,
    robots: 'noindex, nofollow',
    alternates: { canonical: `${BASE_URL}/${locale}/auth` },
  };
}

export default function AuthPage() {
  return <AuthClient />;
}
