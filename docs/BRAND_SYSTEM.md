# Polis Brand System

This document outlines the authoritative brand identity for the Polis platform, establishing a cohesive, premium, and academic visual system.

## Core Brand Concept
Polis is a coursework intelligence workspace designed for social science students. The visual identity should evoke a professional, academic, and polished environment—combining the rigour of a physical library archive with the seamless experience of modern consumer software (e.g., Apple x Google). 

To achieve this, the brand relies on a restrained palette rooted in classic academic aesthetics (navy ink, slate, gold foil, and parchment) executed with high-fidelity digital precision.

## Core Brand Palette
The core brand colours have been precisely extracted from the authoritative logo assets (`polis-icon.svg`, `polis-wordmark.svg`).

| Role | Colour Name | Hex Code | Usage context |
| :--- | :--- | :--- | :--- |
| **Primary** | Dark Navy | `#0f284d` | Core brand colour. Used for primary text, sidebars, active states, and dominant brand surfaces. High contrast and authoritative. |
| **Secondary** | Slate Blue | `#445f7c` | Muted supporting colour. Used for secondary UI elements, borders, secondary text, and interactive hover states. |
| **Highlight** | Gold | `#ba9858` | Accent colour. Used sparingly for primary Call-to-Actions (CTAs), warnings, or highlighting active/important workspace elements. |
| **Surface** | Parchment | `#ecdcbe` | Warm background colour. Used as a subtle alternative to harsh white for reading surfaces, giving a physical paper/academic feel. |

---

## Semantic UI Design Tokens
For the frontend reset, these core brand colours map to the following semantic CSS variables. This structure supports both Light and Dark mode themes seamlessly.

### Global CSS Variables

```css
@theme {
  /* Polis Brand Tokens - Light Theme Default */
  --color-brand-primary: #0f284d; /* Dark Navy */
  --color-brand-secondary: #445f7c; /* Slate Blue */
  --color-brand-accent: #ba9858; /* Gold */
  --color-brand-surface: #ecdcbe; /* Parchment */

  /* UI Functional Tokens - Light */
  --color-background: #ffffff; /* Crisp white for workspace canvas */
  --color-background-alt: #f8f9fa; /* Slightly cooler off-white for app shell */
  --color-background-warm: var(--color-brand-surface); /* For reading/focus zones */
  
  --color-foreground: var(--color-brand-primary);
  --color-foreground-muted: var(--color-brand-secondary);
  
  --color-border: #e2e8f0;
  --color-border-brand: var(--color-brand-secondary);

  /* AI & Intelligence specific tokens */
  --color-ai-surface: #f0f4f8; /* Soft slate tint for AI panels */
  --color-ai-border: #d0def0;
  --color-ai-text: #1a365d;
}

@media (prefers-color-scheme: dark) {
  :root {
    /* UI Functional Tokens - Dark */
    --color-background: #091324; /* Deepened Navy for dark canvas */
    --color-background-alt: var(--color-brand-primary); /* Dark Navy shell */
    --color-background-warm: #142a4a; 
    
    --color-foreground: var(--color-brand-surface); /* Parchment text on dark */
    --color-foreground-muted: #94a3b8;
    
    --color-border: #1e293b;
    --color-border-brand: var(--color-brand-secondary);

    /* AI & Intelligence specific tokens */
    --color-ai-surface: #13243a; 
    --color-ai-border: #2a4365;
    --color-ai-text: #e2e8f0;
  }
}
```

---

## Brand SVG Assets

The original rasterized (`.png`) assets have been meticulously recreated as clean, production-ready SVGs using exact geometry to ensure infinite scalability and crisp rendering across all viewports.

1.  **`polis-icon.svg`** 
    *   **Structure:** A handcrafted, precise geometric SVG using a `clip-path` mask.
    *   **Design:** A rounded diamond cut by diagonal gaps, revealing four distinct coloured segments surrounding a central dot.
    *   **Usage:** For avatars, favicons, collapsed sidebars, and tight UI spaces.

2.  **`polis-wordmark.svg`**
    *   **Structure:** A highly optimized vector trace.
    *   **Design:** Contains the "POLIS" text. It uses `fill="currentColor"` so it naturally adapts to the surrounding text colour (Dark Navy in light mode, Parchment/White in dark mode).
    *   **Usage:** For headers, footers, and inline brand mentions.

3.  **`polis-logo.svg`**
    *   **Structure:** A combined layout utilizing both the icon and the wordmark within a flexible, horizontally aligned `viewBox`.
    *   **Usage:** For the primary authentication screen, landing page hero, and expanded navigation sidebars.

### SVG Implementation Guidelines
*   **Avoid Fixed Dimensions:** The SVGs do not have hardcoded `width` or `height` attributes (other than proportional values or flexible `viewBox` definitions). Control their size using Tailwind utility classes (e.g., `w-8 h-8`, `h-6 w-auto`).
*   **Accessibility:** When using these SVGs inline, ensure they are accompanied by a `<title>` tag or `aria-label` (e.g., `aria-label="Polis Logo"`) for screen readers.

---

## Design System Principles (Frontend Reset)

As we rebuild the workspace frontend, adhere to these principles:

1.  **Minimalist Canvas:** The core workspace where students read and write (essays, sources) should be predominantly crisp white or warm parchment. Avoid aggressive colours that distract from text.
2.  **Authoritative Shell:** Use the Dark Navy (`#0f284d`) for the application shell (sidebars, top navigation) to frame the bright workspace, creating a clear physical boundary.
3.  **Restrained Accents:** Reserve the Gold (`#ba9858`) exclusively for primary actions (e.g., "Generate Plan", "Review Draft") so that the eye is naturally drawn to the next step in the workflow.
4.  **Academic Typography:** Ensure typography pairs well with the brand palette. Consider pairing a geometric sans-serif (e.g., Inter) for the UI with a highly legible serif (e.g., Merriweather, Lora) for the academic content and essay editor.
