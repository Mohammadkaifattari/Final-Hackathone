# Progress

This is a hackathon starter **skeleton** — a plumbing test kit. Keep files small
and readable so future AI sessions can extend it.

## DONE

- **Core**
  - `lib/mongodb.ts` — cached Mongoose connection (serverless-safe)
  - `lib/pusher.ts` — server + client Pusher helpers (shared channel/event names)
  - `lib/cloudinary.ts` — server-side Cloudinary config (secret never exposed)
  - `lib/stripe.ts` — lazy Stripe client
  - `lib/auth.ts` — NextAuth options (credentials + Google)
  - `models/User.ts` — user model (hashed password, provider field)
  - `models/Note.ts` — notes model (user-scoped)
  - `types/index.ts` — all shared types
- **Status dashboard** (`/`)
  - Env var table (SET / MISSING) via `/api/status`
  - Live checks: MongoDB, Stripe, Cloudinary, Pusher, Resend
  - Links to every test page
- **Auth** (`/auth-test`) — signup, credentials login, Google OAuth, logout, session display
  - `/api/signup`, `/api/auth/[...nextauth]`
- **MongoDB CRUD** (`/mongo-test`) — create/read/update/delete notes, login-protected
  - `/api/notes` (GET/POST/PUT/DELETE), each query scoped to `userId`
- **Cloudinary** (`/cloudinary-test`) — upload + delete
  - `/api/cloudinary-upload`, `/api/cloudinary-delete`
- **Stripe** (`/stripe-test`) — $1 test checkout, success/cancel pages
  - `/api/checkout`, `/api/webhooks/stripe`
- **Resend** (`/resend-test`) — send test email
  - `/api/send-email`
- **Pusher** (`/pusher-test`) — send + live-subscribe realtime messages
  - `/api/pusher-send`

## IN PROGRESS

- Nothing.

## TODO

- Waiting for hackathon theme. Design system, real features, and content will be
  layered on top of this skeleton on hackathon night. See `DESIGN.md`.

## Manual setup still required

- **Google OAuth**: add authorized redirect URI in Google Cloud Console:
  `https://<your-domain>/api/auth/callback/google` (and
  `http://localhost:3000/api/auth/callback/google` for local dev).
- **Stripe webhook**: create an endpoint pointing to
  `https://<your-domain>/api/webhooks/stripe`, subscribe to
  `checkout.session.completed`, and set `STRIPE_WEBHOOK_SECRET`. For local
  testing use `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
- **Resend**: without a verified domain, emails send from `onboarding@resend.dev`
  and only deliver to your own Resend account email. Verify a domain to send to
  anyone.
- **NEXTAUTH_URL**: must match the deployed URL (e.g. `http://localhost:3000` in
  dev).
- **Pusher**: confirm the app cluster matches `NEXT_PUBLIC_PUSHER_CLUSTER`.
