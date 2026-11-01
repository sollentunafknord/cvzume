# CVzume — rehberli akış planı

Amaç: kullanıcıyı elinden tutup başvurunun sonuna kadar götüren basit bir asistan.
Her ekranda tek soru, büyük butonlar, ilerleme çubuğu, otomatik kayıt, önce mobil.

## Akış
1. Giriş
2. İlk kez geliyorsa — CV'yi hazırlayalım (bir kerelik):
   "Elinde hazır bir CV var mı?"
   - Evet → PDF/Word yükle → okunur → bizim formatımıza çevrilir
   - Hayır → soru-cevapla CV oluşturulur
   → Kontrol paneli (düzelt) → Kaydet → standart görünüm (fotoğraflı) + PDF
3. "Hangi ilana başvuruyorsun?" (link veya metin)
4. Karşılaştırma: 🟢 ≥70 / 🟡 40–69 / 🔴 <40, eksikler listesi
   - Eksik her madde için: "Bu deneyimin var mı ama CV'ne yazmadın mı?" (evetse gerçek bilgi eklenir)
   - Asla engelleme: "Yine de başvur" / "Vazgeç"
5. İlana uyarlanmış CV → kontrol → PDF
6. Kişisel mektup → kontrol → PDF
7. Bitti → "Başvurularım"a kaydedildi
CV kayıtlıysa sonraki başvurular doğrudan 3. adımdan başlar.

## Soru-cevap (hazır CV yoksa)
1. Ad soyad
2. Telefon + tam adres
3. Fotoğraf (isteğe bağlı)
4. Aranan iş / unvan
5. Çalıştın mı? Evet → her iş: unvan, şirket, tarihler, "neler yaptın?" (serbest metin → AI madde) → başka iş?
   Hayır → staj / gönüllü / okul projesi
6. Eğitim (okul, bölüm, yıl, "hâlâ okuyorum")
7. Diller + seviye
8. Ehliyet
9. Beceriler (aranan işe göre AI önerir, tıklayarak seçilir)
10. Profil yazısı sorulmaz — AI cevaplardan yazar, kullanıcı düzeltir

## Kararlar (2026-10-31)
- [x] İlk girişte sıra: önce CV (bir kerelik), sonra ilan
- [x] Adres: tam adres sorulur
- [x] Şablon: şimdilik tek standart şablon
- [x] Soru tarzı: kart kart; sadece "o işte neler yaptın?" serbest anlatım (yazı veya mikrofon) → AI CV maddesine çevirir, kullanıcı onaylar
- [x] Ücretsiz plan: ayda 2 başvuru; CV ve mektubun en altında ortada küçük açık gri "Skapad med CVzume · cvzume.com" (dile göre), Pro'da yok; Word'de silinebilir, kabul

## Tasarım kararı
- Sitenin genel görünümü telefon akışındaki mantıkla: tek sütun, tek soru, büyük butonlar.
  Bilgisayarda alanlar daha büyük ve ekrana oturan (ortalanmış geniş sütun), menü kalabalığı yok.

## Görsel kimlik (2026-10-31)
- Yazı tipi: Lexend (okumayı kolaylaştırmak için tasarlanmış; ilk dili farklı iş arayanlar için de rahat)
- Mat pastel renkler, keskin renk yok; fosforlu kalem/vurgu işaretleri yok
- Paletler: 1 Nane (ücretsiz plan, varsayılan) · 2 Gökyüzü · 3 Kayısı — Pro kullanıcı üçü arasından seçer
  (uygulama renkleri + CV/PDF başlık rengi)
- Önizleme: https://claude.ai/artifact/C3y7PRVEwE1joqBY76JfAJ

## Site geneli yeni görünüm (2026-11-01)
- globals.css: Lexend + Nane paleti (eski değişken adları --navy/--blue… yeni değerlerle); sayfa dosyalarındaki eski mavi/yeşil kodlar çevrildi
- Uygulama: koyu kenar menüsü yerine üst çubuk (logo + ☰) ve sağdan açılan açık menü; içerik ortada
- Logo, simgeler, e-postalar, paylaşım görseli ve Word/PDF varsayılan renkleri yeni palette

## Test ve yayın
- Taslak: https://www.cvzume.com/yedek/akis.html (gizli, noindex)
- Gerçek akış önce gizli bir test adresinde canlıya çıkar (/<dil>/akis), gerçek hesaplarla test edilir;
  onaydan sonra giriş sonrası açılan sayfa olarak devreye alınır. Ana sayfaya doğrudan konmaz.

## Yapılacaklar (sonra)
- [ ] 2–3 CV şablonu, Pro kullanıcılara sunulacak — birlikte düşünülecek
- [x] Tıklanabilir taslak (prototip)
- [x] Gerçek akış: /<dil>/akis — 2026-11-01 girişten sonra açılan ana sayfa (eski /ny oraya yönlenir)
- [ ] Site bittiğinde: robots.txt ve sitemap'i gözden geçir (/yedek/ ve /<dil>/akis kurallarını kaldır,
      yeni sayfaları ekle, eski /dashboard vb. kurallarını temizle), /yedek/ klasörünü sil
- [ ] Palet seçimini profile kaydet (şimdilik tarayıcıda) ve Ayarlar'a da koy; ücretsiz kullanıcıya kilitli önizleme (Pro tanıtımı)
- [ ] **ÖDEME — Stripe canlıda (2026-11-01)**
      - [x] Stripe hesabı live (Individual), Radar Standard, vergi: "not selling yet"
      - [x] Canlı ürün/fiyatlar: CVzume Pro prod_VXqzYaZ3qpvZcB · 109 SEK/ay price_1UWlHRGnK5c1KgO9lQJFbPgF · 999 SEK/yıl price_1UWlHSGnK5c1KgO9ct1koSx2 (kodda: src/lib/stripe-plan.ts)
      - [x] Webhook https://www.cvzume.com/api/stripe/webhook (checkout.session.completed, customer.subscription.deleted); STRIPE_WEBHOOK_SECRET + STRIPE_LIVE_SECRET_KEY sadece Production'da; önizleme test anahtarında
      - [x] Ödeme sayfası müşterinin dilinde, doğru sayfaya dönüş, cayma hakkı notu, mevcut müşteriyi kullanma
      - [ ] Gerçek kartla uçtan uca test: ücretsiz test hesabı → Pro 109 SEK → Pro açılıyor mu + onay e-postası → portaldan iptal → Stripe'tan iade
      - [ ] F-skatt (skatteverket.se/verksamt.se, ücretsiz) — gerçek müşteriden para almadan önce
      - [ ] Moms durumu (muafiyet sınırı 2026'da yükseltildi, güncel rakamı Skatteverket'ten kontrol et); gerekirse Stripe Tax
      - [ ] Yasal metinlere satıcı bilgisi (ad, adres, organisationsnummer = personnummer)
- [x] Sosyal medya: facebook.com/cvzume ve instagram.com/cvzume açıldı, sitenin altında linkleri var; ilk 5 gönderi hazır (docs/sosyal-medya-gonderiler.md)
- [ ] Sosyal medya: Instagram'ı Facebook sayfasına bağla, gönderileri paylaş; sonra Meta API ile otomatik paylaşım
- [ ] LinkedIn (sonra): şirket sayfası + entegrasyon fikirleri — "LinkedIn ile giriş", LinkedIn profilinden CV'yi içe aktarma,
      hazırlanan başvuruyu/ilanı LinkedIn'de paylaşma; LinkedIn API izinleri ve kuralları önce incelenmeli
- [x] Yeni akışın İspanyolca ve Almanca metinleri
