# MaintainIQ — Design System

A premium, credible **operations console** for maintenance & asset management.
Dark-mode-first. Functional over decorative. Think NOC / monitoring tool, not a consumer app.

---

## 1. Color tokens (oklch, defined in `app/globals.css`)

All colors are exposed as CSS custom properties and mapped into Tailwind's
`@theme` so utilities like `bg-surface`, `text-accent`, `border-line` work.

| Token              | Value                  | Used for                                  |
|--------------------|------------------------|-------------------------------------------|
| `--background`      | `oklch(0.16 0.012 260)` | App background (deep slate / near-black) |
| `--surface`         | `oklch(0.205 0.012 260)`| Card / panel background                   |
| `--surface-2`       | `oklch(0.245 0.012 260)`| Raised surfaces, hover, inputs            |
| `--foreground`      | `oklch(0.97 0.005 260)` | Primary text (near-white)                 |
| `--muted`           | `oklch(0.68 0.015 260)` | Secondary text, captions                  |
| `--line`            | `oklch(0.30 0.012 260)` | Borders, dividers                         |
| `--accent`          | `oklch(0.78 0.14 200)`  | Primary accent — **cyan/teal**            |
| `--accent-fg`       | `oklch(0.18 0.04 220)`  | Text on accent background                 |

### Functional status colors (consistent badges EVERYWHERE)

| Meaning            | Token           | Value                  |
|--------------------|-----------------|------------------------|
| Operational        | `--status-ok`    | `oklch(0.72 0.16 152)` emerald |
| Issue Reported     | `--status-report`| `oklch(0.80 0.15 85)` amber     |
| Under Inspection   | `--status-inspect`| `oklch(0.80 0.15 85)` amber (darker ring) |
| Under Maintenance  | `--status-maint` | `oklch(0.73 0.17 55)` orange    |
| Out of Service     | `--status-down`  | `oklch(0.62 0.22 25)` red       |
| Retired            | `--status-retired`| `oklch(0.60 0.012 260)` muted slate |
| **Critical** priority | `--critical`  | `oklch(0.60 0.24 25)` red — visually LOUD, distinct from normal priorities |

> No purple/violet. No scattered gradient blobs. If a background is overridden, its
> text color is overridden too (contrast preserved).

---

## 2. Typography (next/font, max 2 fonts)

- **Display / headings:** `Space_Grotesk` → `--font-display` (weights 500–700)
- **Body:** `Inter` → `--font-body` (weights 400–600)
- Body line-height relaxed **1.5**.
- Headings use `text-balance`; paragraphs use `text-pretty`.

---

## 3. Layout

- **Flexbox first.** CSS Grid only for the bento dashboard summary.
- **Dashboard:** bento summary cards — total assets, open issues, **CRITICAL** count,
  assets Out of Service, assets due for service. No decorative filler charts.
- **Responsive, mobile-first.** The **public asset page must be perfect on a phone**
  (evaluator scans QR → views on mobile).
- Tailwind spacing scale + `gap-*` utilities throughout.

---

## 4. Iconography

`lucide-react` ONLY. Consistent sizes **16 / 20 / 24**.
Set: `Wrench, QrCode, ScanLine, ClipboardList, AlertTriangle, CircleCheck, History,
Users, Gauge, Package, MapPin`. **Never** emojis as icons.

---

## 5. Motion (framer-motion)

Purposeful, subtle (this is an ops tool). Durations **150–400ms**.

- Page-transition fades
- Staggered list/card reveals on mount
- Subtle hover/tap micro-interactions on cards + buttons
- Smooth modal/dialog transitions
- Animated status changes

---

## 6. Component conventions

- **StatusBadge** renders every asset/issue status with its functional color — one
  component, used everywhere so colors stay consistent.
- **PriorityBadge** renders priority; `critical` is loud red.
- Cards: `bg-surface`, `border border-line`, `rounded-xl`, subtle hover lift.
- Buttons: primary = `bg-accent text-accent-fg`; secondary = outline `border-line`.
- Every async surface has **loading + error + empty** states. Nothing crashes.
