# Design System — Notion-inspired Premium UI

## Overview

Notion looks like a well-organized desk in good daylight. The dominant surface is not pure white but a warm, paper-soft off-white — `{colors.canvas-soft}` (#f6f5f4) — that takes the clinical edge off the screen and makes long pages feel like a document rather than an app. Type is set in `NotionInter` (a tuned Inter) in near-black `{colors.ink}` at large, tightly-tracked weights, so headlines read as confident statements with very little letter-spacing slack at display sizes (`{typography.display-1}` pulls −2.125px of tracking at 64px). The whole system whispers in greys and blacks, then says exactly one thing: a single, dependable black, `{colors.primary}` (#000000), reserved almost entirely for the primary call-to-action and inline links.

Against that quiet chrome, Notion lets a **playful multi-colour sticker palette** carry all of the brand's personality — purple, pink, orange, teal, green and sky-blue appear as small illustrated blocks, app-icon stickers, and category dots scattered through the marketing pages. These colours never structure the layout or paint a CTA; they decorate. The discipline is deliberate: the interface stays monochrome-plus-blue so the content (and the cheerful illustrations) can breathe. The one exception to the bright daylight is the homepage hero, which inverts into a deep indigo "night" band (`{colors.secondary}`) with white type and glowing sticker constellations — a single dark island in an otherwise light document.

Surfaces are defined by hairlines and the faintest layered shadows rather than heavy elevation. Cards round at a friendly 12px (`{rounded.lg}`), the marketing CTAs are fully-pill-shaped (`{rounded.full}`), and utility buttons round at a tighter 8px (`{rounded.md}`). Nothing is loud; the brand's character comes from restraint plus one well-placed splash of joy.

**Key Characteristics:**

- Warm paper-soft canvas `{colors.canvas-soft}` over pure white, never clinical
- Near-black `{colors.ink}` `NotionInter` type with tight negative tracking at display sizes (`{typography.display-1}`)
- Exactly one structural accent — Black `{colors.primary}` — reserved for CTAs and links
- A decorative-only multi-colour sticker palette (`{colors.accent-purple}`, `{colors.accent-orange}`, `{colors.accent-teal}`, `{colors.accent-green}`, `{colors.accent-sky}`) that adds personality without ever painting structure
- Primary CTAs are standard rounded (`{rounded.md}`) rather than pill-shaped.
- Elevation by hairline + barely-there layered shadow, not heavy drop-shadows
- A single dark indigo hero "night" band (`{colors.secondary}`) inverting the otherwise daylight page rhythm

---

## Design Principles

1. **Mobile-first, always.** The base style is mobile. Tablet, desktop and wide are added progressively via breakpoints.
2. **Content-first.** Content determines layout, never the reverse.
3. **Restraint over decoration.** One structural accent (`{colors.primary}`). Everything else is function or controlled decoration.
4. **Breathing room is a feature.** Whitespace groups better than any line or shadow.
5. **Accessibility is not a plugin.** WCAG 2.2 AA is the floor, not the ceiling.
6. **Every interaction has a state.** Nothing is "static"; everything responds.
7. **Tokens over values.** If a value repeats or carries meaning, it must be a token.

---

## Colors

&gt; Source pages analysed: the Notion home page plus Pricing, Enterprise, Product (AI), Product (Agents), and Startups. Every secondary page resolved to the same core palette — Notion runs one tightly-scoped system across the marketing site.

### Brand & Accent

- **Brand Black** (`{colors.primary}` — #000000): the single structural accent. Primary CTA fill ("Get Notion free"), inline link colour, active-tab and focus signal. This is the only colour that ever paints an action.
- **Pressed Black** (`{colors.primary-active}` — #31302e): the darker press state of the primary CTA.
- **Deep Indigo** (`{colors.secondary}` — #213183): the dark hero "night" band background and its sticker-constellation field; a deep brand-blue used for full-bleed inverted sections.

The remaining colours form Notion's **decorative sticker palette** — they appear only as illustrated blocks, app stickers and category dots, never as CTAs or structural fills:

- **Sticker Sky** (`{colors.accent-sky}` — #62aef0)
- **Sticker Purple** (`{colors.accent-purple}` — #d6b6f6) / **Deep Purple** (`{colors.accent-purple-deep}` — #391c57)
- **Sticker Orange** (`{colors.accent-orange}` — #dd5b00) / **Deep Orange** (`{colors.accent-orange-deep}` — #793400)
- **Sticker Teal** (`{colors.accent-teal}` — #2a9d99)
- **Sticker Green** (`{colors.accent-green}` — #1aae39)
- **Sticker Brown** (`{colors.accent-brown}` — #523410)

### Surface

- **White** (`{colors.canvas}` / `{colors.surface}` — #ffffff): card and panel surfaces, nav bar, form fields.
- **Warm Paper** (`{colors.canvas-soft}` — #f6f5f4): the signature page canvas and the footer band — a warm off-white that gives the whole site its document-like calm.
- **Hairline** (`{colors.hairline}` — #e6e6e6): 1px card borders and dividers, a black-at-10%-on-white blend kept solid for token reuse.

### Text

- **Ink** (`{colors.ink}` — #000000): primary headings and body text (rendered at ~95% alpha for a soft true-black).
- **Warm Charcoal** (`{colors.ink-secondary}` — #31302e): secondary body copy and footer text.
- **Stone** (`{colors.ink-muted}` — #615d59): supporting / muted copy.
- **Ash** (`{colors.ink-faint}` — #a39e98): captions, metadata, placeholder text.

### Semantic

Notion's marketing surfaces do not expose a dedicated error/success palette in the system chrome — status is carried by the sticker palette (e.g. `{colors.accent-green}` for affirmative ticks) rather than a separate semantic ramp. For application surfaces (forms, validation, system feedback), the following semantic tokens are mandatory:

| Token                     | Hex     | Use                                   |
| ------------------------- | ------- | ------------------------------------- |
| `{colors.error}`          | #dc2626 | Validation errors, destructive alerts |
| `{colors.error-subtle}`   | #fef2f2 | Background of fields with error       |
| `{colors.success}`        | #16a34a | Confirmations, success states         |
| `{colors.success-subtle}` | #f0fdf4 | Background of success states          |
| `{colors.warning}`        | #d97706 | Warnings, irreversible actions        |
| `{colors.warning-subtle}` | #fffbeb | Background of warning states          |

&gt; These do NOT replace `{colors.primary}`. They are for state communication, not primary actions.

---

## Typography

### Font Family

The entire system is set in **`NotionInter`** — Notion's tuned cut of Inter — with a fallback stack of `Inter, -apple-system, system-ui, "Segoe UI", Helvetica, Arial`. A single family carries everything from 64px display headlines to 12px eyebrows; there is no serif, no monospace display face. OpenType `lnum` (lining numerals) and `locl` features are enabled on body and heading roles.

### Hierarchy

| Token                    | Size | Weight | Line Height | Letter Spacing | Use                                      |
| ------------------------ | ---- | ------ | ----------- | -------------- | ---------------------------------------- |
| `{typography.display-1}` | 64px | 700    | 1.0         | −2.125px       | Hero headline ("Meet the night shift")   |
| `{typography.display-2}` | 54px | 700    | 1.04        | −1.875px       | Large section headlines                  |
| `{typography.heading-1}` | 40px | 700    | 1.1         | −1px           | Section headlines ("Plans and features") |
| `{typography.heading-2}` | 26px | 700    | 1.23        | −0.625px       | Sub-section headings                     |
| `{typography.heading-3}` | 22px | 700    | 1.27        | −0.25px        | Card titles                              |
| `{typography.title}`     | 20px | 600    | 1.4         | −0.125px       | Feature titles, callouts                 |
| `{typography.body-md}`   | 16px | 400    | 1.5         | 0              | Default body copy                        |
| `{typography.body-sm}`   | 15px | 400    | 1.33        | 0              | Dense body, table rows, nav              |
| `{typography.button}`    | 16px | 500    | 1.5         | 0              | Button labels                            |
| `{typography.caption}`   | 14px | 400    | 1.43        | 0              | Captions, footnotes                      |
| `{typography.eyebrow}`   | 12px | 600    | 1.33        | +0.125px       | Pill badges, small labels                |

### Responsive Typography

To ensure fluid scaling without jarring breakpoint jumps, display and heading tokens should use `clamp()` where the design tool supports it:

| Token                    | Fluid Range                               | Weight | Line Height | Tracking |
| ------------------------ | ----------------------------------------- | ------ | ----------- | -------- |
| `{typography.display-1}` | `clamp(2.5rem, 5vw + 1rem, 4rem)`         | 700    | 1.0         | −2.125px |
| `{typography.display-2}` | `clamp(2.25rem, 4vw + 0.75rem, 3.375rem)` | 700    | 1.04        | −1.875px |
| `{typography.heading-1}` | `clamp(1.75rem, 3vw + 0.5rem, 2.5rem)`    | 700    | 1.1         | −1px     |
| `{typography.heading-2}` | `clamp(1.375rem, 2vw + 0.5rem, 1.625rem)` | 700    | 1.23        | −0.625px |

&gt; **Rule:** Never shrink body copy below 16px on mobile to prevent involuntary zoom on iOS.

### Principles

Notion's type voice is **tight, heavy, and quiet-confident**. Headlines lean on weight 700 and aggressive negative tracking (more negative the larger the size) so display copy feels set, not stretched. Body copy stays at a comfortable 1.5 line-height for document readability. The contrast between a heavy 700 headline and a calm 400 body is the primary expressive lever — there is no decorative typography, only a clear hierarchy.

### Note on Font Substitutes

`NotionInter` is a proprietary tuning of the open-source **Inter** family — substitute Inter directly. To approximate Notion's display tightness, apply the negative letter-spacing values in the table above explicitly (Inter at default tracking will read looser than `NotionInter`).

---

## Layout

### Spacing System

- **Base unit**: 8px.
- **Tokens**: `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 28px · `{spacing.xxl}` 32px · `{spacing.xxxl}` 48px · `{spacing.xxxxl}` 64px.
- Card interior padding lands around `{spacing.lg}` (24px); utility buttons use a tight 4px/14px; form fields pad at `{spacing.xxs}`-scale 6px. Section gaps stack the larger steps.

### Grid & Container

- **System**: 12-column fluid grid.
- **Gutter**: `{spacing.md}` (16px) on mobile, `{spacing.lg}` (24px) on desktop.
- **Container max-width**: 1280px, centred.
- **Outer padding**: 16px (mobile) / 24px (tablet) / 32px (desktop) / 48px (wide).
- **Text measure**: Maximum `65ch` (~520px at 16px) for pure reading blocks. Never wider.

### Whitespace Philosophy

Whitespace is the primary grouping device. Sections are separated by large vertical gaps rather than rules, and cards sit on the warm canvas with quiet hairlines instead of heavy frames. The effect is document-like: airy, scannable, and never crowded.

### Responsive Strategy

#### Breakpoints

| Name    | Width       | Key Changes                                          |
| ------- | ----------- | ---------------------------------------------------- |
| Wide    | 1440px+     | Full multi-column grids, widest container            |
| Desktop | 1080–1300px | Standard centred container, 3-up card grids          |
| Tablet  | 768–840px   | Grids collapse to 2-up, nav begins condensing        |
| Mobile  | ≤600px      | Single-column stacks, hamburger nav, full-width CTAs |

#### Touch Targets

- Minimum 44×44px for any interactive control.
- Buttons must preserve vertical padding of at least 12px on mobile.
- CTAs (`button-primary`, `button-secondary`) and utility buttons (`button-utility`) carry comfortable tap padding.

#### Collapsing Strategy

The top nav condenses to a hamburger below the tablet breakpoint; multi-column card grids collapse to a single stacked column; the pricing plan table reflows from 4 side-by-side columns into stacked plan cards. Section padding tightens but the warm-canvas rhythm is preserved.

#### Image Behavior

Product screenshots and illustration tiles sit inside rounded `{rounded.lg}` frames and scale fluidly within their grid cell. Sticker illustrations are small fixed-scale decorative assets that re-flow but do not crop.

---

## Visual Rhythm

### Line Length

- Reading text: maximum `65ch`.
- Dense text (tables, lists): maximum `75ch`.

### Section Spacing

- Between major sections: `{spacing.xxxl}` (48px) or `{spacing.xxxxl}` (64px).
- Inside a section: `{spacing.lg}` (24px) to `{spacing.xl}` (28px).
- Between paragraphs: `{spacing.sm}` (12px).

### Information Density

- **Relaxed:** Dashboards, long-form reading. More space, fewer elements per row.
- **Normal:** Listings, forms. Standard balance.
- **Compact:** Dense tables, data grids. Reduce internal padding to `{spacing.xs}` (8px), never less.

&gt; **Rule:** If a card contains more than 7 distinct visual elements, split or simplify.

---

## Elevation & Depth

| Level        | Treatment                                                                                                                        | Use                                                        |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 0 — Flat     | Hairline border `{colors.hairline}`, no shadow                                                                                   | Default cards on the warm canvas                           |
| 1 — Soft     | Layered micro-shadow: `rgba(0,0,0,0.01) 0 0.175px 1.041px`, `0.02 0 0.8px 2.925px`, `0.027 0 2.025px 7.847px`, `0.04 0 4px 18px` | Raised feature cards, floating buttons                     |
| 2 — Elevated | Deeper 5-stop stack ending in `rgba(0,0,0,0.05) 0 23px 52px`                                                                     | Modals, popovers, the elevated white pill on the dark hero |

Notion's elevation philosophy is **barely-there**: shadows are built from many near-transparent layers so surfaces feel gently lifted off the paper rather than dramatically dropped. Most cards rely on a hairline alone.

### Decorative Depth

The brand's real depth cue is **illustration**, not shadow. The dark indigo hero (`{colors.secondary}`) uses glowing sticker stickers and a starfield to create a sense of a lit night scene, and feature sections layer small colourful app-icon stickers over plain surfaces to add playful dimensionality. Colour-blocked illustration tiles (purple, pink, orange, teal headers on otherwise-white cards) provide visual rhythm.

---

## Shapes

### Border Radius Scale

| Token            | Value  | Use                                               |
| ---------------- | ------ | ------------------------------------------------- |
| `{rounded.xs}`   | 4px    | Form fields, small tags, inline chips             |
| `{rounded.sm}`   | 5px    | Menu items, list rows, status pills               |
| `{rounded.md}`   | 8px    | Utility / nav buttons, smaller cards              |
| `{rounded.lg}`   | 12px   | Feature cards, illustration frames, content tiles |
| `{rounded.xl}`   | 16px   | Large containers, image wells                     |
| `{rounded.full}` | 9999px | Badges, circular icon buttons (CTAs are NOT pill) |

### Photography Geometry

Product screenshots are framed in rounded `{rounded.lg}` / `{rounded.xl}` wells, typically full-bleed within their container with a hairline edge. Illustration tiles use colour-blocked header bands above white card bodies. Avatars and app-icon stickers are small, sometimes fully circular (`{rounded.full}`). There is no heavy art-direction crop — images scale within their rounded frame.

---

## Motion

### Tokens

| Token              | Duration | Easing                              | Use                                            |
| ------------------ | -------- | ----------------------------------- | ---------------------------------------------- |
| `{motion.instant}` | 0ms      | —                                   | Instant state changes (toggles)                |
| `{motion.fast}`    | 150ms    | `cubic-bezier(0.4, 0, 0.2, 1)`      | Hover, focus, colour changes                   |
| `{motion.normal}`  | 250ms    | `cubic-bezier(0.4, 0, 0.2, 1)`      | Dropdowns, tooltips, switches                  |
| `{motion.slow}`    | 350ms    | `cubic-bezier(0.4, 0, 0.2, 1)`      | Modals, sheets, page transitions               |
| `{motion.spring}`  | 400ms    | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Badges, toasts, celebratory micro-interactions |

### Rules

- Never exceed 400ms for direct feedback.
- Entry animations should be faster than exit animations.
- On `prefers-reduced-motion: reduce`, all durations collapse to 0ms or are replaced by instant fades.
- Avoid animating `width`, `height`, `top`, `left`; prefer `transform` and `opacity`.

---

## Accessibility

### Contrast

- `{colors.ink}` on `{colors.canvas-soft}`: ~18:1 ✅
- `{colors.ink-muted}` on `{colors.canvas-soft}`: ~5.2:1 ✅
- `{colors.ink-faint}` ONLY for decoration or non-essential metadata. Never for functional text.
- `{colors.primary}` on `{colors.canvas}`: 21:1 ✅

### Focus Indicators

- All interactive controls MUST have a visible focus ring.
- Use `outline: 2px solid {colors.primary}` with `outline-offset: 2px`.
- NEVER use `outline: none` without a replacement.
- Focus must remain visible in forced-colors mode (Windows High Contrast).

### Keyboard Navigation

- Logical, predictable tab order.
- No positive `tabindex`.
- `Escape` closes overlays, modals and dropdowns.
- Keyboard traps are PROHIBITED.

### Motion

- Respect `prefers-reduced-motion: reduce`.
- Animations must not be essential to understanding state.
- Layout transitions should disable when the user requests reduced motion.

### Screen Readers

- Icon-only buttons MUST have a descriptive `aria-label`.
- Informative images: useful `alt`. Decorative: `alt=""` or `aria-hidden="true"`.
- Loading states MUST be announced with `aria-live="polite"`.
- Control groups MUST use `&lt;fieldset&gt;` + `&lt;legend&gt;`.

---

## Component States

Every interactive component MUST define these states:

| State                | Visual                                    | Interaction      |
| -------------------- | ----------------------------------------- | ---------------- |
| **Default**          | Base appearance                           | —                |
| **Hover**            | Subtle background or elevation shift      | Cursor pointer   |
| **Focus**            | Visible focus ring                        | Keyboard / touch |
| **Active / Pressed** | `scale(0.98)` or darker background        | Click / tap      |
| **Disabled**         | Opacity 0.5, cursor not-allowed, no hover | Non-interactive  |
| **Loading**          | Spinner or skeleton, maintain dimensions  | Non-interactive  |

### Example: `button-primary`

- **Default:** bg `{colors.primary}`, text `{colors.on-primary}`
- **Hover:** bg `{colors.primary-active}` (or slight lighten)
- **Focus:** `outline: 2px solid {colors.primary}`, `outline-offset: 2px`
- **Active:** bg `{colors.primary-active}`, `transform: scale(0.98)`
- **Disabled:** opacity 0.4, cursor not-allowed
- **Loading:** white spinner centred, text visually hidden but accessible (`aria-label`)

---

## Forms

### Field States

| State    | Border              | Background                | Shadow         | Icon       |
| -------- | ------------------- | ------------------------- | -------------- | ---------- |
| Default  | `{colors.hairline}` | `{colors.surface}`        | none           | —          |
| Hover    | darken 10%          | `{colors.surface}`        | none           | —          |
| Focus    | `{colors.primary}`  | `{colors.surface}`        | Level-1 shadow | —          |
| Error    | `{colors.error}`    | `{colors.error-subtle}`   | none           | Error icon |
| Success  | `{colors.success}`  | `{colors.success-subtle}` | none           | Check icon |
| Disabled | `{colors.hairline}` | `{colors.canvas-soft}`    | none           | —          |

### Validation

- Errors MUST appear next to the field, not only in a global toast.
- Use `aria-describedby` to link the error message to the input.
- NEVER clear user input on error.
- Messages MUST explain HOW to correct, not only WHAT is wrong.

### Required Fields

- Identify with `aria-required="true"` or `required`.
- Visual asterisk MUST have screen-reader text (`&lt;span aria-label="required"&gt;*&lt;/span&gt;`).

---

## System Feedback

### Loading States

- **Skeletons:** Use `{colors.canvas-soft}` with a subtle shimmer (opacity pulse, 1.5s loop).
- **Spinners:** Only for actions &lt;2s. For longer, use skeleton + text.
- **Progress bars:** `{colors.primary}`, height 4px, `{rounded.full}`.

### Empty States

- Small decorative illustration from the sticker palette (48–64px).
- Clear title: "No results found".
- Actionable subtitle: "Try different filters or create a new one".
- Secondary CTA if applicable.

### Error States

- Clear message, never blaming the user.
- No visible technical codes.
- Recovery action always available (retry, go back, contact support).

### Toasts / Notifications

- Position: bottom-right on desktop, bottom-center on mobile.
- Duration: 4s or until manual dismiss.
- Maximum 3 stacked toasts.
- Types: info (default), success, warning, error.

---

## Media

### Aspect Ratios

Define standard ratios to prevent layout shift:

- Hero: 16:9 (mobile) / 21:9 (desktop)
- Cards: 4:3 or 3:2
- Avatars: 1:1
- Thumbnails: 1:1

### Lazy Loading

- All images below the fold MUST use `loading="lazy"`.
- Placeholder: blur-up low-resolution or dominant colour (`{colors.canvas-soft}`).

### Alt Text

- Informative: functional description, not decorative.
- Decorative: `alt=""` + `role="presentation"`.
- Never repeat adjacent text in the `alt`.

---

## Components

&gt; **No hover states documented in original specs.** Every spec below documents Default and Active/Pressed states only. Variants live as separate `components:` front-matter entries and are described in their own sub-blocks.

### Navigation

**`nav-bar`** — Top navigation

- White surface `{colors.canvas}`, `{colors.ink}` link text at `{typography.body-sm}`, padding `{spacing.md}`. Sits as a slim sticky bar; left wordmark, centre product/solutions menu links, right "Log in" text link plus a `button-utility` "Get Notion free" CTA. Condenses to a hamburger below the tablet breakpoint.

### Buttons

**`button-primary`** — Primary CTA ("Get Notion free")

- Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button}`, rounded `{rounded.md}` (8px). The single black action on any page.
- Pressed state lives in `button-primary-pressed` (background `{colors.primary-active}`); marketing buttons also apply a brief `scale(0.9)` press transform.

**`button-primary-pressed`**

- Background `{colors.primary-active}`, text `{colors.on-primary}` — the depressed state of the primary CTA.

**`button-secondary`** — Secondary CTA ("Request a demo")

- White surface `{colors.surface}`, text `{colors.ink}`, type `{typography.button}`, rounded `{rounded.md}`, carried by the soft Level-1 shadow. Pairs beside `button-primary` in the hero.

**`button-utility`** — Nav / plan-select button

- White surface `{colors.surface}`, text `{colors.ink}`, type `{typography.button}`, tighter `{rounded.md}` (8px), padding `4px 14px`, 1px `{colors.hairline}` border. Used for the nav CTA and pricing plan-select buttons where the marketing pill would be too large.

**`button-icon-circular`** — Carousel / media control

- Circular `{rounded.full}` control with a translucent `rgba(0,0,0,0.05)` fill and `{colors.on-primary}` glyph, used for slide and play/pause controls; applies a `scale(0.9)` press transform.

### Cards & Containers

**`feature-card`** — Content / feature card

- White surface `{colors.surface}`, `{colors.ink}` text, `{typography.body-md}`, rounded `{rounded.lg}` (12px), padding `{spacing.lg}` (24px). The workhorse marketing card; often topped by a colour-blocked illustration band from the sticker palette. Default elevation is flat (hairline only).

**`feature-card-elevated`** — Raised feature card

- Same chrome as `feature-card` with the soft Level-1 layered shadow for cards that float above the canvas (testimonials, floating product panels).

**`pricing-plan-card`** — Pricing plan column

- White surface `{colors.surface}`, `{colors.ink}` text, `{typography.body-sm}`, rounded `{rounded.md}` (8px), padding `{spacing.lg}`. A bordered column listing a plan's price and feature checklist, with a `button-utility` select action.

**`pricing-plan-card-featured`** — Highlighted plan column

- Warm `{colors.canvas-soft}` fill to lift the recommended tier off the white siblings, same `{rounded.md}` shape and padding. Distinguished by surface tint rather than a coloured border.

### Inputs & Forms

**`text-input`** — Text / number field

- White surface `{colors.surface}`, `{colors.ink}` text, `{typography.body-sm}`, 1px `rgb(221,221,221)` border, rounded `{rounded.xs}` (4px), padding `6px`. Square-ish corners deliberately tighter than the pill CTAs. Focus adds the soft Level-1 shadow.

### Signature Components

**`hero-band`** — Dark "night" hero

- Full-bleed deep indigo `{colors.secondary}` band carrying `{typography.display-1}` white headline, sticker-constellation field, and a `button-primary` + `button-secondary` CTA pair. The single inverted dark island in an otherwise daylight page.

**`badge-pill`** — Eyebrow / category pill

- White surface `{colors.surface}`, `{colors.primary}` text, `{typography.eyebrow}` (12px / 600), fully pill `{rounded.full}`, padding `4px 8px`. Small labels such as the pricing "Essential for staying organized" eyebrow and category tags.

**`footer`** — Site footer

- Warm `{colors.canvas-soft}` band, `{colors.ink-secondary}` link text at `{typography.caption}`, padding `{spacing.xxl}`. Multi-column link directory closing every page.

### Examples (illustrative)

&gt; Kit-mirror demonstration surfaces. Each `ex-*` entry references brand-native primitives so downstream consumers (`/preview-design`, `/generate-kit`) re-skin the same 10 surfaces consistently.

**`ex-pricing-tier`** — Default Pricing tier card. Re-uses feature-card chrome with brand canvas-soft surface.

- Properties: `backgroundColor`, `textColor`, `borderColor`, `rounded`, `padding`

**`ex-pricing-tier-featured`** — Featured/highlighted tier — polarity-flipped surface (dark fill + light text in light mode, light fill + dark text in dark mode).

- Properties: `backgroundColor`, `textColor`, `rounded`, `padding`

**`ex-product-selector`** — What's Included summary card — re-purposed for SaaS / B2B verticals (NOT a literal product gallery).

- Properties: `backgroundColor`, `rounded`, `padding`

**`ex-cart-drawer`** — Subscription summary — re-purposed for SaaS / B2B (line items per add-on, not literal cart).

- Properties: `backgroundColor`, `rounded`, `padding`, `item-divider`

**`ex-app-shell-row`** — Sidebar nav row inside the App Shell example. Active state uses brand primary as the indicator.

- Properties: `backgroundColor`, `activeIndicator`, `rounded`, `padding`

**`ex-data-table-cell`** — Default data-table th + td chrome. Header uses mono-caps eyebrow typography; body uses body-sm.

- Properties: `headerBackground`, `headerTypography`, `bodyTypography`, `cellPadding`, `rowBorder`

**`ex-auth-form-card`** — Sign-in / sign-up card. Re-uses feature-card chrome with text-input primitives inside.

- Properties: `backgroundColor`, `rounded`, `padding`

**`ex-modal-card`** — Modal dialog surface — same chrome as feature-card with elevated shadow.

- Properties: `backgroundColor`, `rounded`, `padding`

**`ex-empty-state-card`** — Empty-state illustration frame.

- Properties: `backgroundColor`, `rounded`, `padding`, `captionTypography`

**`ex-toast`** — Toast notification surface — feature-card shape + medium shadow.

- Properties: `backgroundColor`, `rounded`, `padding`, `typography`

---

## Component API Conventions

### Naming

- Components: PascalCase (`FeatureCard`, `ButtonPrimary`).
- Props: camelCase (`isLoading`, `onClick`).
- Boolean props: prefix `is` or `has` (`isExpanded`, `hasError`).
- Event handlers: prefix `on` (`onSelect`, `onDismiss`).

### Composition over Configuration

- Prefer composition of small components over accumulating boolean props.
- Example: `&lt;Card&gt;&lt;CardHeader /&gt;&lt;CardBody /&gt;&lt;/Card&gt;` instead of `&lt;Card header={...} body={...} /&gt;`.

### Variants

- Variants MUST be mutually exclusive where applicable.
- Document the default explicitly.
- Example: `variant: 'default' | 'elevated' | 'featured'`

---

## Do's and Don'ts

### Do

- Reserve `{colors.primary}` for the primary action, inline links, and the active/focus signal — nothing decorative.
- Keep the page on the warm `{colors.canvas-soft}` canvas; use pure white `{colors.surface}` for cards and fields to create gentle figure/ground.
- Let the sticker palette (`{colors.accent-teal}`, `{colors.accent-orange}`, …) live only in illustrations, icon tiles and category dots.
- Set headlines in heavy `{typography.display-1}`/`{typography.heading-1}` with their negative tracking applied explicitly.
- Use `{rounded.md}` for both CTAs and nav/utility buttons.
- Define surfaces with `{colors.hairline}` and the barely-there Level-1 shadow rather than heavy drop-shadows.
- Reserve the deep indigo `{colors.secondary}` "night" treatment for a single hero moment, not repeated bands.
- Test every change at mobile, tablet, desktop, wide, zoomed, and with screen readers.
- Use `clamp()` for fluid typography instead of fixed breakpoint jumps.
- Respect `prefers-reduced-motion` for all animations.

### Don't

- Don't paint a CTA or structural fill in any sticker-palette colour — those are decoration only.
- Don't introduce a second structural accent alongside `{colors.primary}`.
- Don't put pill `{rounded.full}` radii on form fields — inputs stay tight at `{rounded.xs}` (4px).
- Don't drop heavy shadows; Notion's elevation is many near-transparent layers, never a hard cast.
- Don't set body copy in a heavy weight — keep 400 for readability and let weight 700 belong to headlines.
- Don't place type on pure clinical white for full pages; the warm `{colors.canvas-soft}` is core to the brand calm.
- Don't use `outline: none` without a visible replacement.
- Don't animate layout properties (`width`, `height`, `top`, `left`); use `transform` and `opacity`.
- Don't use index arrays as React keys when real identity exists.
- Don't hardcode hex/RGB values when a semantic token is available.
