# Design System — White Precision UI

## Overview

The product uses a clean white canvas (`{colors.canvas}` — #ffffff), near-black ink (`{colors.ink}` — #111111), and restrained gray grouping surfaces. Primary actions stay black; blue is reserved for links, while visible focus uses muted gray. Structure comes from whitespace, surface changes, and thin borders instead of decorative color.

Typography does the heavy lifting. **Inter** is the available substitute for Cal Sans: headings use weight 600 and tight negative tracking, while body and controls use Inter with neutral tracking. App buttons and inputs use `{rounded.md}` (8px); cards use `{rounded.lg}` (12px); avatars and icon-only controls may use `{rounded.full}`.

Surfaces barely lift. The workspace and page floor are white. `{colors.canvas-soft}` (#f8f9fa) groups navigation and quiet regions; `{colors.surface-card}` (#ffffff) holds feature content; `{colors.canvas-elevated}` (#ffffff) is used for inputs, menus, dialogs, and product-detail surfaces. Hairlines preserve separation between white surfaces.

**Key Characteristics:**
- White canvas with black primary actions, blue links, and a restrained muted focus ring.
- Light-gray surfaces group related content; white elevated surfaces hold controls and overlays.
- Inter 600 with negative tracking approximates Cal Sans for headings; Inter remains the UI and body face.
- Buttons and inputs use an 8px radius, content cards 12px, marquee panels 16px, avatars and icon buttons full circles.
- Default depth is flat or a 1px hairline. Floating menus and dialogs use only a subtle shadow.
- Controls keep the application's 44px minimum touch target, even where the visual reference uses smaller controls.

## Colors

> The supplied white-theme reference defines the palette, type character, radii, and shallow elevation. Application accessibility and the existing 44px touch-target contract take precedence where the reference is more compact.

### Brand & Accent
- **Ink** (`{colors.primary}` / `{colors.ink}` — #111111): headings, primary CTA fill, logo, and highest-emphasis text. Pressed actions use `{colors.primary-active}` (#242424). Paired with `{colors.on-primary}` (white).
- **Accessible Blue** (`{colors.link}` — #0066cc): link color with AA contrast on white surfaces. Darker press tone `{colors.link-deep}` (#004f9f), pale wash `{colors.link-soft}` (#e6f0ff).
- **Focus** (`{colors.focus}` / `{colors.mute}` — #6b7280): a 2px muted outline with no offset on light surfaces. Inverted surfaces and forced-colors mode use their existing high-contrast focus colors.
- Existing violet, cyan, pink, and magenta tokens are decorative compatibility tokens only. They must not structure application navigation, forms, tables, or cards.

### Surface
- **Canvas** (`{colors.canvas}` — #ffffff): default page and workspace floor.
- **Canvas Soft** (`{colors.canvas-soft}` — #f8f9fa): navigation, quiet bands, and subtle grouping.
- **Elevated** (`{colors.canvas-elevated}` — #ffffff): inputs, menus, dialogs, and detail surfaces.
- **Card** (`{colors.surface-card}` — #ffffff): feature cards and secondary content panels, separated by a hairline.
- **Strong** (`{colors.surface-strong}` — #e5e7eb): disabled control fill and stronger neutral separation.
- **Dark** (`{colors.surface-dark}` — #101010): scarce inverted surfaces such as tooltips; never a general page background.

### Text
- **Ink** (`{colors.ink}` — #111111): primary headings and high-emphasis text.
- **Body** (`{colors.body}` — #374151): standard paragraph and navigation text.
- **Mute** (`{colors.mute}` — #6b7280): secondary copy, labels, and metadata.
- **Faint** (`{colors.faint}` — #767676): lowest functional text tier, including placeholders. Disabled controls may use opacity only when their state is also programmatically exposed.

### Borders
- **Hairline** (`{colors.hairline}` — #e5e7eb): 1px border on cards and dividers.
- **Hairline Soft** (`{colors.hairline-soft}` — #f3f4f6): subtle division between white regions.
- **Hairline Strong** (`{colors.hairline-strong}` — #d1d5db): emphasized neutral separation.
- **Control Border** (`{colors.control-border}` — #6b7280): inputs, selects, secondary buttons, checkboxes, and icon buttons. It preserves non-text contrast on white.

### Semantic
- **Error** (`{colors.error}` — #ef4444): indicators and destructive controls; `{colors.error-deep}` (#b91c1c) is used for accessible text and pressed states.
- **Warning** uses `{colors.warning}` (#f59e0b) for indicators and `{colors.warning-text}` (#92400e) for text.
- **Success** uses `{colors.success}` (#10b981) for indicators and `{colors.success-text}` (#047857) for text on light backgrounds. Status must never rely on color alone.

### Decorative Compatibility
Legacy gradient tokens remain available only to avoid breaking existing illustrations. New application UI must use the white, ink, gray, link, and semantic tokens above.

## Typography

### Font Family
The system uses **Inter** for body, controls, and headings. Headings use Inter 600 with negative tracking as the authorized substitute for Cal Sans, which is not bundled or downloaded at runtime. **Geist Mono**, **JetBrains Mono**, or a system monospace stack is reserved for code and technical eyebrows.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 48px | 600 | 48px | -2.4px | Editorial hero headline |
| `{typography.heading-lg}` | 32px | 600 | 40px | -1.28px | Major page and section headings |
| `{typography.heading-md}` | 20px | 600 | 28px | -0.4px | Sub-section / card headings |
| `{typography.label-sm}` | 14px | 500 | 20px | -0.28px | Strong labels, nav emphasis |
| `{typography.mono-eyebrow}` | 12px | 500 | 16px | 0 | Uppercase monospace section eyebrows |
| `{typography.body-lg}` | 16px | 400 | 24px | 0 | Lead paragraphs, large body |
| `{typography.body-md}` | 14px | 400 | 20px | 0 | Default body, nav links, table cells |
| `{typography.body-sm}` | 12px | 400 | 16px | 0 | Captions, footnotes, metadata |
| `{typography.button-lg}` | 16px | 600 | 20px | Large action labels |
| `{typography.button-md}` | 14px | 600 | 20px | Navigation and app action labels |
| `{typography.code}` | 14px | 400 | 20px | Code blocks and inline code |

### Principles
- Display type is defined by tight negative tracking. Body type sits at neutral spacing.
- Headings and buttons use weight 600; navigation labels may use 500; body remains 400.
- The monospace stack is reserved for code and small uppercase technical labels.

### Note on Font Substitutes
Do not download or simulate Cal Sans. Use the existing Inter/system stack and preserve weight 600 plus negative display tracking.

## Layout

### Spacing System
- **Base unit**: 4px. The scale steps 4 → 8 → 12 → 16 → 24 → 32 → 40 → 64 → 96 → 128px.
- **Tokens**: `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.2xl}` 40px · `{spacing.3xl}` 64px · `{spacing.4xl}` 96px · `{spacing.section}` 128px.
- **Card interiors** sit at `{spacing.lg}`–`{spacing.xl}` (24–32px); **section bands** run `{spacing.4xl}`–`{spacing.section}` (96–128px) of vertical rhythm.
- **Button sizing**: every interactive control has `min-height: 44px`. In-app controls use the shared horizontal-padding token. Height is never inferred from line-height alone.

### Grid & Container
- Pages use the shared max-width container and responsive gutters.
- Feature grids start at one column and add columns only at documented breakpoints.
- Dense data regions must adapt without making horizontal scrolling the primary page interaction.

### Whitespace Philosophy
Whitespace is structural. White space, restrained gray grouping, and thin hairlines separate content without heavy panels. Major sections breathe while controls keep a compact internal rhythm.

### Responsive Strategy

#### Breakpoints
| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 768px | Single-column stacks; navigation becomes an overlay; primary actions remain reachable |
| Tablet | 768px | 2-up card grids; condensed nav |
| Desktop | 1080px | Authenticated sidebar and full app workspace |
| Wide | 1440px+ | Wider gutters and full multi-column grids |

#### Touch Targets
Buttons, inputs, checkboxes, and circular icon controls use an explicit 44px minimum target. Text zoom may increase height; controls must not clip.

#### Collapsing Strategy
The navigation collapses behind its existing menu trigger; multi-column card grids reflow to one column; long text wraps intentionally; essential actions remain available at every width.

#### Image Behavior
Images and illustrations scale within their containers and preserve intrinsic proportions. Decorative media must not create overflow or carry essential meaning without an accessible alternative.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 — Flat | 1px hairline (`{colors.hairline}`), no shadow | Default feature cards, inputs, dividers, the canvas |
| 1 — Whisper | `{shadows.xs}` | Lightly raised cards and the desktop workspace |
| 2 — Floating | `{shadows.sm}` | Menus, modals, and popovers |

Depth is deliberately minimal. The system prefers a crisp 1px hairline and small white-to-gray surface changes; floating surfaces use a low-alpha shadow rather than a heavy drop.

### Decorative Depth
Decorative color is optional and localized. Product UI, data, and semantic states must remain understandable without gradients or color-only signals. No glows or heavy gradients.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Full-bleed bands, dividers |
| `{rounded.xs}` | 4px | Checkbox marks and compact accents |
| `{rounded.sm}` | 6px | Menu items and compact inline controls |
| `{rounded.md}` | 8px | Buttons, inputs, tabs, and utility controls |
| `{rounded.lg}` | 12px | Content cards, menus, and dialogs |
| `{rounded.xl}` | 16px | Marquee or product-preview containers |
| `{rounded.pill-category}` | 64px | Existing grouped-navigation pills |
| `{rounded.pill}` | 100px | Existing promotional CTA pills |
| `{rounded.full}` | 9999px | Circular icon buttons, avatars, nav ghost links |

The application uses 8px functional controls, 12px content surfaces, and full circles for avatars and icon-only buttons. Pills are reserved for badges or explicitly grouped navigation.

### Geometry
Cards are rectangles at 12–16px radius; normal controls are 8px; icon buttons and avatars are circular. New pills require a badge or grouped-navigation role.

## Components

> No hover states are documented. Each spec covers Default and (where extracted) pressed/active states. Variants live as separate `components:` entries.

### Navigation

**`nav-bar`** — top navigation
- Background `{colors.canvas}`, bottom hairline `{colors.hairline}`, text `{colors.body}`, type `{typography.body-md}`, and tokenized padding. It contains the product identity, navigation links, and existing account actions.

**`nav-link`** — individual nav item
- Body-grey text `{colors.body}`, type `{typography.body-md}`, fully rounded hit area `{rounded.full}`, padding `{spacing.xs} {spacing.sm}`. Transparent until interacted.

**`app-workspace`** — authenticated application shell
- On desktop, the sidebar remains fixed on `{colors.canvas}` and the workspace is one continuous white surface shared by header and page content.
- The workspace uses a 1px `{colors.hairline}` border, `{rounded.lg}` corners, and a Level-1 shadow. A `{spacing.sm}` inset separates it from the white page floor without creating a gray frame. It owns vertical scrolling so the sidebar remains stationary.
- Sidebar selection uses a solid `{colors.primary}` fill with `{colors.on-primary}` text and icons, without a leading border or inset indicator. The same treatment applies to the current submenu entry. `{colors.link}` is reserved for links, not for filling the active navigation row.
- Sidebar links use `{typography.body-md}`, with `{typography.label-sm}` for the current section. Group labels use `{typography.mono-eyebrow}` and `{spacing.lg}` separates groups. Navigation and account controls use `{rounded.md}` and retain a 44px minimum target.
- Below the desktop breakpoint the sidebar becomes an overlay and the workspace returns to a continuous, unframed page surface. The mobile bar must not cover content or safe areas.

### Buttons

**`button-primary`** — the black primary app action
- Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button-md}` at weight 600, `{rounded.md}` (8px), min-height `44px`, padding `{spacing.xs} {spacing.sm}`.

**`button-secondary`** — the white secondary app action
- Background `{colors.canvas-elevated}`, text `{colors.ink}`, border `{colors.control-border}`, type `{typography.button-md}` at weight 600, `{rounded.md}`, min-height `44px`, padding `{spacing.xs} {spacing.sm}`.

**`button-primary-sm`** — the standard black app CTA
- Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button-md}` at weight 600, `{rounded.md}` (8px), min-height `44px`, padding `0px 12px`.

**`button-ghost-sm`** — the white secondary app button
- Background `{colors.canvas-elevated}`, text `{colors.ink}`, 1px `{colors.control-border}`, type `{typography.button-md}` at weight 600, `{rounded.md}`, min-height `44px`, padding `0px 12px`.

**`button-category-pill`** — grouped category navigation
- Background `{colors.canvas-elevated}`, text `{colors.ink}`, type `{typography.button-md}`, rounded `{rounded.pill-category}`. Use only inside a grouped-navigation container, never as a generic action.

**`button-icon-circular`** — circular icon / carousel control
- Background `{colors.canvas-elevated}`, text `{colors.ink}`, 1px `{colors.control-border}`, type `{typography.body-lg}`, rounded `{rounded.full}`, no padding.

### Inputs & Forms

**`text-input`** — default form field
- Background `{colors.canvas-elevated}`, ink text `{colors.ink}`, 1px `{colors.control-border}`, type `{typography.body-md}`, rounded `{rounded.md}`, padding `{spacing.xs} {spacing.sm}`, min-height `44px`.

**`auth-workspace`** — sign-in workspace
- `/login` stays single-column at every width: centered brand above a white form card, with title and supporting copy inside the card and `--auth-form-max-inline-size` as its reading width.
- On desktop the flow sits in a white `{rounded.lg}` card with a hairline and Level-1 shadow over `{colors.canvas-soft}`.
- On mobile the outer workspace frame is removed so the flow remains continuous and can scroll with the software keyboard or increased text zoom.
- Fields and CTA share the 44px minimum control height; the page must not autofocus a field on mobile.

### Cards & Containers

**`feature-card`** — flat hairline content card
- Background `{colors.surface-card}`, 1px hairline `{colors.hairline}`, ink text `{colors.ink}`, type `{typography.body-md}`, rounded `{rounded.lg}`, padding `{spacing.lg}`.

**`feature-card-elevated`** — lifted card variant
- White background, hairline, and Level-1 shadow. Level-2 is reserved for floating menus, dialogs, and popovers.

**`code-block`** — code / terminal surface
- Background `{colors.canvas-elevated}`, ink text `{colors.ink}`, 1px hairline `{colors.hairline}`, monospace `{typography.code}`, rounded `{rounded.md}`, padding `{spacing.md}`. Syntax rendered in the ink-and-accent palette.

## Do's and Don'ts

### Do
- Keep the white canvas and use gray only for quiet regions; separate white cards with a hairline.
- Reserve `{colors.link}` for links and use `{colors.focus}` for visible focus; decorative accents must stay local and optional.
- Use 8px app controls, 12px cards, and full circles only for avatars or icon-only buttons.
- Define cards and inputs with a 1px hairline (`{colors.hairline}`) before any shadow — flat is the default.
- Set display headings in Inter 600 with tight negative tracking; label technical sections with the monospace eyebrow token.
- Step the grey text ladder deliberately: `{colors.ink}` → `{colors.body}` → `{colors.mute}` → `{colors.faint}`.

### Don't
- Don't fill large surfaces with accent colors; decorative tokens must not become application chrome.
- Don't use pills for ordinary app buttons or inputs.
- Don't pile on shadows — depth is a 1px hairline plus, at most, a finely-layered low-alpha shadow stack.
- Don't set body copy in pure black (`#000000`) — headings use #111111 and body steps to `{colors.body}`.
- Don't add decorative systems to application chrome; product surfaces stay ink, white, and restrained gray.
- Don't loosen the display tracking — large Inter headings carry tight negative letter-spacing by design.
