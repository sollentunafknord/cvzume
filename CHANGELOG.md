# CVzume Changelog

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
