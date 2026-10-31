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

## Test ve yayın
- Taslak: https://www.cvzume.com/yedek/akis.html (gizli, noindex)
- Gerçek akış önce gizli bir test adresinde canlıya çıkar (/<dil>/akis), gerçek hesaplarla test edilir;
  onaydan sonra giriş sonrası açılan sayfa olarak devreye alınır. Ana sayfaya doğrudan konmaz.

## Yapılacaklar (sonra)
- [ ] 2–3 CV şablonu, Pro kullanıcılara sunulacak — birlikte düşünülecek
- [x] Tıklanabilir taslak (prototip)
- [ ] Gerçek akış: /<dil>/akis test adresinde
- [ ] Site bittiğinde: robots.txt ve sitemap'i gözden geçir (/yedek/ ve /<dil>/akis kurallarını kaldır,
      yeni sayfaları ekle, eski /dashboard vb. kurallarını temizle), /yedek/ klasörünü sil
- [ ] Palet seçimini profile kaydet (şimdilik tarayıcıda) ve Ayarlar'a da koy; ücretsiz kullanıcıya kilitli önizleme (Pro tanıtımı)
- [ ] Yeni akışın İspanyolca ve Almanca metinleri (test sürümünde İngilizce yedek kullanılıyor)
