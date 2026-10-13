# Design System — Crema editorial y carbón cálido

This visual system applies to product interfaces throughout the repository.

## Overview

The light theme follows the supplied editorial reference: a warm cream canvas (`{colors.canvas}` — #faf9f5), warm ink (`{colors.ink}` — #141413), and layered cream surfaces. Primary actions use an AA-safe deep coral; links use a separate, darker coral token. Structure comes from whitespace, surface changes, and thin borders.

Typography does the heavy lifting. **Inter** is the only interface family for headings, body, controls, technical labels and code in both themes. Existing type sizes, weights, line heights and tracking remain unchanged. App buttons and inputs use `{rounded.md}` (8px); cards use `{rounded.lg}` (12px); avatars and icon-only controls may use `{rounded.full}`.

The light and dark themes share the same hierarchy. The workspace and page floor use `{colors.canvas}`. `{colors.canvas-soft}` groups quiet regions; `{colors.surface-card}` (#efe9de in light mode) holds feature content; `{colors.canvas-elevated}` is used for inputs, menus, dialogs, and product-detail surfaces. Light mode uses cream; dark mode uses a warm charcoal hierarchy. Existing document and export colors remain independent.

**Key Characteristics:**
- Warm cream canvas with deep coral primary actions, accessible coral links, and a visible neutral focus ring.
- Quiet cream grouping regions and deeper cream cards; controls and overlays use the canvas tone.
- Inter unifies display headings, UI and body in both themes.
- Buttons and inputs use an 8px radius, content cards 12px, marquee panels 16px, avatars and icon buttons full circles.
- Default depth is flat or a 1px hairline. Floating menus and dialogs use only a subtle shadow.
- Controls keep the application's 44px minimum touch target.

## Colors — Light Editorial Cream

> The light palette adapts the supplied Claude.com reference through shared tokens. The reference coral #cc785c with white text does not meet AA for ordinary button text, so actions use its accessible deeper tone #a9583e. The existing type sizes, radii, shallow elevation and touch targets remain.

### Brand & Accent
- **Accessible coral** (`{colors.primary}` — #a9583e in light mode): primary CTA fill, logo and selected navigation, paired with `{colors.on-primary}` (#ffffff). Dark mode uses #cc785c with dark text to preserve contrast for both filled controls and coral-colored text.
- **Coral links** (`{colors.link}` — #9e5038): functional links with AA contrast on cream surfaces. The pressed tone is `{colors.link-deep}` (#8c442e), with a cream wash `{colors.link-soft}` (#f5f0e8).
- **Focus** (`{colors.focus}` / `{colors.mute}`): a 2px neutral outline with no offset. Inverted surfaces and forced-colors mode retain their dedicated focus colors.
- Interaction backgrounds across navigation and floating menus use the existing soft-surface tokens in both themes; selected navigation retains primary/on-primary. CustomSelect highlights use the same soft-surface alias, and disabled or invalid triggers keep their own state colors during hover. Section-summary card hover uses the shared Level-1 shadow. Public-careers controls use the shared focus width, color and zero-offset tokens. Decorative motion and existing content-concealment effects are separate from hover colors and keyboard focus.
- Existing violet, cyan, pink, and magenta tokens remain localized compatibility tokens.

### Surface
- **Canvas** (`{colors.canvas}` — #faf9f5): continuous page and workspace floor.
- **Canvas Soft** (`{colors.canvas-soft}` — #f5f0e8): quiet bands and subtle grouping.
- **Card** (`{colors.surface-card}` — #efe9de): feature cards and secondary content panels, separated by a hairline.
- **Elevated** (`{colors.canvas-elevated}` — canvas tone in light mode): inputs, menus, dialogs, and detail surfaces.
- **Strong** (`{colors.surface-strong}` — derived from canvas and ink): disabled control fill and stronger neutral separation.
- **Dark** (`{colors.surface-dark}` — #181715): scarce inverted surfaces such as tooltips and toasts.
- Official document paper and ink retain their independent print/export tokens.

### Text
- **Ink** (`{colors.ink}` — #141413): primary headings and high-emphasis text.
- **Body** (`{colors.body}` — #3d3d3a): standard paragraph and navigation text.
- **Mute** (`{colors.mute}` — #625f59): secondary copy, labels, and metadata.
- **Faint** (`{colors.faint}` — #696760): lowest functional text tier, including placeholders, darkened from the reference's muted-soft to remain readable on cards. Disabled controls may use opacity only when their state is also programmatically exposed.

### Borders
- **Hairline** (`{colors.hairline}` — #e6dfd8): 1px border on cards and dividers.
- **Hairline Soft** (`{colors.hairline-soft}` — #ebe6df): subtle division between light regions.
- **Hairline Strong** (`{colors.hairline-strong}` — derived from canvas and ink): emphasized neutral separation.
- **Control Border** (`{colors.control-border}` — derived from ink and canvas): inputs, selects, secondary buttons, checkboxes, and icon buttons.

### Semantic
- **Error** uses `{colors.error}` (#ef4444) for indicators and `{colors.error-deep}` (#b91c1c) for text and pressed controls.
- **Warning** uses `{colors.warning}` (#f59e0b) for indicators and `{colors.warning-text}` (#92400e) for text.
- **Success** uses `{colors.success}` (#10b981) for indicators and `{colors.success-text}` (#047857) for text.
- Status must never rely on color alone.

### Light Contrast
The minimum calculated text contrast on the three cream surfaces is above 4.5:1 for ink, body, mute, faint and functional links. White text on the deep coral primary is 5.06:1. Decorative hairlines are separate from the stronger functional control-border token. These token pairs do not cover inherited text, opacity, images or every rendered state.

### Decorative Compatibility
Legacy gradient tokens remain available for existing illustrations. Light application UI uses cream neutrals, deep coral actions and links, and the semantic tokens above.


## Dark Theme — Warm Charcoal

The optional dark theme extends the same semantic tokens; it uses Inter throughout and does not change layout, radii, data, actions or permissions. Light mode uses editorial cream; dark mode follows the reference's near-black and gray surface sequence, with warm off-white text and a brighter coral primary. Comfort depends on the display, ambient lighting and the reader; contrast compliance is not a guarantee against fatigue.

### Appearance Preference

- The appearance control lives in /account and in the login screen. In /account it is a full clickable option beside Language in two equal columns; login retains its unfilled icon control. ThemeSelect toggles directly between Claro and Oscuro using the currently resolved theme, with no dropdown. The Eclipse icon reflects the current theme; the accessible name and tooltip describe the next action. Native buttons support Enter/Space, the shared minimum touch target and visible focus. Reduced-motion preferences disable the icon transition. Sistema remains the initial behavior when no valid stored preference exists; the first click chooses and persists the opposite explicit theme.
- The browser preference is stored under `reclutamiento_color_scheme`; it is independent of account data and authentication. Sistema follows operating-system changes; other selections override them. Changes synchronize across tabs.
- `public/theme.js` restores the preference on `html[data-color-scheme]` before the global stylesheet loads. `useTheme` subscribes to this single controller; portals inherit the same tokens.
- If storage is unavailable, the selected theme still applies for the current visit and the selector explains that it cannot be saved.
- The browser theme-color is read from `--color-canvas`. The existing PWA manifest remains unchanged.

### Dark Semantic Palette

| Role | CSS token | Dark value |
|---|---|---|
| Page floor | `--color-canvas` | #181715 |
| Quiet/navigation region | `--color-canvas-soft` | #1f1e1b |
| Content cards | `--color-surface-card` | #252320 |
| Controls and floating surfaces | `--color-canvas-elevated` | Derived from card and ink |
| Headings | `--color-ink` | #faf9f5 |
| Reading text | `--color-body` | Derived from ink and canvas |
| Secondary text | `--color-mute` | Derived from ink and canvas |
| Placeholders | `--color-faint` | Derived from ink and canvas |
| Primary action and selection | `--color-primary` | #cc785c |
| Text on primary fill | `--color-on-primary` | #181715 |
| Links / focus | `--color-link` / `--color-focus` | #cbd1d8 / derived from mute |
| Functional control border | `--color-control-border` | Derived from card and ink |
| Success indicator/text | `--color-success` | #83c9a3 |
| Warning indicator/text | `--color-warning` | #e2b76f |
| Error indicator/text | `--color-error` | #f28b82 |

Primary remains the sole structural action color in dark mode. The dark coral and dark on-primary text preserve readable filled controls and coral text on dark surfaces. Links retain their existing underline/interaction treatment. Semantic and existing chart/category colors remain localized and retain labels, icons or line patterns. Cards and dividers use subtle hairlines; required control boundaries use the stronger control-border token. Page layout containers and the mobile header use --workspace-surface, which aliases --color-canvas, so the workspace floor stays continuous across routes. Elevated tokens are reserved for cards, controls and floating surfaces.

### Contrast and Shared Tokens

Across page, quiet, card and elevated backgrounds, minimum contrast is 12.51:1 for headings, 9.37:1 for reading text, 6.12:1 for secondary text, 5.23:1 for placeholders, 4.25:1 for control borders and 6.12:1 for focus against those backgrounds. Dark text on the coral primary has 5.47:1 contrast; coral text on the dark card has 4.78:1. These calculated pairs do not replace verification of inherited text, hover, selected states, transparency or real rendered components.

- `--color-on-neutral`, `--color-on-error`, `--color-on-success` and `--color-on-warning` describe text on solid status fills; `--color-on-dark` remains text on a dark surface.
- `--color-on-dark-hover` describes the hover fill for a light action inside a dark surface.
- `--color-shadow-rgb` keeps shadow channels separate from text, avoiding light halos when ink becomes light.
- `--color-scene-light` provides theme-independent neutral illumination for the existing decorative WebGL scene; its material follows the primary token.
- The shared brand SVG inherits currentColor. Raster photographs and existing illustrations retain their original colors.
- Document paper, ink and official print/export tokens remain independent of appearance. Required native controls keep the existing touch target and focus treatment. Appearance changes add no animation.

## Typography

### Font Family
**Inter** is the single interface family in light and dark, including headings, body, controls, labels, code and technical eyebrows. The display, body and code family tokens all resolve to the same Inter stack. Typography role sizes, weights, line heights and tracking remain as implemented.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 48px | 600 | 48px | -2.4px | Editorial hero headline |
| `{typography.heading-lg}` | 32px | 600 | 40px | -1.28px | Major page and section headings |
| `{typography.heading-md}` | 20px | 600 | 28px | -0.4px | Sub-section / card headings |
| `{typography.brand}` | 24px | 600 | 34px | -0.48px | Brand wordmark |
| `{typography.label-sm}` | 14px | 500 | 20px | -0.28px | Strong labels, nav emphasis |
| `{typography.mono-eyebrow}` | 12px | 500 | 16px | 0 | Uppercase technical section eyebrows; legacy token name, Inter family |
| `{typography.caption-up}` | 12px | 600 | 16px | 0.72px | Short uppercase labels: table headers, eyebrows, tags |
| `{typography.body-lg}` | 16px | 400 | 24px | 0 | Lead paragraphs, large body |
| `{typography.body-md}` | 14px | 400 | 20px | 0 | Default body, nav links, table cells |
| `{typography.body-sm}` | 12px | 400 | 16px | 0 | Captions, footnotes, metadata |
| `{typography.button-lg}` | 16px | 600 | 20px | Large action labels |
| `{typography.button-md}` | 14px | 600 | 20px | Navigation and app action labels |
| `{typography.code}` | 14px | 400 | 20px | Code blocks and inline code |

### Principles
- Shared application primitives use complete Inter token roles: body-md for pagination, dropdown items, popover descriptions, confirmation descriptions and form messages; body-strong for popover, sheet and modal titles; caption-up for form labels, dropdown labels and candidate status badges. Wizard step labels and titles use caption-up and body-strong. Editable controls retain their documented iOS minimum text-size safeguard; exported documents retain their independent typography.
- Display type is defined by tight negative tracking. Body type sits at neutral spacing.
- Headings and buttons use weight 600; navigation labels may use 500; body remains 400.
- Code and technical labels also use Inter; role names retain compatibility with existing consumers.

### Note on Font Substitutes
Only Inter loads through the existing font stylesheet provider. System sans-serif fallbacks apply if it is unavailable. Display sizes remain unchanged.

## Layout

### Spacing System
- **Base unit**: 4px. The scale steps 4 → 8 → 12 → 16 → 24 → 32 → 40 → 64 → 96 → 128px.
- **Tokens**: `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.2xl}` 40px · `{spacing.3xl}` 64px · `{spacing.4xl}` 96px · `{spacing.section}` 128px.
- **Card interiors** sit at `{spacing.lg}`–`{spacing.xl}` (24–32px); **section bands** run `{spacing.4xl}`–`{spacing.section}` (96–128px) of vertical rhythm.
- **Button sizing**: every interactive control has `min-height: 44px`. In-app controls use the shared horizontal-padding token. Height is never inferred from line-height alone.

### Grid & Container
- Pages use the shared max-width container and responsive gutters.
- Authenticated workspace content starts one shared spacing step below the header: `{spacing.md}` on mobile and `{spacing.lg}` from tablet upward. The shell owns this gap; pages keep only their internal spacing.
- The workspace header title uses Inter at the existing 20px/700 through the heading-md size and font-bold weight tokens, retaining the body-md line height and tracking and the mute color on the canvas, including linked and dynamic page titles.
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

Depth is deliberately minimal. The system prefers a crisp 1px hairline and small changes between neutral surfaces; floating surfaces use a low-alpha shadow rather than a heavy drop.

### Data tables

Product data tables use the shared `data-table` primitive: `{colors.surface-card}` for the body, `{colors.canvas-soft}` for the column header and total row, `{colors.hairline-strong}` for row separators, `caption-up` for column labels, and `body-md` for cells. The surrounding panel uses `{colors.hairline}` and `{rounded.lg}` when a frame is needed. The same tokenized cell spacing applies across desktop tables; numeric alignment and emphasis follow the meaning of each column. Tables that become stacked cards on narrow screens keep their existing mobile layout through `data-table--cards`. Printable and exported documents retain their separate `document-*` palette and layout.

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

The application uses 8px functional controls, 12px content surfaces, and full circles for avatars and icon-only buttons. Badges use `{rounded.sm}`, opaque token backgrounds, and semantic foreground/background pairs that meet WCAG AA in both themes. Grouped navigation may use pills.

### Geometry
Cards are rectangles at 12–16px radius; normal controls are 8px; icon buttons and avatars are circular. New pills require an explicitly grouped-navigation role.

## Components

> No hover states are documented. Each spec covers Default and (where extracted) pressed/active states. Variants live as separate `components:` entries.

**`session-splash`** - session transition typography
- The shared TransitionLoader uses complete Inter body-strong (14px/600) for the product name and body-md (14px/400) for status messages. Workspace entry, exit and default loading share these roles. Authentication, credential validation, messages and announcements, timing, portal behavior, illustrations, responsive layout, colors and motion remain unchanged.

**`app-toast`** — global notification
- The toast stack sits at the top center at every viewport width. It respects safe areas and the shared container gutters; multiple notifications share the same alignment within the stack.
- The surface uses `{colors.surface-dark}`, high-contrast text, the existing hairline and floating shadow, and the `wave` robot with a semantic status icon. Width is capped by the shared toast token and shrinks to fit narrow viewports.
- The title reveals progressively while its full space remains reserved to avoid layout shifts. Assistive technology receives the complete message immediately; reduced-motion preference shows the complete title without typing.
- Toasts use complete Inter roles: body-strong (14px/600) for titles and body-md (14px/400) for descriptions and action labels. System update and release notifications reuse this same presentation for available, applying, error and applied states. Update/defer/retry actions, pinned notices, durations, announcements, typing, safe areas, responsive layout, colors and motion remain unchanged.

### Navigation

**`home-workspace`** — internal team start page
- The greeting uses the shared `app-page-title` style in the workspace header; the introductory profile card, employment metadata and motivational message are omitted. Topic headings use `{typography.heading-md}`, lesson headings use `{typography.heading-sm}`, and reading content uses `{typography.body-md}`.
- Home uses the shared Inter stack with complete typography roles: short lesson eyebrows use uppercase `{typography.caption-up}`, source links use `{typography.body-md}`, internal reading headings and article references use `{typography.body-strong}`, and the legal footnote uses `{typography.body-sm}`. The greeting inherits the existing workspace header size (20px) and weight (700); this page does not override header or sidebar typography.
- The selected topic is navigated with the previous/next arrow buttons beside its heading; topic tabs and the mobile topic selector are not shown. Each lesson and contextual item in the selected topic is a compact, content-height card at every width; its existing details open in a shared HoverCard on pointer hover, keyboard focus or touch. Card triggers retain visible focus and expose expanded state. Topic content, role-specific messages and document links remain available; the official document link stays directly keyboard-accessible on its card.
- Content starts in one column on mobile, two columns on tablet, and three columns from the desktop breakpoint. Cards in each grid row share the height required by that row's longest content while their contents align from the top; nested reading lists stay in one column inside the narrower cards.
- The header quick-access list includes Requests / Gestionar or Leave / Solicitar according to the same review permission, plus Org chart / Organigrama. These actions no longer appear above the sidebar footer. The leave action links to the review page for administrators and active coordinators; other users open “Vacaciones y permisos” in the shared Modal on mobile and the shared Sheet from tablet upward, using the existing mobile breakpoint. Both containers share the same policy, form and confirmation content, actions and request state. The Sheet uses the floating variant: a shared spacing inset respecting safe areas, the workspace hairline, rounded corners and Level-1 shadow, while retaining the elevated dialog surface. It returns focus to the request trigger when closed. Its policy step keeps only “Solicita” as the footer action and retains the header close control. The form step uses the existing CustomSelect and a single inline Calendar in range mode; its borderless header arrow returns to the policy. Date guidance, the live selected range, and any short-notice note appear in a flat persistent status field; A borderless reset icon stays on the same row inside the bubble when a start date exists, with a descriptive accessible name. The field has no pointer or decorative illustrations and announces date changes through a polite status region at every width. Its visible range uses compact same-day, same-month and cross-month formats, while assistive technology receives the full dates; narrow widths truncate only the visible label as a fallback. The request form stacks the type selector and status field on mobile and tablet; from the desktop breakpoint (1080px), they share two equal columns with the status field aligned to the selector control below its label. The centered calendar remains below both controls. The Sheet uses the shared small dialog width across all steps. On desktop, its label retains the shared control-label height. Mobile retains the bottom Modal with its shared 92dvh maximum height, scrollable body and fixed footer. Body spacing uses shared tokens; this request calendar adapts its seven columns to the available width between the 44px touch minimum and the existing 48px cell size, retaining horizontal scrolling only below the minimum calendar width. Range calendars give each day button a small horizontal gutter and separate week rows using the shared smallest spacing token. The first selected date and both completed endpoints use primary fill with on-primary text; intermediate dates keep a continuous tinted band, capped at week edges. Date cells preserve a consistent size, weight and alignment across open, single-day and completed ranges. Calendar dates use America/Mexico_City and shared tokens, with selected endpoints visible in both themes, keyboard navigation and the existing minimum touch target. Past dates are disabled, a live summary shows the selected range, and Guardar solicitud becomes available when both dates are chosen. Saving uses the idempotent Supabase RPC; confirmed persistence shows “Se validará tu solicitud” and the reminder to leave pending tasks, process status, vacancies and interviews ready for follow-up. Recruiter date ranges cannot overlap, enforced by the PostgreSQL exclusion constraint; short-notice requests retain an exception flag. The protected requests page is available through its sidebar quick action to administrators and active coordinators. Its empty state reuses the shared empty-state styles with a static calendar icon, a short heading and one explanation on a tokenized card surface. There is no manual refresh action; loading occurs on entry and page changes, and only failed loads expose Reintentar. Administrators can delete any pending request; active coordinators can delete their own pending requests. Eliminar uses the shared ConfirmModal showing requester, type and dates; the dedicated RPC verifies active review access, administrator role or ownership, and pending status, without granting direct table deletion. Successful deletion confirms through the shared app toast and reloads the current page, returning to the last available page when needed. Pagination controls appear only when there is more than one page. Physical formats remain handled by the coordinator.
- The protected leave review page keeps its data table when its content area is wide enough for the shared compact table width. In narrower spaces it presents the same requests as flat, tokenized cards; at intermediate widths the cards form two columns. Requester and type lead, start and end dates form two readable columns, then validation status and submission time follow in quieter text. Table cells and icon actions align at the vertical center of each row while retaining full touch targets. The table reserves one action column for adjacent, borderless authorize and delete icons with descriptive accessible names. Cards group those same icons at the end. The mobile heading uses the shared subsection type scale so it fits beside the back control without clipping. Pagination, empty/loading states and permissions remain shared across layouts. When results scroll, the pagination footer remains docked to the bottom of its page or panel, respecting the safe area; independent lists retain independent footers.
- Leave status starts as pending and can become approved only through an administrator's confirmed action on another person's request. The server records the reviewer and review time, while direct table updates remain denied. Pending and approved labels share the status column with a focusable information icon when a short-notice exception applies; the shared Tooltip reveals the explanation and updates its wording after approval. Confirmation and success feedback use the existing modal and toast. Approved requests remain in the list and continue to reserve the recruiter date range.
- Keyboard access, topic content, profile data, and role-specific messages are preserved.

**`nav-bar`** — top navigation
- Background `{colors.canvas}`, bottom hairline `{colors.hairline}`, text `{colors.body}`, type `{typography.body-md}`, and tokenized padding. It contains the product identity, navigation links, and existing account actions.

**`nav-link`** — individual nav item
- Body-grey text `{colors.body}`, type `{typography.body-md}`, fully rounded hit area `{rounded.full}`, padding `{spacing.xs} {spacing.sm}`. Transparent until interacted.

**`app-workspace`** — authenticated application shell
- On desktop, the sidebar is a separate panel inset from the shell edges by shared spacing, with rounded corners and Level-1 shadow but no border. It uses the continuous canvas surface and existing navigation tones; the workspace is one continuous canvas surface shared by header and page content.
- The workspace uses the shared canvas, `{rounded.lg}` corners and a 1px `{colors.hairline}` border, with no shadow so the sidebar remains the more prominent frame. A `{spacing.sm}` inset separates it from the shared page floor. It owns vertical scrolling so the sidebar remains stationary.
- The shell owns the page's top gutter: `{spacing.md}` on mobile and `{spacing.lg}` from tablet upward. Authenticated pages use `PageHeading` for the global header title and do not add page-level top padding or margin; retain page-specific widths and internal section spacing.
- Back navigation embedded directly in app-page-title inherits the heading color in default, hover, focus, active and visited states and never gains an underline. Existing Link/button semantics, destinations, keyboard navigation and visible focus outlines remain unchanged.
- Sidebar selection uses a solid `{colors.primary}` fill with `{colors.on-primary}` text and icons, without a leading border or inset indicator. Every page link is shown directly in a single flat list, with no nested navigation; section labels remain available to assistive technology as visually-hidden headings. `{colors.link}` is reserved for links, not for filling the active navigation row.
- Header controls and sidebar text share the complete `{typography.body-md}` role (Inter, 14px, weight 400), including user name, active and inactive navigation, badges, quick actions and sign-out confirmation buttons. The workspace page title uses the authorized 20px/700 header typography. Active navigation retains its existing primary surface and on-primary text. Heading semantics remain unchanged. Navigation icons and labels use `{spacing.sm}`; adjacent links have no extra gap and their 44px minimum targets set the row rhythm. `{spacing.xs}` separates the brand from navigation. Navigation and workspace-header controls use `{rounded.md}` and retain a 44px minimum target.
- The sidebar brand is an unbordered transparent row with the symbol inside a rounded-md primary tile. The tile uses the shared touch minimum minus spacing.xs (36px), with its currentColor SVG at 60% in on-primary ink. Beside it, the user display name (falling back to username and using the same natural-case utility as the header) uses the complete heading-sm role (16px, weight 600), stays on one line and truncates with ellipsis. The existing configured job title (or localized Administrator/Recruiter fallback) appears below in body-sm (12px, weight 400), wrapping to at most two lines before truncation. Full name and job title remain in the DOM for assistive technology and in native title attributes for pointer inspection. This identity block is the localized exception to the otherwise uniform header/sidebar body-md typography. The symbol is revealed once with the system `fadeUp` motion. Reduced-motion mode shows the static mark; forced-colors mode inherits the system text color via `currentColor`.
- Below the desktop breakpoint the sidebar becomes an overlay and the workspace returns to a continuous, unframed page surface. The mobile bar must not cover content or safe areas.
- The sidebar keeps the workspace canvas color. A clean header inside the workspace holds a compact quick-access trigger and a direct account avatar link at the right, without a divider. The account link navigates to /account, shows the avatar with localized My account / Mi cuenta text at every breakpoint, and keeps its descriptive accessible name. It shows the existing UserRound icon in place of initials when the profile photo is absent or fails to load. The header retains the menu trigger at the left below the desktop breakpoint. From the desktop breakpoint (1080px), the quick-access trigger shows its localized text beside the icon; mobile and tablet keep the icon with an accessible name. Its popover lists the existing creation, request, organization-chart and Kanban actions without a search field. The `Alt+K` shortcut opens the list at every breakpoint. The actions retain keyboard access and their existing mobile Modal and desktop Sheet presentations. `Ctrl+K` remains assigned to the candidate-page search.
- At every breakpoint, sign-out lives in the sidebar footer, including the mobile overlay. Its trigger and equal-width inline Cancel/Confirm actions retain the existing 44px touch targets, tokenized backgrounds and hairline borders, and visible focus. The trigger keeps its transparent surface, semantic error text and subtle error hover; Cancel uses the elevated neutral surface and the final confirmation uses the solid semantic danger treatment. Confirmation uses the existing sidebar flow and shared sign-out operation. The mobile navigation list keeps its existing scroll region so the footer stays accessible.
- Free-text search fields across authenticated pages use the shared `SearchField` primitive and the concise localized placeholder `Buscar` / `Search`; contextual accessible labels continue to identify what each field searches, and existing keyboard shortcuts remain unchanged.

**`career-workspace`** — personal career journey
- Temporarily unpublished: `CAREER_JOURNEY_ENABLED` in `src/features/career/types.ts` is `false`. Sign-in goes to `/home`, direct visits to `/career-path` redirect there, and the “Tu día, tu enfoque” dialog is not mounted, including when navigation retains `careerMotivation` state. The journey and dialog implementation remain available for later activation. Authentication, permissions and saved data are preserved. The behavior below describes the enabled experience.
- `/career-path` appears after a fresh credential sign-in until the account completes it with “¡Vamos!”. Completion is saved in the authenticated user's metadata and applies across devices. Later sign-ins and direct visits to `/career-path` return to `/home`; restored sessions keep their existing entry behavior. A failed completion save stays on the summary with a retry message.
- This entry page reuses the workspace frame and tokens without the sidebar or application header. Authentication, maintenance and team-directory guards remain in place. Mobile starts in one column; tablet, desktop and wide use the documented breakpoints.
- The supplied recruitment/HR path runs from Analyst B through Analyst A, Coordinator, Head and Manager. Titles are centralized in `src/features/career/types.ts`; no other organization hierarchy is implied.
- Across every screen that already includes decorative messages, all existing bubbles occupy two responsive bands above and below the main content. Both bands remain in normal layout flow with intrinsic row heights, tokenized gaps and animation clearance; they cannot sit underneath foreground panels or be cropped by a clipping message layer. Text can wrap and the page can grow or scroll on narrow screens. This also applies while a choice is selected and during the final lets go transition. Message texts, counts, varied alignments, existing motion and assistive-technology exclusion remain unchanged; the opening screens retain their message-free presentation.
- The entry shows only “¿Dónde estás hoy?” and a native arrow button named “Ver puestos”. Advancing reveals one card per existing position, each with its title and a different built-in Wave expression (wave, typing, think, base2 or success). Cards enter once using existing duration, stagger, spacing and easing tokens; reduced-motion mode shows them immediately. The choices use a stable non-hierarchical presentation order while preserving the centralized role data. On mobile, compact cards pair the robot illustration with a left-aligned title and alternate their horizontal placement. Tablet uses two columns; desktop and wide use three, with alternating tokenized vertical spacing and larger robot illustrations above the titles. Position choices have no background, border or shadow, and robot illustrations have no surrounding background. Native buttons preserve the visible keyboard focus indicator; the selected choice remains centered with its check indicator.
- `--diagram-stage-min-block-size` provides a reusable 24rem diagram floor; nodes grow for dynamic text. `--diagram-connector-width` defines 2px graph connectors.
- Selecting a card hides the others and briefly retains the selected button with `aria-pressed` and a check indicator. After the existing brand-reveal duration, the same route advances to a new screen headed “¿A dónde quieres llegar?” and focuses its heading. Reduced-motion mode advances immediately. Selection stays in memory for this visit and does not change employment data or saved goals. Previously saved personal goals and next steps remain intact in local storage, separated by authenticated user ID. The existing recovery messages remain available in the position selectors. The outlined lets go action appears on the final journey summary; selecting a starting position advances automatically.

- The destination introduction shows “¿A dónde quieres llegar?”, the original twelve motivational bubbles (“Lo estás haciendo bien”, “Casi lo logras”, “Un paso más” and related encouragement), and a native arrow button named “Ver puestos de destino”. Pressing this arrow opens a separate goal-selection screen that reuses the position selector with only Head and Manager choices, sourced from the centralized roles. Both remain visible before selection; choosing one hides the other, briefly retains the chosen title and check indicator, then automatically opens “¿Por dónde quieres empezar?” after the existing brand-reveal duration. This step has no continuation arrow; reduced-motion mode advances immediately. This destination choice is separate from the starting-position selection and remains in memory without saving a goal. Twelve decorative leadership message bubbles (“Aprende”, “Cambia”, “Mejora”, “Sé un líder” and related encouragement) appear behind the goal selector with varied alignments, replacing the introductory messages only after its arrow is pressed. It uses existing surface, hairline, radius, shadow and typography tokens. The entrance and float animation plays once within the existing decorative cycle, then settles; reduced-motion mode is static. Bubbles are excluded from assistive technology and cannot intercept pointer events.

- After the destination is chosen, “¿Por dónde quieres empezar?” offers three development choices: “Liderar personas”, “Tomar mejores decisiones” and “Comunicar con claridad”, each with its approved description and a different existing Wave expression. It reuses the borderless, background-free, staggered selector with a visible heading and four decorative bubbles: “Empieza pequeño”, “Escucha y aprende”, “Practica cada día” and “Lidera con el ejemplo”. The development foreground has no background, and the four bubbles occupy the upper and lower corners with tokenized vertical space reserved around the main content, so all remain visible without covering the title or choices. Choosing one hides the others, shows its check indicator, then advances after the existing brand-reveal duration to “¿Cuál será tu primer paso?”. Reduced-motion mode advances immediately. The first-step screen continues into the journey summary, where the outlined lets go action remains available. Selections remain separate in memory, with no changes to saved goals, employment data or permissions.

- “¿Cuál será tu primer paso?” reuses the same free-standing Wave choices with three actions drawn from the selected development focus. People offers “Pedir feedback”, “Delegar una tarea” and “Acompañar a alguien del equipo”; decisions offers “Priorizar pendientes”, “Revisar datos” and “Proponer una solución”; communication offers “Escuchar antes de responder”, “Dar feedback” and “Explicar mejor un objetivo”. Four corner bubbles encourage small actions, including “Una acción pequeña cuenta” and “Empieza con algo posible”. Selecting an action hides the other choices and advances after the existing reveal duration to “Este es tu camino”; reduced-motion mode advances immediately.
- The closing summary displays only the desired position with its selected Wave expression and the first action, centered in one column on all screen sizes. The current-position and development-focus blocks are omitted from this summary; their selections and earlier steps remain intact in memory. Native description lists, the compact container and existing typography and spacing tokens are preserved, with no dividers or painted panels. The existing outlined continuation action visually hides the main title while retaining its accessible heading and animates the centered desired position before returning to /home after the brand-reveal duration. The first action and decorative message bands remain visible, and the button prevents repeated activation. Reduced-motion mode skips the animation. Returning to `/home` waits for the account completion marker to be saved and opens the motivational dialog. Employment data, saved goals and permissions remain unchanged.

### Buttons

**`button-primary`** — the theme's primary app action
- Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button-md}` at weight 600, `{rounded.md}` (8px), min-height `44px`, padding `{spacing.xs} {spacing.sm}`.

**`button-secondary`** — the elevated secondary app action
- Background `{colors.canvas-elevated}`, text `{colors.ink}`, border `{colors.control-border}`, type `{typography.button-md}` at weight 600, `{rounded.md}`, min-height `44px`, padding `{spacing.xs} {spacing.sm}`.

**`button-primary-sm`** — the standard app CTA
- Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button-md}` at weight 600, `{rounded.md}` (8px), min-height `44px`, padding `0px 12px`.

**`button-ghost-sm`** — the neutral secondary app button
- Background `{colors.canvas-elevated}`, text `{colors.ink}`, 1px `{colors.control-border}`, type `{typography.button-md}` at weight 600, `{rounded.md}`, min-height `44px`, padding `0px 12px`.

**`button-category-pill`** — grouped category navigation
- Background `{colors.canvas-elevated}`, text `{colors.ink}`, type `{typography.button-md}`, rounded `{rounded.pill-category}`. Use only inside a grouped-navigation container, never as a generic action.

**`button-icon-circular`** — circular icon / carousel control
- Background `{colors.canvas-elevated}`, text `{colors.ink}`, 1px `{colors.control-border}`, type `{typography.body-lg}`, rounded `{rounded.full}`, no padding.

### Inputs & Forms

- On iOS WebKit, editable fields use the shared `--editable-text-min-size` floor mapped to `--type-body-lg-size` (16px), including search fields at tablet widths. Their existing typography remains unchanged elsewhere. Keep manual viewport zoom enabled.

**`text-input`** — default form field
- Background `{colors.canvas-elevated}`, ink text `{colors.ink}`, 1px `{colors.control-border}`, type `{typography.body-md}`, rounded `{rounded.md}`, padding `{spacing.xs} {spacing.sm}`, min-height `44px`.

**`auth-workspace`** — sign-in workspace
- `/login` keeps the sign-in form in a single column on mobile and tablet. At the desktop breakpoint, a quiet `{colors.canvas-soft}` panel on the left presents a decorative Motion sequence between the brand SVG and the existing Wave robot, while the centered brand and form remain on the right. The sequence plays once: after the brand reveal, the robot changes between the existing Wave, Think and Success expressions, moves sideways and upward inside its reserved illustration area, and returns to Wave at the center with its greeting visible. The text and form stay fixed. Expression fades and travel derive from the shared brand-reveal duration; travel distances use spacing and float tokens. The full sequence lasts 4.5 seconds with the current duration token, has no loop and cancels when the scene unmounts or motion becomes unavailable. The brand fades out completely before Wave fades in; each fade uses half of `{duration.brand-reveal}`. Reduced-motion preference shows only the static brand.
- On desktop the form sits in a `{colors.surface-card}` `{rounded.lg}` card with a hairline and Level-1 shadow within the shared canvas.
- On mobile the outer workspace frame is removed so the flow remains continuous and can scroll with the software keyboard or increased text zoom.
- Fields and CTA share the 44px minimum control height; the page must not autofocus a field on mobile.

### Cards & Containers

**`delete-confirmation`** — compact destructive dialog
- The shared DeleteConfirmModal contains only its title, visible header close button, existing description/error content and Cancel/Delete footer. It uses the compact extra-small Modal, aligned to the bottom on mobile without exterior gutters and with rounded top corners, matching the base Modal presentation. From tablet upward it stays centered horizontally and vertically with tokenized gutters and full rounded corners. Existing internal padding and safe-area clearance remain in place. It remains a Modal even inside a Sheet presentation scope.
- Existing confirmation handlers, destructive action styling and loading labels remain unchanged. During deletion, footer actions are disabled and header/backdrop/Escape closure is blocked. Other ConfirmModal uses retain their existing placement and header controls.

**`position-settings`** — workforce configuration
- “Configurar plantilla” keeps its existing two-step wizard in the shared Modal on mobile and uses the compact floating FormSheet from tablet upward. Sheet fields stay in one column. The wizard fills the available body, scrolls its step content and retains its Cancel/Next/Back/Save controls.
- Administrator access, position selection, paired Starlite rules, validation and position-settings persistence remain unchanged.

**`employee-create`** — workforce employee entry
- New employee entry retains the shared Modal and existing wizard on mobile. From tablet upward it reuses the compact floating FormSheet used by candidate creation, with all fields, including employee number and name, in a single column. The body scrolls independently of the header and Cancel/Save actions, and closing returns focus to the opener.
- Existing vacancy selection, field dependencies, validation, submission and permissions remain unchanged. Employee editing and promotion retain the shared Modal on mobile and reuse the same compact floating FormSheet from tablet upward, with form fields in one column, a scrollable body and their existing footer actions. Promotion keeps both existing-position selection and new-position creation, including their dependent fields, validation and persistence. The workforce employee deletion form, which captures exit date, type and reason, uses the same compact floating FormSheet in one column from tablet upward and retains its Modal on mobile. Its warning, validation, Cancel/Delete actions and exit-data persistence remain unchanged; the separate DeleteConfirmModal remains bottom-centered on mobile and centered from tablet upward.

**`maintenance-screen`** - access maintenance typography
- MaintenanceGuard uses complete Inter body-md (14px/400) roles for descriptions, status/error messages and Check status/Sign out actions. The shared app-page-title heading remains unchanged. Authentication and maintenance guards, administrator access, status checks, sign-out, loading locks, announcements, responsive layout, colors and motion remain unchanged.

**`logout-workspace`** - sign-out confirmation typography
- The sign-out page remains at the existing /logout route. It uses complete Inter roles: body-md (14px/400) for email and confirmation/loading actions; body-strong (14px/600) for the account name and avatar initials. Its primary h1 retains heading-md (20px/600). The shared exit loader already uses body-md for its status message. Sign-out, duplicate-submit protection, error feedback, authentication guards, validated return navigation, loading locks, data, responsive layouts, colors and motion remain unchanged.

**`login-workspace`** - sign-in typography
- /login uses complete Inter roles: caption-up (12px/600) for field labels; body-md (14px/400) for descriptions, remember-username text, submit states, preferences and reading/error/storage/Caps Lock messages; body-strong (14px/600) for the compact brand name and decorative story titles. The primary h1 retains its existing heading-lg role with Inter, and the legal notice retains body-sm (12px/400). Editable fields preserve the existing iOS text-size safeguard. Authentication, validation, remembered-username storage, password visibility, preference persistence, focus, responsive layout, colors and the existing decorative sequence remain unchanged.

**`team-workspace`** - team directory typography
- /team uses complete Inter roles: caption-up (12px/600) for form labels and access status badges; body-md (14px/400) for job titles, linked accounts, help, checkbox labels, actions and reading/empty/error/success text; body-strong (14px/600) for member names and shared dialog titles. Member creation/editing keeps Modal on mobile and FormSheet from tablet upward. Status and removal actions confirm inline on a second click with their consequence visible in the row; Escape or leaving the action cancels confirmation. Dialog typography is scoped through team-dialog, editable fields keep the existing iOS text-size safeguard, and the shared workspace header remains 20px/700. Administrator guards, search, account linking, validation, save/status/archive operations, data, focus, layouts, colors and motion remain unchanged.

**`header-controls`** - search and account menu typography
- The header quick-access trigger and direct account link use transparent, borderless surfaces at rest and hover, retaining their centered alignment, 44px touch targets and visible keyboard focus. The shortcut floating menu uses complete Inter body-md roles for actions and reading/empty/error text; shortcut labels use caption-up. The account link opens /account directly, where Theme and Language use their existing preference controllers. The shared workspace title and shortcut filtering, keyboard shortcuts and navigation remain unchanged.

**`account-workspace`** - account page layout and typography
- /account has no dialogs: every account action is resolved inline inside tokenized `account-card` sections (surface-card, hairline, rounded.lg, flat; spacing.md padding on mobile, spacing.lg from tablet). Mobile and tablet stack the cards in one column; from the desktop breakpoint (1080px) the profile card sits sticky in a 1fr column beside a 2fr settings column. Each card has an h2 (body-strong) with an optional body-md description and an optional compact header action; the page title stays in the shared header through PageHeading and the page owns its `main` landmark. The account root is the local containing block for absolutely positioned accessible text, so those nodes remain inside the workspace scroll area and do not create document-level overflow on desktop.
- Profile: the avatar is a native button (44px minimum, accessible name with the user's name) with a decorative primary camera badge; the name uses heading-sm and the email body-md. Below, a body-sm/mute hint announces politely the selection state. Clicking the avatar opens the hidden file input; there is no duplicate Change picture button. Selecting a valid image shows its preview and the Cancel/Save actions in a two-column row, moving focus to Save. Cancelling or completing a save returns focus to the avatar without automatic scrolling. Delete picture appears only when a saved avatar exists, uses the semantic error text and confirms inline: the first click changes it to Confirm, the second deletes; blur or Escape cancels. Validation, upload, deletion and storage-cleanup feedback keep the existing toasts; deletion errors appear inline.
- Password: Change password is a secondary header action exposing aria-expanded/aria-controls. The action retains its position and is disabled while the form is open, keeping the header geometry stable. The inline form takes its natural height immediately and uses only an opacity Motion transition on opening and closing, without animated height or intermediate clipping. It focuses the current password after the opening fade completes, using preventScroll. Cancel collapses the form and returns focus to the action after closing completes, also without automatic scrolling; with typed values the first click changes it to Discard and the second discards (no native confirm). Success remains visible inside the form.
- Appearance and language: /account uses ThemeSelect and LanguageToggle in two equal columns inside an AccountSection. Each complete option is a native button, including its label, current value and icon or language code; there are no nested buttons. The shared controls accept composed content while retaining their existing actions, browser preferences and storage-error feedback. Both options use the shared control border, spacing and minimum touch target, and the same layout in both themes.
- Recognition (recruiters only): frequency CustomSelect and the shared Checkbox are edited inline, two columns from tablet; persistence stays in the browser with its note in body-sm/mute and inline save errors.
- Administration (administrators only): Team is a full-row link with a chevron; maintenance keeps the transparent hairline Enable/Disable action beside a badge of the same visible height, confirming on a second click (Escape or blur cancels); the enabled badge uses warning-subtle/warning-text and the inactive one the neutral elevated surface. Errors show inline with Retry. User activity follows as an h3 subsection with a horizontal, wrapping avatar list. Each avatar uses the saved photo or initials, indicates online presence with a solid badge, and reveals the user's name in a tooltip on hover, focus or tap. The compact online or last-access status stays visible below each avatar; loading, empty and error states retain their existing messages and retry action.
- Typography uses complete Inter roles: caption-up for field labels and badges; body-md for descriptions, email, preferences and messages; body-strong for section titles; body-sm for hints and notes. Card entrances and swaps use framer-motion driven by the shared `--transition-*` and `--motion-float-distance` tokens through `useMotionTokens`; reduced motion shows the final state without movement.

**`pay-scale-workspace`** - salary scale typography
- /pay-scale uses complete Inter roles: caption-up (12px/600) for table column headers, position-type labels and mobile salary labels; body-md (14px/400) for area counts, daily salaries, tabs, actions and reading/empty/error text; body-strong (14px/600) for area/position names and emphasized monthly salaries. Desktop tables and mobile cards share these roles. Search retains its existing editable iOS text-size safeguard, and the global header remains 20px/700. Salary values and precision, source files, grouping, filtering and highlights, tab keyboard navigation, data, permissions, layouts, colors and motion remain unchanged.

**`route-day-employees-workspace`** - route day employees typography
- /routes/employees uses complete Inter roles: caption-up (12px/600) for table column headers and mobile field labels; body-md (14px/400) for employee numbers, sections, reading/empty/error text and notice navigation; body-strong (14px/600) for the route name and employee row names. The existing page title and shared workspace header typography remain unchanged. Mobile cards and the desktop table retain their current layouts. Route/day lookup, employee ordering, query parameters, back navigation and initial focus, data, permissions, loading skeletons, colors and motion remain unchanged.

**`routes-workspace`** - routes page typography
- /routes uses complete Inter roles: caption-up (12px/600) for shift/property labels, daily metric labels, capacity alerts and match badges; body-md (14px/400) for route subtitles, search metadata, detail values, comparison notes, navigation and empty/error text; body-strong (14px/600) for internal headings, route/employee names, capacities, daily values and change indicators. The change tooltip uses page-scoped body-md reading text and body-strong titles. Shared search retains its existing editable iOS text-size safeguard, and the global header remains 20px/700. Route selection, search, mobile navigation and focus return, capacity/comparison calculations, employee-day links and query parameters, data, permissions, layouts, colors and motion remain unchanged.
- Each selected route shows its official ordered itinerary from the six supplied route schedules, independently of employee assignments in `rutas.json`. Every stop keeps its neighborhood, reference and listed time for each shift, including explicit `N/A` values. The itinerary uses a responsive ordered list with tokenized typography and surfaces; employee search continues to show search results instead.

**`metrics-workspace`** - metrics page typography
- /metrics uses complete Inter roles: caption-up (12px/600) for KPI labels and table column headers; body-md (14px/400) for dates, month navigation, metadata, descriptions, reading text, historical details and empty/error states; body-strong (14px/600) for internal headings, recruiter/employee names, KPI values, totals, trends and percentages. The historical-goal tooltip uses page-scoped body-md reading text and body-strong titles. Desktop tables and mobile recruiter/retention/departure details share these roles. The global header remains 20px/700. Month navigation, mobile drill-down and focus return, calculations, sorting, data, permissions, layouts, colors and motion remain unchanged.

**`forms-workspace`** - forms page typography
- /forms uses complete Inter roles: caption-up (12px/600) for the route-date label, table headers and mobile record labels; body-md (14px/400) for descriptions, metadata, week options, route records, selection actions, empty/error messages and buttons; body-strong (14px/600) for section/card titles, collaborator names, emphasized counts and the selected week option. The review flow retains its mobile Modal and desktop FormSheet, while editable date text keeps the existing iOS minimum size safeguard. The global header remains 20px/700. Weekly print documents and exported route-image typography retain their existing values. Employee selection, date/week filtering, route lookup, print pagination, clipboard export, data, permissions, layouts and motion remain unchanged.

**`departure-reasons-workspace`** - departure reasons typography
- /departure-reasons uses complete Inter roles: caption-up (12px/600) for filter and capture labels, table headers and mobile record labels; body-md (14px/400) for reading text, records, counts, chart axes/legend/tooltip, actions and empty/error messages; body-strong (14px/600) for internal headings, chart values and percentages. Capture retains its existing mobile Modal and desktop FormSheet, shared title typography and editable iOS text-size safeguard. The global header remains 20px/700. Filters, sorting, pagination, trend calculations, validation, persistence, translations, layouts, colors and motion remain unchanged.

**`report-comparison-workspace`** - report comparison typography
- /reports/comparison uses complete Inter roles: caption-up (12px/600) for quarterly metric labels, table headers and the existing shared count/absence badges; body-md (14px/400) for table values, reading/empty/error text, detail metadata and retry; body-strong (14px/600) for internal headings, quarter/month names, emphasized counts, percentages and trends. The responsive mobile cards retain shared report typography. The global header remains 20px/700. Monthly/quarterly calculations, trend signs and semantics, sorting, numeric precision, expand/collapse, data, navigation, layouts and colors remain unchanged.

**`report-day-workspace`** - report day typography
- /reports/day/:month/:day uses complete Inter roles: caption-up (12px/600) for metric/property labels, table headers, incident codes, shift tags and count badges; body-md (14px/400) for employee numbers, reading text, metadata, navigation, retry and empty/error states; body-strong (14px/600) for internal headings, area/section and employee names, attendance values and percentages. SectionSummaryCard retains its existing layout and uses these roles at the source; its only current consumer is report area summary. The area absence Modal and its responsive tables/cards use the same roles. Page-specific header typography overrides are removed so the shared header retains 20px/700 at all breakpoints. Existing date/week text, day navigation, area/incident selection, calculations, data, permissions, layouts, badges and motion remain unchanged. Comparison remains pending.

**`reports-workspace`** - reports overview typography
- /reports uses complete Inter roles: caption-up (12px/600) for short KPI labels, calendar weekdays, incident codes, count badges and preview property labels; body-md (14px/400) for dates, report metadata, descriptions, controls, links and reading/empty/error text; body-strong (14px/600) for internal headings, report/employee names and emphasized values. These roles cover upload/preview, saved reports, calendar, attendance analysis, KPI detail and employee details. Active employee identifiers and incident dates use Inter; their typography is scoped through classes instead of inline styles. Shared KpiCard typography is scoped to the report dashboard. The global header remains 20px/700. Saved reports and attendance analysis retain their existing mobile Modal and desktop Sheet presentations; employee and area KPI details retain Modal. Parsing, calculations, save/delete, filters, navigation, layouts and motion remain unchanged. Day and comparison routes require separate review.

**`data-update-workspace`** - data update page typography
- /data-update uses complete Inter roles: caption-up (12px/600) for field labels, legends, property labels and status badges; body-md (14px/400) for employee numbers, metadata, tabs, action text, progress descriptions, save/photo states, file names, previews, help and empty/error messages; body-strong (14px/600) for names, internal headings and emphasized progress values. The same roles cover administration, lockers, progress details, the existing wizard, campaign/shift import dialogs and photo retry. Campaign import and photo viewing retain their mobile Modal and desktop Sheet patterns; locker editing and shift import retain Modal. Shared selects retain body-md and the existing iOS editable text-size safeguard. The global header remains 20px/700. Assignment, import/export, autosave, validation, persistence, permissions, layouts and motion remain unchanged.

**`overview-workspace`** - overview page typography
- /overview uses complete Inter roles: caption-up (12px/600) for short KPI labels, coverage categories, table headers and status badges; body-md (14px/400) for dates, metadata, chart axes and legends, counters, controls and empty/error messages; body-strong (14px/600) for internal headings, names, positions and emphasized metric values. These roles also cover workforce coverage, pending-position details and the four active candidate/hire dialogs, including their accordions. Dialogs retain mobile Modal and desktop Sheet presentations. StatCard typography is scoped to this page; the global header remains 20px/700. Hidden TTF details remain outside this review. Data, calculations, permissions, actions, layouts and motion remain unchanged.

**`vacancy-assignments-workspace`** - vacancy assignment page typography
- /vacancy-assignments uses complete Inter roles: body-strong (14px/600) for department titles and position names; body-md (14px/400) for group counts, empty-state text, recruiter selectors and the Copy report action. The recruiter dropdown retains shared CustomSelect typography, including selected-option emphasis. The global header remains 20px/700. Assignment state, count exclusions, calculations, report content, clipboard behavior, layouts and motion remain unchanged.

**`workforce-workspace`** - workforce page typography
- /workforce uses complete Inter roles: caption-up (12px/600) for table headers, short metric labels and status badges; body-md (14px/400) for coverage notes, search metadata, dates, tabs, counters and form actions; body-strong (14px/600) for department and position titles, employee names, internal headings and emphasized coverage values. Workforce numbers use Inter through the shared typography token. Employee creation, editing, promotion and position-settings dialogs retain their mobile Modal and desktop Sheet presentations. The incapacity dialog retains the shared Modal. All use these roles through scoped classes. The global header title stays 20px/700. Search, projections, permissions, persistence, data, layouts and motion remain unchanged.

**`analysis-workspace`** - analysis page typography
- /analysis uses complete Inter token roles: caption-up (12px/600) for filter labels, employee property labels, status badges, weekdays and incidence codes; body-md (14px/400) for employee details, dates, controls, result counts, calendar summaries, legend and empty/error messages; body-strong (14px/600) for names, employee card headings, internal section titles and risk counts. The global header title remains 20px/700. Shared SearchField retains body-md on all breakpoints and its existing iOS editable text-size floor. Search, filters, calculations, data and layouts remain unchanged.

**`leave-and-organization-workspaces`** - leave requests and organization chart typography
- /leave-requests uses complete Inter roles: caption-up (12px/600) for column headers, short labels and status badges; body-md (14px/400) for dates, request metadata, pagination and page actions; body-strong (14px/600) for requester names and internal headings. The request policy, date summary, authorization notice and footer actions use body-md in the existing mobile Modal and desktop Sheet; the success heading uses body-strong. The shared calendar uses body-strong for the month and caption-up for weekdays, preserving selected-date emphasis.
- /organization-chart uses body-strong (14px/600) for positions and internal subtitles, and caption-up (12px/600) for location badges. Both routes retain the existing 20px global header title, layouts, data and actions. Legal footnotes, when present, use body-sm (12px/400).

**`candidate-workspace`** - candidate page typography
- /candidates uses Inter with complete token roles: short labels and column headers use caption-up (12px/600); reading text, links, dates, recruiter names and filters use body-md (14px/400); candidate names, positions and internal subtitles use body-strong (14px/600). Legal footnotes, when present, use body-sm (12px/400). The global header title retains its existing 20px size. These roles also apply to the page-owned mobile detail and profile preview; shared badges receive explicit page classes so other pages retain their typography.

**`candidate-create`** — new candidate entry
- New candidate entry retains the shared Modal and existing three-step wizard on mobile. From tablet upward it uses the compact floating Sheet with the existing form fields in a single column, a scrollable body and the same Cancel/Save footer actions. The header retains its title, icon and close control, and closing returns focus to the opener.
- Existing field validation, dependent position selectors, recruiter permissions, submission, errors and interview-pass confirmation stay unchanged. Candidate editing uses the same compact floating Sheet in one column from tablet upward and retains its existing Modal/wizard on mobile, with role-based field restrictions unchanged. Candidate deletion retains the separate DeleteConfirmModal.
- The mobile candidate detail drill-down labels its neutral-colored back control with the selected candidate's name, preserves the back action, shows that name only once, and reduces the extra top spacing before the detail card.
- Selecting a candidate from search results opens the existing profile preview in the shared Modal on mobile and compact floating Sheet from tablet upward. Show available candidate details as a vertical, labeled list to use the Sheet body without blank stretches; omit missing optional values. Preserve the existing Hire/Edit actions.

**`candidate-interview-pass`** — shareable white document and preview dialog
- The exported pass always uses document-paper, document-ink and document-neutral tokens, independent of the application appearance. Brand and title establish context, the candidate name leads, the position follows, date and recruiter share one quiet panel, and location plus access requirements close the document. Text blocks flow vertically and the canvas grows for long names, positions or addresses instead of clipping or overlapping them. Only the header and final requirements use hairline dividers.
- The preview follows the application's active light or dark theme. After candidate creation and when opened from the candidate list, the interview pass uses the compact floating Sheet from tablet upward and retains the shared Modal on mobile. Only the exported document remains white. The dialog shows one short instruction, a centered responsive image and two touch-sized actions: secondary Copy and primary Share. Feedback uses app toasts, keeping the dialog geometry stable. The preview reserves its 4:5 area while loading and fits taller documents within it; it has no scale entrance animation. Short viewports scroll inside the shared modal region with contained overscroll. In the floating Sheet, only the instruction and preview body scroll; the native Copy/Share footer stays at the bottom of the available sheet height, separated by the shared hairline and with safe-area clearance. Mobile keeps its existing content-led Modal layout. The generated image has descriptive alternative text, and loading or generation errors are announced in place.

**`feature-card`** — flat hairline content card
- Background `{colors.surface-card}`, 1px hairline `{colors.hairline}`, ink text `{colors.ink}`, type `{typography.body-md}`, rounded `{rounded.lg}`, padding `{spacing.lg}`.

**`onboarding-document-review`** — credential and contract delivery
- “Entrega de credencial” and “Entrega de contratos” retain the shared Modal on mobile and use the compact floating FormSheet from tablet upward. Both reuse the same employee-selection content, counts, select/remove-all control and Cancel/Print actions. The list scrolls inside the dialog body while the header and footer remain accessible.
- Employee data, ordering, selection, print eligibility, document generation and print styles remain unchanged. The shared Sheet handles keyboard focus, closing and return to the opener.

**`activities-dialogs`** — activities, responsibilities and vacancy assignment
- /activities uses the shared Inter stack and complete token roles: caption-up (12px/600) for short labels and status badges; body-md (14px/400) for tabs, descriptions, counters, assignment names, filters, attachments and form actions; body-strong (14px/600) for internal headings and card titles. Form messages and dialog headers inherit the shared primitives. SmartTextarea keeps the existing iOS minimum editable text size while using body-md. The global page header retains its existing 20px size.
- The Vacancies, Responsibilities and Activities section headers show only their title and the existing creation action when permitted; they omit the count and descriptive subtitle. Their titles use the complete heading-sm role and align vertically with the creation buttons. All three creation buttons use Create / Crear; their destination and permissions remain unchanged. Empty states, filters and pagination keep their own data and labels.
- Within `/activities`, vacancy creation (the “Asignar Vacante” form), activity/responsibility creation and editing use the shared Modal on mobile and the compact floating FormSheet from tablet upward. The presentation provider wraps only these forms; the vacancy creation Sheet keeps its fields in one column. Recruiter reassignment uses the compact extra-small Modal bottom-centered on mobile and centered horizontally and vertically from tablet upward, with the shared tokenized gutters and safe-area clearance. Its selector and immediate assignment behavior remain unchanged. Detail/evidence, deletion confirmation and image viewing retain their existing Modal presentation. Contents, actions and permissions remain unchanged.
- The creation/editing Sheet header centers its icon, title and close control. Body scrolling and keyboard/focus behavior use the existing shared primitives; the other dialogs keep their current presentation and behavior.

**Activity and vacancy assignment cards**
- Reuse the shared `feature-card` surface. Activity and vacancy assignment cards follow their content height at every breakpoint; cards in the same grid row stretch together and their footers align at the bottom. Vacancy assignment footers show the existing assignee badge and, for administrators, a shared Assign to select and an inline Delete/Confirm control with badge-height surfaces, tokenized borders and backgrounds, focus rings on the visible surfaces, and 44px touch targets; assignment and deletion preserve their existing data operations and permissions.
- Preserve empty grid tracks so a single filtered card does not expand across the full content width.
- Clamp visible titles to two lines and descriptions to three; activity details remain available in the existing detail view.

**`feature-card-elevated`** — lifted card variant
- White background, hairline, and Level-1 shadow. Level-2 is reserved for floating menus, dialogs, and popovers.

**`code-block`** — code / terminal surface
- Background `{colors.canvas-elevated}`, ink text `{colors.ink}`, 1px hairline `{colors.hairline}`, Inter `{typography.code}`, rounded `{rounded.md}`, padding `{spacing.md}`. Syntax rendered in the ink-and-accent palette.

## Do's and Don'ts

### Do
- Keep one continuous canvas across pages; separate card and elevated surfaces with semantic tokens and hairlines.
- Reserve `{colors.link}` for links and use `{colors.focus}` for visible focus; decorative accents must stay local and optional.
- Use 8px app controls, 12px cards, and full circles only for avatars or icon-only buttons.
- Define cards and inputs with a 1px hairline (`{colors.hairline}`) before any shadow — flat is the default.
- Set display headings in Inter with the existing weight and tight negative tracking; label technical sections with the technical eyebrow token.
- Step the grey text ladder deliberately: `{colors.ink}` → `{colors.body}` → `{colors.mute}` → `{colors.faint}`.

### Don't
- Don't fill large surfaces with accent colors; decorative tokens must not become application chrome.
- Don't use pills for ordinary app buttons or inputs.
- Don't pile on shadows — depth is a 1px hairline plus, at most, a finely-layered low-alpha shadow stack.
- Don't set body copy in pure black (`#000000`) — headings use `{colors.ink}` and body steps to `{colors.body}`.
- Don't add decorative systems to application chrome; product surfaces follow the theme's neutral and semantic tokens.
- Don't loosen the display tracking — large headings retain their tight negative letter-spacing.

**`candidate-metrics-page`** — recruitment metrics
- Candidate metrics follows the candidate typography standard: Inter; caption-up (12px/600) for labels and table headers, body-md (14px/400) for reading text, dates and links, and body-strong (14px/600) for internal headings and emphasized values. The workspace header retains its existing 20px title.
- `/candidates/metrics` replaces the metrics menu and its nested dialogs with a protected page using the standard shared container and page header. The Candidates toolbar links to this page; summary, campaign and catalogue recruiter links select page views through query parameters, with a return link and browser history.
- Preserve the candidate source, catalogue inclusion rules, inactive accounts, Wednesday–Tuesday grouping, weekly targets, percentages and TSV copy actions. Mobile retains the existing compact summaries; tablet and desktop use tokenized cards and the weekly table. Loading, recoverable errors, empty candidates and missing catalogue entries have visible states.

**`departure-capture-and-saved-reports`** — responsive dialogs
- Register departure and Saved reports use the existing Modal on mobile and the compact floating FormSheet from tablet upward. Capture fields and the saved-report list stay in one column in the Sheet; its body scrolls independently of the header and existing capture footer.
- After a departure reason is saved successfully, keep its capture dialog open and clear the fields for another entry; retain the success toast.
- Preserve employee/date validation, dependent departure reasons, capture persistence, saved-report data and loading/deletion actions. Report deletion confirmation remains the separate DeleteConfirmModal, bottom-centered on mobile and centered from tablet upward. On larger screens it temporarily replaces the saved-report Sheet, which reopens when confirmation closes; a stable trigger reference restores focus when the Sheet is dismissed.

**`monthly-report-comparison-page`** — saved-report comparison
- `/reports/comparison` replaces the monthly comparison dialog with a protected page using the standard shared container and page header. The heading itself links back to Daily report; no separate return action is shown. Loading uses the shared accessible LoadingSkeleton with tokenized quarterly cards and monthly rows, retaining a screen-reader loading label without visible loading text. Existing Compare triggers navigate to the page and retain their visibility rules. Reuse the saved-summary hook and cache; show loading, recoverable errors and a two-report minimum empty state.
- Preserve chronological comparison, newest-first display, weighted quarterly absence percentages, the existing 3% threshold and mobile expandable details. Quarterly cards start in one column, use two on tablet and three on desktop; monthly details use expandable cards on mobile/tablet and a wrapping table from desktop, without horizontal page scrolling. Typography, spacing, surfaces, hairlines and elevation use existing tokens.

**`attendance-insight-details`** — attendance employee lists
- The monthly attendance analysis and worst-area incident details use the existing Modal on mobile and the compact floating FormSheet from tablet upward. Keep their ranked employee lists and existing drill-down behavior unchanged.
- These dialogs may share the ranked-list presentation, but retain their distinct scopes: monthly attendance analysis with employee/month drill-down, and employees with incidents in the selected worst area.

**`data-update-photo-viewer`** — campaign photograph
- The administrative photo viewer retains Modal presentation on mobile and uses the compact floating FormSheet from tablet upward. Reuse LightboxModal; other image viewers retain their current presentation and loading indicator.
- Reserve the existing portrait 3:4 geometry and shared image-viewer height limit. The shared LoadingSkeleton covers URL retrieval and image loading, disappears only after the image load event, and provides one accessible loading announcement. Preserve original photo colors, descriptive alt text, signed-URL access, failure/retry behavior and return focus.

**`data-update-progress-page`** — campaign progress
- Keep the campaign name and year in the “Global” section header, aligned opposite its heading when space permits. The page title is rendered in the shared app header; do not retain an empty local page-header wrapper.


**`avatar-editor`** — profile picture actions
- The avatar editor lives inline in the /account profile card (see `account-workspace`); there is no avatar Modal or deletion ConfirmModal.

**`report-day-details`** — attendance day page
- Selecting an available calendar day opens the protected /reports/day/:month/:day route. The report parent stays mounted to retain the loaded report, month and filters when returning. The daily detail no longer appears beneath the calendar.
- The date and ISO week remain the single page heading. Show a compact localized date and week (for example, “Mar 6 oct · Sem 41”) while retaining the full date/week in the link's accessible name. Use the heading-sm typography role on mobile so the title can fit beside its return icon; retain heading-md from tablet upward. Keep the week as an unbroken unit if the viewport is too narrow for both parts. Its native link returns to /reports, following the comparison-page pattern. Use the existing global container and mobile-first page header. The day-page wrapper adds no top padding; the shared page header owns the space above the title. Keep touch-sized Previous day/Next day navigation beside “Resumen por área” when space permits, with no incident-count badge. Show only directional icons on mobile and retain accessible labels; display full labels from tablet upward using the body-sm typography token, staying on one line. The controls may wrap as whole items when enlarged text requires more space.
- Reuse the existing area summaries, area drill-down and incident tabs without changing daily calculations, work/rest rules, filters, data contracts or permissions. Direct entry reuses the existing report-loading service and parser; loading uses LoadingSkeleton, errors allow retry, and unavailable days retain the title return link.


`personal-kanban` reutiliza CustomSelect en formularios, Badge y PageHeading. El contenido empieza directamente en el tablero: no muestra encabezado secundario, descripciones, actualizar, búsqueda, filtro ni contador global. Conserva el título Kanban del shell y errores recuperables. La carga inicial usa LoadingSkeleton compartido con tres columnas esquemáticas, formas proporcionales y dimensiones de tokens, sin texto de carga visible ni datos simulados. Solo una región anuncia la carga; se respeta reduced motion y las cargas posteriores conservan las tarjetas existentes. Conserva Cargar más cuando aplica y anuncios de éxito accesibles sin bloque visible permanente. Cada columna tiene encabezado, contador y lista de tarjetas separados por hairline. Solo Pendiente incluye la acción Añadir y el pie de creación; el selector de estado del formulario permite crear en cualquier estado. En proceso y Completado no duplican esa acción ni reservan un pie vacío. Cuando el tablero está vacío, un único párrafo compacto comunica el estado y cómo comenzar, sin panel adicional ni mensajes repetidos por columna. Las listas vacías no reservan padding y conservan un solo divisor entre encabezado y pie; durante el arrastre muestran la indicación de destino y recuperan su área de contenido. Añadir permanece en Pendiente y abre FormSheet en tablet/PC o Modal con FormWizard en móvil (Detalles, Fecha y pasos); la edición abre FormSheet en tablet/PC o Modal en móvil, con Tipo y Estado en dos columnas iguales mediante la primitiva form-grid y una variante localizada, conservando altura y alineación de labels y controles; el descarte mantiene sus acciones en el footer fijo del sheet. En edición, el encabezado incluye una acción compacta con icono: Eliminar cambia a Confirmar y un segundo clic ejecuta el borrado existente. Al perder el foco vuelve a Eliminar; durante la petición los controles quedan deshabilitados. Los errores conservan el editor y sus cambios. No hay popover de acciones ni modal de borrado. El tablero muestra una columna en móvil, dos desde 768px y tres desde 1080px, con scroll vertical natural de página. Las columnas se alinean al inicio y conservan altura natural; abrir un editor no estira las columnas vecinas. Cards surface-card con borde hairline-strong y elevación Level 1 (shadows.xs) para separar las tarjetas interactivas de su columna; superficies de columna canvas-elevated; los encabezados heredan el fondo de su columna y se separan mediante hairline, con rounded.lg; tipografía y espaciado usan tokens compartidos. Kanban usa Inter como familia de producto mediante font-body. Títulos de tarjeta, encabezados del editor y encabezados de columna usan body-strong (14px/600); texto base, descripción, contadores, mensajes y texto de controles body-md (14px/400, con mínimo móvil existente para inputs); etiquetas y badges de tipo/estado caption-up (12px/600); metadatos de fecha body-sm (12px/400). Botones conservan el rol button existente. No existe nota legal en esta vista; si se incorpora por petición explícita, corresponde body-sm (12px/400). Los roles conservan familia, peso, line-height y tracking completos. Las tarjetas muestran tipo, fecha real de creación en la esquina superior derecha como metadato body-sm/mute (10 Oct 26), título editable y descripción, con separación interna de spacing.xxs. Título y descripción conservan separación compacta; una única área de edición y arrastre de al menos touch-target-min cubre la tarjeta sin añadir filas vacías. El arrastre utiliza @dnd-kit existente con puntero y teclado, área interactiva que cubre toda la tarjeta, sin icono de agarre y con mínimo de 44px, destinos con borde discontinuo, anuncios accesibles y cambio de estado persistido. El arrastre conserva soporte de teclado y el formulario conserva el selector de estado existente. El arrastre permite cambiar de estado y ordenar dentro de cada columna; el servidor guarda posición y versión de forma atómica. Conserva los tres estados y el acceso por propietario. Los badges reutilizan Badge con rounded.sm, hairline y el rol caption-up completo. Estados: Pendiente usa warning-text/subtle, En proceso primary/on-primary y Completado success-text/subtle, con iconos distintos. Tipos: Actividad usa accent-purple, Proceso accent-orange, Entrevista accent-teal y Por hacer magenta; estos acentos solo decoran el borde y el icono de la etiqueta, mientras el texto usa ink sobre canvas-elevated para conservar contraste en claro y oscuro. No estructuran acciones, navegación ni formularios.

- Kanban reserva espacio inferior con `--design-spacing-xxl` y `--safe-area-bottom` para separar la ultima columna del borde de la vista, conservando el scroll principal del workspace sin crear scroll interno.
- Durante el arrastre, las tarjetas vecinas se reacomodan con `--transition-spring`; la tarjeta activa sigue al puntero sin retraso de transformación y el destino se distingue con borde `{colors.primary}`. Al soltarla en otra columna, el destino permanece marcado durante el guardado y la tarjeta entra (framer-motion, opacidad y desplazamiento `--motion-float-distance` con `--transition-spring`) cuando el servidor confirma el cambio; las tarjetas también entran al cambiar de página, pero no en la carga inicial. La paginación por columna solo se muestra con más de una página y anuncia «Página n de m». El archivo usa tarjetas compactas con la misma densidad que el tablero, títulos limitados a dos líneas (el nombre completo permanece en el nombre accesible de la acción), Restaurar sin fondo ni borde al pie y salida animada con reacomodo de las vecinas. Con movimiento reducido se conservan los indicadores estáticos sin transición.
- Kanban planning: el editor añade fecha objetivo y hora opcionales en dos columnas; las horas siguen America/Mexico_City y requieren fecha. La checklist utiliza Checkbox y controles del sistema, con pasos editables y una plantilla explícita por tipo al crear, disponible solo cuando no hay pasos para evitar sobrescribir contenido. La tarjeta principal muestra la fecha objetivo en metadatos body-sm/mute y, si hay pasos, una barra nativa de progreso con conteo body-sm/mute bajo el contenido; vencimiento se expresa con texto e indicador semántico, nunca solo color. Los completados se archivan desde el editor cuando no hay cambios sin guardar. Una única acción Archivo abre el histórico y permite restaurarlos. En el tablero vacío comparte fila con el mensaje inicial, en el extremo contrario; en el histórico, Volver comparte fila con el título Archivo, en el extremo contrario. La fila usa dos columnas fluidas para que ambas acciones queden dentro del ancho disponible en móvil o con zoom. Ambas acciones se presentan sin fondo ni borde, con Inter body-strong, foco visible y un touch target de 44px; archivado conserva los datos y no equivale a borrado. Carga reutiliza skeleton, errores conservan contenido y permiten reintentar. No hay vínculo con candidatos ni vacantes.

- La creación conserva el borrador al cambiar de paso y valida detalles antes de continuar. Guardar aparece al final del wizard; Enter en el primer paso no guarda anticipadamente. Cerrar, Escape o pulsar el fondo pide confirmar si existen cambios sin guardar. Los pasos usan Checkbox y entradas elevadas con tipografía completa, controles alineados de 44px y una acción de quitar accesible; completar un paso añade tachado sin sustituir su texto.
