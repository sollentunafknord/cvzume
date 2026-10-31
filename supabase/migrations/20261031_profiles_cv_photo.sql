-- CV fotoğrafı seçimi: '' = profil resmi, 'none' = fotoğraf yok, URL = ayrı CV fotoğrafı (avatars kovası).
alter table public.profiles add column if not exists cv_photo_url text;
