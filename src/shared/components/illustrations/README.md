# JCV brand illustrations

Inline SVG line art for empty, error and success states. No dependencies, no
asset files, no runtime cost beyond the markup.

## The motif: el arco roto

Every illustration is the **same broken ring**: a 308-degree graphite arc,
centred at `(60, 60)` with radius `40`, interrupted at the top-right by a
right-angle cyan chevron — the **V-notch**, lifted from the V of the JCV
wordmark. The subject changes; the ring never does.

Why this and not a generic mascot or spot illustration:

- The app already speaks in rings. `TrackingCalendar` closes a
  `stroke-dashoffset` ring every time a day is completed (`.celebrate-ring` in
  `globals.css`). The arc is that ring, seen again.
- The break is the point. An unfinished arc is a state that is not done yet, and
  the V sitting in the gap is both the wordmark and the shape of effort. The
  illustration says "there is work left" before you read a single word.
- One motif repeated across six drawings makes a system out of six drawings. A
  user who sees the 404 and later the offline banner recognises the same hand.

**The arc encodes state, so never pick it for looks:**

| Arc | Meaning | Used by |
| --- | --- | --- |
| Graphite (`state="open"`, default) | unfinished — empty, offline, lost | EmptyPlan, EmptyProgress, NoConnection, NotFound, Coach |
| Cyan (`state="closed"`) | complete | PlanReady only |

`PlanReady` also reuses the V-notch as its checkmark, rotated 180 degrees — the
mark that was missing from the ring is the mark that confirms you finished.

## Style rules

- **Single stroke weight: 2.** Everywhere, accent included. No hierarchy by
  thickness; hierarchy comes from colour and opacity. (The one exception is the
  5-unit round cap used to draw a dot in `NoConnection`.)
- **`strokeLinecap` and `strokeLinejoin` are `round`,** set once on the `<svg>`
  and inherited.
- **Palette — three values, no more:**
  - `LINE` = `var(--text-muted, #94a3b8)` at `strokeOpacity 0.5` — structure and
    subject.
  - `ACCENT` = `var(--accent-cyan, #22d3ee)` at full opacity — the V-notch plus
    **at most one** other element.
  - `MASS` = `var(--bg-card, #1a2029)` — the only fill, used to make a shape read
    as solid against the dark background.
  - The tokens are CSS variables with hex fallbacks, so illustrations follow
    `globals.css` and still render standalone (email, static export, tests).
- **`viewBox="0 0 120 120"` for all of them,** so a row of illustrations aligns
  optically without per-component nudging. Keep art inside the radius-40 circle;
  the 20-unit margin is the breathing room.
- **No gradients, no shadows, no drop-in glow.** If a surface needs glow, the
  consumer adds `.glow-cyan-soft` to a wrapper.
- **No animation.** These render in empty and error states where the user is
  already stuck; a moving drawing adds noise. If you ever add motion, gate it
  behind `prefers-reduced-motion` (see `features/shared/utils/reduced-motion`).

### Do

- Reuse `BrokenArc` as-is. Draw the subject inside it.
- Keep the subject to five shapes or fewer.
- Give the accent to the one element the user should act on.

### Don't

- Don't recolour with anything outside cyan / graphite. Success green and danger
  red are semantic-only and belong to status UI, not to drawings.
- Don't scale, rotate or reposition the arc per illustration.
- Don't add a second accent element "for balance".
- Don't set width/height attributes; size with Tailwind classes.

## Usage

```tsx
import { EmptyPlan, PlanReady } from "@/shared/components/illustrations";

// Meaningful: the drawing carries information the copy doesn't repeat.
<EmptyPlan title="Todavia no tienes un plan" className="w-36 h-36 mx-auto mb-6" />

// Decorative: the heading right below already says it. Renders aria-hidden.
<PlanReady className="w-24 h-24" />
```

Props:

| Prop | Type | Notes |
| --- | --- | --- |
| `className` | `string?` | Sizing and spacing. Always set a width and height. |
| `title` | `string?` | Accessible name. Present → `role="img"` + `aria-label` + `<title>`. Absent → `aria-hidden="true"`. |

They are plain function components with no hooks, so they work in both server
and client components.

## The set

| Component | State | Wired at |
| --- | --- | --- |
| `EmptyPlan` | no plan generated yet | `src/app/plan/view/page.tsx` (no-plan branch) |
| `NotFound` | 404 | `src/app/not-found.tsx` |
| `EmptyProgress` | no tracked days yet | not wired — `TrackingCalendar` has no zero-day branch today |
| `NoConnection` | offline | not wired — `PlanViewer` offline banner is a one-line strip |
| `PlanReady` | plan generated / payment confirmed | not wired — `payment/success` and the wizard hand-off |
| `Coach` | human contact | not wired — WhatsApp CTA blocks (`landing/sections/CTASection`) |

## Adding one

1. Copy the smallest existing component (`PlanReady`).
2. Render `<BrokenArc />` first, subject second.
3. Stay inside the circle, stay on weight 2, spend the accent once.
4. Add it to `index.ts` and to the `it.each` list in
   `__tests__/illustrations.test.tsx`.
