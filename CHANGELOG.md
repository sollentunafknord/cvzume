# CVzume Changelog

## v4.1 — 2026-11-01
- Admin: Google Analytics, Vercel Analytics, Stripe ve Supabase panellerine tek tıkla bağlantılar

## v4.0 — 2026-11-01
Yeni görünüm ve rehberli başvuru akışı.
- Rehberli akış girişten sonraki ana sayfa: hazır CV yükle ya da soru-cevapla oluştur → ilan → uyum (eksikleri sor) → uyarlanmış CV → mektup; adres dile göre (/tr/basvuru, /sv/ansok, /en/apply, /es/solicitud, /de/bewerbung)
- Görsel kimlik: Lexend + mat Nane paleti tüm sitede; açık renkli sol menü; yeni logo renkleri
- Başvurularım baştan tasarlandı; CV'm akıştaki CV görünümünü açıyor; Ayarlar yeni tasarımda
- PDF/Word: tarayıcı başlık/altbilgisi yok, mektup biçimi, ücretsiz planda belgenin dilinde küçük CVzume ibaresi; PDF yükleme Vercel'de düzeltildi (unpdf)
- Ödeme: Stripe canlı (109 SEK/ay, 999 SEK/yıl), ödeme sayfası müşterinin dilinde, cayma hakkı notu
- Şifre sıfırlama ve kayıt doğrulama e-postaları noreply@cvzume.com'dan, kullanıcının dilinde; yanıtlar hello@cvzume.com'a
- Admin: Aktivite istatistikleri (kayıt, başvuru, mektup, huni, günlük grafikler)
- Google Analytics çerez onayıyla; çerez ve gizlilik metinleri güncellendi
- Güvenlik: e-posta doğrulaması, şifre sıfırlama sadece sıfırlama linkiyle, admin listesi istemci kodundan çıkarıldı, iş arama uçlarına sınır, oturum anahtarı otomatik yenileniyor
- Yükseltme sayfası 5 dilde, 3 paket yan yana; iş arama düğmesi ülkenin kurumuna bağlı; sosyal medya bağlantıları

## v3.4 — 2026-04-23
- Admin paneli: kullanıcı yönetimi, plan değiştirme, şifre sıfırlama (sadece cyesil@gmail.com)
- Onboarding modal: tüm diller kendi kartında gösteriliyor, gerçek bayrak görselleri
- Sök jobb sidebar sırası: Dashboard'ın hemen altına taşındı
- FavoritesTab: cvita_profile_${locale} ile CV kontrolü düzeltildi
- Sidebar: isPro state ile dil geçişi düzeltildi
- Versiyon numarası sistemi eklendi

## v3.3 — 2026-04-20
- Composite PK bug fix: tüm Supabase sorgularına locale eklendi
- PasswordTab, AccountTab: tüm İsveççe metinler çevrildi
- NewApplicationModal: analyzeMsg ve alert metinleri çevrildi
- SettingsClient: name_required validasyonu çevrildi
- is_pro_override: DB kolonu + Mina Aktamış Pro yapıldı

## v3.2 — 2026-04-19
- Multi-language CV izolasyonu: profiles tablosuna (id, locale) composite PK
- Dil geçiş kapısı: Free kullanıcılar sadece default dil, Pro tüm diller
- OnboardingModal: kullanıcı ilk girişte CV dili seçiyor
- Sidebar: Pro/Free dil kapısı, upgrade modal
- AI çıktıları locale'e göre doğru dilde üretiliyor
- Settings sayfasına profil fotoğrafı yükleme eklendi

## v3.1 — 2026-04-18
- Dashboard, Sidebar tam i18n (İsveççe hardcode kaldırıldı)
- ProfileClient, LetterClient tam i18n
- AI analyze + interview API'leri locale'e göre dil üretiyor
- Skickade, Intervju, Archive sayfaları eklendi
- Favori yıldız animasyonu düzeltildi
- Avatar görüntüleme + PDF fotoğraf desteği
