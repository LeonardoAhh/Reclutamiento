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
- **Focus** (`{colors.focus}` / `{colors.mute}` — #586371): a 2px neutral outline with no offset on light surfaces. Inverted surfaces and forced-colors mode retain their dedicated focus colors.
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
Across the canvas, quiet, card and elevated surfaces, calculated minimum contrast is 11.21:1 for headings, 6.78:1 for reading text, 5.15:1 for secondary text and focus, 4.63:1 for placeholders and 3.57:1 for control borders. Primary button text has 10.67:1 contrast. These token pairs do not cover inherited text, opacity, images or every rendered state.

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

**`app-toast`** — global notification
- The toast stack sits at the top center on mobile and tablet, and at the top right from the desktop breakpoint. It respects safe areas and the shared container gutters; multiple notifications share the same alignment within the stack.
- The surface uses `{colors.surface-dark}`, high-contrast text, the existing hairline and floating shadow, and the `wave` robot with a semantic status icon. Width is capped by the shared toast token and shrinks to fit narrow viewports.
- The title reveals progressively while its full space remains reserved to avoid layout shifts. Assistive technology receives the complete message immediately; reduced-motion preference shows the complete title without typing.

### Navigation

**`home-workspace`** — internal team start page
- The greeting uses the shared `app-page-title` style. Topic headings use `{typography.heading-md}`, lesson headings use `{typography.heading-sm}`, and reading content uses `{typography.body-md}`. Employment metadata keeps `{typography.body-sm}`.
- The selected topic is navigated with the previous/next arrow buttons beside its heading; topic tabs and the mobile topic selector are not shown. Each lesson and contextual item in the selected topic appears as a compact, content-height card on mobile and a 16:9 card from tablet width; its existing details open in a shared HoverCard on pointer hover, keyboard focus or touch. Card triggers retain visible focus and expose expanded state. Topic content, role-specific messages and document links remain available; the official document link stays directly keyboard-accessible on its card.
- Content starts in one column on mobile, two columns on tablet, and three columns from the desktop breakpoint to keep 16:9 cards compact. At the desktop breakpoint the greeting and employment details share a top-aligned row with flexible columns. Nested reading lists stay in one column inside these narrower cards.
- The greeting footer opens “Vacaciones y permisos” in the shared Modal on mobile and the shared Sheet from tablet upward, using the existing mobile breakpoint. Both containers share the same policy, form and confirmation content, actions and request state. The Sheet uses the floating variant: a shared spacing inset respecting safe areas, the workspace hairline, rounded corners and Level-1 shadow, while retaining the elevated dialog surface. It returns focus to the request trigger when closed. Its policy step keeps only “Solicita” as the footer action and retains the header close control. The form step uses the existing CustomSelect and a single inline Calendar in range mode; its borderless header arrow returns to the policy. Date guidance, the live selected range, and any short-notice note appear in a persistent speech bubble pointing to the existing validation robot; A borderless reset icon stays on the same row inside the bubble when a start date exists, with a descriptive accessible name. The desktop bubble pointer aligns with the robot rather than the logo. The bubble remains visible on mobile next to a smaller robot and announces date changes through a polite status region. Its visible range uses compact same-day, same-month and cross-month formats, while assistive technology receives the full dates; narrow widths truncate only the visible label as a fallback. The request form keeps a single column at every width, with the type selector and existing guidance followed by the calendar; the Sheet uses the shared small dialog width across all steps. The desktop type section shows the existing BrandMark SVG and validation robot as a decorative scene underneath the control, using shared size/color/motion tokens. The type selector fills its column so the control and both illustrations share a horizontal center. On desktop, its label retains the shared control-label height. The BrandMark is hidden in the mobile column layout, while the small robot and speech bubble remain visible; float animation respects reduced motion. Body spacing uses shared tokens and calendar touch targets remain unchanged. Range calendars give each day button a small horizontal gutter and separate week rows using the shared smallest spacing token. The first selected date and both completed endpoints use primary fill with on-primary text; intermediate dates keep a continuous tinted band, capped at week edges. Date cells preserve a consistent size, weight and alignment across open, single-day and completed ranges. Calendar dates use America/Mexico_City and shared tokens, with selected endpoints visible in both themes, keyboard navigation and the existing minimum touch target. Past dates are disabled, a live summary shows the selected range, and Guardar solicitud becomes available when both dates are chosen. Saving uses the idempotent Supabase RPC; confirmed persistence shows “Se validará tu solicitud” and the reminder to leave pending tasks, process status, vacancies and interviews ready for follow-up. Recruiter date ranges cannot overlap, enforced by the PostgreSQL exclusion constraint; short-notice requests retain an exception flag. The greeting shows the request action only to recruiters outside the reviewer role; administrators and active coordinators use their existing review-page link, since they coordinate their own absences directly. The protected requests page is available through “Ver solicitudes” to administrators and active coordinators. Its empty state reuses the shared empty-state styles with a static calendar icon, a short heading and one explanation on a tokenized card surface. There is no manual refresh action; loading occurs on entry and page changes, and only failed loads expose Reintentar. Administrators can delete any pending request; active coordinators can delete their own pending requests. Eliminar uses the shared ConfirmModal showing requester, type and dates; the dedicated RPC verifies active review access, administrator role or ownership, and pending status, without granting direct table deletion. Successful deletion confirms through the shared app toast and reloads the current page, returning to the last available page when needed. Pagination controls appear only when there is more than one page. Physical formats remain handled by the coordinator.
- The protected leave review page keeps its data table when its content area is wide enough for the shared compact table width. In narrower spaces it presents the same requests as flat, tokenized cards; at intermediate widths the cards form two columns. Requester and type lead, start and end dates form two readable columns, then validation status and submission time follow in quieter text. Table cells and icon actions align at the vertical center of each row while retaining full touch targets. The table reserves one action column for adjacent, borderless authorize and delete icons with descriptive accessible names. Cards group those same icons at the end. The mobile heading uses the shared subsection type scale so it fits beside the back control without clipping. Pagination, empty/loading states and permissions remain shared across layouts.
- Leave status starts as pending and can become approved only through an administrator's confirmed action on another person's request. The server records the reviewer and review time, while direct table updates remain denied. Pending and approved labels share the status column with a focusable information icon when a short-notice exception applies; the shared Tooltip reveals the explanation and updates its wording after approval. Confirmation and success feedback use the existing modal and toast. Approved requests remain in the list and continue to reserve the recruiter date range.
- Keyboard access, topic content, profile data, and role-specific messages are preserved.

**`nav-bar`** — top navigation
- Background `{colors.canvas}`, bottom hairline `{colors.hairline}`, text `{colors.body}`, type `{typography.body-md}`, and tokenized padding. It contains the product identity, navigation links, and existing account actions.

**`nav-link`** — individual nav item
- Body-grey text `{colors.body}`, type `{typography.body-md}`, fully rounded hit area `{rounded.full}`, padding `{spacing.xs} {spacing.sm}`. Transparent until interacted.

**`app-workspace`** — authenticated application shell
- On desktop, the sidebar remains fixed on `{colors.canvas}` and the workspace is one continuous canvas surface shared by header and page content.
- The workspace uses a 1px `{colors.hairline}` border, `{rounded.lg}` corners, and a Level-1 shadow. A `{spacing.sm}` inset separates it from the shared page floor. It owns vertical scrolling so the sidebar remains stationary.
- Sidebar selection uses a solid `{colors.primary}` fill with `{colors.on-primary}` text and icons, without a leading border or inset indicator. Every page link is shown directly in a single flat list, with no nested navigation; section labels remain available to assistive technology as visually-hidden headings. `{colors.link}` is reserved for links, not for filling the active navigation row.
- Sidebar links use `{typography.body-md}`, with `{typography.label-sm}` for the current section. Adjacent links have no extra gap; their 44px minimum targets set the row rhythm. `{spacing.xs}` separates the brand from navigation. Navigation and account controls use `{rounded.md}` and retain a 44px minimum target.
- The sidebar brand is an SVG symbol at the opposite end from the appearance control (the product mark, in `{colors.primary}` ink) revealed once with the system `fadeUp` motion. Its accessible name keeps the original brand spelling. Reduced-motion mode shows the static mark; forced-colors mode inherits the system text color via `currentColor`.
- Below the desktop breakpoint the sidebar becomes an overlay and the workspace returns to a continuous, unframed page surface. The mobile bar must not cover content or safe areas.

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

**`text-input`** — default form field
- Background `{colors.canvas-elevated}`, ink text `{colors.ink}`, 1px `{colors.control-border}`, type `{typography.body-md}`, rounded `{rounded.md}`, padding `{spacing.xs} {spacing.sm}`, min-height `44px`.

**`auth-workspace`** — sign-in workspace
- `/login` keeps the sign-in form in a single column on mobile and tablet. At the desktop breakpoint, a quiet `{colors.canvas-soft}` panel on the left presents a decorative Motion sequence between the brand SVG and the existing Wave robot, while the centered brand and form remain on the right. The sequence plays once and settles on Wave with its greeting visible. The brand fades out completely before Wave fades in; each fade uses half of `{duration.brand-reveal}`. Reduced-motion preference shows only the static brand.
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

**`candidate-create`** — new candidate entry
- New candidate entry retains the shared Modal and existing three-step wizard on mobile. From tablet upward it uses the compact floating Sheet with the existing form fields in a single column, a scrollable body and the same Cancel/Save footer actions. The header retains its title, icon and close control, and closing returns focus to the opener.
- Existing field validation, dependent position selectors, recruiter permissions, submission, errors and interview-pass confirmation stay unchanged. Candidate editing uses the same compact floating Sheet in one column from tablet upward and retains its existing Modal/wizard on mobile, with role-based field restrictions unchanged. Candidate deletion retains the separate DeleteConfirmModal.

**`candidate-interview-pass`** — shareable white document and preview dialog
- The exported pass always uses document-paper, document-ink and document-neutral tokens, independent of the application appearance. Brand and title establish context, the candidate name leads, the position follows, date and recruiter share one quiet panel, and location plus access requirements close the document. Text blocks flow vertically and the canvas grows for long names, positions or addresses instead of clipping or overlapping them. Only the header and final requirements use hairline dividers.
- The preview follows the application's active light or dark theme. After candidate creation and when opened from the candidate list, the interview pass uses the compact floating Sheet from tablet upward and retains the shared Modal on mobile. Only the exported document remains white. The dialog shows one short instruction, a centered responsive image and two touch-sized actions: secondary Copy and primary Share. Feedback uses app toasts, keeping the dialog geometry stable. The preview reserves its 4:5 area while loading and fits taller documents within it; it has no scale entrance animation. Short viewports scroll inside the shared modal region with contained overscroll. In the floating Sheet, only the instruction and preview body scroll; the native Copy/Share footer stays at the bottom of the available sheet height, separated by the shared hairline and with safe-area clearance. Mobile keeps its existing content-led Modal layout. The generated image has descriptive alternative text, and loading or generation errors are announced in place.

**`feature-card`** — flat hairline content card
- Background `{colors.surface-card}`, 1px hairline `{colors.hairline}`, ink text `{colors.ink}`, type `{typography.body-md}`, rounded `{rounded.lg}`, padding `{spacing.lg}`.

**`onboarding-document-review`** — credential and contract delivery
- “Entrega de credencial” and “Entrega de contratos” retain the shared Modal on mobile and use the compact floating FormSheet from tablet upward. Both reuse the same employee-selection content, counts, select/remove-all control and Cancel/Print actions. The list scrolls inside the dialog body while the header and footer remain accessible.
- Employee data, ordering, selection, print eligibility, document generation and print styles remain unchanged. The shared Sheet handles keyboard focus, closing and return to the opener.

**`activities-dialogs`** — activities, responsibilities and vacancy assignment
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
- `/candidates/metrics` replaces the metrics menu and its nested dialogs with a protected page using the standard shared container and page header. The Candidates toolbar links to this page; summary, campaign and catalogue recruiter links select page views through query parameters, with a return link and browser history.
- Preserve the candidate source, catalogue inclusion rules, inactive accounts, Wednesday–Tuesday grouping, weekly targets, percentages and TSV copy actions. Mobile retains the existing compact summaries; tablet and desktop use tokenized cards and the weekly table. Loading, recoverable errors, empty candidates and missing catalogue entries have visible states.

**`departure-capture-and-saved-reports`** — responsive dialogs
- Register departure and Saved reports use the existing Modal on mobile and the compact floating FormSheet from tablet upward. Capture fields and the saved-report list stay in one column in the Sheet; its body scrolls independently of the header and existing capture footer.
- Preserve employee/date validation, dependent departure reasons, capture persistence, saved-report data and loading/deletion actions. Report deletion confirmation remains the separate DeleteConfirmModal, bottom-centered on mobile and centered from tablet upward. On larger screens it temporarily replaces the saved-report Sheet, which reopens when confirmation closes; a stable trigger reference restores focus when the Sheet is dismissed.

**`monthly-report-comparison-page`** — saved-report comparison
- `/reports/comparison` replaces the monthly comparison dialog with a protected page using the standard shared container and page header. The heading itself links back to Daily report; no separate return action is shown. Loading uses the shared accessible LoadingSkeleton with tokenized quarterly cards and monthly rows, retaining a screen-reader loading label without visible loading text. Existing Compare triggers navigate to the page and retain their visibility rules. Reuse the saved-summary hook and cache; show loading, recoverable errors and a two-report minimum empty state.
- Preserve chronological comparison, newest-first display, weighted quarterly absence percentages, the existing 3% threshold and mobile expandable details. Quarterly cards start in one column, use two on tablet and three on desktop; monthly details use expandable cards on mobile/tablet and a wrapping table from desktop, without horizontal page scrolling. Typography, spacing, surfaces, hairlines and elevation use existing tokens.

**`data-update-photo-viewer`** — campaign photograph
- The administrative photo viewer retains Modal presentation on mobile and uses the compact floating FormSheet from tablet upward. Reuse LightboxModal; other image viewers retain their current presentation and loading indicator.
- Reserve the existing portrait 3:4 geometry and shared image-viewer height limit. The shared LoadingSkeleton covers URL retrieval and image loading, disappears only after the image load event, and provides one accessible loading announcement. Preserve original photo colors, descriptive alt text, signed-URL access, failure/retry behavior and return focus.


**`avatar-editor`** — profile picture actions
- Keep the compact shared Modal centered from tablet upward and bottom-aligned on mobile. The preview and existing image guidance precede a two-column action grid on mobile and desktop. Change picture and Delete picture share the row and exterior control height; when no saved avatar exists, Change picture spans both columns.
- Delete picture remains a text-and-icon ghost action beside the selection control, with the existing semantic destructive text color, touch target and confirmation. It is available only when a saved avatar exists.
- Show the Cancel/Save footer only after a new image is selected. The header close control remains available before selection. Preview, explicit saving, validation, errors, loading locks and deletion persistence remain unchanged.
