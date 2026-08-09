-- JAGDAMBAA TOURS & TRAVELS — V12
-- Run after V11 schema. This adds public status lookup and workflow support.

create or replace view public.booking_public_status as
select
  booking_id,
  customer_phone,
  service,
  pickup,
  destination,
  travel_date,
  pickup_time,
  passengers,
  trip_type,
  status,
  fare,
  advance,
  balance
from public.bookings;

-- Public customers can look up only their own booking when BOTH booking ID and phone match.
-- PostgreSQL views can expose columns, but RLS behavior depends on view security settings.
-- For production, prefer a SECURITY DEFINER function with tightly controlled inputs.
drop function if exists public.get_booking_status(text,text);

create or replace function public.get_booking_status(p_booking_id text,p_phone text)
returns table(
 booking_id text,
 customer_phone text,
 service text,
 pickup text,
 destination text,
 travel_date date,
 pickup_time time,
 passengers integer,
 trip_type text,
 status text,
 fare numeric,
 advance numeric,
 balance numeric
)
language sql
security definer
set search_path = public
as $$
 select b.booking_id,b.customer_phone,b.service,b.pickup,b.destination,b.travel_date,
        b.pickup_time,b.passengers,b.trip_type,b.status,b.fare,b.advance,b.balance
 from public.bookings b
 where b.booking_id=p_booking_id and b.customer_phone=p_phone
 limit 1;
$$;

revoke all on function public.get_booking_status(text,text) from public;
grant execute on function public.get_booking_status(text,text) to anon, authenticated;

-- V12 status lookup page should use the function rather than exposing the full view.
