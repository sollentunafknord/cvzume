-- Landing demo'sunun (/api/ai/demo) deneme sayacı.
-- Satır başına bir deneme; IP'nin kendisi değil tuzlu sha256 hash'i saklanır.
-- 2 günden eski satırlar API tarafından siliniyor, tablo hep küçük kalır.
create table if not exists public.demo_usage (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists demo_usage_ip_created_idx on public.demo_usage (ip_hash, created_at);
create index if not exists demo_usage_created_idx on public.demo_usage (created_at);

-- Sadece sunucu (service_role) erişir; anon/authenticated için policy yok.
alter table public.demo_usage enable row level security;

-- 30 Ekim 2026'dan sonra yeni tablolara Data API grant'i otomatik verilmiyor.
grant select, insert, delete on public.demo_usage to service_role;
grant usage, select on sequence public.demo_usage_id_seq to service_role;
