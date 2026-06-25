# Polis Brand System

Polis should feel authentic, academic, and product-native: bold enough to stand apart from generic study tools, restrained enough to support serious coursework.

## Logo Usage

Use the shared `PolisMark` component for visible app chrome and marketing surfaces:

```tsx
import { PolisMark } from "@/components/brand/polis-mark";
```

The component combines:

- The transparent `public/brand/polis-icon.svg` asset.
- The cleaned, tightly cropped `public/brand/polis-wordmark-transparent.svg` asset, preserving the actual Polis letter shapes without the traced white background.

Avoid using the raster PNG logo assets directly in the UI. They include a white background and are not suitable for dark or glass surfaces.

## Core Palette

All colors live as tokens in `src/app/globals.css` and are surfaced through Tailwind utilities (`bg-`, `text-`, `border-`). Do not hardcode hex in components.

| Role | Hex | Usage |
| --- | --- | --- |
| Canvas (Parchment) | `#FCFBF9` | Page background everywhere — the logo's parchment quadrant |
| Ink (Navy) | `#162A4A` | Foreground text, primary actions, strong structure |
| Slate | `#4B6685` | Secondary text, calm UI, source tones |
| Gold | `#BA9858` | The brand thread + state: topbar rule, focal-card rule, active state, stage badges |
| Gold soft | `#EBD9BB` | Gold tint backgrounds (active nav, focal cards) |
| Card | `#FFFFFF` | Default surface |
| Card elevated | `#FFFEFB` | Focal/elevated surface |
| Sand (muted) | `#F5F2EB` | Muted bands, secondary surfaces |
| Border | `#E8E1D5` | Hairline separation (1px) |
| Border strong | `#D9CFBE` | Hover/emphasis borders |
| Success green | `#2F6B4A` | Source-supported status |
| Warning | `#A9854B` | Soft warnings, needs-evidence |
| Danger | `#9B2C2C` | Destructive actions, validation truth |

## Marketing Direction

The public site shares one language with the app: a **light, parchment canvas** with navy ink, slate secondary text, and gold as a selective brand thread.

- Upfront: state the product in the first viewport.
- Product-led: show a realistic workspace surface immediately.
- Light and airy: parchment canvas, hairline sand borders, near-invisible shadows, one focal moment per view.
- Gold as a thread: a 1px gold rule under the topbar, gold-tinted focal cards, gold for the active state.
- Motion-light: use hover/focus transitions only unless motion clarifies a real interaction.
- Source-truth focused: lead with workspace, evidence, writing help, and soft warnings.

Avoid:

- Dark frosted glass, decorative blobs, bokeh, playful illustration loops, and abstract mascots.
- Generic SaaS bento clutter.
- Fake metrics that do not explain the product.
- Raster logo files with visible backgrounds.
- Hero badges, eyebrows, or long category labels above the headline.
- Hardcoded hex outside `src/app/globals.css` — every color is a token.

## App Direction

The app itself remains quieter than the marketing site:

- Dashboard is workspace-first and does not show the sidenav.
- Workspace views use the sidenav because the user is now inside a module.
- Workspace creation and editing are intentionally name-only.
- The dashboard stays a simple workspace launcher.
- Workspace navigation is limited to Module Info, Sources, Assignments, and Settings pinned at the bottom.
- Module Info is the default workspace landing page and carries the setup tracker.

## Typography

- Use the configured sans font for UI controls, labels, and dense product chrome.
- Use the configured serif font for marketing headlines and selected academic/product headings.
- Keep control text deliberate and readable; do not rely on browser-default button sizing.

## Source-Backed States

Use consistent labels:

- `Source-supported`
- `Interpretation`
- `General context`
- `Unsupported`
- `Needs evidence`

Insufficient evidence should produce a soft warning. Fabricated citation data, fake page numbers, and misattributed source claims are never valid.
