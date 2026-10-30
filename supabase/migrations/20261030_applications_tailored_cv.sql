-- "Ny ansökan": ilana uyarlanmış CV'nin tamamı (özet, sıralanmış deneyimler, beceriler) başvuruyla
-- birlikte saklanır; "Mina ansökningar"dan tekrar indirilebilsin. Mevcut tablo → grant'ler aynı kalır.
alter table public.applications add column if not exists tailored_cv jsonb;
