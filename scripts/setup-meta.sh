#!/bin/bash
# Facebook sayfası + Instagram otomatik gönderisi için Meta anahtarlarını Vercel'e yazar.
# Anahtarlar ekrana yazılmaz, sohbete girmez: betik panoyu izler, kopyaladığınız değeri alır.
# Kullanım: scripts/setup-meta.sh <APP_ID> [SAYFA_ADI] [ÖNEK]
#   CVzume sayfası:   scripts/setup-meta.sh <APP_ID>                  → META_PAGE_ID, META_PAGE_TOKEN, META_IG_ID
#   Forum İsveç:      scripts/setup-meta.sh <APP_ID> "forum" FORUM    → FORUM_PAGE_ID, FORUM_PAGE_TOKEN
#   1) Meta uygulamasının App Secret'ını kopyalayın (App settings → Basic → App secret → Show → kopyala)
#   2) Graph API Explorer'da ürettiğiniz User access token'ı kopyalayın
# Betik kısa ömürlü anahtarı uzun ömürlüye çevirir, CVzume sayfasının süresiz sayfa anahtarını ve
# Instagram hesap kimliğini bulur, META_PAGE_ID / META_PAGE_TOKEN / META_IG_ID olarak Production'a yazar.
cd "$(dirname "$0")/.." || exit 1
APP_ID="$1"
PAGE_MATCH="${2:-cvzume}"
PREFIX="${3:-META}"
[ -z "$APP_ID" ] && { echo "Kullanım: scripts/setup-meta.sh <APP_ID> [SAYFA_ADI] [ÖNEK]"; exit 1; }
G=https://graph.facebook.com/v23.0

# Panoyu 5 dakika izler; App Secret (32 hex) ve kullanıcı anahtarını (EAA…) hangi sırayla kopyalanırsa alır.
echo "→ App Secret'ı ve Graph API Explorer'daki Access Token'ı kopyalayın, sıra fark etmez (5 dakika bekliyorum)..."
SECRET=""; SHORT=""
for i in $(seq 1 300); do
  c=$(pbpaste | tr -d '[:space:]')
  if [ -z "$SECRET" ] && echo "$c" | grep -Eq '^[0-9a-f]{32}$'; then SECRET="$c"; echo "✓ App Secret alındı."; fi
  if [ -z "$SHORT" ] && echo "$c" | grep -Eq '^EAA'; then SHORT="$c"; echo "✓ Access Token alındı."; fi
  [ -n "$SECRET" ] && [ -n "$SHORT" ] && break
  sleep 1
done
[ -z "$SECRET" ] && { echo "✗ App Secret gelmedi (32 karakter, harf/rakam). Tekrar çalıştırın."; exit 1; }
[ -z "$SHORT" ] && { echo "✗ Access Token gelmedi (EAA… ile başlar). Tekrar çalıştırın."; exit 1; }
printf '' | pbcopy

LONG=$(curl -s "$G/oauth/access_token?grant_type=fb_exchange_token&client_id=$APP_ID&client_secret=$SECRET&fb_exchange_token=$SHORT" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin).get("access_token",""))')
[ -z "$LONG" ] && { echo "✗ Meta anahtarı uzun ömürlüye çevirmedi. App ID ve App Secret aynı uygulamaya mı ait?"; exit 1; }
echo "✓ Uzun ömürlü anahtar alındı."

# Uzun ömürlü kullanıcı anahtarından alınan sayfa anahtarı süresizdir.
OUT=$(curl -s "$G/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=$LONG" | PAGE_MATCH="$PAGE_MATCH" python3 -c '
import os
import json, sys
d = json.load(sys.stdin)
pages = d.get("data", [])
if not pages:
    print("ERR " + d.get("error", {}).get("message", "Sayfa bulunamadı (pages_show_list izni verildi mi?)")); sys.exit()
want = os.environ["PAGE_MATCH"].lower()
p = next((x for x in pages if want in x["name"].lower()), None)
if not p:
    print("ERR Adında \"" + want + "\" geçen sayfa yok (token oluştururken o sayfayı da seçin). Görünen sayfalar: " + ", ".join(x["name"] for x in pages)); sys.exit()
print(p["id"], p.get("instagram_business_account", {}).get("id", "-"), p["access_token"], p["name"])
')
case "$OUT" in ERR*) echo "✗ ${OUT#ERR }"; exit 1 ;; esac
read -r PAGE_ID IG_ID PAGE_TOKEN PAGE_NAME <<< "$OUT"
echo "✓ Sayfa: $PAGE_NAME ($PAGE_ID)"
if [ "$PREFIX" = "META" ]; then
  [ "$IG_ID" = "-" ] && echo "⚠ Sayfaya bağlı Instagram işletme hesabı görünmüyor; yalnızca Facebook'a gönderilecek." || echo "✓ Instagram hesabı: $IG_ID"
fi

put() { vercel env rm "$1" production --yes >/dev/null 2>&1; printf '%s' "$2" | vercel env add "$1" production >/dev/null 2>&1 || { echo "✗ $1 Vercel'e yazılamadı."; exit 1; }; }
put "${PREFIX}_PAGE_ID" "$PAGE_ID"
put "${PREFIX}_PAGE_TOKEN" "$PAGE_TOKEN"
[ "$PREFIX" = "META" ] && [ "$IG_ID" != "-" ] && put META_IG_ID "$IG_ID"
echo "✓ Vercel'e kaydedildi (Production). Bir sonraki yayından itibaren her gün 07:00 UTC'de gönderi atılır."
