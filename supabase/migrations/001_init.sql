-- ═══════════════════════════════════════════════════════════════
--  CUCHILLO EN BOCA — Schema Supabase
--  Ejecuta esto en el SQL Editor de tu proyecto Supabase
-- ═══════════════════════════════════════════════════════════════

-- ── Sessions (una por entrenamiento/partido/salida) ──────────────
create table if not exists sessions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             text not null,
  sport               text not null check (sport in ('gym','padel','tenis','running','natacion','ciclismo','otro')),
  date                date not null default current_date,
  duration_min        integer,
  notes               text,
  garmin_activity_id  text unique,
  garmin_data         jsonb,
  created_at          timestamptz default now()
);

-- ── Gym sets (series de cada ejercicio) ─────────────────────────
create table if not exists gym_sets (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid references sessions(id) on delete cascade,
  exercise    text not null,
  weight_kg   numeric(6,2) not null,
  sets        integer not null,
  reps        integer not null,
  rpe         numeric(3,1),
  is_pr       boolean default false,
  created_at  timestamptz default now()
);

-- ── Persons (rivales y compañeros) ──────────────────────────────
create table if not exists persons (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  name        text not null,
  sports      text[] default '{}',
  note        text,
  created_at  timestamptz default now()
);

-- ── Matches (relación sesión ↔ persona) ─────────────────────────
create table if not exists matches (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid references sessions(id) on delete cascade,
  person_id   uuid references persons(id),
  mode        text check (mode in ('solo','compania','rival')),
  result      text check (result in ('win','loss','draw')),
  score       text,
  created_at  timestamptz default now()
);

-- ── Goals (objetivos y hojas de ruta) ───────────────────────────
create table if not exists goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null,
  title         text not null,
  target_date   date,
  level         text,
  target_value  text,
  total_weeks   integer,
  phases        jsonb,
  active        boolean default true,
  created_at    timestamptz default now()
);

-- ── Garmin syncs (un registro por sincronización) ────────────────
create table if not exists garmin_syncs (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null,
  synced_at       timestamptz default now(),
  sleep_hours     numeric(4,2),
  hrv             integer,
  body_battery    integer,
  recovery_score  integer,
  raw             jsonb
);

-- ── Índices para velocidad ───────────────────────────────────────
create index if not exists idx_sessions_user_date  on sessions(user_id, date desc);
create index if not exists idx_gym_sets_session    on gym_sets(session_id);
create index if not exists idx_matches_session     on matches(session_id);
create index if not exists idx_matches_person      on matches(person_id);
create index if not exists idx_garmin_user_date    on garmin_syncs(user_id, synced_at desc);
create index if not exists idx_goals_user          on goals(user_id, active);

-- ── Row Level Security (actívala cuando añadas auth real) ────────
-- alter table sessions enable row level security;
-- alter table gym_sets enable row level security;
-- etc.
