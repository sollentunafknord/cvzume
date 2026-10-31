-- avatars kovası: eskiden girişsiz (anon anahtarla) herkes dosya yükleyebiliyor/üzerine yazabiliyordu.
-- Artık: okuma herkese açık (CV/profil resmi), yükleme sadece giriş yapmış kullanıcı ve sadece
-- kendi klasörüne (<user id>/...). Kova sadece 2 MB'a kadar JPG/PNG/WebP kabul eder (HTML vb. barındırılamaz).

-- 1) Kova ayarları
update storage.buckets
set public = true,
    file_size_limit = 2097152,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'avatars';

-- 2) avatars'a dokunan eski kuralların hepsini kaldır
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%avatars%'
  loop
    execute format('drop policy %I on storage.objects', r.policyname);
  end loop;
end $$;

-- 3) Yeni kurallar: kullanıcı sadece kendi klasörüne yükler, kendi dosyalarını görür/siler
create policy "avatars: own folder insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars: own folder select" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars: own folder delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Kontrol: kalan avatars kuralları (3 satır görmelisiniz)
select policyname, cmd, roles from pg_policies
where schemaname = 'storage' and tablename = 'objects' and (coalesce(qual, '') || coalesce(with_check, '')) like '%avatars%';
