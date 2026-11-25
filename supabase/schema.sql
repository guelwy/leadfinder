create table if not exists public.leads (
 id text primary key, name text not null, category text, address text, phone text, website text, rating numeric(2,1), review_count integer not null default 0, maps_url text, lead_score integer not null default 0, score_reasons jsonb not null default '[]'::jsonb, outreach_message text, status text not null default 'new' check (status in ('new','qualified','contacted','won','lost')), source text not null default 'geoapify', is_demo boolean not null default false, updated_at timestamptz not null default now()
);

-- Atualiza instalações existentes que ainda tinham o provedor antigo como padrão.
alter table public.leads alter column source set default 'geoapify';
alter table public.leads enable row level security;
revoke all on public.leads from anon, authenticated;
grant all on public.leads to service_role;
