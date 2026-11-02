# Sosyal medya otomasyonu

Her gün 07:00 UTC (`vercel.json` → `/api/cron/social`):
1. **Facebook sayfası + Instagram**: günün ipucu, günün dilinde (sv → en → de → es → tr sırasıyla döner), kart görseliyle.
2. **Elle paylaşım**: Admin → "Paylaşım hazırlığı" — her ipucu/dil için görsel + Facebook/Instagram metni + önerilen gruplar. Gruplara elle yapıştırılır — Meta, gruplara API ile paylaşımı 2024'te kapattı. (Günlük e-posta v4.5'te kaldırıldı.)

## Dosyalar
- `src/lib/social/tips.ts` — 21 ipucu × 5 dil (sayı 5'in katı olmasın)
- `src/lib/social/groups.ts` — önerilen gruplar; "(arama)" olanları katıldığınız gerçek grupla değiştirin
- `src/lib/social/posts.ts` — günün seçimi, gönderi metinleri, UTM'li linkler
- `/api/social/card?tip=<id>&lang=<dil>` — 1080×1350 JPEG kart
- Deneme: `curl -H "Authorization: Bearer $CRON_SECRET" "https://www.cvzume.com/api/cron/social?dry=1"` (hiçbir şey göndermez)

## Meta kurulumu (bir kez)
1. https://developers.facebook.com/apps → **Create app** → kullanım alanı: *Manage everything on your Page* (+ Instagram için *Manage messaging & content on Instagram*). İşletme portföyü sorarsa CVzume'yi seçin.
2. **App settings → Basic**: Privacy policy URL `https://www.cvzume.com/sv/legal/privacy`, kategori *Business*, kaydet. Üstteki **App Mode**'u *Live* yapın (yoksa API gönderilerini yalnız siz görürsünüz).
3. **Tools → Graph API Explorer**: sağda uygulamayı seçin, *User Token*, izinler:
   `pages_show_list, pages_read_engagement, pages_manage_posts, instagram_basic, instagram_content_publish, business_management` → **Generate Access Token** → CVzume sayfasını ve Instagram hesabını işaretleyin.
4. Terminalde: `scripts/setup-meta.sh <APP_ID>` → önce App Secret'ı, sonra Explorer'daki token'ı kopyalayın. Betik süresiz sayfa anahtarını Vercel'e yazar.
5. Sonraki yayından itibaren çalışır.

## Forum İsveç (ikinci sayfa)
- Pazartesi/çarşamba/cuma 07:00 UTC, Türkçe; Türkiye'ye özgü ipuçlarının İsveç sürümü `tips.ts` → `trSE`
- Bağlantı: Explorer'da token üretirken Forum İsveç sayfasını da seçin, sonra
  `scripts/setup-meta.sh <APP_ID> "forum" FORUM` → `FORUM_PAGE_ID`, `FORUM_PAGE_TOKEN`
- Env eklendikten sonra yeniden yayın gerekir (`vercel redeploy <prod-url> --target production`)
