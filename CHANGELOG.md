# CVzume Changelog

## v4.7 — 2026-11-07
- Google ile giriş onarıldı: dönüş sayfası (auth-callback.html) eski statik dosyalarla silinmişti; dönüş artık /<dil>/auth?mode=oauth, oturum açılıp doğrudan başvuru akışına geçiliyor
- Facebook ile giriş/kayıt eklendi (Supabase'de Facebook sağlayıcısı açılınca düğme kendiliğinden görünür); GitHub düğmesi kaldırıldı
- Google/Facebook hesaplarında ad-soyad given_name/family_name ya da full_name'den alınıyor
- Türkçe sosyal giriş düğmeleri "siz" hitabıyla

## v4.6 — 2026-11-02
- Sosyal gönderiler: her ipucunda CVzume'nin o konuda ne yaptığı + 3 adım (ilanı yapıştır → CV yükle → indir); kartta net çağrı şeridi
- Admin: indirim kodları — oran, süre (ilk ödeme / ilk N ay / her ödeme), son kullanma, kullanım sınırı; oranı listeden değiştir, kapat/aç (Stripe promosyon kodları)
- Admin: kullanıcı silme — ad soyad yazılarak onay (sunucuda da kontrol); verisi ve fotoğrafları silinir, aktif Pro aboneliği iptal edilir; admin hesabı silinemez

## v4.5 — 2026-11-02
- Admin: "Paylaşım hazırlığı" bölümü — her ipucu ve dil (Forum İsveç dahil) için indirilebilir görsel, kopyalanabilir Facebook ve Instagram metni, önerilen gruplar
- Günlük grup e-postası kaldırıldı (içerik artık admin panelinde)

## v4.4 — 2026-11-02
- Sosyal medya: Instagram'a da günlük otomatik gönderi (anahtar eklendi)
- Forum İsveç sayfasına pazartesi/çarşamba/cuma Türkçe, İsveç'e göre uyarlanmış ipucu (FORUM_PAGE_ID/FORUM_PAGE_TOKEN)

## v4.3 — 2026-11-02
- Yeni başvuruda belge dili seçimi: CV ve mektup ilanın dilinde (otomatik) ya da seçilen dilde; uyum analizi ve ipuçları arayüz dilinde kalır (ör. Türkçe arayüz, İsveççe CV)
- Uyarlanmış CV'de unvan, eğitim, beceriler ve diller de belge diline çevriliyor; karşılığı olmayan dereceler açıklamayla korunuyor
- CV başlıkları belgenin dilinde (önizleme, PDF, Word); dil seviyeleri abartılmıyor

## v4.2 — 2026-11-01
- Sosyal medya: her gün 07:00 UTC'de Facebook sayfası ve Instagram'a o günün dilinde iş arama ipucu (21 ipucu × 5 dil, otomatik kart görseli)
- Her sabah hello@cvzume.com'a gruplar için 5 dilde hazır metin ve önerilen grup listesi

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
