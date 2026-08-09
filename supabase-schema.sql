-- JAGDAMBAA TOURS & TRAVELS — V11 SUPABASE SETUP
-- Run in Supabase SQL Editor.
-- Create your Auth user first, then add that user's UUID to public.profiles.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_id text not null unique,
  service text not null,
  pickup text not null,
  destination text not null,
  travel_date date not null,
  pickup_time time not null,
  passengers integer not null check (passengers between 1 and 7),
  trip_type text not null,
  return_date date,
  luggage text,
  customer_name text not null,
  customer_phone text not null,
  notes text,
  status text not null default 'Enquiry'
    check (status in ('Enquiry','Quoted','Advance Pending','Confirmed','Completed','Cancelled')),
  fare numeric(12,2),
  advance numeric(12,2),
  balance numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_travel_date_idx on public.bookings(travel_date);
create index if not exists bookings_status_idx on public.bookings(status);
create index if not exists bookings_phone_idx on public.bookings(customer_phone);

alter table public.profiles enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "Public can create booking enquiries" on public.bookings;
create policy "Public can create booking enquiries"
on public.bookings for insert to anon, authenticated
with check (status = 'Enquiry');

drop policy if exists "Admins can read bookings" on public.bookings;
create policy "Admins can read bookings"
on public.bookings for select to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'
));

drop policy if exists "Admins can update bookings" on public.bookings;
create policy "Admins can update bookings"
on public.bookings for update to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'
));

drop policy if exists "Admins can delete bookings" on public.bookings;
create policy "Admins can delete bookings"
on public.bookings for delete to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'
));

drop policy if exists "Admins can read own profile" on public.profiles;
create policy "Admins can read own profile"
on public.profiles for select to authenticated
using (id = auth.uid());

-- After creating your admin Auth user, run:
-- insert into public.profiles (id, full_name, role)
-- values ('YOUR_ADMIN_USER_UUID','Jagdambaa Admin','admin');

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bookings_updated_at on public.bookings;
create trigger bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();
