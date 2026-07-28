-- =====================================================================
-- League of LLMs — Database Schema (PostgreSQL / Supabase)
-- Run this in the Supabase SQL editor, or via `supabase db push`.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------
create type battle_visibility as enum ('private', 'public');
create type battle_status as enum ('pending', 'running', 'completed', 'flagged', 'removed');
create type prompt_category as enum (
  'coding', 'writing', 'business', 'research', 'marketing', 'education', 'creativity'
);
create type vote_category as enum ('overall', 'accuracy', 'creativity', 'helpfulness');
create type model_name as enum ('gpt', 'claude', 'gemini', 'deepseek', 'grok', 'mistral');
create type app_role as enum ('user', 'moderator', 'admin');

-- ---------------------------------------------------------------------
-- USERS  (profile row, 1:1 with auth.users)
-- ---------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Challenger',
  email text unique not null,
  avatar text,
  role app_role not null default 'user',
  is_banned boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auto-create a public.users row whenever a new auth user signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- BATTLES
-- ---------------------------------------------------------------------
create table public.battles (
  id uuid primary key default gen_random_uuid(),
  prompt text not null check (char_length(prompt) between 3 and 4000),
  category prompt_category not null default 'writing',
  created_by uuid references public.users(id) on delete set null,
  visibility battle_visibility not null default 'private',
  status battle_status not null default 'pending',
  -- shuffled mapping so the UI can label cards "Model A..D" without
  -- revealing identity; only readable server-side / after reveal.
  model_slots jsonb not null default '{}'::jsonb, -- e.g. {"A": "gpt", "B": "claude", ...}
  is_flagged boolean not null default false,
  flagged_reason text,
  view_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index battles_category_idx on public.battles (category);
create index battles_visibility_idx on public.battles (visibility, created_at desc);
create index battles_created_by_idx on public.battles (created_by);

-- ---------------------------------------------------------------------
-- RESPONSES  (one row per model per battle)
-- ---------------------------------------------------------------------
create table public.responses (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references public.battles(id) on delete cascade,
  model_name model_name not null,
  slot text not null check (slot in ('A', 'B', 'C', 'D')),
  response_text text not null default '',
  latency_ms integer,
  tokens integer,
  error text,
  created_at timestamptz not null default now(),
  unique (battle_id, model_name),
  unique (battle_id, slot)
);

create index responses_battle_idx on public.responses (battle_id);

-- ---------------------------------------------------------------------
-- VOTES
-- ---------------------------------------------------------------------
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  battle_id uuid not null references public.battles(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  anon_session text, -- fallback identifier for signed-out voters
  category vote_category not null,
  selected_model model_name not null,
  created_at timestamptz not null default now(),
  -- one vote per category per battle per voter (user or anon session)
  unique (battle_id, category, user_id),
  unique (battle_id, category, anon_session)
);

create index votes_battle_idx on public.votes (battle_id);

-- ---------------------------------------------------------------------
-- LEADERBOARD  (materialized rolling stats per model, overall + by category)
-- ---------------------------------------------------------------------
create table public.leaderboard (
  model_name model_name not null,
  category vote_category not null default 'overall',
  wins integer not null default 0,
  losses integer not null default 0,
  ties integer not null default 0,
  elo_rating integer not null default 1200,
  updated_at timestamptz not null default now(),
  primary key (model_name, category)
);

-- Per-day rollups power the "daily / weekly / all-time" leaderboard views
create table public.leaderboard_daily (
  day date not null,
  model_name model_name not null,
  category vote_category not null default 'overall',
  wins integer not null default 0,
  losses integer not null default 0,
  primary key (day, model_name, category)
);

-- ---------------------------------------------------------------------
-- USER EXTRAS: favorites & saved comparisons
-- ---------------------------------------------------------------------
create table public.favorite_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  prompt text not null,
  category prompt_category not null default 'writing',
  created_at timestamptz not null default now()
);

create table public.saved_comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  battle_id uuid not null references public.battles(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, battle_id)
);

-- ---------------------------------------------------------------------
-- MODERATION LOG (admin actions on battles/users)
-- ---------------------------------------------------------------------
create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id) on delete set null,
  target_battle_id uuid references public.battles(id) on delete cascade,
  target_user_id uuid references public.users(id) on delete cascade,
  action text not null, -- 'flag', 'remove', 'restore', 'ban', 'unban'
  reason text,
  created_at timestamptz not null default now()
);

-- seed leaderboard rows for every model x category so joins never miss a row
insert into public.leaderboard (model_name, category)
select m, c
from unnest(enum_range(null::model_name)) as m
cross join unnest(enum_range(null::vote_category)) as c;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.users enable row level security;
alter table public.battles enable row level security;
alter table public.responses enable row level security;
alter table public.votes enable row level security;
alter table public.leaderboard enable row level security;
alter table public.leaderboard_daily enable row level security;
alter table public.favorite_prompts enable row level security;
alter table public.saved_comparisons enable row level security;
alter table public.moderation_actions enable row level security;

-- Helper: is the current user an admin/moderator?
create function public.is_staff()
returns boolean as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role in ('admin', 'moderator')
  );
$$ language sql security definer stable;

-- USERS: anyone can read public profile fields; only the owner can update their own row
create policy "users_select_all" on public.users for select using (true);
create policy "users_update_self" on public.users for update using (auth.uid() = id);
create policy "users_staff_all" on public.users for all using (public.is_staff());

-- BATTLES: owners see their own; everyone sees public + completed battles; staff see all
create policy "battles_select_public" on public.battles
  for select using (visibility = 'public' or created_by = auth.uid() or public.is_staff());
create policy "battles_insert_own" on public.battles
  for insert with check (created_by = auth.uid() or created_by is null);
create policy "battles_update_own_or_staff" on public.battles
  for update using (created_by = auth.uid() or public.is_staff());
create policy "battles_delete_staff" on public.battles
  for delete using (public.is_staff());

-- RESPONSES: readable if the parent battle is readable
create policy "responses_select_via_battle" on public.responses
  for select using (
    exists (
      select 1 from public.battles b
      where b.id = battle_id
        and (b.visibility = 'public' or b.created_by = auth.uid() or public.is_staff())
    )
  );
create policy "responses_service_write" on public.responses
  for insert with check (true);

-- VOTES: anyone (incl. anon) can insert one vote per category/battle; users read their own, staff read all
create policy "votes_insert_any" on public.votes for insert with check (true);
create policy "votes_select_own_or_staff" on public.votes
  for select using (user_id = auth.uid() or public.is_staff());

-- LEADERBOARD: public read-only; writes happen via service role from the vote API
create policy "leaderboard_select_all" on public.leaderboard for select using (true);
create policy "leaderboard_daily_select_all" on public.leaderboard_daily for select using (true);

-- FAVORITES / SAVED: owner-only
create policy "favorites_owner" on public.favorite_prompts for all using (user_id = auth.uid());
create policy "saved_owner" on public.saved_comparisons for all using (user_id = auth.uid());

-- MODERATION LOG: staff-only
create policy "moderation_staff_only" on public.moderation_actions for all using (public.is_staff());
