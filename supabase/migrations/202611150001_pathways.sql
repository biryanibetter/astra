begin;

-- Additive only: the existing school/membership intake is untouched.
create table public.astra_rounds (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  opens_at timestamptz not null,
  closes_at timestamptz not null check (closes_at > opens_at),
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index astra_one_active_round on public.astra_rounds(is_active) where is_active;
alter table public.astra_rounds enable row level security;
revoke all on public.astra_rounds from public, anon, authenticated;
grant select on public.astra_rounds to service_role;

create table public.astra_admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('reviewer', 'admin')),
  created_at timestamptz not null default now()
);
alter table public.astra_admin_roles enable row level security;
revoke all on public.astra_admin_roles from public, anon, authenticated;
grant select on public.astra_admin_roles to service_role;

create table public.astra_question_rules (
  track text not null check (track in ('core','fellow')),
  question_id text not null,
  kind text not null check (kind in ('textarea','single-select','multi-select')),
  minimum integer,
  maximum integer,
  options jsonb,
  primary key (track, question_id)
);
alter table public.astra_question_rules enable row level security;
revoke all on public.astra_question_rules from public, anon, authenticated;
grant select on public.astra_question_rules to service_role;
insert into public.astra_question_rules values
('core','core-areas','multi-select',null,null,'["Events & experiences","Projects & programs","Technology & AI","Communications & media","Partnerships & outreach","School network","Operations & planning"]'),
('core','core-idea','textarea',200,500,null),
('core','core-experience','textarea',100,300,null),
('core','core-responsibilities','multi-select',null,null,'["Plan and coordinate tasks","Create or improve digital tools","Design content or communications","Organize events or workshops","Research ideas and opportunities","Connect with students or partners","Support a team and follow through"]'),
('core','core-time','single-select',null,null,'["1–2 hours","3–4 hours","5–6 hours","7+ hours","It varies by week"]'),
('core','core-skills','textarea',100,250,null),
('fellow','fellow-field','single-select',null,null,'["Artificial intelligence & technology","Science, engineering & environment","Entrepreneurship & business","Research & academia","Arts, design & media","Education & community impact","Leadership & advocacy","Other / interdisciplinary"]'),
('fellow','fellow-project','textarea',200,500,null),
('fellow','fellow-contribution','textarea',150,350,null),
('fellow','fellow-evidence','textarea',100,300,null),
('fellow','fellow-next-year','textarea',150,350,null),
('fellow','fellow-contribution-to-astra','textarea',100,250,null);

-- Round-scoped HMAC markers preserve duplicate protection after content erasure.
-- The HMAC key exists only on the server, never in this database.
create table public.astra_duplicate_markers (
  round_id uuid not null references public.astra_rounds(id),
  track text not null check (track in ('core','fellow')),
  email_fingerprint text not null check (email_fingerprint ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  primary key (round_id,track,email_fingerprint)
);
alter table public.astra_duplicate_markers enable row level security;
revoke all on public.astra_duplicate_markers from public, anon, authenticated;
grant select on public.astra_duplicate_markers to service_role;

create table public.astra_submission_requests (
  id uuid primary key,
  owner_id uuid references auth.users(id) on delete set null,
  round_id uuid not null references public.astra_rounds(id),
  track text not null check (track in ('core','fellow')),
  email text not null check (email = lower(btrim(email)) and char_length(email) between 3 and 254),
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  email_fingerprint text not null check (email_fingerprint ~ '^[a-f0-9]{64}$'),
  attempt_id uuid not null,
  lease_until timestamptz not null,
  application_id uuid,
  created_at timestamptz not null default now()
);
create index astra_requests_cleanup_idx on public.astra_submission_requests(created_at);
alter table public.astra_submission_requests enable row level security;
revoke all on public.astra_submission_requests from public, anon, authenticated;
grant select on public.astra_submission_requests to service_role;

create table public.astra_applications (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.astra_submission_requests(id),
  owner_id uuid references auth.users(id) on delete set null,
  round_id uuid not null references public.astra_rounds(id),
  track text not null check (track in ('core','fellow')),
  email text not null check (email = lower(btrim(email)) and char_length(email) between 3 and 254),
  status text not null default 'pending' check (status in ('pending','under_review','accepted','rejected','withdrawn','deleting')),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  unique (round_id, track, email)
);
create index astra_applications_review_idx on public.astra_applications(status,submitted_at desc,id);
create index astra_applications_round_idx on public.astra_applications(round_id,track,submitted_at desc,id);
create index astra_applications_retention_idx on public.astra_applications(expires_at);
alter table public.astra_applications enable row level security;
revoke all on public.astra_applications from public, anon, authenticated;
grant select on public.astra_applications to service_role;

create table public.astra_profiles (
  application_id uuid primary key references public.astra_applications(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 100),
  school text not null check (char_length(btrim(school)) between 2 and 150),
  grade text not null check (grade in ('grade-6-year-7','grade-7-year-8','grade-8-year-9','grade-9-year-10','grade-10-year-11','grade-11-year-12','grade-12-year-13')),
  age_eligible boolean not null check (age_eligible),
  created_at timestamptz not null default now()
);
alter table public.astra_profiles enable row level security;
revoke all on public.astra_profiles from public, anon, authenticated;
grant select on public.astra_profiles to service_role;

create table public.astra_answers (
  application_id uuid not null references public.astra_applications(id) on delete cascade,
  question_id text not null,
  value jsonb not null,
  created_at timestamptz not null default now(),
  primary key (application_id,question_id)
);
alter table public.astra_answers enable row level security;
revoke all on public.astra_answers from public, anon, authenticated;
grant select on public.astra_answers to service_role;

create table public.astra_projects (
  application_id uuid not null references public.astra_applications(id) on delete cascade,
  ordinal smallint not null check (ordinal between 1 and 5),
  title text not null check (char_length(title) <= 120),
  description text not null check (char_length(description) <= 600),
  created_at timestamptz not null default now(),
  primary key (application_id,ordinal),
  check (btrim(title) <> '' or btrim(description) <> '')
);
alter table public.astra_projects enable row level security;
revoke all on public.astra_projects from public, anon, authenticated;
grant select on public.astra_projects to service_role;

create table public.astra_links (
  application_id uuid not null references public.astra_applications(id) on delete cascade,
  ordinal smallint not null check (ordinal between 1 and 5),
  type text not null check (char_length(type) <= 60),
  label text not null check (char_length(label) <= 120),
  url text not null check (char_length(url) <= 2048 and url ~ '^https?://[^/@[:space:]]+([/?#]|$)'),
  created_at timestamptz not null default now(),
  primary key (application_id,ordinal)
);
alter table public.astra_links enable row level security;
revoke all on public.astra_links from public, anon, authenticated;
grant select on public.astra_links to service_role;

create table public.astra_cv_files (
  id uuid primary key,
  application_id uuid not null references public.astra_applications(id) on delete cascade,
  ordinal smallint not null check (ordinal between 1 and 3),
  object_path text not null unique,
  file_size integer not null check (file_size between 1 and 5242880),
  mime_type text not null check (mime_type = 'application/pdf'),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  unique (application_id,ordinal)
);
alter table public.astra_cv_files enable row level security;
revoke all on public.astra_cv_files from public, anon, authenticated;
grant select on public.astra_cv_files to service_role;

create table public.astra_review_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.astra_applications(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  note text not null check (char_length(btrim(note)) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index astra_notes_application_idx on public.astra_review_notes(application_id,created_at);
alter table public.astra_review_notes enable row level security;
revoke all on public.astra_review_notes from public, anon, authenticated;
grant select on public.astra_review_notes to service_role;

create table public.astra_audit_records (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  application_id uuid,
  action text not null check (action in ('list','detail','cv','export','review','delete','maintenance','login','auth_delete')),
  created_at timestamptz not null default now()
);
create index astra_audit_time_idx on public.astra_audit_records(created_at);
alter table public.astra_audit_records enable row level security;
revoke all on public.astra_audit_records from public, anon, authenticated;
grant select,insert on public.astra_audit_records to service_role;

create table public.astra_upload_attempts (
  id uuid primary key,
  request_id uuid not null references public.astra_submission_requests(id) on delete cascade,
  paths text[] not null check (cardinality(paths) between 1 and 3),
  accepted boolean not null default false,
  cleaned_at timestamptz,
  created_at timestamptz not null default now()
);
create index astra_upload_cleanup_idx on public.astra_upload_attempts(created_at) where not accepted and cleaned_at is null;
alter table public.astra_upload_attempts enable row level security;
revoke all on public.astra_upload_attempts from public, anon, authenticated;
grant select,update on public.astra_upload_attempts to service_role;

create table public.astra_rate_limits (
  fingerprint text primary key check (fingerprint ~ '^[a-f0-9]{64}$'),
  starts_at timestamptz not null default now(),
  attempts integer not null default 1
);
alter table public.astra_rate_limits enable row level security;
revoke all on public.astra_rate_limits from public, anon, authenticated;
grant select,delete on public.astra_rate_limits to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('astra-cvs', 'astra-cvs', false, 5242880, array['application/pdf'])
on conflict (id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['application/pdf'];
-- Restrictive policy also defeats pre-existing broad permissive policies.
-- service_role bypasses RLS; only the authorized server may access this bucket.
create policy astra_cvs_server_only on storage.objects as restrictive
for all to anon, authenticated
using (bucket_id <> 'astra-cvs') with check (bucket_id <> 'astra-cvs');

create function public.astra_limit(p_fingerprint text, p_max integer) returns boolean
language plpgsql security definer set search_path='' as $$
declare used integer;
begin
  if p_max not between 1 and 100 then raise exception 'Invalid limit'; end if;
  insert into public.astra_rate_limits as limits(fingerprint) values(p_fingerprint)
  on conflict(fingerprint) do update set
    attempts=case when limits.starts_at < now()-interval '1 hour' then 1 else least(limits.attempts+1,101) end,
    starts_at=case when limits.starts_at < now()-interval '1 hour' then now() else limits.starts_at end
  returning attempts into used;
  return used <= p_max;
end $$;
revoke all on function public.astra_limit(text,integer) from public, anon, authenticated;
grant execute on function public.astra_limit(text,integer) to service_role;

create function public.astra_intake() returns uuid
language sql security definer set search_path='' stable as $$
  select id from public.astra_rounds where is_active and now() >= opens_at and now() < closes_at
$$;
revoke all on function public.astra_intake() from public, anon, authenticated;
grant execute on function public.astra_intake() to service_role;

create function public.astra_begin(
 p_id uuid,p_owner uuid,p_round uuid,p_email text,p_email_hash text,p_track text,p_hash text,p_attempt uuid,p_paths text[]
) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.astra_submission_requests; round uuid;
begin
  -- Recovery of an already committed request works even after intake closes.
  select * into r from public.astra_submission_requests where id=p_id for update;
  if found then
    if r.owner_id is distinct from p_owner or r.round_id is distinct from p_round or r.email<>p_email or r.track<>p_track or r.payload_hash<>p_hash or r.email_fingerprint<>p_email_hash
      then return jsonb_build_object('state','conflict'); end if;
    if r.application_id is not null then return jsonb_build_object('state','accepted','id',r.application_id); end if;
    if r.lease_until>now() then return jsonb_build_object('state','processing'); end if;
  end if;
  round:=public.astra_intake();
  if round is null then return jsonb_build_object('state','closed'); end if;
  if round is distinct from p_round then return jsonb_build_object('state','closed'); end if;
  if r.id is not null and r.round_id<>round then return jsonb_build_object('state','conflict'); end if;
  if p_email<>lower(btrim(p_email)) or p_hash !~ '^[a-f0-9]{64}$' or p_email_hash !~ '^[a-f0-9]{64}$'
    or p_track not in ('core','fellow') or cardinality(p_paths) not between 1 and 3
    or exists(select 1 from unnest(p_paths) p where p !~ ('^'||p_attempt::text||'/[a-f0-9-]{36}\.pdf$'))
    then raise exception 'Invalid submission'; end if;
  if exists(select 1 from public.astra_duplicate_markers where email_fingerprint=p_email_hash and track=p_track and round_id=round)
    then return jsonb_build_object('state','duplicate'); end if;
  insert into public.astra_submission_requests(id,owner_id,round_id,track,email,email_fingerprint,payload_hash,attempt_id,lease_until)
  values(p_id,p_owner,round,p_track,p_email,p_email_hash,p_hash,p_attempt,now()+interval '2 minutes')
  on conflict(id) do nothing;
  select * into r from public.astra_submission_requests where id=p_id for update;
  -- Recheck after the insert wait: concurrent callers must not steal a lease.
  if r.owner_id is distinct from p_owner or r.round_id is distinct from p_round or r.email<>p_email or r.track<>p_track or r.payload_hash<>p_hash or r.email_fingerprint<>p_email_hash
    then return jsonb_build_object('state','conflict'); end if;
  if r.application_id is not null then return jsonb_build_object('state','accepted','id',r.application_id); end if;
  if r.attempt_id<>p_attempt and r.lease_until>now() then return jsonb_build_object('state','processing'); end if;
  update public.astra_submission_requests set attempt_id=p_attempt,lease_until=now()+interval '2 minutes' where id=p_id;
  insert into public.astra_upload_attempts(id,request_id,paths) values(p_attempt,p_id,p_paths);
  return jsonb_build_object('state','new','round',round);
end $$;
revoke all on function public.astra_begin(uuid,uuid,uuid,text,text,text,text,uuid,text[]) from public, anon, authenticated;
grant execute on function public.astra_begin(uuid,uuid,uuid,text,text,text,text,uuid,text[]) to service_role;

create function public.astra_validate_answers(p_track text,p_answers jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare q public.astra_question_rules; v jsonb; s text;
begin
  if jsonb_typeof(p_answers) is distinct from 'object'
    or (select count(*) from jsonb_object_keys(p_answers))<>6
    then raise exception 'Invalid answers'; end if;
  for q in select * from public.astra_question_rules where track=p_track loop
    v:=p_answers->q.question_id;
    if q.kind='textarea' then
      s:=p_answers->>q.question_id;
      if jsonb_typeof(v) is distinct from 'string' or btrim(s)=''
        or char_length(s) not between q.minimum and q.maximum then raise exception 'Invalid answer'; end if;
    elsif q.kind='single-select' then
      if jsonb_typeof(v) is distinct from 'string' or not q.options @> jsonb_build_array(v)
        then raise exception 'Invalid choice'; end if;
    else
      if jsonb_typeof(v) is distinct from 'array' then raise exception 'Invalid choices'; end if;
      if jsonb_array_length(v)=0 or not q.options @> v
        or jsonb_array_length(v)<>(select count(distinct x) from jsonb_array_elements(v) x)
        then raise exception 'Invalid choices'; end if;
    end if;
  end loop;
end $$;
revoke all on function public.astra_validate_answers(text,jsonb) from public, anon, authenticated;

create function public.astra_finalize(p_id uuid,p_attempt uuid,p_owner uuid,p_payload jsonb,p_files jsonb,p_days integer)
returns uuid language plpgsql security definer set search_path='' as $$
declare r public.astra_submission_requests; app uuid; project jsonb; link jsonb; f jsonb; n integer;
begin
  select * into strict r from public.astra_submission_requests where id=p_id for update;
  if r.owner_id is distinct from p_owner then raise exception 'Denied'; end if;
  if r.application_id is not null then return r.application_id; end if;
  if r.attempt_id<>p_attempt or r.lease_until<now() or r.round_id is distinct from public.astra_intake()
    then raise exception 'Submission lease expired'; end if;
  if p_payload->>'email' is distinct from r.email or p_payload->>'track' is distinct from r.track
    or p_payload->'ageEligible' is distinct from 'true'::jsonb
    or p_days not between 1 and 365
    or jsonb_typeof(p_payload->'projects') is distinct from 'array'
    or jsonb_typeof(p_payload->'links') is distinct from 'array'
    or jsonb_typeof(p_files) is distinct from 'array'
    then raise exception 'Invalid application'; end if;
  if jsonb_array_length(p_payload->'projects') not between 1 and 5
    or jsonb_array_length(p_payload->'links')>5
    or jsonb_array_length(p_files) not between 1 and 3 then raise exception 'Invalid counts'; end if;
  perform public.astra_validate_answers(r.track,p_payload->'questionResponses');
  insert into public.astra_duplicate_markers(round_id,track,email_fingerprint)
  values(r.round_id,r.track,r.email_fingerprint);
  insert into public.astra_applications(request_id,owner_id,round_id,track,email,expires_at)
  values(r.id,r.owner_id,r.round_id,r.track,r.email,now()+make_interval(days=>p_days)) returning id into app;
  insert into public.astra_profiles(application_id,full_name,school,grade,age_eligible)
  values(app,p_payload->>'fullName',p_payload->>'school',p_payload->>'grade',true);
  insert into public.astra_answers(application_id,question_id,value)
  select app,key,value from jsonb_each(p_payload->'questionResponses');
  n:=0;
  for project in select value from jsonb_array_elements(p_payload->'projects') loop
    n:=n+1;
    insert into public.astra_projects(application_id,ordinal,title,description)
    values(app,n,project->>'title',project->>'description');
  end loop;
  n:=0;
  for link in select value from jsonb_array_elements(p_payload->'links') loop
    n:=n+1;
    insert into public.astra_links(application_id,ordinal,type,label,url)
    values(app,n,link->>'type',link->>'label',link->>'url');
  end loop;
  n:=0;
  for f in select value from jsonb_array_elements(p_files) loop
    n:=n+1;
    if not exists(select 1 from public.astra_upload_attempts
      where id=p_attempt and (f->>'path')=any(paths)) or not exists(
      select 1 from storage.objects where bucket_id='astra-cvs' and name=f->>'path'
    ) then raise exception 'Missing CV object'; end if;
    insert into public.astra_cv_files(id,application_id,ordinal,object_path,file_size,mime_type,sha256)
    values((f->>'id')::uuid,app,n,f->>'path',(f->>'size')::integer,'application/pdf',f->>'sha256');
  end loop;
  update public.astra_submission_requests set application_id=app where id=r.id;
  update public.astra_upload_attempts set accepted=true where id=p_attempt;
  return app;
end $$;
revoke all on function public.astra_finalize(uuid,uuid,uuid,jsonb,jsonb,integer) from public, anon, authenticated;
grant execute on function public.astra_finalize(uuid,uuid,uuid,jsonb,jsonb,integer) to service_role;

create function public.astra_review(p_actor uuid,p_id uuid,p_status text,p_note text) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.astra_admin_roles where user_id=p_actor)
    or p_status not in ('pending','under_review','accepted','rejected','withdrawn')
    then raise exception 'Denied'; end if;
  perform 1 from public.astra_applications where id=p_id and status<>'deleting' for update;
  if not found then raise exception 'Missing application'; end if;
  update public.astra_applications set status=p_status,updated_at=now() where id=p_id;
  if btrim(coalesce(p_note,''))<>'' then
    insert into public.astra_review_notes(application_id,author_id,note) values(p_id,p_actor,p_note);
  end if;
  insert into public.astra_audit_records(actor_id,application_id,action) values(p_actor,p_id,'review');
end $$;
revoke all on function public.astra_review(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.astra_review(uuid,uuid,text,text) to service_role;

-- Two-phase deletion keeps storage cleanup retryable and prevents fresh CV access.
create function public.astra_delete(p_actor uuid,p_id uuid,p_finish boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.astra_admin_roles where user_id=p_actor and role='admin')
    then raise exception 'Denied'; end if;
  perform 1 from public.astra_applications where id=p_id for update;
  if not found then return; end if;
  if not p_finish then
    update public.astra_applications set status='deleting',updated_at=now() where id=p_id;
  else
    if exists(select 1 from public.astra_applications where id=p_id and status<>'deleting')
      then raise exception 'Deletion not prepared'; end if;
    if exists(select 1 from public.astra_cv_files f join storage.objects o on o.name=f.object_path
      and o.bucket_id='astra-cvs' where f.application_id=p_id) then raise exception 'Remove storage first'; end if;
    delete from public.astra_applications where id=p_id;
    -- Preserve the request tombstone to prevent duplicates or PII-dependent retries.
    update public.astra_submission_requests set email='deleted-'||id::text||'@example.invalid',owner_id=null,payload_hash=repeat('0',64)
      where application_id=p_id;
    insert into public.astra_audit_records(actor_id,application_id,action) values(p_actor,p_id,'delete');
  end if;
end $$;
revoke all on function public.astra_delete(uuid,uuid,boolean) from public, anon, authenticated;
grant execute on function public.astra_delete(uuid,uuid,boolean) to service_role;

create function public.astra_purge_coordination() returns void
language plpgsql security definer set search_path='' as $$
begin
  delete from public.astra_submission_requests r where r.created_at<now()-interval '1 day'
    and not exists(select 1 from public.astra_applications a where a.request_id=r.id)
    and not exists(select 1 from public.astra_upload_attempts u where u.request_id=r.id and not u.accepted and u.cleaned_at is null);
  delete from public.astra_duplicate_markers m using public.astra_rounds r
    where m.round_id=r.id and r.closes_at<now()-interval '1 day';
end $$;
revoke all on function public.astra_purge_coordination() from public, anon, authenticated;
grant execute on function public.astra_purge_coordination() to service_role;

create table public.astra_maintenance_state (
  id text primary key check (id='auth'),
  page integer not null default 1 check (page between 1 and 1000000)
);
alter table public.astra_maintenance_state enable row level security;
revoke all on public.astra_maintenance_state from public, anon, authenticated;
grant select,update on public.astra_maintenance_state to service_role;
insert into public.astra_maintenance_state(id) values('auth');

-- Only INSERT tags an account. Updating user-editable metadata later cannot
-- opt an existing/shared Auth account into this retention policy.
create function public.astra_tag_intake_signup() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.raw_user_meta_data->'astra_intake_signup'='true'::jsonb then
    new.raw_app_meta_data:=coalesce(new.raw_app_meta_data,'{}'::jsonb)
      || jsonb_build_object('astra_intake_managed',true);
  end if;
  return new;
end $$;
revoke all on function public.astra_tag_intake_signup() from public, anon, authenticated;
create trigger astra_tag_intake_signup before insert on auth.users
for each row execute function public.astra_tag_intake_signup();

commit;
