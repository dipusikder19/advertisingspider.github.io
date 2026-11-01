-- Advertising Spider: Supabase Auth + service content
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  slug text primary key check (slug in ('google-ads', 'meta-ads', 'ga4-analytics', 'gtm-tracking')),
  title text not null check (char_length(title) between 1 and 80),
  card_description text not null check (char_length(card_description) between 1 and 280),
  page_headline text not null check (char_length(page_headline) between 1 and 140),
  page_description text not null check (char_length(page_description) between 1 and 600),
  is_published boolean not null default true,
  sort_order integer not null,
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.services enable row level security;

revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;

revoke all on table public.services from anon, authenticated;
grant select on table public.services to anon, authenticated;
grant update (title, card_description, page_headline, page_description, is_published, updated_at)
  on table public.services to authenticated;

drop policy if exists "admins can read own membership" on public.admin_users;
create policy "admins can read own membership"
  on public.admin_users for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "public can read published services" on public.services;
create policy "public can read published services"
  on public.services for select to anon, authenticated
  using (is_published = true);

drop policy if exists "admins can read all services" on public.services;
create policy "admins can read all services"
  on public.services for select to authenticated
  using (exists (
    select 1 from public.admin_users a
    where a.user_id = (select auth.uid())
  ));

drop policy if exists "admins can update services" on public.services;
create policy "admins can update services"
  on public.services for update to authenticated
  using (exists (
    select 1 from public.admin_users a
    where a.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.admin_users a
    where a.user_id = (select auth.uid())
  ));

insert into public.services
  (slug, title, card_description, page_headline, page_description, sort_order)
values
  (
    'google-ads',
    'Google Ads',
    'Reach people searching for what you offer. Build campaigns around intent, useful landing experiences, and business priorities.',
    'Turn search intent into a clearer path forward.',
    'Google Ads can connect your business with people actively looking for a solution. We help plan, structure, and improve campaigns so targeting, budget, landing experience, and measurement work toward the same business goal.',
    1
  ),
  (
    'meta-ads',
    'Meta Ads',
    'Plan and refine campaigns across Facebook and Instagram with audience, creative, and conversion signals working together.',
    'Make social campaigns more intentional.',
    'Meta Ads can introduce your offer to new audiences and help people take the next step. We connect campaign objectives, audience choices, creative testing, and conversion measurement in one practical plan.',
    2
  ),
  (
    'ga4-analytics',
    'GA4 analytics',
    'Make your reporting more useful with clear event definitions, conversion measurement, and a view of what visitors do next.',
    'Turn analytics into decisions you can use.',
    'GA4 is most useful when events and reports reflect the actions your business cares about. We help review the current setup, clarify what should be measured, and make the resulting data easier to interpret.',
    3
  ),
  (
    'gtm-tracking',
    'GTM & tracking',
    'Organize tags, events, and conversion tracking so campaign decisions are grounded in data you can trust.',
    'Make campaign tracking easier to trust.',
    'Google Tag Manager helps manage the tags that collect and share campaign signals. We help organize the container, define event behavior, and validate measurement so the right information reaches your analytics and ad platforms.',
    4
  )
on conflict (slug) do nothing;
