# Maven Technosoft — Design System

All colours, font sizes and spacing come from `assets/css/tokens.css`. Load it before `style.css` and `maven-custom.css` on every page. Do not write hex colours, px font sizes or off-grid spacing in new CSS; use a token.

## Colour

### One call-to-action colour

| Token | Value | Use |
| --- | --- | --- |
| `--color-cta` | `#bd3c0a` | Every button, text link, active nav item and orange text |
| `--color-cta-hover` | `#9a3008` | Hover/focus state of the above |
| `--color-on-cta` | `#ffffff` | Text and icons on a CTA background |

Rules:

- Every button uses `--color-cta`: solid for primary actions, an outline in the same colour for secondary ones. Don't add a second button colour.
- The logo orange `--color-brand` (`#ff5821`) is for decoration only: gradients, glows, icon tiles and rules. It is only 3.15:1 on white, so never use it for text or button backgrounds on light surfaces. On `--color-surface-dark` it is 4.78:1 and may be used for text.

### Text and surfaces

| Token | Value | Contrast on white |
| --- | --- | --- |
| `--color-heading` | `#2c2522` | 15:1. Every heading, h1–h6 |
| `--color-text` | `#313030` | 13.2:1. Body copy |
| `--color-text-secondary` | `#554945` | 8.7:1 |
| `--color-text-muted` | `#635551` | 7.1:1. The lightest text allowed on light surfaces |
| `--color-surface` / `--color-surface-alt` / `--color-surface-muted` | `#fff` / `#fffaf7` / `#f4f2f2` | Light section backgrounds |
| `--color-surface-dark` / `-dark-2` | `#2c2522` / `#39312f` | Hero, topbar and dark feature tiles. Use `--color-on-dark` text |
| `--color-tint-100/200/300` | `#fff1eb` … `#ffd1bf` | Borders, chips and highlights. Never text on light surfaces |
| `--color-success` / `--color-error` | `#127a3f` / `#b3261e` | Form messages, with white text |

## Contrast: 4.5:1 minimum

- Body text needs **4.5:1** against its background (WCAG 2.2 AA 1.4.3).
- Large text (24px and up, or 18.66px bold and up) and non-text UI (icons, input borders, focus rings) need **3:1**.
- Text over a gradient or image must sit on a solid `background-color` fallback that passes on its own. The hero, industry cards and about panel all set one.
- Before release, check every page at 1440px and 390px width. All five pages and the 404 pass as of the design system rollout.

## Type

Two families only: **Poppins** (`--font-heading`) for headings, buttons and labels, and **Open Sans** (`--font-body`) for everything else. Raleway has been removed. Weights loaded: 400, 600 and 700 (Open Sans), and 400–700 (Poppins).

| Token | Size | Typical use |
| --- | --- | --- |
| `--fs-xs` | 12px | Tags, legal |
| `--fs-sm` | 14px | Nav, meta, captions |
| `--fs-base` | 16px | Body, buttons |
| `--fs-md` | 18px | Lead text, card titles |
| `--fs-lg` | 20px | h5 |
| `--fs-xl` | 24px | h4, subheads |
| `--fs-2xl` | 28px | h3; h1 on mobile |
| `--fs-3xl` | 36px | h2 section titles |
| `--fs-4xl` | 48px | h1, hero |

Line heights: `--lh-tight` 1.2 (display), `--lh-snug` 1.4 (headings), `--lh-body` 1.6 (running text). For fluid headings, clamp between two scale steps, e.g. `clamp(var(--fs-3xl), 4vw, var(--fs-4xl))`.

## Spacing: 8px grid

Margins, padding and gaps are multiples of 8px. The token number is the multiple: `--space-1` = 8px, `--space-2` = 16px, `--space-3` = 24px, `--space-4` = 32px, `--space-6` = 48px, `--space-8` = 64px (default section padding), `--space-10` = 80px.

Half steps `--space-0-5` (4px) and `--space-1-5` (12px) are only for the insides of small components, such as icon-to-label gaps and chip padding. Bootstrap spacing utilities (`mb-2` 8px, `mb-3` 16px, `mb-4` 24px, `mb-5` 48px) are already on the grid and may be used.

## Images

1. **No stock photos of people.** No stock faces anywhere: hero, cards, testimonials, team or blog. A face on the site must be a real, identifiable Maven person or client who has approved its use.
2. **People photos.** Use real leadership and team photos only, cropped square, at least 800×800, on a plain background. Clients appear only with written approval; until then, use `assets/img/testimonials/client-placeholder.svg`.
3. **Everything else is image-free brand graphics or real work.** Use the dark brand surface, brand glows, Bootstrap Icons, or real screenshots of products Maven built, with client permission. Generic "team at a laptop" and coffee-cup photos are not allowed.
4. **Technical.** Every `<img>` needs `alt` (empty `alt=""` if decorative), `width`, `height` and `loading="lazy"` below the fold. Use WebP/JPEG at 2× display size, under 200 KB.
5. **Known exceptions (to replace).** The hero (`hero-bg.jpg`), the about box (`about-img.jpg`) and the industry cards (`values-*.jpg`, `about-img.jpg`) still use template stock photos, and some show faces. They stay until real photography or approved graphics are ready. Don't add more, and don't reuse `team/team-*.jpg` or `testimonials/testimonials-*.jpg`.
