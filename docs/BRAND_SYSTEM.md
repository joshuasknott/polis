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

| Role | Hex | Usage |
| --- | --- | --- |
| Ink | `#060b14` | Marketing page base, deepest product surfaces |
| Navy | `#07111f` | Primary dark sections, app preview background |
| Brand navy | `#0f284d` | Product shell, strong text, selected states |
| Slate | `#445f7c` | Secondary text, borders, calm UI structure |
| Gold | `#ba9858` | Selective emphasis, stage badges, warning-adjacent accents |
| Success green | `#2F6B4A` | Source-supported status |
| Canvas | `#f7f9fc` | Light marketing/product bands |
| Border | `#dfe6ef` | Light section borders |

## Marketing Direction

The public site should be:

- Upfront: state the product in the first viewport.
- Product-led: show a realistic workspace surface immediately.
- Dark and frosted: use translucent panels, crisp borders, and quiet shadows.
- Motion-light: use hover/focus transitions only unless motion clarifies a real interaction.
- Source-truth focused: lead with workspace, evidence, writing help, and soft warnings.

Avoid:

- Decorative blobs, bokeh, playful illustration loops, and abstract mascots.
- Generic SaaS bento clutter.
- Fake metrics that do not explain the product.
- Raster logo files with visible backgrounds.
- Hero badges, eyebrows, or long category labels above the headline.

## App Direction

The app itself remains quieter than the marketing site:

- Dashboard is workspace-first and does not show the sidenav.
- Workspace views use the sidenav because the user is now inside a module.
- Workspace creation is intentionally lightweight: name, semester, year.
- Timeline lives inside Workspaces, not as a separate top-level destination.

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
