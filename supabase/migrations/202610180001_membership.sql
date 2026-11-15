begin;

create table public.membership_applications (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz not null default now(),
  full_name text not null check (char_length(full_name) between 2 and 100),
  email text not null unique check (email = lower(email) and char_length(email) <= 254),
  school text not null check (char_length(school) between 2 and 150),
  grade text not null check (char_length(grade) between 1 and 50),
  age_eligible boolean not null check (age_eligible),
  interests text[] not null check (cardinality(interests) between 1 and 9 and interests <@ array['Technology','AI','Programming','Entrepreneurship','Business','Science','Engineering','Design','Media']::text[]),
  membership_interest text not null check (membership_interest in ('ASTRA Network','ASTRA Core','School Representative')),
  introduction text check (char_length(introduction) <= 1000),
  privacy_acknowledged boolean not null check (privacy_acknowledged),
  privacy_version text not null,
  review_status text not null default 'pending' check (review_status in ('pending','under_review','accepted','rejected')),
  guardian_authorization_status text not null default 'not_reviewed' check (guardian_authorization_status in ('not_reviewed','required','verified','not_required')),
  expires_at timestamptz not null
);
create index applications_retention_idx on public.membership_applications(expires_at);
create index applications_review_idx on public.membership_applications(review_status, submitted_at);
alter table public.membership_applications enable row level security;
revoke all on public.membership_applications from public, anon, authenticated;
grant select, insert, update, delete on public.membership_applications to service_role;

create table public.application_rate_limits (
  fingerprint text primary key check (fingerprint ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null default now(),
  attempts integer not null default 1
);
alter table public.application_rate_limits enable row level security;
revoke all on public.application_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.application_rate_limits to service_role;

create function public.consume_application_limit(p_fingerprint text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare used integer;
begin
  insert into public.application_rate_limits as limits (fingerprint) values ($1)
  on conflict (fingerprint) do update set
    attempts = case when limits.window_started_at < now() - interval '1 hour' then 1 else least(limits.attempts + 1, 6) end,
    window_started_at = case when limits.window_started_at < now() - interval '1 hour' then now() else limits.window_started_at end
  returning attempts into used;
  return used <= 5;
end;
$$;
revoke all on function public.consume_application_limit(text) from public, anon, authenticated;
grant execute on function public.consume_application_limit(text) to service_role;

create function public.purge_expired_applications() returns integer
language plpgsql security definer set search_path = '' as $$
declare removed integer;
begin
  delete from public.membership_applications where expires_at <= now();
  get diagnostics removed = row_count;
  delete from public.application_rate_limits where window_started_at < now() - interval '1 day';
  return removed;
end;
$$;
revoke all on function public.purge_expired_applications() from public, anon, authenticated;
grant execute on function public.purge_expired_applications() to service_role;

commit;
