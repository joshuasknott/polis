# Polis Redesign — Design Spec

**Date:** 2026-06-16
**Status:** Approved for implementation
**Objective:** A thorough redesign of the entirety of Polis — seamless, minimalist, polished — taking inspiration from the logo's colors and geometry.

## Confirmed Direction (from brainstorming)

| Decision | Choice |
| --- | --- |
| Theme | **Light everywhere** (unify on warm parchment; retire the dark marketing site) |
| Visual register | **Quiet + selective emphasis** (airy whitespace, hairline borders, one focal moment per view) |
| Gold usage | **State + brand thread** (gold for meaningful states AND as a recurring brand thread) |
| Structure | **Approach C — Hybrid** (design tokens in `globals.css` + shared primitives, then phased surface application) |

## 1. Design Language — inspiration from the logo

The logo is a four-quadrant rotated diamond (classical *agora* mark) with a central dot, in **Navy / Slate / Gold / Parchment**.

### Color → role mapping

| Logo color | Hex | Role in the product |
| --- | --- | --- |
| Parchment | `#FCFBF9` | Canvas — the page itself. Calm, warm, paper-like. |
| Navy | `#162A4A` | Ink — text, primary structure, primary action. Center of gravity. |
| Slate | `#4B6685` | Quiet structure — secondary text, borders, calm UI. |
| Gold | `#BA9858` | The thread + state — active indicator, stage badges, topbar rule, focal-card tints, selection. |

### Three principles (from the logo's geometry)

1. **Quadrant clarity** — each surface has one clear focal point (the "center dot"). No surface competes with itself.
2. **Hairline separation** — the logo's quadrants are divided by fine diagonal gaps. In UI: 1px sand borders, near-invisible shadows, surfaces that almost touch.
3. **Selective gilding** — gold is precious. It marks *meaning* (a stage, the active state, a focal card), never decoration.

### Typography

- **Lora serif** — the single focal headline per view.
- **Geist sans** — all UI and dense chrome.
- **Geist mono** — metadata only (codes, timestamps, counts).

## 2. Token System — `src/app/globals.css`

One source of truth. Every color is a CSS variable consumed via Tailwind's `@theme`. **No raw hex outside this file** (audit gate, §9).

```css
:root {
  /* Logo-derived canvas */
  --background: #FCFBF9;        /* Parchment */
  --foreground: #162A4A;        /* Navy ink */

  /* Surfaces & borders — sand family */
  --card: #FFFFFF;
  --card-elevated: #FFFEFB;
  --muted: #F5F2EB;
  --border: #E8E1D5;
  --border-strong: #D9CFBE;

  /* Text scale */
  --muted-foreground: #4B6685;  /* Slate */

  /* Brand — Navy + Gold */
  --accent: #162A4A;
  --accent-foreground: #FCFBF9;
  --gold: #BA9858;
  --gold-soft: #EBD9BB;
  --gold-foreground: #5A481F;

  /* Semantic — derived, kept */
  --success: #2F6B4A;
  --warning: #A9854B;
  --danger: #9B2C2C;
  --source: #4B6685;
  --interpretation: #A9854B;
}
```

The `@theme inline` block maps these to Tailwind color utilities (`--color-gold`, `--color-card-elevated`, `--color-border-strong`, etc.).

**Module colour palette:** the `MODULE_COLOURS` rainbow (`#2563eb`, `#7c3aed`, `#dc2626`…) is replaced with a 4-swatch logo-derived set: Navy `#162A4A`, Slate `#4B6685`, Gold `#BA9858`, Deep-parchment `#8A7B5A`.

## 3. Shared Primitives — `src/components/ui/`

A small, token-only component library. Every surface composes the same atoms.

| Primitive | Responsibility |
| --- | --- |
| `Button` | variants: `primary` (navy), `secondary` (outline sand), `ghost`, `danger`; sizes `sm`/`md`/`lg`; `loading`. Consistent `min-h` for a11y. |
| `Card` | `rounded-xl border border-border bg-card`; variants `accent` (gold left rule, focal) and `interactive` (hover lift). |
| `Badge` | semantic tones: `stage` (gold), `source` (slate), `success`, `warning`, `neutral`. Single source for provenance + marketing + stage labels. |
| `Input` / `Textarea` | unified focus ring `focus:ring-gold/30 focus:border-gold`; replaces the repeated 8-line input class string. |
| `Dialog` | modal shell; replaces both hand-rolled modals in dashboard. |
| `EmptyState` | icon + serif headline + body + CTA. |
| `SectionHeading` | enforces "one serif headline per view" with consistent tracking. |

## 4. Marketing Surface — `src/components/landing/marketing-site.tsx`

The biggest transformation: dark → light, unified with the app.

- **Hero**: parchment canvas, navy serif headline, slate body. Workspace preview becomes the **gold-accented focal card** (thin gold left rule, `card-elevated`).
- **Grid backdrop**: hairline parchment grid (slate at ~6% opacity) — not white-on-black.
- **Workflow section**: standardized to `Card` + `Badge stage`.
- **Integrity section**: flipped to light; cards on muted sand; source/warning badges via `Badge`.
- **Topbar**: parchment with a **1px gold bottom rule** (brand thread).
- **All hardcoded hex** (`#060b14`, `#07111f`, `#b7c4d6`, …) → tokens.

## 5. App Shell — `shell.tsx`, `sidebar.tsx`, `topbar.tsx`

Already token-based — light polish.

- **Topbar**: add the **1px gold bottom rule** + subtle shadow on scroll.
- **Sidebar**: active item gets a **2px gold left tick** instead of solid navy fill (quieter; gold-as-state). Module avatar uses logo-derived colours.
- **Mobile nav**: same gold rule; scrim unchanged.

## 6. Dashboard — `src/components/dashboard/dashboard-content.tsx`

- Replace `MODULE_COLOURS` rainbow → 4 logo swatches.
- Module cards: 2px gold left rule + `Card interactive`.
- Both hand-rolled modals → `Dialog` + `Button` + `Input`.
- Empty state → `EmptyState`.
- Stat pills → `Badge neutral`.

## 7. Workspace, Write/Review, Sources, Timeline

Consistency enforcement (these are token-aware already).

- **Workspace** (home, imports, assessments, kb, settings): adopt `Card`, `Badge`, `Button`, `Input`, `SectionHeading`. Remove raw hex from `workspace-settings.tsx`.
- **Write surface + provenance badges**: provenance labels use `Badge` tones (`source`, `interpretation`, `success`, `warning`). Same component marketing shows.
- **Sources / source-viewer**: `Card` + `Badge`.
- **Timeline**: stage badges via `Badge stage`.

## 8. Auth — `sign-in`, `sign-up`

Light, centered, minimal: parchment canvas, a single `Card` with `PolisMark`, gold rule under the card header, Clerk components themed to inherit tokens (navy primary button). One focal element — the form.

## 9. Audit Gate (the "seamless" guarantee)

After implementation:

```bash
# No raw hex outside globals.css
git grep -n -E "#[0-9a-fA-F]{6}" -- "src/"   # → only src/app/globals.css
npm run lint                                  # green
npm run build                                 # green
```

## Out of scope (YAGNI)

- No new product features, routes, or data-model changes.
- No dark mode (light everywhere is the confirmed direction).
- No motion library — hover/focus transitions only.
- No raster logo changes (SVG icon + wordmark retained).
