-- ===============================================
-- MAXIKIA GLOBAL TRAVEL — Configuración de Supabase
-- Cópialo y pégalo en: Supabase → SQL Editor → Run
-- ===============================================

-- 1) Tabla del contenido del sitio (destinos, hoteles, flyer, reels)
create table if not exists site_data (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table site_data enable row level security;

-- Todos pueden LEER el contenido (es un sitio público)
drop policy if exists "leer_site" on site_data;
create policy "leer_site" on site_data for select to anon, authenticated using (true);

-- Solo el administrador (usuario con sesión iniciada) puede MODIFICAR
drop policy if exists "escribir_site" on site_data;
create policy "escribir_site" on site_data for all to authenticated using (true) with check (true);

-- 2) Tabla de solicitudes de reserva
create table if not exists reservas (
  id bigint generated always as identity primary key,
  created_at timestamptz default now(),
  codigo text,
  nombre text,
  telefono text,
  destino text,
  hotel text,
  plan text,
  tarifa text,
  pax text,
  total text
);

alter table reservas enable row level security;

-- Cualquier visitante puede ENVIAR una solicitud
drop policy if exists "crear_reserva" on reservas;
create policy "crear_reserva" on reservas for insert to anon, authenticated with check (true);

-- Solo el administrador puede VERLAS
drop policy if exists "ver_reservas" on reservas;
create policy "ver_reservas" on reservas for select to authenticated using (true);

-- 3) Carpeta de archivos (imágenes y videos) pública
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- Todos pueden VER los archivos
drop policy if exists "ver_media" on storage.objects;
create policy "ver_media" on storage.objects for select to anon, authenticated
  using (bucket_id = 'media');

-- Solo el administrador puede SUBIR archivos
drop policy if exists "subir_media" on storage.objects;
create policy "subir_media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media');

drop policy if exists "actualizar_media" on storage.objects;
create policy "actualizar_media" on storage.objects for update to authenticated
  using (bucket_id = 'media');
