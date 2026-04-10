-- Posts table (Instagram + YouTube)
create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  month text not null, -- e.g. "2026-05"
  week text, -- e.g. "KW 19"
  channel_id text not null,
  post_date date,
  weekday text,
  format text,
  topic text,
  responsible text default 'Team',
  shoot_date date,
  shooting_done boolean default false,
  editing_done boolean default false,
  caption_done boolean default false,
  thumbnail_done boolean default false,
  status text default 'Offen',
  notes text
);

-- Podcast episodes
create table if not exists podcast_episodes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  episode_number integer,
  guest text not null,
  record_date date,
  publish_date date,
  ig_teaser boolean default false,
  yt_upload boolean default false,
  editing_done boolean default false,
  cover_done boolean default false,
  status text default 'Offen',
  notes text
);

-- Team todos
create table if not exists todos (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  month text,
  task text not null,
  channel_id text,
  responsible text,
  due_date date,
  priority text default 'Diese Woche', -- 'Dringend', 'Diese Woche', 'Diesen Monat', 'Backlog'
  done boolean default false
);

-- Meeting notes
create table if not exists meetings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  meeting_date date not null,
  month text not null,
  attendees text,
  shooting_ideas jsonb default '[]',
  decisions jsonb default '[]',
  notes text
);

-- Enable RLS (Row Level Security) but allow all for now (internal tool)
alter table posts enable row level security;
alter table podcast_episodes enable row level security;
alter table todos enable row level security;
alter table meetings enable row level security;

-- Allow all operations for anon key (internal team tool)
create policy "Allow all for anon" on posts for all using (true) with check (true);
create policy "Allow all for anon" on podcast_episodes for all using (true) with check (true);
create policy "Allow all for anon" on todos for all using (true) with check (true);
create policy "Allow all for anon" on meetings for all using (true) with check (true);
