create table if not exists public.orders (
  order_id text primary key,
  email text not null,
  customer text,
  payment text,
  status text,
  tracking text,
  total numeric,
  items jsonb default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_email_idx on public.orders (email);
create index if not exists orders_updated_at_idx on public.orders (updated_at desc);
