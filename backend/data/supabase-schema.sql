-- Lodestar: Supabase schema
-- Run this in the Supabase SQL editor once. It creates the tables that
-- store users and each user's synced search data.
--
-- The backend accesses these tables with the service role key, so no
-- Row Level Security policies are needed here.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  salt text not null,
  hash text not null,
  token text,
  token_at timestamptz,
  display_name text,
  bio text,
  avatar text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_sync (
  id uuid primary key references public.users (id) on delete cascade,
  history jsonb not null default '[]'::jsonb,
  history_setting text not null default '24h',
  theme text not null default 'system',
  suggestions text not null default 'on',
  language text not null default 'en',
  bookmarks jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Signed-in devices. One row per active session token.
create table if not exists public.sessions (
  token text primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  label text
);

create index if not exists sessions_user_idx on public.sessions (user_id);
