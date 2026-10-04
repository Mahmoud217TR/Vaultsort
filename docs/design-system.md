# Vaultsort Design System

Vaultsort is a local-first vault editor. The visual system should feel **secure, calm, technical, and lightweight** rather than heavy or enterprise-like.

The chosen direction is the **Azure** palette: blue as the trust/security color, deep navy for structure and text, and sky blue for highlights.

---

## 1. Brand Direction

### Core attributes

- Secure
- Local-first
- Clean
- Precise
- Fast
- Developer-friendly

### Visual principles

- Prefer clean surfaces over heavy gradients.
- Use blue sparingly for actions, selection, and security cues.
- Keep neutral UI surfaces dominant.
- Use subtle borders rather than shadows for structure.
- Avoid excessive rounded cards; reserve stronger rounding for controls, dialogs, and icon tiles.
- Keep sensitive-data UI visually calm and predictable.

---

## 2. Brand Palette — Azure

### Core brand colors

| Token | Hex | Usage |
|---|---:|---|
| `azure-600` | `#0284C7` | Primary brand color, main actions, selected states |
| `azure-700` | `#0369A1` | Hover/pressed states |
| `azure-900` | `#0C4A6E` | Deep brand color, dark surfaces, strong accents |
| `sky-400` | `#38BDF8` | Secondary accent, highlights, focus details |
| `sky-300` | `#7DD3FC` | Subtle accent backgrounds and dark-mode highlights |

### Neutral palette

| Token | Hex | Usage |
|---|---:|---|
| `slate-950` | `#020617` | Deepest dark background |
| `slate-900` | `#0F172A` | Main dark text / dark surfaces |
| `slate-800` | `#1E293B` | Secondary dark surfaces |
| `slate-700` | `#334155` | Strong secondary text |
| `slate-600` | `#475569` | Secondary text |
| `slate-500` | `#64748B` | Muted text |
| `slate-400` | `#94A3B8` | Placeholder / disabled text |
| `slate-300` | `#CBD5E1` | Strong light borders |
| `slate-200` | `#E2E8F0` | Default borders |
| `slate-100` | `#F1F5F9` | Subtle surfaces |
| `slate-50` | `#F8FAFC` | App background |
| `white` | `#FFFFFF` | Primary surface |

### Status colors

| Token | Hex | Usage |
|---|---:|---|
| `success` | `#10B981` | Local-only, success, healthy state |
| `warning` | `#D97706` | Plaintext vault warning, caution |
| `danger` | `#DC2626` | Destructive actions, validation errors |
| `info` | `#0284C7` | Informational state |

Do not use status colors decoratively. They should communicate state.

---

## 3. Typography

### Primary family

**Inter**

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
  "Segoe UI", sans-serif;
```

Reasons:

- Excellent readability in dense dashboard interfaces.
- Strong distinction between labels, metadata, and body text.
- Works well at small sizes.
- Neutral enough to let the Vaultsort identity come from the logo and palette.

For a fully local app, bundle the font with the application rather than loading it from Google Fonts or another CDN.

### Monospace family

Use for JSON, IDs, raw values, technical metadata, and keyboard shortcuts.

```css
font-family: "JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace;
```

If avoiding an additional bundled font, use the system monospace stack only.

### Type scale

| Role | Size | Weight | Line height |
|---|---:|---:|---:|
| Page title | `28px` | `700` | `1.2` |
| Section title | `18px` | `650` | `1.3` |
| Item title | `14px` | `600` | `1.4` |
| Body | `14px` | `400` | `1.5` |
| UI label | `12px` | `600` | `1.4` |
| Metadata | `12px` | `400` | `1.4` |
| Eyebrow / section label | `11px` | `700` | `1.3` |

Uppercase eyebrow labels may use:

```css
letter-spacing: 0.08em;
text-transform: uppercase;
```

Do not use uppercase for ordinary buttons or navigation items.

---

## 4. Light Mode

### Semantic tokens

```css
:root {
  --bg-app: #F8FAFC;
  --bg-surface: #FFFFFF;
  --bg-surface-subtle: #F1F5F9;
  --bg-selected: #E0F2FE;
  --bg-brand-soft: #F0F9FF;

  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-muted: #94A3B8;
  --text-inverse: #FFFFFF;

  --border-default: #E2E8F0;
  --border-strong: #CBD5E1;

  --brand: #0284C7;
  --brand-hover: #0369A1;
  --brand-strong: #0C4A6E;
  --accent: #38BDF8;

  --success: #10B981;
  --warning: #D97706;
  --danger: #DC2626;

  --focus-ring: rgba(56, 189, 248, 0.35);
}
```

### Recommended usage

- App canvas: `#F8FAFC`
- Main content surfaces: `#FFFFFF`
- Sidebar: `#F8FAFC` or `#FFFFFF`
- Selected nav row: `#E0F2FE`
- Selected nav icon/text: `#0284C7`
- Primary button: `#0284C7`
- Primary button hover: `#0369A1`
- Strong headings: `#0F172A`
- Secondary text: `#475569`
- Borders: `#E2E8F0`

---

## 5. Dark Mode

Dark mode should feel like a native version of Vaultsort, not an inverted light theme.

Use navy/slate surfaces with Azure accents.

### Semantic tokens

```css
.dark {
  --bg-app: #020617;
  --bg-surface: #0F172A;
  --bg-surface-subtle: #111C2F;
  --bg-selected: #0C4A6E;
  --bg-brand-soft: rgba(2, 132, 199, 0.12);

  --text-primary: #F8FAFC;
  --text-secondary: #CBD5E1;
  --text-muted: #94A3B8;
  --text-inverse: #020617;

  --border-default: #1E293B;
  --border-strong: #334155;

  --brand: #38BDF8;
  --brand-hover: #7DD3FC;
  --brand-strong: #0284C7;
  --accent: #7DD3FC;

  --success: #34D399;
  --warning: #F59E0B;
  --danger: #F87171;

  --focus-ring: rgba(56, 189, 248, 0.4);
}
```

### Recommended dark surfaces

| Surface | Color |
|---|---:|
| App background | `#020617` |
| Sidebar / panels | `#0F172A` |
| Raised/secondary surface | `#111C2F` |
| Border | `#1E293B` |
| Strong border | `#334155` |
| Primary text | `#F8FAFC` |
| Secondary text | `#CBD5E1` |
| Muted text | `#94A3B8` |

Avoid pure black (`#000000`) for large surfaces.

---

## 6. Logo Usage

The Vaultsort shield/file mark should remain usable in one color.

### Light mode

Preferred:

- Azure mark: `#0284C7`
- Navy mark: `#0C4A6E`
- Black monochrome variant when necessary

### Dark mode

Preferred:

- Sky mark: `#38BDF8`
- White monochrome variant

### App icon

Recommended treatment:

- Azure background: `#0284C7`
- White logo mark

Alternative dark variant:

- Slate background: `#0F172A`
- Sky logo mark: `#38BDF8`

The logo should never depend on gradients to remain recognizable.

---

## 7. Components

### Primary button

Light:

```css
background: #0284C7;
color: #FFFFFF;
```

Hover:

```css
background: #0369A1;
```

Dark:

```css
background: #0284C7;
color: #FFFFFF;
```

The button may use `#38BDF8` only for smaller accent actions. Do not make every action bright cyan.

### Secondary button

Light:

```css
background: #FFFFFF;
border: 1px solid #E2E8F0;
color: #334155;
```

Dark:

```css
background: #0F172A;
border: 1px solid #334155;
color: #CBD5E1;
```

### Inputs

- Height: `40–44px`
- Radius: `8px`
- Default border: semantic border token
- Focus border: brand color
- Focus ring: `0 0 0 3px var(--focus-ring)`

### Selected rows

Avoid fully saturated blue backgrounds.

Light:

```css
background: #E0F2FE;
color: #0369A1;
```

Dark:

```css
background: rgba(2, 132, 199, 0.16);
color: #7DD3FC;
```

### Sensitive values

Passwords, TOTP secrets, and masked usernames should use normal text colors rather than warning colors.

Security is the default state, not an error state.

---

## 8. Borders, Radius, and Elevation

### Radius

```text
Small controls:   6px
Inputs/buttons:   8px
Cards/dialogs:   10–12px
Icon tiles:      10–12px
Pills/badges:    9999px
```

### Borders

Prefer `1px` borders for structure.

Avoid heavy card shadows throughout the main dashboard.

### Shadows

Use only for overlays and elevated UI:

```css
box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);
```

Dark mode:

```css
box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
```

---

## 9. Accessibility

- Maintain WCAG AA contrast for ordinary text.
- Never communicate folder/category state by color alone.
- Always show a visible keyboard focus ring.
- Keep destructive actions clearly distinct from primary actions.
- Privacy Mode must not rely only on blur; sensitive data should actually be replaced/masked in the DOM where practical.
- Respect `prefers-reduced-motion`.

---

## 10. Tailwind Mapping

If using Tailwind, keep the standard Slate/Sky palette and map semantic colors through CSS variables.

Recommended core references:

```text
Primary:      sky-600   (#0284C7)
Primary dark: sky-900   (#0C4A6E)
Accent:       sky-400   (#38BDF8)
Canvas:       slate-50  (#F8FAFC)
Text:         slate-900 (#0F172A)
Borders:      slate-200 (#E2E8F0)
Dark canvas:  slate-950 (#020617)
Dark panel:   slate-900 (#0F172A)
```

Prefer semantic classes/tokens such as:

```text
bg-app
bg-surface
text-primary
text-secondary
border-default
bg-brand
text-brand
```

over scattering raw color utilities across the app.

---

## 11. Final Visual Direction

Vaultsort should primarily look like:

- white / slate surfaces
- dark navy typography
- Azure blue primary actions
- soft sky-blue selection states
- restrained green for "Local only" / safe-state indicators
- amber only for the plaintext warning
- minimal shadow
- crisp borders
- dense but readable information layout

The end result should feel related to modern security software without visually imitating Bitwarden.

## Project implementation

- This document is the canonical design guide. Read it before any UI change; `AGENTS.md` makes that requirement discoverable for future work.
- Semantic colors, typography, control dimensions, and native light/dark themes live in `src/style.css`. Do not introduce per-component hardcoded palettes or duplicate theme files.
- Shared density tokens are `--control-height` (40px), `--control-height-compact` (36px), `--item-row-height` (48px), and `--panel-padding` (20px). Workspace titles use 22px; the import-page title remains 28px. Keep metadata at 12px, tabular numerals for counts/dates, and restrained neutral type labels rather than a pill on every row.
- Dialog headers/actions remain outside the scrolling body. List controls have their own bounded scroll region so expanded filters cannot consume the entire fixed-height workspace. At narrow phone widths the same navigation sits above the list and the page scrolls; the table retains its own horizontal scroll. On compact screens, opening the editor uses the workspace width instead of squeezing the list or leaving focusable controls behind an overlay; closing restores the list and keyboard focus.
- Inter Variable 4.1 is bundled at `src/fonts/InterVariable.woff2` from the upstream [Inter v4.1 release](https://github.com/rsms/inter/tree/v4.1). Its OFL license is shipped at `public/fonts/OFL.txt`. Technical text uses system monospace; there are no runtime font downloads from external services.
- Use Slate 500 for readable muted text in light mode; reserve Slate 400 for disabled/decorative states. Accessibility takes precedence over the lighter example metadata token above.
- Normal-size white-label primary buttons use Azure 700, with Azure 900 hover, to meet WCAG AA. Azure 600 remains the main brand/icon color; using white 12–14px text on Azure 600 does not reach 4.5:1 contrast.
- OS color preference selects the initial theme when no theme has been saved. The Light/Dark selector persists only the theme preference. A small local blocking head script applies `data-theme` before styles can paint; `:root[data-theme="dark"]` selects the existing dark tokens. Primary buttons remain Azure, not bright cyan; dark text/links use the Sky tokens.
- The supplied mark is `src/branding/vaultsort-logo.svg`, imported by Vue/Vite. Do not redraw it, stretch it, apply color filters, or add an unused alternate logo.
- Favicon integration and permanent file locations are documented in `docs/favicon.md`.
- Privacy Mode replaces sensitive input values with masks rather than leaving secrets in visual-only effects. Masked values are readonly and are never written back into the vault.
- English is the default language; Arabic sets the root `lang="ar"` and `dir="rtl"`. Use logical spacing/borders/positioning and natural RTL flex/grid/table flow. Mirror arrows, chevrons, history, and exit icons, not the logo or non-directional symbols. Preserve LTR for JSON, URIs, and shortcuts, and isolate imported names with `bdi` or `dir="auto"`. Arabic uses the local system sans-serif fallback for glyphs Inter does not contain; no external fonts are fetched.
