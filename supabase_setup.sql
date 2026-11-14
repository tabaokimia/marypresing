-- =====================================================================
--  MARY'S SERVICE PRESSING : installation de la base de données
--  À coller dans Supabase > SQL Editor > New query > Run
--  (une seule fois)
-- =====================================================================

-- 1) Les trois tables --------------------------------------------------
create table if not exists public.commandes_en_ligne (
  id          text primary key,
  created_at  timestamptz not null default now(),
  saisie      boolean not null default false,
  data        jsonb not null
);

create table if not exists public.livreurs (
  id           uuid primary key default gen_random_uuid(),
  uid          uuid,
  nom          text not null,
  tel          text not null,
  login_email  text not null,
  created_at   timestamptz not null default now()
);

create table if not exists public.missions (
  id          text primary key,
  cle         text not null,
  livreur_id  uuid references public.livreurs(id) on delete cascade,
  type        text not null check (type in ('collecte','livraison')),
  statut      text not null default 'a_livrer',
  note        text,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
create index if not exists missions_livreur_idx on public.missions(livreur_id);
create index if not exists missions_cle_idx     on public.missions(cle);

-- 2) Qui est l'administrateur ? (CHANGEZ L'E-MAIL SI BESOIN) -----------
create or replace function public.is_admin() returns boolean
language sql stable as $$
  select lower(coalesce(auth.jwt() ->> 'email','')) = 'maryservice242@gmail.com'
$$;

-- 3) Fonctions utilitaires ---------------------------------------------
create or replace function public.my_livreur_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.livreurs where uid = auth.uid() limit 1
$$;

-- permet à un livreur de se connecter avec son numéro de téléphone
create or replace function public.login_alias(p_tel text) returns text
language sql stable security definer set search_path = public as $$
  select login_email from public.livreurs
  where right(regexp_replace(tel,'\D','','g'),8) = right(regexp_replace(p_tel,'\D','','g'),8)
  order by created_at desc limit 1
$$;
grant execute on function public.login_alias(text) to anon, authenticated;

-- 4) Sécurité (RLS) : qui a le droit de faire quoi ----------------------
alter table public.commandes_en_ligne enable row level security;
alter table public.livreurs           enable row level security;
alter table public.missions           enable row level security;

drop policy if exists "clients envoient leur commande" on public.commandes_en_ligne;
create policy "clients envoient leur commande" on public.commandes_en_ligne
  for insert to anon, authenticated with check (true);

drop policy if exists "admin gere les commandes" on public.commandes_en_ligne;
create policy "admin gere les commandes" on public.commandes_en_ligne
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin gere les livreurs" on public.livreurs;
create policy "admin gere les livreurs" on public.livreurs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "livreur lit son profil" on public.livreurs;
create policy "livreur lit son profil" on public.livreurs
  for select to authenticated using (uid = auth.uid());

drop policy if exists "admin gere les missions" on public.missions;
create policy "admin gere les missions" on public.missions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "livreur voit ses missions" on public.missions;
create policy "livreur voit ses missions" on public.missions
  for select to authenticated using (livreur_id = public.my_livreur_id());

drop policy if exists "livreur met a jour ses missions" on public.missions;
create policy "livreur met a jour ses missions" on public.missions
  for update to authenticated using (livreur_id = public.my_livreur_id()) with check (livreur_id = public.my_livreur_id());

drop policy if exists "livreur supprime ses missions" on public.missions;
create policy "livreur supprime ses missions" on public.missions
  for delete to authenticated using (livreur_id = public.my_livreur_id());

-- Terminé. Retournez dans les réglages d'authentification (voir LISEZ-MOI).
