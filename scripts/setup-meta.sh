#!/bin/bash
# Facebook sayfası + Instagram otomatik gönderisi için Meta anahtarlarını Vercel'e yazar.
# Anahtarlar ekrana yazılmaz, sohbete girmez: betik panoyu izler, kopyaladığınız değeri alır.
# Kullanım: scripts/setup-meta.sh <APP_ID>
#   1) Meta uygulamasının App Secret'ını kopyalayın (App settings → Basic → App secret → Show → kopyala)
#   2) Graph API Explorer'da ürettiğiniz User access token'ı kopyalayın
# Betik kısa ömürlü anahtarı uzun ömürlüye çevirir, CVzume sayfasının süresiz sayfa anahtarını ve
# Instagram hesap kimliğini bulur, META_PAGE_ID / META_PAGE_TOKEN / META_IG_ID olarak Production'a yazar.
cd "$(dirname "$0")/.." || exit 1
APP_ID="$1"
[ -z "$APP_ID" ] && { echo "Kullanım: scripts/setup-meta.sh <APP_ID>"; exit 1; }
G=https://graph.facebook.com/v23.0

wait_clip() { # $1 = açıklama, $2 = desen (grep -E)
  echo "→ Şimdi $1 kopyalayın (3 dakika bekliyorum)..." >&2
  local before; before=$(pbpaste)
  for i in $(seq 1 180); do
    c=$(pbpaste | tr -d '[:space:]')
    if [ "$c" != "$before" ] && echo "$c" | grep -Eq "$2"; then printf '%s' "$c"; return 0; fi
    sleep 1
  done
  return 1
}

SECRET=$(wait_clip "App Secret'ı" '^[0-9a-f]{32}$') || { echo "✗ Panoda App Secret görmedim (32 karakterlik harf/rakam)."; exit 1; }
echo "✓ App Secret alındı."
SHORT=$(wait_clip "Graph API Explorer'daki User access token'ı" '^EAA') || { echo "✗ Panoda anahtar görmedim (EAA… ile başlamalı)."; exit 1; }
echo "✓ Kullanıcı anahtarı alındı."
printf '' | pbcopy

LONG=$(curl -s "$G/oauth/access_token?grant_type=fb_exchange_token&client_id=$APP_ID&client_secret=$SECRET&fb_exchange_token=$SHORT" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin).get("access_token",""))')
[ -z "$LONG" ] && { echo "✗ Meta anahtarı uzun ömürlüye çevirmedi. App ID ve App Secret aynı uygulamaya mı ait?"; exit 1; }
echo "✓ Uzun ömürlü anahtar alındı."

# Uzun ömürlü kullanıcı anahtarından alınan sayfa anahtarı süresizdir.
OUT=$(curl -s "$G/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=$LONG" | python3 -c '
import json, sys
d = json.load(sys.stdin)
pages = d.get("data", [])
if not pages:
    print("ERR " + d.get("error", {}).get("message", "Sayfa bulunamadı (pages_show_list izni verildi mi?)")); sys.exit()
p = next((x for x in pages if "cvzume" in x["name"].lower()), pages[0] if len(pages) == 1 else None)
if not p:
    print("ERR CVzume adlı sayfa yok: " + ", ".join(x["name"] for x in pages)); sys.exit()
print(p["id"], p.get("instagram_business_account", {}).get("id", "-"), p["access_token"], p["name"])
')
case "$OUT" in ERR*) echo "✗ ${OUT#ERR }"; exit 1 ;; esac
read -r PAGE_ID IG_ID PAGE_TOKEN PAGE_NAME <<< "$OUT"
echo "✓ Sayfa: $PAGE_NAME ($PAGE_ID)"
[ "$IG_ID" = "-" ] && echo "⚠ Sayfaya bağlı Instagram işletme hesabı görünmüyor; yalnızca Facebook'a gönderilecek." || echo "✓ Instagram hesabı: $IG_ID"

put() { vercel env rm "$1" production --yes >/dev/null 2>&1; printf '%s' "$2" | vercel env add "$1" production >/dev/null 2>&1 || { echo "✗ $1 Vercel'e yazılamadı."; exit 1; }; }
put META_PAGE_ID "$PAGE_ID"
put META_PAGE_TOKEN "$PAGE_TOKEN"
[ "$IG_ID" != "-" ] && put META_IG_ID "$IG_ID"
echo "✓ Vercel'e kaydedildi (Production). Bir sonraki yayından itibaren her gün 07:00 UTC'de gönderi atılır."
