# Design System — Graphite UI

This visual system applies to product interfaces throughout the repository.

## Overview

The light theme uses a soft graphite palette: an off-white canvas (`{colors.canvas}` — #f1f2f4), graphite ink (`{colors.ink}` — #2b3037), and restrained gray surfaces. Primary actions use graphite; blue remains reserved for links, while visible focus uses a neutral gray. Structure comes from whitespace, surface changes, and thin borders.

Typography does the heavy lifting. **Inter** is the available substitute for Cal Sans: headings use weight 600 and tight negative tracking, while body and controls use Inter with neutral tracking. App buttons and inputs use `{rounded.md}` (8px); cards use `{rounded.lg}` (12px); avatars and icon-only controls may use `{rounded.full}`.

The light and dark themes share the same hierarchy. The workspace and page floor use `{colors.canvas}`. `{colors.canvas-soft}` (#e9ecf0) groups quiet regions; `{colors.surface-card}` (#f7f8fa) holds feature content; `{colors.canvas-elevated}` (#fafbfc) is used for inputs, menus, dialogs, and product-detail surfaces. All colors belong to shared semantic tokens.

**Key Characteristics:**
- Off-white canvas with graphite primary actions, accessible blue links, and a visible neutral focus ring.
- Light-gray grouping regions and subtly brighter cards and elevated surfaces.
- Inter 600 with negative tracking approximates Cal Sans for headings; Inter remains the UI and body face.
- Buttons and inputs use an 8px radius, content cards 12px, marquee panels 16px, avatars and icon buttons full circles.
- Default depth is flat or a 1px hairline. Floating menus and dialogs use only a subtle shadow.
- Controls keep the application's 44px minimum touch target.

## Colors — Light Graphite

> The light palette follows the approved graphite direction through shared tokens. The existing typography, radii, shallow elevation and accessible touch targets apply to both appearances.

### Brand & Accent
- **Primary graphite** (`{colors.primary}` — #343b43): primary CTA fill, logo and selected navigation. Pressed actions use `{colors.primary-active}` (#262c33), paired with `{colors.on-primary}` (#f7f8fa).
- **Accessible Blue** (`{colors.link}` — #0066cc): functional links with AA contrast on light surfaces. Darker press tone `{colors.link-deep}` (#004f9f), pale wash `{colors.link-soft}` (#e6f0ff).
- **Focus** (`{colors.focus}` / `{colors.mute}`): a 2px neutral outline at 75% opacity with no offset on light surfaces, preserving at least 3:1 contrast against the light canvas and surface tokens. Inverted surfaces and forced-colors mode retain their dedicated focus colors.
- Existing violet, cyan, pink, and magenta tokens remain localized compatibility tokens.

### Surface
- **Canvas** (`{colors.canvas}` — #f1f2f4): continuous page and workspace floor.
- **Canvas Soft** (`{colors.canvas-soft}` — #e9ecf0): quiet bands and subtle grouping.
- **Card** (`{colors.surface-card}` — #f7f8fa): feature cards and secondary content panels, separated by a hairline.
- **Elevated** (`{colors.canvas-elevated}` — #fafbfc): inputs, menus, dialogs, and detail surfaces.
- **Strong** (`{colors.surface-strong}` — #dde1e6): disabled control fill and stronger neutral separation.
- **Dark** (`{colors.surface-dark}` — #23262a): scarce inverted surfaces such as tooltips and toasts.
- Official document paper and ink retain their independent print/export tokens.

### Text
- **Ink** (`{colors.ink}` — #2b3037): primary headings and high-emphasis text.
- **Body** (`{colors.body}` — #48515e): standard paragraph and navigation text.
- **Mute** (`{colors.mute}` — #586371): secondary copy, labels, and metadata.
- **Faint** (`{colors.faint}` — #606a77): lowest functional text tier, including placeholders. Disabled controls may use opacity only when their state is also programmatically exposed.

### Borders
- **Hairline** (`{colors.hairline}` — #d4d9e0): 1px border on cards and dividers.
- **Hairline Soft** (`{colors.hairline-soft}` — #e3e7ec): subtle division between light regions.
- **Hairline Strong** (`{colors.hairline-strong}` — #bbc3ce): emphasized neutral separation.
- **Control Border** (`{colors.control-border}` — #727c8a): inputs, selects, secondary buttons, checkboxes, and icon buttons.

### Semantic
- **Error** uses `{colors.error}` (#ef4444) for indicators and `{colors.error-deep}` (#b91c1c) for text and pressed controls.
- **Warning** uses `{colors.warning}` (#f59e0b) for indicators and `{colors.warning-text}` (#92400e) for text.
- **Success** uses `{colors.success}` (#10b981) for indicators and `{colors.success-text}` (#047857) for text.
- Status must never rely on color alone.

### Light Contrast
Across the canvas, quiet, card and elevated surfaces, calculated minimum contrast is 11.21:1 for headings, 6.78:1 for reading text, 5.15:1 for secondary text, 3.15:1 for the focus indicator, 4.63:1 for placeholders and 3.57:1 for control borders. Primary button text has 10.67:1 contrast. These token pairs do not cover inherited text, opacity, images or every rendered state.

### Decorative Compatibility
Legacy gradient tokens remain available for existing illustrations. Application UI uses the graphite, gray, link, and semantic tokens above.


## Dark Theme — Soft Graphite

The optional dark theme extends the same semantic tokens; it does not change typography, layout, radii, data, actions or permissions. Light mode uses Light Graphite. Dark mode uses graphite rather than pure black, and attenuated light text rather than pure white. Comfort depends on the display, ambient lighting and the reader; contrast compliance is not a guarantee against fatigue.

### Appearance Preference

- The appearance control is an unfilled Sun/Moon icon button without a border, at the right of the sidebar header opposite the brand on the left, and in the login screen. Clicking it toggles directly between Claro and Oscuro using the currently resolved theme, with no dropdown. The icon reflects the current theme; the accessible name and tooltip describe the next action. A native button supports Enter/Space, the shared minimum touch target and visible focus. Reduced-motion preferences disable the icon transition. Sistema remains the initial behavior when no valid stored preference exists; the first click chooses and persists the opposite explicit theme.
- The browser preference is stored under `reclutamiento_color_scheme`; it is independent of account data and authentication. Sistema follows operating-system changes; other selections override them. Changes synchronize across tabs.
- `public/theme.js` restores the preference on `html[data-color-scheme]` before the global stylesheet loads. `useTheme` subscribes to this single controller; portals inherit the same tokens.
- If storage is unavailable, the selected theme still applies for the current visit and the selector explains that it cannot be saved.
- The browser theme-color is read from `--color-canvas`. The existing PWA manifest remains unchanged.

### Dark Semantic Palette

| Role | CSS token | Dark value |
|---|---|---|
| Page floor | `--color-canvas` | #1b1d20 |
| Quiet/navigation region | `--color-canvas-soft` | #202328 |
| Content cards | `--color-surface-card` | #23262a |
| Controls and floating surfaces | `--color-canvas-elevated` | #2b2f34 |
| Headings | `--color-ink` | #e2e5e9 |
| Reading text | `--color-body` | #c7ccd3 |
| Secondary text | `--color-mute` | #a0a7b1 |
| Placeholders | `--color-faint` | #969eaa |
| Primary action, links, selection and focus | `--color-primary` | #cbd1d8 |
| Text on primary fill | `--color-on-primary` | #202328 |
| Functional control border | `--color-control-border` | #858e9b |
| Success indicator/text | `--color-success` | #83c9a3 |
| Warning indicator/text | `--color-warning` | #e2b76f |
| Error indicator/text | `--color-error` | #f28b82 |

Primary remains the sole structural action color in dark mode. Links retain their existing underline/interaction treatment. Semantic and existing chart/category colors remain localized and retain labels, icons or line patterns. Cards and dividers use subtle hairlines; required control boundaries use the stronger control-border token. Page layout containers and the mobile header use --workspace-surface, which aliases --color-canvas, so the workspace floor stays continuous across routes. Elevated tokens are reserved for cards, controls and floating surfaces.

### Contrast and Shared Tokens

Across page, card and elevated backgrounds, minimum contrast is 8.34:1 for reading text, 5.55:1 for secondary text, 4.98:1 for placeholders, 4.07:1 for control borders and 8.76:1 for focus against those backgrounds. The primary button text pair is 10.24:1. These calculated pairs do not replace verification of inherited text, hover, selected states, transparency or real rendered components.

- `--color-on-neutral`, `--color-on-error`, `--color-on-success` and `--color-on-warning` describe text on solid status fills; `--color-on-dark` remains text on a dark surface.
- `--color-on-dark-hover` describes the hover fill for a light action inside a dark surface.
- `--color-shadow-rgb` keeps shadow channels separate from text, avoiding light halos when ink becomes light.
- `--color-scene-light` provides theme-independent neutral illumination for the existing decorative WebGL scene; its material follows the primary token.
- The shared brand SVG inherits currentColor. Raster photographs and existing illustrations retain their original colors.
- Document paper, ink and official print/export tokens remain independent of appearance. Required native controls keep the existing touch target and focus treatment. Appearance changes add no animation.

## Typography

### Font Family
The system uses **Inter** for body, controls, and headings. Headings use Inter 600 with negative tracking as the authorized substitute for Cal Sans, which is not bundled or downloaded at runtime. **Geist Mono**, **JetBrains Mono**, or a system monospace stack is reserved for code and technical eyebrows.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 48px | 600 | 48px | -2.4px | Editorial hero headline |
| `{typography.heading-lg}` | 32px | 600 | 40px | -1.28px | Major page and section headings |
| `{typography.heading-md}` | 20px | 600 | 28px | -0.4px | Sub-section / card headings |
| `{typography.brand}` | 24px | 600 | 34px | -0.48px | Brand wordmark |
| `{typography.label-sm}` | 14px | 500 | 20px | -0.28px | Strong labels, nav emphasis |
| `{typography.mono-eyebrow}` | 12px | 500 | 16px | 0 | Uppercase monospace section eyebrows |
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
- Authenticated workspace content starts one shared spacing step below the header: `{spacing.md}` on mobile and `{spacing.lg}` from tablet upward. The shell owns this gap; pages keep only their internal spacing.
- The workspace header title uses Inter at 20px/700 through the existing heading-md size and font-bold weight tokens, retaining the body-md line height and tracking and the mute color on the canvas, including linked and dynamic page titles.
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
- The selected topic is navigated with the previous/next arrow buttons beside its heading; topic tabs and the mobile topic selector are not shown. Each lesson and contextual item in the selected topic appears as a compact, content-height card on mobile and a 16:9 card from tablet width; its existing details open in a shared HoverCard on pointer hover, keyboard focus or touch. Card triggers retain visible focus and expose expanded state. Topic content, role-specific messages and document links remain available; the official document link stays directly keyboard-accessible on its card.
- Content starts in one column on mobile, two columns on tablet, and three columns from the desktop breakpoint to keep 16:9 cards compact. Nested reading lists stay in one column inside these narrower cards.
- Sidebar quick actions use two equal columns above the footer, each a muted text label using the full body-md typography role inside its own hairline outline (--color-hairline), with a transparent background including hover. Their visible controls retain the shared 44px minimum height without an inset border. The leave control links to the review page for administrators and active coordinators; other users open “Vacaciones y permisos” in the shared Modal on mobile and the shared Sheet from tablet upward, using the existing mobile breakpoint. Both containers share the same policy, form and confirmation content, actions and request state. The Sheet uses the floating variant: a shared spacing inset respecting safe areas, the workspace hairline, rounded corners and Level-1 shadow, while retaining the elevated dialog surface. It returns focus to the request trigger when closed. Its policy step keeps only “Solicita” as the footer action and retains the header close control. The form step uses the existing CustomSelect and a single inline Calendar in range mode; its borderless header arrow returns to the policy. Date guidance, the live selected range, and any short-notice note appear in a flat persistent status field; A borderless reset icon stays on the same row inside the bubble when a start date exists, with a descriptive accessible name. The field has no pointer or decorative illustrations and announces date changes through a polite status region at every width. Its visible range uses compact same-day, same-month and cross-month formats, while assistive technology receives the full dates; narrow widths truncate only the visible label as a fallback. The request form stacks the type selector and status field on mobile and tablet; from the desktop breakpoint (1080px), they share two equal columns with the status field aligned to the selector control below its label. The centered calendar remains below both controls. The Sheet uses the shared small dialog width across all steps. On desktop, its label retains the shared control-label height. Mobile retains the bottom Modal with its shared 92dvh maximum height, scrollable body and fixed footer. Body spacing uses shared tokens; this request calendar adapts its seven columns to the available width between the 44px touch minimum and the existing 48px cell size, retaining horizontal scrolling only below the minimum calendar width. Range calendars give each day button a small horizontal gutter and separate week rows using the shared smallest spacing token. The first selected date and both completed endpoints use primary fill with on-primary text; intermediate dates keep a continuous tinted band, capped at week edges. Date cells preserve a consistent size, weight and alignment across open, single-day and completed ranges. Calendar dates use America/Mexico_City and shared tokens, with selected endpoints visible in both themes, keyboard navigation and the existing minimum touch target. Past dates are disabled, a live summary shows the selected range, and Guardar solicitud becomes available when both dates are chosen. Saving uses the idempotent Supabase RPC; confirmed persistence shows “Se validará tu solicitud” and the reminder to leave pending tasks, process status, vacancies and interviews ready for follow-up. Recruiter date ranges cannot overlap, enforced by the PostgreSQL exclusion constraint; short-notice requests retain an exception flag. The protected requests page is available through its sidebar quick action to administrators and active coordinators. Its empty state reuses the shared empty-state styles with a static calendar icon, a short heading and one explanation on a tokenized card surface. There is no manual refresh action; loading occurs on entry and page changes, and only failed loads expose Reintentar. Administrators can delete any pending request; active coordinators can delete their own pending requests. Eliminar uses the shared ConfirmModal showing requester, type and dates; the dedicated RPC verifies active review access, administrator role or ownership, and pending status, without granting direct table deletion. Successful deletion confirms through the shared app toast and reloads the current page, returning to the last available page when needed. Pagination controls appear only when there is more than one page. Physical formats remain handled by the coordinator.
- The protected leave review page keeps its data table when its content area is wide enough for the shared compact table width. In narrower spaces it presents the same requests as flat, tokenized cards; at intermediate widths the cards form two columns. Requester and type lead, start and end dates form two readable columns, then validation status and submission time follow in quieter text. Table cells and icon actions align at the vertical center of each row while retaining full touch targets. The table reserves one action column for adjacent, borderless authorize and delete icons with descriptive accessible names. Cards group those same icons at the end. The mobile heading uses the shared subsection type scale so it fits beside the back control without clipping. Pagination, empty/loading states and permissions remain shared across layouts. When results scroll, the pagination footer remains docked to the bottom of its page or panel, respecting the safe area; independent lists retain independent footers.
- Leave status starts as pending and can become approved only through an administrator's confirmed action on another person's request. The server records the reviewer and review time, while direct table updates remain denied. Pending and approved labels share the status column with a focusable information icon when a short-notice exception applies; the shared Tooltip reveals the explanation and updates its wording after approval. Confirmation and success feedback use the existing modal and toast. Approved requests remain in the list and continue to reserve the recruiter date range.
- Keyboard access, topic content, profile data, and role-specific messages are preserved.

**`nav-bar`** — top navigation
- Background `{colors.canvas}`, bottom hairline `{colors.hairline}`, text `{colors.body}`, type `{typography.body-md}`, and tokenized padding. It contains the product identity, navigation links, and existing account actions.

**`nav-link`** — individual nav item
- Body-grey text `{colors.body}`, type `{typography.body-md}`, fully rounded hit area `{rounded.full}`, padding `{spacing.xs} {spacing.sm}`. Transparent until interacted.

**`app-workspace`** — authenticated application shell
- On desktop, the sidebar remains fixed on `{colors.canvas}` and the workspace is one continuous canvas surface shared by header and page content.
- The workspace uses a 1px `{colors.hairline}` border, `{rounded.lg}` corners, and a Level-1 shadow. A `{spacing.sm}` inset separates it from the shared page floor. It owns vertical scrolling so the sidebar remains stationary.
- The shell owns the page's top gutter: `{spacing.md}` on mobile and `{spacing.lg}` from tablet upward. Authenticated pages use `PageHeading` for the global header title and do not add page-level top padding or margin; retain page-specific widths and internal section spacing.
- Back navigation embedded directly in app-page-title inherits the heading color in default, hover, focus, active and visited states and never gains an underline. Existing Link/button semantics, destinations, keyboard navigation and visible focus outlines remain unchanged.
- Sidebar selection uses a solid `{colors.primary}` fill with `{colors.on-primary}` text and icons, without a leading border or inset indicator. Every page link is shown directly in a single flat list, with no nested navigation; section labels remain available to assistive technology as visually-hidden headings. `{colors.link}` is reserved for links, not for filling the active navigation row.
- Header controls and sidebar text share the complete `{typography.body-md}` role (Inter, 14px, weight 400), including user name, active and inactive navigation, badges, quick actions and sign-out confirmation buttons. The workspace page title uses the authorized 20px/700 header typography. Active navigation retains its existing primary surface and on-primary text. Heading semantics remain unchanged. Adjacent links have no extra gap; their 44px minimum targets set the row rhythm. `{spacing.xs}` separates the brand from navigation. Navigation and workspace-header controls use `{rounded.md}` and retain a 44px minimum target.
- The sidebar brand is an unbordered transparent row with the symbol inside a rounded-md primary tile. The tile uses the shared touch minimum minus spacing.xs (36px), with its currentColor SVG at 60% in on-primary ink. Beside it, the user display name (falling back to username and using the same natural-case utility as the header) uses the complete heading-sm role (16px, weight 600), stays on one line and truncates with ellipsis. The existing configured job title (or localized Administrator/Recruiter fallback) appears below in body-sm (12px, weight 400), wrapping to at most two lines before truncation. Full name and job title remain in the DOM for assistive technology and in native title attributes for pointer inspection. This identity block is the localized exception to the otherwise uniform header/sidebar body-md typography. The symbol is revealed once with the system `fadeUp` motion. Reduced-motion mode shows the static mark; forced-colors mode inherits the system text color via `currentColor`.
- Below the desktop breakpoint the sidebar becomes an overlay and the workspace returns to a continuous, unframed page surface. The mobile bar must not cover content or safe areas.
- The sidebar keeps the workspace canvas color. A clean header inside the workspace holds the compact action search and account avatar menu at the right, without a divider; from the desktop breakpoint (1080px), its trigger shows only the avatar; mobile and tablet keep avatar plus user name. The dropdown uses the shared feature-account-menu-inline-size token, capped by the available viewport width, independently of the trigger width so labels remain readable. The existing Tooltip shows localized My account / Mi cuenta on hover and keyboard focus, and the trigger retains its descriptive accessible name. This menu shows the existing UserRound icon in place of initials when the profile photo is absent or fails to load; below the desktop breakpoint it also holds the existing menu trigger at the left. The search opens from an icon button and retains its `Alt+K` shortcut. Its native-button results open the existing candidate and employee creation flows on their respective pages; the results are keyboard accessible, and navigation uses the existing mobile Modal and desktop Sheet presentations. `Ctrl+K` remains assigned to the candidate-page search.
- On desktop, sign-out lives in the sidebar footer; its trigger uses a transparent background and hairline outline, filling with error-deep and on-error text on hover or visible keyboard focus, and opens inline Cancel/Sign out actions; the equal-width Cancel button uses the elevated surface and hairline, while Sign out uses the solid semantic danger treatment. Confirmation uses the shared sign-out operation. Below the desktop breakpoint, keep sign-out in the avatar menu and route through `/logout` as before.
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

**`button-primary`** — the graphite primary app action
- Background `{colors.primary}`, text `{colors.on-primary}`, type `{typography.button-md}` at weight 600, `{rounded.md}` (8px), min-height `44px`, padding `{spacing.xs} {spacing.sm}`.

**`button-secondary`** — the elevated secondary app action
- Background `{colors.canvas-elevated}`, text `{colors.ink}`, border `{colors.control-border}`, type `{typography.button-md}` at weight 600, `{rounded.md}`, min-height `44px`, padding `{spacing.xs} {spacing.sm}`.

**`button-primary-sm`** — the standard graphite app CTA
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
- /team uses complete Inter roles: caption-up (12px/600) for form labels and access status badges; body-md (14px/400) for job titles, linked accounts, help, checkbox labels, actions and reading/empty/error/success text; body-strong (14px/600) for member names and shared dialog titles. Member creation/editing keeps Modal on mobile and FormSheet from tablet upward; status and removal confirmations retain ConfirmModal. Dialog typography is scoped through team-dialog, editable fields keep the existing iOS text-size safeguard, and the shared workspace header remains 20px/700. Administrator guards, search, account linking, validation, save/status/archive operations, data, focus, layouts, colors and motion remain unchanged.

**`header-controls`** - search and account menu typography
- Header search and avatar controls retain their existing centered alignment, compact surfaces and 44px touch targets. Both floating menus use complete Inter body-md (14px/400) roles for actions and reading/empty/error text; search shortcut labels use caption-up (12px/600). Search input retains the existing iOS editable text-size safeguard. The shared workspace title remains 20px/700. Search filtering, keyboard shortcuts, navigation, account actions, theme/language persistence, focus, responsive layouts, colors and motion remain unchanged.

**`account-workspace`** - account page typography
- /account uses complete Inter roles: caption-up (12px/600) for field/property labels and maintenance badges; body-md (14px/400) for email, descriptions, help, preferences, activity metadata, dialog actions and empty/error/success text; body-strong (14px/600) for internal headings and user names. Avatar upload/deletion confirmation, password change, recognition preferences, maintenance and the activity panel follow these roles. Dialog action typography is scoped through account-dialog, and password fields retain the existing iOS editable text-size safeguard. The shared workspace header remains 20px/700. Authentication, role checks, avatar upload/delete, password validation, preference persistence, maintenance updates, presence subscriptions, focus behavior, data, layouts, colors and motion remain unchanged.

**`pay-scale-workspace`** - salary scale typography
- /pay-scale uses complete Inter roles: caption-up (12px/600) for table column headers, position-type labels and mobile salary labels; body-md (14px/400) for area counts, daily salaries, tabs, actions and reading/empty/error text; body-strong (14px/600) for area/position names and emphasized monthly salaries. Desktop tables and mobile cards share these roles. Search retains its existing editable iOS text-size safeguard, and the global header remains 20px/700. Salary values and precision, source files, grouping, filtering and highlights, tab keyboard navigation, data, permissions, layouts, colors and motion remain unchanged.

**`route-day-employees-workspace`** - route day employees typography
- /routes/employees uses complete Inter roles: caption-up (12px/600) for table column headers and mobile field labels; body-md (14px/400) for employee numbers, sections, reading/empty/error text and notice navigation; body-strong (14px/600) for the route name and employee row names. The existing page title and shared workspace header typography remain unchanged. Mobile cards and the desktop table retain their current layouts. Route/day lookup, employee ordering, query parameters, back navigation and initial focus, data, permissions, loading skeletons, colors and motion remain unchanged.

**`routes-workspace`** - routes page typography
- /routes uses complete Inter roles: caption-up (12px/600) for shift/property labels, daily metric labels, capacity alerts and match badges; body-md (14px/400) for route subtitles, search metadata, detail values, comparison notes, navigation and empty/error text; body-strong (14px/600) for internal headings, route/employee names, capacities, daily values and change indicators. The change tooltip uses page-scoped body-md reading text and body-strong titles. Shared search retains its existing editable iOS text-size safeguard, and the global header remains 20px/700. Route selection, search, mobile navigation and focus return, capacity/comparison calculations, employee-day links and query parameters, data, permissions, layouts, colors and motion remain unchanged.

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
- /workforce uses complete Inter roles: caption-up (12px/600) for table headers, short metric labels and status badges; body-md (14px/400) for coverage notes, search metadata, dates, tabs, counters and form actions; body-strong (14px/600) for department and position titles, employee names, internal headings and emphasized coverage values. Workforce numbers use Inter instead of the monospace utility. Employee creation, editing, promotion and position-settings dialogs retain their mobile Modal and desktop Sheet presentations. The incapacity dialog retains the shared Modal. All use these roles through scoped classes. The global header title stays 20px/700. Search, projections, permissions, persistence, data and layouts remain unchanged.

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
- Within `/activities`, vacancy creation (the “Asignar Vacante” form), activity/responsibility creation and editing use the shared Modal on mobile and the compact floating FormSheet from tablet upward. The presentation provider wraps only these forms; the vacancy creation Sheet keeps its fields in one column. Recruiter reassignment uses the compact extra-small Modal bottom-centered on mobile and centered horizontally and vertically from tablet upward, with the shared tokenized gutters and safe-area clearance. Its selector and immediate assignment behavior remain unchanged. Detail/evidence, deletion confirmation and image viewing retain their existing Modal presentation. Contents, actions and permissions remain unchanged.
- The creation/editing Sheet header centers its icon, title and close control. Body scrolling and keyboard/focus behavior use the existing shared primitives; the other dialogs keep their current presentation and behavior.

**Activity and vacancy assignment cards**
- Reuse the shared `feature-card` surface. At the desktop breakpoint, cards use a 16:9 aspect ratio; mobile and tablet retain content-led height.
- Preserve empty grid tracks so a single filtered card does not expand across the full content width.
- Clamp visible titles to two lines and descriptions to three; activity details remain available in the existing detail view.

**`feature-card-elevated`** — lifted card variant
- White background, hairline, and Level-1 shadow. Level-2 is reserved for floating menus, dialogs, and popovers.

**`code-block`** — code / terminal surface
- Background `{colors.canvas-elevated}`, ink text `{colors.ink}`, 1px hairline `{colors.hairline}`, monospace `{typography.code}`, rounded `{rounded.md}`, padding `{spacing.md}`. Syntax rendered in the ink-and-accent palette.

## Do's and Don'ts

### Do
- Keep one continuous canvas across pages; separate card and elevated surfaces with semantic tokens and hairlines.
- Reserve `{colors.link}` for links and use `{colors.focus}` for visible focus; decorative accents must stay local and optional.
- Use 8px app controls, 12px cards, and full circles only for avatars or icon-only buttons.
- Define cards and inputs with a 1px hairline (`{colors.hairline}`) before any shadow — flat is the default.
- Set display headings in Inter 600 with tight negative tracking; label technical sections with the monospace eyebrow token.
- Step the grey text ladder deliberately: `{colors.ink}` → `{colors.body}` → `{colors.mute}` → `{colors.faint}`.

### Don't
- Don't fill large surfaces with accent colors; decorative tokens must not become application chrome.
- Don't use pills for ordinary app buttons or inputs.
- Don't pile on shadows — depth is a 1px hairline plus, at most, a finely-layered low-alpha shadow stack.
- Don't set body copy in pure black (`#000000`) — headings use `{colors.ink}` and body steps to `{colors.body}`.
- Don't add decorative systems to application chrome; product surfaces follow graphite, neutral and semantic tokens.
- Don't loosen the display tracking — large Inter headings carry tight negative letter-spacing by design.

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
- Keep the compact shared Modal centered from tablet upward and bottom-aligned on mobile. The preview and existing image guidance precede a two-column action grid on mobile and desktop. Change picture and Delete picture share the row and exterior control height; when no saved avatar exists, Change picture spans both columns.
- Delete picture remains a text-and-icon ghost action beside the selection control, with the existing semantic destructive text color, touch target and confirmation. It is available only when a saved avatar exists.
- Show the Cancel/Save footer only after a new image is selected. The header close control remains available before selection. Preview, explicit saving, validation, errors, loading locks and deletion persistence remain unchanged.


**`report-day-details`** — attendance day page
- Selecting an available calendar day opens the protected /reports/day/:month/:day route. The report parent stays mounted to retain the loaded report, month and filters when returning. The daily detail no longer appears beneath the calendar.
- The date and ISO week remain the single page heading. Show a compact localized date and week (for example, “Mar 6 oct · Sem 41”) while retaining the full date/week in the link's accessible name. Use the heading-sm typography role on mobile so the title can fit beside its return icon; retain heading-md from tablet upward. Keep the week as an unbroken unit if the viewport is too narrow for both parts. Its native link returns to /reports, following the comparison-page pattern. Use the existing global container and mobile-first page header. The day-page wrapper adds no top padding; the shared page header owns the space above the title. Keep touch-sized Previous day/Next day navigation beside “Resumen por área” when space permits, with no incident-count badge. Show only directional icons on mobile and retain accessible labels; display full labels from tablet upward using the body-sm typography token, staying on one line. The controls may wrap as whole items when enlarged text requires more space.
- Reuse the existing area summaries, area drill-down and incident tabs without changing daily calculations, work/rest rules, filters, data contracts or permissions. Direct entry reuses the existing report-loading service and parser; loading uses LoadingSkeleton, errors allow retry, and unavailable days retain the title return link.
