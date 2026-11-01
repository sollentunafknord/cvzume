#!/bin/bash
# Canlı Stripe anahtarını Vercel'e güvenle yazar (anahtar ekrana yazılmaz, sohbete girmez).
# Kullanım: önce bu betiği çalıştır, SONRA Stripe panelinde Secret key'i kopyala.
# Betik panoyu 5 dakika izler; sk_live_/rk_live_ görünce Stripe'ta doğrular, Vercel'e yazar, panoyu temizler.
cd "$(dirname "$0")/.." || exit 1
echo "Şimdi Stripe → Developers → API keys → Secret key için 'Copy'ye basın (5 dakika bekliyorum)..."
key=""
for i in $(seq 1 300); do
  c=$(pbpaste | tr -d '[:space:]')
  case "$c" in sk_live_*|rk_live_*) key="$c"; break ;; esac
  sleep 1
done
[ -z "$key" ] && { echo "✗ Panoda canlı anahtar görmedim (sk_live_… ile başlamalı). Tekrar deneyin."; exit 1; }
code=$(curl -s -o /dev/null -w '%{http_code}' -u "$key:" https://api.stripe.com/v1/balance)
[ "$code" != "200" ] && { echo "✗ Stripe bu anahtarı kabul etmedi (HTTP $code). Doğru anahtarı kopyaladığınızdan emin olun."; exit 1; }
echo "✓ Anahtar Stripe'ta doğrulandı."
vercel env rm STRIPE_LIVE_SECRET_KEY production --yes >/dev/null 2>&1
printf '%s' "$key" | vercel env add STRIPE_LIVE_SECRET_KEY production >/dev/null 2>&1 && echo "✓ Vercel'e kaydedildi (Production)." || { echo "✗ Vercel'e yazılamadı."; exit 1; }
printf '' | pbcopy
echo "✓ Pano temizlendi. Yeni değer bir sonraki yayında devreye girer."
