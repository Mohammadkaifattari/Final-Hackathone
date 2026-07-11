# PROGRESS.md — MaintainIQ

Track A: Advanced Full-Stack + GenAI · SMIT Final Hackathon

## Stack
- Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · MongoDB (Mongoose) · NextAuth v4 (credentials)
- Cloudinary (evidence images) · Vercel AI SDK + AI Gateway · QR via `qrcode`

## Assumptions log
- **Repo was a bare `create-next-app`.** There were NO pre-existing `lib/mongodb.ts`,
  `lib/auth.ts`, `models/*`, wired Cloudinary, or firebase packages despite the brief
  mentioning them. **All plumbing is built fresh.** Firebase is ignored entirely; MongoDB
  is the only database (as required).
- MongoDB is the only DB. NextAuth credentials is the only auth.
- `publicId` is a stable slug generated once per asset and never changes (even if
  name/location are edited) so QR codes never break.
- `issueNumber` is human-readable, zero-padded (`ISS-0001`).
- History is append-only.
- When a requirement was ambiguous, the fastest reasonable option was chosen and noted here.

## Phase status

### Phase 1 — UI shell with MOCK data ✅
Done:
- Design system in `app/globals.css` (oklch tokens, status/priority colors, fonts).
- Fonts wired in `app/layout.tsx` (Space Grotesk display + Inter body), dark theme.
- Shared UI primitives: `StatusBadge`, `PriorityBadge`, `Card`, `EmptyState`, motion variants.
- Mock data module (`lib/mock-data.ts`) driving all screens.
- Dashboard: bento summary cards + recent issues list.
- Asset list + asset detail (QR render via `qrcode`, print label, copy link, open public page).
- Public asset page `/asset/[publicId]` (mobile-first, no login) + report-issue flow.
- Issue detail with timeline + AI suggestion card.
- Internal ops layout with sidebar nav + top bar.
- Fully responsive; loading/empty/error states wired.
Next: Phase 2 (auth + roles).

### Phase 2 — Auth + roles (pending)
- NextAuth credentials login + register, seed admin + technician, protect internal routes,
  role-based UI enforced also on the server.

### Phase 3 — Database wiring (pending)
- All Mongoose models, server actions/route handlers, real CRUD, business rules (Section 4),
  append-only history, Cloudinary evidence upload. Replace all mock data.

### Phase 4 — AI + polish (pending)
- AI Issue Triage end-to-end (`generateObject` + Zod + mock fallback), search/filters,
  framer-motion polish, demo seed, README with setup + demo creds + API docs.
