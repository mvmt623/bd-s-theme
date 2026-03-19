# Big Dawgs Stickers — Theme Architecture Reference

> **Purpose:** Single source of truth for any AI agent or developer working on this Shopify theme. READ THIS ENTIRE FILE BEFORE making any changes.
> **Last updated:** 2026-03-18
> **Store:** big-dawgs-store-2.myshopify.com
> **Admin:** https://admin.shopify.com/store/big-dawgs-store-2/
> **GitHub:** https://github.com/mvmt623/bd-s-theme
> **Live site:** https://bigdawgsstickers.com
> **Theme ID:** 150085337282

---

## 1. Deployment Workflow (Non-Negotiable)

```bash
# THE ONLY DEPLOY COMMAND — memorize this:
git add <files> && git commit -m "description" && git pull --rebase origin main && git push origin main && shopify theme push --theme 150085337282 --force
```

### Rules
1. **All changes are made locally** in this theme folder, never in Shopify admin's code editor
2. **Preview before deploying:** `shopify theme dev` spins up local preview with real store data
3. **Always `git pull --rebase` before push** — Shopify's GitHub integration pushes sync commits that will block your push
4. **`shopify theme push --theme 150085337282 --force`** deploys immediately and skips confirmation prompts
5. **Do NOT use `shopify theme push` alone** without the `--theme` and `--force` flags (it prompts interactively)
6. **JSON files must be valid JSON** — Shopify's GitHub integration injects `/* */` comment headers that break parsing. Always strip these before deploying. Use: `python3 -c "import re,json; c=open(f).read(); open(f,'w').write(json.dumps(json.loads(re.sub(r'/\*.*?\*/','',c,flags=re.DOTALL).strip()),indent=2))"`
7. **Never Base64-encode section files** — a prior commit encoded `bigdawgs-about.liquid` and `footer-group.json` as Base64, breaking both pages
8. **Footer JSON gets comment headers re-added by Shopify on every sync** — strip before every deploy

---

## 2. Products & Variant Architecture

### Product: Custom Card Stickers
- **Handle:** `custom-card-stickers`
- **URL:** `/products/custom-card-stickers`
- **Template:** `templates/product.json` → section `bigdawgs-product-form`
- **Form:** 5-step wizard (Holder Type → Finish → Size → Quantity → Artwork)
- **Variant strategy:** Price-based lookup — `formState.price * 100` matched against `variant.price` (Shopify stores cents)
- **Safety net:** If no variant matches, form BLOCKS submission and alerts customer
- **Pricing:** 12 tier configurations in JS `quantityTiers` object (2 holder types × 3 sizes × 2 finish categories)
- **Finish categories:** `"regular"` = Matte | `"holo"` = Holographic OR Cracked Ice (shared pricing)
- **Secondary logo:** Upload UI only — NO pricing impact (removed 2026-03-18)
- **Submission:** Single form POST to `/cart/add` for ALL cases (no AJAX, no dual-cart-add)

### Product: 3D Printed Card Stand
- **Handle:** `3d-printed-card-stand`
- **URL:** `/products/3d-printed-card-stand`
- **Template:** `templates/product.card-stand.json` → section `bd-card-stand`
- **Variant strategy:** Direct variant ID from Liquid `data-variant` attributes — bulletproof

### Product: Flat Stickers
- **Handle:** `custom-flat-stickers`
- **URL:** `/products/custom-flat-stickers`
- **Template:** `templates/product.flat-stickers.json` → section `bd-flat-stickers`
- **Form:** 4-step wizard (Size → Finish → Quantity → Artwork + Cut Type)
- **Sizes:** 2×2 and 3×3 only (dimension-based, no S/M/L)
- **Fine print:** "Length of sticker is determined by the longest side"
- **Variant strategy:** Option-based matching (`option1=size, option2=finish, option3=qty`) with price-based fallback
- **Shopify options:** Size (2x2, 3x3) / Finish (Matte, Holo) / Quantity (6, 15, 24, 48, 50, 100, 250, 500)
- **Total variants:** 22 (10 for 2x2, 12 for 3x3 — Holo covers both Holographic & Cracked Ice)
- **Cut type:** Die-cut, Circle, Square — stored in `properties[Cut Type]` (required)
- **Artwork:** Primary only (required) — stored in `properties[Artwork]`

### Product: Sample Pack
- **Handle:** `sample-pack`
- **URL:** `/products/sample-pack`
- **Template:** `templates/product.sample-pack.json` → section `bd-sample-pack`
- **Form:** 2-step flow (Finish → Artwork upload → Add to Cart)
- **Variant strategy:** Liquid-based lookup with fallback chain — safe
- **Contents:** 155 stickers total — 30/25/15 One Touch (S/M/L), 40/25/20 Toploader (S/M/L), 3× 3×3 + 5× 2×2 Flat

---

## 3. Pricing Tiers (Custom Card Stickers)

**CRITICAL:** When changing prices, update BOTH Shopify admin variants AND the `quantityTiers` object in `bigdawgs-product-form.liquid`. They must match exactly.

```
Key format: "holderType|size|finishCategory"

ONE TOUCH — REGULAR (Matte):
  Small:  30→$6, 60→$10, 120→$15, 250→$27, 500→$50, 1000→$90*, 2500→$150, 5000→$250, 10000→$400
  Medium: 25→$6, 50→$10, 100→$15, 250→$30, 500→$55, 1000→$100*, 2500→$175, 5000→$300, 10000→$500
  Large:  15→$6, 35→$10, 70→$15, 100→$20, 250→$40, 500→$75, 1000→$125*, 2500→$225, 5000→$400, 10000→$700

ONE TOUCH — HOLO / CRACKED ICE:
  Small:  30→$7, 60→$13, 120→$20, 250→$35, 500→$70, 1000→$100*, 2500→$200, 5000→$350, 10000→$600
  Medium: 25→$7, 50→$13, 100→$20, 250→$40, 500→$70, 1000→$135*, 2500→$250, 5000→$450, 10000→$800
  Large:  15→$7, 35→$13, 70→$20, 100→$25, 250→$50, 500→$90, 1000→$165*, 2500→$300, 5000→$550, 10000→$1000

TOPLOADER — REGULAR (Matte):
  Small:  40→$6, 80→$10, 160→$15, 250→$22, 500→$40, 1000→$75*, 2500→$135, 5000→$220, 10000→$350
  Medium: 25→$6, 55→$10, 110→$15, 250→$25, 500→$45, 1000→$80*, 2500→$145, 5000→$235, 10000→$400
  Large:  20→$6, 45→$10, 90→$15, 250→$35, 500→$65, 1000→$120*, 2500→$200, 5000→$375, 10000→$650

TOPLOADER — HOLO / CRACKED ICE:
  Small:  40→$7, 80→$13, 160→$20, 250→$27, 500→$50, 1000→$90*, 2500→$165, 5000→$300, 10000→$500
  Medium: 25→$7, 55→$13, 110→$20, 250→$32, 500→$60, 1000→$105*, 2500→$180, 5000→$335, 10000→$600
  Large:  20→$7, 45→$13, 90→$20, 250→$45, 500→$80, 1000→$150*, 2500→$275, 5000→$475, 10000→$875

(* = "best value" tier, highlighted in UI)
```

### Flat Stickers Pricing Tiers

**CRITICAL:** When changing prices, update BOTH Shopify admin variants AND the `quantityTiers` object in `bd-flat-stickers.liquid`. They must match exactly.

```
Key format: "size|finishCategory"

2×2 — MATTE:     15→$10, 50→$20, 100→$35, 250→$80*, 500→$150
2×2 — HOLO/ICE:  15→$13, 50→$25, 100→$45, 250→$100*, 500→$175
3×3 — MATTE:     6→$5, 24→$18, 48→$32, 100→$60, 250→$135*, 500→$250
3×3 — HOLO/ICE:  6→$6, 24→$20, 48→$36, 100→$70, 250→$150*, 500→$275

(* = "best value" tier, highlighted in UI)
```

---

## 4. Canonical URLs (Correct Internal Links)

```
/products/custom-card-stickers       ← Custom Card Stickers (NOT /custom-card-sticker)
/products/3d-printed-card-stand      ← Card Stand (NOT /products/card-stand)
/products/sample-pack                ← Sample Pack
/products/custom-flat-stickers       ← Flat Stickers (NOT /collections/flat-stickers)
/pages/about                         ← About page
/pages/faq                           ← FAQ page
/pages/contact                       ← Contact page
/pages/sticker-showcase              ← Sticker Showcase gallery
```

---

## 5. Finish Naming Convention

- Customer-facing name: **Matte** (NOT "Regular")
- Internal JS/CSS key: `"regular"` (in quantityTiers keys, CSS class names like `.bd-finish-card.regular`)
- **Rule:** All customer-visible text uses "Matte". Internal logic keys stay "regular" for backward compatibility.
- Holographic and Cracked Ice share pricing (both map to `"holo"` category)

---

## 6. Finish Effect Tags (V13 — Approved Design)

All finish tags/pills/ribbons use the `bd-ftag` CSS system defined in `snippets/finish-effects.liquid`.

### Source of truth: `finish-effects-preview-v13.html`

**Implementation:**
- `snippets/finish-effects.liquid` — CSS for `.bd-ftag`, `.bd-ftag--matte`, `.bd-ftag--holo`, `.bd-ftag--ice`
- `snippets/finish-ice-svg.liquid` — SVG polygon shards for cracked ice overlay (direct color fills, NO hue-rotate filters)

**Cracked Ice palette (V13 final):**
- Purples: `#a855f7`, `#8b5cf6`, `#7c3aed`, `#c084fc`, `#d8b4fe`
- Blues: `#003da8`, `#0050cc`, `#0070ee`
- Base gradient: `#0050cc, #7c3aed, #1090ff, #a855f7, #0070ee, #c084fc, #003da8, #8b5cf6, #40b0ff`
- Crack lines: `rgba(200,180,255,.6)`
- **NO SVG filter attributes** — direct hex fills only

**Pages with finish tags (6 total):**
1. `bigdawgs-homepage.liquid` — hero pills + product card tags + finishes section headings
2. `bd-showcase-gallery.liquid` — showcase ribbons + "Know Your Finish" headings
3. `bigdawgs-product-form.liquid` — Step 2 finish option cards
4. `bigdawgs-about.liquid` — finishes section headings
5. `bd-flat-stickers.liquid` — finish selection cards
6. `bd-sample-pack.liquid` — finish selection cards

**HTML pattern for Cracked Ice tag:**
```html
<span class="bd-ftag bd-ftag--ice">
  <span class="bd-ftag-text">Cracked Ice</span>
  <svg class="bd-ftag-ice-svg" viewBox="0 0 100 28" preserveAspectRatio="none">
    {% render 'finish-ice-svg' %}
  </svg>
</span>
```

---

## 7. Key Files Reference

| File | Purpose |
|------|---------|
| `sections/bigdawgs-product-form.liquid` | Main product form — 5-step wizard with pricing tiers and variant matching |
| `sections/bd-card-stand.liquid` | Card stand form |
| `sections/bd-flat-stickers.liquid` | Flat stickers form |
| `sections/bd-sample-pack.liquid` | Sample pack form |
| `sections/bigdawgs-about.liquid` | About page — full HTML/CSS section |
| `sections/bigdawgs-homepage.liquid` | Homepage section |
| `sections/bigdawgs-contact.liquid` | Contact page section |
| `sections/bigdawgs-faq.liquid` | FAQ page section |
| `sections/bd-showcase-gallery.liquid` | Sticker showcase gallery |
| `sections/footer-group.json` | Footer layout — nav columns, email signup, social links |
| `sections/header-group.json` | Header/nav layout |
| `snippets/finish-effects.liquid` | V13 finish tag CSS (Matte/Holo/Ice) |
| `snippets/finish-ice-svg.liquid` | Cracked ice SVG shard pattern |
| `snippets/cart-products.liquid` | Cart line item rendering |
| `snippets/header-drawer.liquid` | Mobile menu drawer |

---

## 8. Known Risks & Mitigations

### Price-Based Variant Matching (Custom Card Stickers)
- **Risk:** If two Shopify variants share the same price, the form picks the first match (may be wrong)
- **Mitigation:** Variant validation blocks submission if no match found
- **Future fix:** Migrate to option-based matching like flat-stickers uses

### Theme Pricing vs Shopify Pricing
- **Risk:** `quantityTiers` is hardcoded in JS. If Shopify variant prices change in admin, the form shows stale prices
- **Rule:** Update BOTH Shopify admin AND `quantityTiers` simultaneously

### ⚠️ TESTING_MODE Flags — MUST DISABLE BEFORE LAUNCH
Three product forms have `TESTING_MODE = true` which BYPASSES artwork upload validation:

| File | Variable | Effect |
|------|----------|--------|
| `bigdawgs-product-form.liquid` | `const TESTING_MODE = true;` (~line 897) | Skips primary artwork requirement on Custom Card Stickers |
| `bd-flat-stickers.liquid` | `var TESTING_MODE = true;` (~line 370) | Skips primary artwork requirement on Flat Stickers |
| `bd-sample-pack.liquid` | N/A (no testing flag) | Artwork is always required |

**Before launch:** Search all three files for `TESTING_MODE` and flip to `false`.
**Quick command:** `grep -rn 'TESTING_MODE' sections/ | grep true`

### Shopify GitHub Integration Race Condition
- **Problem:** Shopify pushes sync commits to GitHub that conflict with local pushes
- **Solution:** Always use `git pull --rebase origin main` before `git push`
- **Long-term:** Consider disconnecting bidirectional sync; rely on `shopify theme push` for deploys

### JSON Comment Headers
- **Problem:** Shopify injects `/* */` comments into JSON files on sync
- **Solution:** Strip before deploy. `footer-group.json` is the most frequent offender.

---

## 9. Customer Experience Notes

- **Most popular size:** Medium
- **Most popular finish:** Cracked Ice
- **Default pre-selections (applied on page load across all product forms):**
  - Custom Card Stickers: Cracked Ice (finish) + Medium (size) pre-selected
  - Flat Stickers: 3×3 (size) + Cracked Ice (finish) pre-selected
  - Sample Pack: Cracked Ice visually highlighted (does not auto-advance)
  - Card Stand: N/A (no finish/size options)
- **Turnaround time (shown on site):** 5–7 business days
- **Google Drive / Dropbox link sharing:** REMOVED from all pages (direct upload only)
- **Secondary logo upload:** Available but has NO pricing impact ($2 charge removed)
- **Checkout customization:** Limited to colors/logo on current Shopify plan (not Plus)

---

## 10. CSS Architecture

### Namespace Prefixes (no conflicts)
- `bd-` — global Big Dawgs styles (homepage, about, shared)
- `bd-ftag-` — finish effect tags (V13 system)
- `bdf-` — flat stickers form
- `bdcs-` — card stand form
- `bdsp-` — sample pack form
- `bdsg-` — showcase gallery

### Animation Keyframes (all unique, no conflicts)
- `bd-ftag-holo` — holographic tag gradient flow
- `bd-ftag-shimmer` — holographic shimmer sweep
- `bd-ftag-ice` — cracked ice gradient flow
- `ice-flow` — homepage/about ice section gradient
- `holo-flow` — homepage/about holo section gradient (used in tag-holo from V13 HTML previews)
- `shimmer` — homepage/about shimmer sweep

---

## 11. Design System

### Brand Colors
- `--bd-red: #CC0000` (primary CTA)
- `--bd-red-dark: #990000` (hover state)
- `--bd-gold: #D4A017` (accents, trust badges)
- `--bd-black: #111111` (backgrounds)
- `--bd-dark: #1A1A1A` (card backgrounds)
- `--bd-gray: #333333` (borders)
- `--bd-light: #F5F5F5` (light text bg)
- `--bd-white: #FFFFFF`

### Trust Badge Style (Gold Pill)
```html
<span style="display:inline-block; background:var(--bd-gold); color:#111; font-weight:800; font-size:.82rem; padding:.3rem 1.1rem; border-radius:20px;">
  ⭐ 500+ Verified Orders · ★★★★★ Across All Orders
</span>
```

### Responsive Video Embeds
```css
.bd-finish-video { width:100%; max-width:220px; aspect-ratio:1/1; border-radius:50%; overflow:hidden; margin:0 auto; }
.bd-finish-video video { width:100%; height:100%; object-fit:cover; display:block; }
```

---

## 12. Fixes Applied (2026-03-18 Session)

1. Removed stale `.git/index.lock` file
2. Synced 65 commits from GitHub
3. Decoded Base64-encoded `bigdawgs-about.liquid`
4. Decoded Base64-encoded `footer-group.json`
5. Stripped `/* */` comment headers from 12+ JSON files
6. Resolved 6 merge conflicts in `bigdawgs-product-form.liquid`
7. Fixed JS syntax error: `removeBtn IdremoveBtnId` → `removeBtnId`
8. Fixed broken links: `/custom-card-sticker` → `/custom-card-stickers`, `/card-stand` → `/3d-printed-card-stand`
9. Removed $2 secondary art charge + AJAX dual-cart-add path + hardcoded variant ID `47276076957890`
10. Simplified all form submissions to single POST
11. Added variant validation safety net
12. Renamed all customer-facing "Regular" → "Matte" (14 instances across 4 files)
13. Removed Google Drive/Dropbox references from artwork upload copy
14. Matched about page proof badge to homepage gold pill style
15. Unified finishes section (images + video) across homepage, about, and showcase
16. Made video embeds responsive (`aspect-ratio` instead of fixed px)
17. Moved footer email signup inside "Stay in the hobby loop" group
18. Built V13 finish effect tag system and deployed to all 6 pages (24 tags total)
19. Removed old conflicting finish CSS (`ice-snap`, `holo-sweep`, `bdsg-holo-move`)
