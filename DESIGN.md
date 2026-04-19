# Şantiye Depo — Design System

> **Version:** 1.0.0 · **Generated:** 2026-04-19  
> **Stack:** React + CSS custom properties · **Competitor references:** Procore HELIX, Fieldwire by Hilti, Odoo 19

---

## Why This Document Exists

This design system exists to answer one question fast: *"What value should I use here?"*

Every decision below has a reason. If you know the reason, you can make the right call in edge cases without asking anyone.

---

## 1. Color

### Primary — Indigo `#4f46e5`

**Why indigo, not blue?**  
The three leading construction ERP tools each moved away from generic blue in 2023–2025. Procore HELIX uses a deep blue-indigo. Odoo uses purple-indigo (`#714b67` → shifting to deeper indigo in v19). Fieldwire uses a strong blue that reads as indigo at scale. Indigo reads as *authoritative and digital-native* — it's not a legacy enterprise color. It also has strong contrast performance: white text on `#4f46e5` achieves **4.54:1** (passes WCAG AA for normal text, AA+ for large text).

**Usage rules:**
- Primary actions: `.btn-primary`, active nav item, form submit
- Focus ring: `outline: 2px solid var(--primary)` with `outline-offset: 2px`
- Soft tint: `var(--primary-glow)` for backgrounds only (never for text)

### Semantic Colors

| Token | Value | Construction meaning |
|---|---|---|
| `--success` | `#16a34a` | Stock **IN** movement — material arriving |
| `--warning` | `#d97706` | **Low stock** alert, pending approval |
| `--danger`  | `#dc2626` | Stock **OUT** movement, critical stock, delete |

These map directly to the physical reality of a construction site: green = material arrives, red = material leaves or is missing. This is consistent with Fieldwire's status color conventions and Procore's alert system.

**Never use these colors for decoration.** A green element on screen means "this is an IN movement or everything is healthy." Breaking that semantic causes errors in the field.

### Neutral Scale

Uses Tailwind-compatible slate/gray values (`slate-50` → `gray-900`). Chosen because:
1. Slightly warm undertone (vs. pure gray) reduces fatigue in long sessions
2. Maps cleanly to CSS vars (`--text-main: #111827`, `--text-muted: #6b7280`)
3. Works well with the indigo primary (both have blue undertones)

### Dark Mode

Full dark mode is implemented via `[data-theme="dark"]` token overrides. **All colors must use CSS variables** — never hardcode hex in component logic. The dark surface palette is deep navy (`#0f1117`) rather than near-black (`#000`), which reduces contrast fatigue on displays. This approach is validated by Odoo 19's dark mode implementation.

---

## 2. Typography

### Font: Inter

Single typeface throughout. Inter was chosen because:
1. Designed for screen readability at small sizes — critical for 13px base
2. Variable font available (future optimization: load only used axes)
3. Exceptional number rendering — key for an app with lots of quantities, dates, and codes
4. Industry standard in modern ERP/SaaS (Procore, Fieldwire, Notion, Linear all use Inter or close equivalents)

### Base: 13px

The app uses **13px as the base font size**, not the web-standard 16px. This is intentional for an ERP data management application:
- Construction managers scan many rows quickly; a denser layout reduces scrolling
- Procore and Odoo use 13–14px as their table cell size
- **Trade-off:** Slightly harder to read for users with vision impairment. Mitigated by: high contrast ratios, Inter's x-height, antialiasing.

### Type Scale (named roles, not sizes)

```
2xs  — 9px  — Stat sub-labels, mini uppercase captions
xs   — 10px — Badges, sidebar metadata
sm   — 11px — Table column headers (uppercase + letter-spacing)
base — 13px — Body text, table cells, form inputs  ← anchor
md   — 14px — Section titles, modal titles
lg   — 15px — Sidebar brand, auth headings
xl   — 17px — Form modal panel title
2xl  — 22px — Page titles, summary headings
3xl  — 28px — KPI stat values
```

**Rule:** When you need a new text size, pick the closest named role. If nothing fits, document a new role — don't introduce an arbitrary pixel value.

### Letter Spacing for Uppercase Labels

Table headers and filter labels are uppercase with `letter-spacing: 0.04–0.08em`. This is required because capital letters optically crowd each other — spacing them out restores readability at 11px.

---

## 3. Spacing

### 4px Grid

All spacing values are multiples of 4px. The grid:

```
1 →  4px   (tight: icon gaps, small padding)
2 →  8px   (default row padding vertical, small gaps)
3 → 12px   (default row padding horizontal, form gaps)
4 → 16px   (section padding, standard gap)
5 → 20px   (page top padding)
6 → 24px   (page content horizontal padding)
8 → 32px   (large section separation)
```

**Why 4px, not 8px?** The app has components at very fine granularity (6px stat-card icon border, 9px mini badge). An 8px grid would force too many odd compromises. 4px gives enough precision while still being systematic.

**Row reference anchor:** `--row-pad-v: 8px` / `--row-pad-h: 12px`. All rows, nav items, and list items should match this rhythm. This creates the visual alignment that makes tables scannable.

---

## 4. Border Radius

```
xs  →  4px   Compact — tight badge borders, small chips
sm  →  6px   Controls — inputs, small buttons, export buttons
md  →  8px   Buttons — standard action buttons
lg  → 10px   Cards — table cards, movements cards
xl  → 14px   Modals — standard modals
2xl → 16px   Large — action cards (Giriş/Çıkış/Zimmet), form modals
full → 9999px Pills — status badges, dots
```

**Rule:** Data-dense contexts (table rows, filter bars, toolbar buttons) use smaller radius (xs–sm). Containers and overlays use larger radius (lg–2xl). Never apply `border-radius: 50%` to non-circular elements.

---

## 5. Shadow

5-level shadow scale, all using very low opacity (`0.04–0.12`). Rationale:
- Low opacity shadows work in both light and dark mode
- Dark mode overrides increase opacity slightly (`0.25–0.5`) for same perceived depth
- **No colored shadows** — colored shadows (glow effects) are an AI-slop pattern; they distract in data-dense UIs

Usage guide:
```
xs  — Toolbar buttons, mini stat buttons (3D press effect)
sm  — Input focus outline alternative, subtle card lift
md  — Default card state
lg  — Card hover state
xl  — Dropdown menus, floating pickers
2xl — Modals, full-screen overlays
```

---

## 6. Breakpoints

```
mobile → 400px  — Very small phones; font-size bumped to 16px for touch
sm     → 600px  — Mobile; sidebar hidden, single-column, tables scroll
tablet → 768px  — Tablet; sidebar 180px, 2-col stats, action grid 2-col  ← NEW
lg     → 1024px — Desktop; full layout
xl     → 1280px — Wide desktop
```

**Key decisions:**
- The **tablet breakpoint (768px) was missing** from the original codebase and was added. Without it, tablet users saw a squished desktop layout with 208px sidebar eating 20% of the screen.
- Mobile (600px) is the hard break — sidebar disappears entirely and is replaced by a hamburger menu.

---

## 7. Animation

**Principle:** Animate only state changes that users need to track. Every animation should answer "where did that thing go?" or "what just happened?"

| Context | Duration | Easing |
|---|---|---|
| Nav/button hover | 120ms | ease |
| Modal entrance | 180ms | ease |
| Card hover lift | 200ms | ease |
| Theme switch | 250ms | ease |
| Success card | 450ms | cubic-bezier bounce |
| Loading spinner | 750ms | linear (infinite) |

**Never animate:** layout shifts, table sorting, data updates. These should be instant — animation on data changes confuses users ("is this the new data or still loading?").

---

## 8. Components

### Buttons — 2 Base Variants

| Variant | Class | Use |
|---|---|---|
| Primary | `.btn-primary` | Confirmations, form submit, primary CTA |
| Ghost | `.btn-ghost` | Secondary actions, cancel, navigation |

**Size modifiers** (CSS overrides for form contexts):
- Standard: `padding: 7px 14px`
- Form modal (`.fm-btn-submit`): `padding: 11px`, `border-radius: 10px`
- Full-width form (`.fm-sp-save-btn`): `width: 100%`, `padding: 12px`

Action cards (Giriş/Çıkış/Zimmet) are a third distinct component — not a button variant. They have gradients and lift animations appropriate for their prominence. The gradient is acceptable here because these are the 3 highest-frequency actions in the app.

### Badges

Use semantic color variants: `badge-success`, `badge-warning`, `badge-danger`, `badge-primary`, `badge-neutral`. Never use raw colors for badges — the semantic color carries meaning.

### Tables

All tables use `table-layout: fixed` with named column classes (`col-tarih`, `col-miktar`, etc). This prevents browser-computed layout chaos with Turkish text (long words don't break naturally). Column widths are defined once and used consistently across all pages with the same data type.

### Modals

Two modal sizes:
- Standard: `max-width: 460px` — confirmations, simple forms
- Wide: `max-width: 560px` — forms with more fields
- Form modal (`.fm-modal`): `width: 820px` — full data entry with left panel
- Split panel (`.fm-modal.sp`): `width: 980px` — data entry with live preview

---

## 9. Accessibility

Current state: **score 3/10** (audit finding). Target: **7/10**.

Priority fixes:
1. **Focus rings** — Added `button:focus-visible { outline: 2px solid var(--primary) }` ✅
2. **Color contrast** — `#4f46e5` on white = 4.54:1 (AA) ✅
3. **Rogue color removed** — `#4A90D9` (3.1:1 ratio, FAILS AA) replaced with `var(--primary)` ✅

Still needed:
- `aria-label` on icon-only buttons (there are many in the toolbar)
- `role="status"` on toast/success overlay
- Touch target minimum 44px for mobile buttons

---

## 10. Competitor Insights Applied

| Insight | Source | Applied |
|---|---|---|
| Indigo/purple primary for modern ERP identity | Procore HELIX, Odoo 19 | ✅ Kept `#4f46e5` |
| Color-coded semantic status system | Odoo 19 inventory | ✅ Green=IN, Red=OUT, Amber=Warning |
| Full dark mode as first-class feature | Odoo 19 | ✅ Complete CSS var overrides |
| Mobile-first responsive with field use in mind | Fieldwire | ✅ Tablet + mobile breakpoints |
| Consistent visual language across all modules | Procore HELIX | ✅ Unified button base, shared token system |
| Dense ERP layout (13-14px base) | Procore, Odoo | ✅ 13px base kept intentionally |

---

## Files

```
design-tokens.json    ← Machine-readable W3C-format token definitions
DESIGN.md             ← This file — rationale and guidelines
design-preview.html   ← Interactive browser preview (open directly, no server needed)
src/index.css         ← CSS custom properties implementation
```
