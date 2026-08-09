# V11 Setup — Jagdambaa Tours & Travels

## What V11 adds

- Supabase cloud database for shared bookings
- Supabase email/password admin authentication
- Row Level Security
- Admin dashboard with view/edit/delete
- Status, fare, advance and balance management
- Search/filter/date filter
- CSV export
- Customer booking inserts directly into the cloud when configured
- Local fallback for testing before cloud setup
- Real UPI QR retained

## Setup

1. Create a Supabase project.
2. Open SQL Editor and run `supabase-schema.sql`.
3. Go to Authentication → Users and create your admin email/password user.
4. Copy the user's UUID.
5. Run the commented `insert into public.profiles...` statement with that UUID.
6. Copy `config.example.js` to `config.js`.
7. Put your Supabase URL, anon/public key and admin email in `config.js`.
8. Open `index.html` with Live Server.
9. Submit a test booking.
10. Open `admin.html`.
11. Sign in and confirm that the same booking appears.

## Security

- Never put a Supabase `service_role` key in frontend files.
- Keep Row Level Security enabled.
- Only admin users listed in `profiles` can read/update/delete bookings.
- Anonymous users can only create an `Enquiry`.
- Disable public signup if you do not need customer accounts.

## Booking architecture

Customer
→ website
→ Supabase `bookings`
→ secure admin dashboard

WhatsApp remains a parallel notification channel.

## Important

The cloud features are implemented, but they cannot be activated until your own Supabase project credentials are entered. No credentials are invented in this package.
