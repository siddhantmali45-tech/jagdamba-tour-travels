# V12 — Booking Approval & Customer Status

## Workflow

Customer submits:
PENDING / ENQUIRY

Admin:
1. Reviews request
2. Adds final fare
3. Approves → ADVANCE PENDING
4. Customer receives WhatsApp quote message
5. Customer pays agreed advance
6. Admin marks CONFIRMED after payment verification

Admin can also reject a booking.

## Two approval / access paths

The same booking can be managed from:
- Admin web dashboard (phone/laptop)
- WhatsApp notification/action

WhatsApp is the communication/notification channel. Supabase is the source of truth for booking status.

## Customer status

Customer can open:
booking-status.html

and enter:
- Booking ID
- Mobile number

The customer can see status, route, date, fare, advance and balance.

## Supabase

Run:
1. V11 `supabase-schema.sql`
2. V12 `supabase-v12.sql`

Then configure `config.js`.

## Notifications

V12 uses WhatsApp links for customer notification from the admin dashboard.
Automated email/WhatsApp API notifications require external provider configuration and are deliberately not faked.

## Payment

The QR remains available. The admin should confirm the amount and verify payment before setting status to Confirmed.

## Important

V12 is a strong prototype/early production architecture. Before taking real public bookings, add:
- automated email service
- WhatsApp Business API/provider
- payment reconciliation
- Terms & Conditions
- cancellation/refund policy
- privacy policy
- domain + HTTPS
- final end-to-end testing
