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
- [ ] Soru tarzı: kart kart mı, sohbet mi? — konuşulacak
- [x] Ücretsiz plan: ayda 2 başvuru; ücretsiz CV/mektup PDF'lerinde küçük "CVzume ile oluşturuldu" ibaresi, Pro'da yok

## Yapılacaklar (sonra)
- [ ] 2–3 CV şablonu, Pro kullanıcılara sunulacak — birlikte düşünülecek
- [ ] Tıklanabilir taslak (prototip) → birlikte üzerinden geçilecek → sonra kodlama
