create extension if not exists "pgcrypto";

create table if not exists public.work_sessions (
  id uuid primary key default gen_random_uuid(),
  start_time timestamptz not null,
  end_time timestamptz,
  total_hours numeric(8, 2) not null default 0,
  work_type text not null default 'office',
  mood text not null default 'focused',
  notes text default '',
  created_at timestamptz not null default now(),
  is_manual_edit boolean not null default false,
  is_active_session boolean not null default false
);

create index if not exists work_sessions_start_time_idx
  on public.work_sessions (start_time desc);

create index if not exists work_sessions_active_idx
  on public.work_sessions (is_active_session);

alter table public.work_sessions enable row level security;

drop policy if exists "single_user_public_read" on public.work_sessions;
drop policy if exists "single_user_public_insert" on public.work_sessions;
drop policy if exists "single_user_public_update" on public.work_sessions;
drop policy if exists "single_user_public_delete" on public.work_sessions;

create policy "single_user_public_read"
  on public.work_sessions for select
  using (true);

create policy "single_user_public_insert"
  on public.work_sessions for insert
  with check (true);

create policy "single_user_public_update"
  on public.work_sessions for update
  using (true)
  with check (true);

create policy "single_user_public_delete"
  on public.work_sessions for delete
  using (true);
