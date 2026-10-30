-- Güvenlik: Pro ve ücretsiz kota artık sunucuda (service_role) yönetiliyor.
-- 1) Kullanıcı kendi usage_limits satırını yazıp sayacını sıfırlayamasın (okuyabilir).
revoke insert, update, delete on public.usage_limits from anon, authenticated;

-- 2) Kullanıcı kendi profiles satırına is_pro_override = true yazıp kendini Pro yapamasın.
--    Profil kaydı (upsert) çalışmaya devam eder; sadece bu kolon korunur.
create or replace function public.protect_pro_override() returns trigger
language plpgsql as $$
begin
  if current_user not in ('service_role', 'postgres', 'supabase_admin') then
    if tg_op = 'INSERT' then
      new.is_pro_override := false;
    else
      new.is_pro_override := old.is_pro_override;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists protect_pro_override on public.profiles;
create trigger protect_pro_override
  before insert or update on public.profiles
  for each row execute function public.protect_pro_override();
