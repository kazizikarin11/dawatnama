-- =====================================================================
-- Dawatnama — initial schema
--
-- Design rules encoded here:
--   * Wedding content is template-independent. The chosen design lives in
--     `invitations.template_id` plus `invitation_settings`, never mixed into
--     the content tables.
--   * One user has many invitations; an invitation owns its events, venues,
--     gallery, story, contacts, RSVP configuration and responses.
--   * Deletes are soft (`invitations.archived_at`) so an author can never lose
--     a wedding by mis-tapping.
--   * Every table is protected by row level security. Guests may read only
--     published invitations, and may only insert an RSVP while it is open.
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------

do $$ begin
  create type invitation_status as enum ('draft', 'published');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rsvp_attendance as enum ('attending', 'not-attending');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rsvp_question_type as enum ('text', 'longtext', 'select', 'boolean');
exception when duplicate_object then null; end $$;

do $$ begin
  create type animation_intensity as enum ('calm', 'balanced', 'cinematic');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- templates (catalogue of designs, decoupled from content)
-- ---------------------------------------------------------------------

create table if not exists public.templates (
  id text primary key,
  name text not null,
  tagline text,
  color_scheme text not null default 'light',
  is_active boolean not null default true,
  sort_order integer not null default 0
);

insert into public.templates (id, name, tagline, color_scheme, sort_order) values
  ('royal-emerald',     'Royal Emerald',     'A palace invitation in deep emerald and antique gold.', 'dark',  1),
  ('ivory-rose',        'Ivory & Rose',      'Soft luxury, styled like a fashion editorial.',          'light', 2),
  ('midnight-crescent', 'Midnight Crescent', 'A wedding film opening, lit by moonlight.',             'dark',  3),
  ('mughal-arch',       'Mughal Arch',       'Contemporary South Asian architecture, in sand and sage.', 'light', 4),
  ('minimal-signature', 'Minimal Signature', 'Type, space and photography. Nothing else.',            'light', 5)
on conflict (id) do update
  set name = excluded.name,
      tagline = excluded.tagline,
      color_scheme = excluded.color_scheme,
      sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------
-- invitations
-- ---------------------------------------------------------------------

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,

  slug citext not null,
  status invitation_status not null default 'draft',
  template_id text not null default 'royal-emerald' references public.templates (id),

  wedding_date date,
  wedding_time time,
  hijri_date text,

  invitation_message text,
  family_invitation_wording text,
  family_bride_names text,
  family_groom_names text,
  gratitude_message text,
  closing_message text,

  -- Small, self-contained value objects. Never queried by their internals.
  dress_code jsonb not null default '{}'::jsonb,
  islamic jsonb not null default '{}'::jsonb,
  seo jsonb not null default '{}'::jsonb,

  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint invitations_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60)
);

-- A slug must be globally unique among invitations that still exist.
create unique index if not exists invitations_slug_live_idx
  on public.invitations (slug)
  where archived_at is null;

create index if not exists invitations_owner_idx
  on public.invitations (owner_id, updated_at desc)
  where archived_at is null;

create index if not exists invitations_published_idx
  on public.invitations (slug)
  where status = 'published' and archived_at is null;

drop trigger if exists invitations_touch on public.invitations;
create trigger invitations_touch before update on public.invitations
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- couples  (1:1 with invitation)
-- ---------------------------------------------------------------------

create table if not exists public.couples (
  invitation_id uuid primary key references public.invitations (id) on delete cascade,
  name_order text not null default 'bride-first'
    check (name_order in ('bride-first', 'groom-first')),
  short_description text,

  bride_name text not null default '',
  bride_short_name text,
  bride_parents text,
  bride_description text,
  bride_photo jsonb,

  groom_name text not null default '',
  groom_short_name text,
  groom_parents text,
  groom_description text,
  groom_photo jsonb
);

-- ---------------------------------------------------------------------
-- venues
-- ---------------------------------------------------------------------

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  name text not null default '',
  address text,
  map_link text,
  latitude double precision,
  longitude double precision,
  image jsonb,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists venues_invitation_idx on public.venues (invitation_id);

-- ---------------------------------------------------------------------
-- events  (unlimited, reorderable, individually enabled)
-- ---------------------------------------------------------------------

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  venue_id uuid references public.venues (id) on delete set null,

  name text not null default 'Celebration',
  subtitle text,
  description text,
  event_date date,
  start_time time,
  end_time time,
  dress_code text,
  image jsonb,
  rsvp_required boolean not null default false,
  enabled boolean not null default true,
  sort_order integer not null default 0
);

create index if not exists events_invitation_idx
  on public.events (invitation_id, sort_order);

-- ---------------------------------------------------------------------
-- gallery_images  (also stores the hero, flagged)
-- ---------------------------------------------------------------------

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  url text not null,
  alt text,
  caption text,
  width integer,
  height integer,
  blur_data_url text,
  is_hero boolean not null default false,
  in_gallery boolean not null default true,
  sort_order integer not null default 0
);

create index if not exists gallery_invitation_idx
  on public.gallery_images (invitation_id, sort_order);

-- Exactly one hero per invitation.
create unique index if not exists gallery_single_hero_idx
  on public.gallery_images (invitation_id)
  where is_hero;

-- ---------------------------------------------------------------------
-- story_milestones
-- ---------------------------------------------------------------------

create table if not exists public.story_milestones (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  title text not null default '',
  milestone_date text,
  description text,
  image jsonb,
  sort_order integer not null default 0
);

create index if not exists story_invitation_idx
  on public.story_milestones (invitation_id, sort_order);

-- ---------------------------------------------------------------------
-- contacts
-- ---------------------------------------------------------------------

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  name text not null default '',
  role text,
  phone text,
  whatsapp text,
  sort_order integer not null default 0
);

create index if not exists contacts_invitation_idx
  on public.contacts (invitation_id, sort_order);

-- ---------------------------------------------------------------------
-- music  (1:1)
-- ---------------------------------------------------------------------

create table if not exists public.music (
  invitation_id uuid primary key references public.invitations (id) on delete cascade,
  enabled boolean not null default false,
  url text,
  title text,
  credit text,
  loop_track boolean not null default true
);

-- ---------------------------------------------------------------------
-- invitation_settings  (appearance + section visibility, 1:1)
-- ---------------------------------------------------------------------

create table if not exists public.invitation_settings (
  invitation_id uuid primary key references public.invitations (id) on delete cascade,
  accent text,
  background_variant text not null default 'default',
  typography_variant text not null default 'default',
  animation_intensity animation_intensity not null default 'balanced',
  gallery_style text not null default 'auto',
  sections jsonb not null default '{}'::jsonb
);

-- ---------------------------------------------------------------------
-- rsvp_settings  (1:1)
-- ---------------------------------------------------------------------

create table if not exists public.rsvp_settings (
  invitation_id uuid primary key references public.invitations (id) on delete cascade,
  enabled boolean not null default true,
  deadline date,
  headline text,
  message text,
  confirmation_message text,
  ask_phone boolean not null default true,
  ask_guest_count boolean not null default true,
  max_guests integer not null default 6 check (max_guests between 1 and 50),
  ask_event_selection boolean not null default true,
  ask_meal_preference boolean not null default false,
  meal_options text[] not null default '{}',
  ask_message boolean not null default true
);

create table if not exists public.rsvp_questions (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  label text not null,
  question_type rsvp_question_type not null default 'text',
  options text[] not null default '{}',
  required boolean not null default false,
  sort_order integer not null default 0
);

create index if not exists rsvp_questions_invitation_idx
  on public.rsvp_questions (invitation_id, sort_order);

-- ---------------------------------------------------------------------
-- rsvp_responses
-- ---------------------------------------------------------------------

create table if not exists public.rsvp_responses (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  guest_name text not null check (char_length(trim(guest_name)) between 1 and 120),
  phone text,
  attendance rsvp_attendance not null,
  guest_count integer not null default 1 check (guest_count between 0 and 50),
  event_ids uuid[] not null default '{}',
  meal_preference text,
  message text,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists rsvp_responses_invitation_idx
  on public.rsvp_responses (invitation_id, created_at desc);

-- ---------------------------------------------------------------------
-- Visibility helpers used by the policies below
-- ---------------------------------------------------------------------

create or replace function public.owns_invitation(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.invitations i
    where i.id = target and i.owner_id = auth.uid()
  );
$$;

create or replace function public.invitation_is_public(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.invitations i
    where i.id = target
      and i.status = 'published'
      and i.archived_at is null
  );
$$;

-- RSVP is accepted only while the invitation is published and still open.
create or replace function public.rsvp_is_open(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.invitations i
    join public.rsvp_settings s on s.invitation_id = i.id
    where i.id = target
      and i.status = 'published'
      and i.archived_at is null
      and s.enabled
      and (s.deadline is null or s.deadline >= current_date)
  );
$$;

-- ---------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------

alter table public.profiles            enable row level security;
alter table public.templates           enable row level security;
alter table public.invitations         enable row level security;
alter table public.couples             enable row level security;
alter table public.venues              enable row level security;
alter table public.events              enable row level security;
alter table public.gallery_images      enable row level security;
alter table public.story_milestones    enable row level security;
alter table public.contacts            enable row level security;
alter table public.music               enable row level security;
alter table public.invitation_settings enable row level security;
alter table public.rsvp_settings       enable row level security;
alter table public.rsvp_questions      enable row level security;
alter table public.rsvp_responses      enable row level security;

-- profiles: a user sees and edits only their own profile.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- templates: the catalogue is public, read only.
drop policy if exists templates_select_all on public.templates;
create policy templates_select_all on public.templates
  for select to anon, authenticated using (true);

-- invitations: owners manage theirs; everyone may read published ones.
drop policy if exists invitations_select_own on public.invitations;
create policy invitations_select_own on public.invitations
  for select to authenticated using (owner_id = auth.uid());

drop policy if exists invitations_select_public on public.invitations;
create policy invitations_select_public on public.invitations
  for select to anon, authenticated
  using (status = 'published' and archived_at is null);

drop policy if exists invitations_insert_own on public.invitations;
create policy invitations_insert_own on public.invitations
  for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists invitations_update_own on public.invitations;
create policy invitations_update_own on public.invitations
  for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Hard deletes are intentionally not granted; the app archives instead.

-- Child tables all follow the same shape, so generate the policies.
do $$
declare
  child text;
begin
  foreach child in array array[
    'couples', 'venues', 'events', 'gallery_images', 'story_milestones',
    'contacts', 'music', 'invitation_settings', 'rsvp_settings', 'rsvp_questions'
  ]
  loop
    execute format('drop policy if exists %1$s_select_own on public.%1$s', child);
    execute format(
      'create policy %1$s_select_own on public.%1$s for select to authenticated
         using (public.owns_invitation(invitation_id))', child);

    execute format('drop policy if exists %1$s_select_public on public.%1$s', child);
    execute format(
      'create policy %1$s_select_public on public.%1$s for select to anon, authenticated
         using (public.invitation_is_public(invitation_id))', child);

    execute format('drop policy if exists %1$s_write_own on public.%1$s', child);
    execute format(
      'create policy %1$s_write_own on public.%1$s for all to authenticated
         using (public.owns_invitation(invitation_id))
         with check (public.owns_invitation(invitation_id))', child);
  end loop;
end $$;

-- rsvp_responses: guests may add one, but only owners can read them.
drop policy if exists rsvp_responses_insert_public on public.rsvp_responses;
create policy rsvp_responses_insert_public on public.rsvp_responses
  for insert to anon, authenticated
  with check (public.rsvp_is_open(invitation_id));

drop policy if exists rsvp_responses_select_own on public.rsvp_responses;
create policy rsvp_responses_select_own on public.rsvp_responses
  for select to authenticated
  using (public.owns_invitation(invitation_id));

drop policy if exists rsvp_responses_delete_own on public.rsvp_responses;
create policy rsvp_responses_delete_own on public.rsvp_responses
  for delete to authenticated
  using (public.owns_invitation(invitation_id));

-- ---------------------------------------------------------------------
-- Storage: one public bucket for invitation media, one for audio
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('invitation-media', 'invitation-media', true, 10485760,
   array['image/jpeg','image/png','image/webp','image/avif']),
  ('invitation-audio', 'invitation-audio', true, 15728640,
   array['audio/mpeg','audio/mp4','audio/aac','audio/ogg'])
on conflict (id) do nothing;

-- Media is world-readable (invitations are shared by link) but each author may
-- only write inside a folder named after their own user id.
drop policy if exists invitation_media_read on storage.objects;
create policy invitation_media_read on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('invitation-media', 'invitation-audio'));

drop policy if exists invitation_media_write on storage.objects;
create policy invitation_media_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('invitation-media', 'invitation-audio')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists invitation_media_update on storage.objects;
create policy invitation_media_update on storage.objects
  for update to authenticated
  using (
    bucket_id in ('invitation-media', 'invitation-audio')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
