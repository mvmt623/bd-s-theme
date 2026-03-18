# Big Dawgs Stickers — Theme Architecture Reference

> **Purpose:** Persistent context for any AI agent or developer working on this Shopify theme.
> **Last updated:** 2026-03-18
> **Store:** big-dawgs-store-2.myshopify.com
> **Admin:** https://admin.shopify.com/store/big-dawgs-store-2/
> **GitHub:** https://github.com/mvmt623/bd-s-theme
> **Live site:** https://bigdawgsstickers.com

---

## Workflow Rules (Non-Negotiable)

1. **All changes are made locally** in the theme folder, never in Shopify admin's code editor
2. **Deploy via git:** `git add → git commit → git push origin main` — Shopify GitHub integration auto-deploys
3. **Preview before deploying:** `shopify theme dev` spins up a local preview with real store data
4. **Do NOT use `shopify theme push`** for normal workflow — it bypasses git and causes sync conflicts
5. **JSON files must be valid JSON** — Shopify's GitHub integration sometimes injects `/* */` comment headers that break parsing. Always strip these.
6. **Never Base64-encode section files** — a prior "force re-sync" commit encoded `bigdawgs-about.liquid` and `footer-group.json` as Base64, which broke both pages

---

## Products & Variant Architecture

### Product: Custom Card Stickers
- **Handle:** `custom-card-stickers`
- **URL:** `/products/custom-card-stickers`
- **Template:** `templates/product.json` → uses section `bigdawgs-product-form`
- **Form:** 5-step wizard (Holder Type → Finish → Size → Quantity → Artwork)
- **Variant strategy:** Price-based lookup — `formState.price * 100` matched against `variant.price` (Shopify stores cents)
- **Pricing:** 12 tier configurations defined in JS `quantityTiers` object (2 holder types × 3 sizes × 2 finish categories)
- **Finish categories:** `"regular"` = Matte | `"holo"` = Holographic OR Cracked Ice (shared pricing)
- **Secondary logo:** Upload UI only — NO pricing impact (removed 2026-03-18)
- **Submission:** Single form POST to `/cart/add` for ALL cases
- **Safety net:** If no variant matches the calculated price, form blocks submission and alerts customer

#### Pricing Tiers (Custom Card Stickers)
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

### Product: 3D Printed Card Stand
- **Handle:** `3d-printed-card-stand`
- **URL:** `/products/3d-printed-card-stand`
- **Template:** `templates/product.card-stand.json` → uses section `bd-card-stand`
- **Form:** 2-step (Package selection → Artwork upload)
- **Variant strategy:** Direct variant ID from Liquid `data-variant` attributes — safe, no price guessing
- **Packages:** Logo Only vs Extra Customizations (2 variants)

### Product: Flat Stickers
- **Handle:** `flat-stickers` (collection) — individual products within
- **URL:** `/collections/flat-stickers`
- **Template:** `templates/product.flat-stickers.json` → uses section `bd-flat-stickers`
- **Form:** 3-step (Size → Finish → Artwork)
- **Variant strategy:** Option-based matching (`variant.option1 === size && variant.option2 === finish`) — the most robust approach
- **Sizes:** 1"×1", 2"×2", 3"×3", 4"×4", 5"×5"
- **Finishes:** Regular/Matte, Holographic, Cracked Ice

### Product: Sample Pack
- **Handle:** `sample-pack`
- **URL:** `/products/sample-pack`
- **Template:** `templates/product.sample-pack.json` → uses section `bd-sample-pack`
- **Form:** 1-step (Finish selection only)
- **Variant strategy:** Liquid-based lookup with fallback chain — safe

---

## Correct Internal Links (Canonical URLs)

```
/products/custom-card-stickers       ← Custom Card Stickers (NOT /custom-card-sticker)
/products/3d-printed-card-stand      ← Card Stand (NOT /products/card-stand)
/products/sample-pack                ← Sample Pack
/collections/flat-stickers           ← Flat Stickers collection
/pages/about                         ← About page
/pages/faq                           ← FAQ page
/pages/contact                       ← Contact page
/pages/sticker-showcase              ← Sticker Showcase gallery
```

---

## Key Files

| File | Purpose |
|------|---------|
| `sections/bigdawgs-product-form.liquid` | Main product form — 5-step wizard with pricing tiers and variant matching |
| `sections/bd-card-stand.liquid` | Card stand form |
| `sections/bd-flat-stickers.liquid` | Flat stickers form |
| `sections/bd-sample-pack.liquid` | Sample pack form |
| `sections/bigdawgs-about.liquid` | About page — full HTML/CSS section (NOT a JSON template) |
| `sections/bigdawgs-homepage.liquid` | Homepage section |
| `sections/bigdawgs-contact.liquid` | Contact page section |
| `sections/bigdawgs-faq.liquid` | FAQ page section |
| `sections/bd-showcase-gallery.liquid` | Sticker showcase gallery |
| `sections/footer-group.json` | Footer layout — nav columns, email signup, social links |
| `sections/header-group.json` | Header/nav layout |
| `snippets/cart-products.liquid` | Cart line item rendering |
| `snippets/header-drawer.liquid` | Mobile menu drawer |

---

## Known Risks & Mitigations

### Price-Based Variant Matching (Custom Card Stickers)
- **Risk:** If two Shopify variants share the same price, the form picks the first match (may be wrong)
- **Mitigation:** Variant validation added — form blocks submission if no match found
- **Future fix:** Migrate to option-based matching like flat-stickers uses

### Theme Pricing vs Shopify Pricing
- **Risk:** The `quantityTiers` object is hardcoded in JS. If Shopify variant prices change in admin, the form shows stale prices and variant matching fails
- **Rule:** When changing prices, update BOTH Shopify admin variants AND the `quantityTiers` object in `bigdawgs-product-form.liquid`

### TESTING_MODE Flag
- **Location:** `bigdawgs-product-form.liquid` line ~895
- **Current value:** `true` — artwork upload validation is BYPASSED
- **Production:** Set to `false` before final launch to require artwork uploads

---

## Fixes Applied (2026-03-18)

1. Removed stale `.git/index.lock` file blocking git operations
2. Synced 65 commits from GitHub to local
3. Decoded Base64-encoded `bigdawgs-about.liquid` (was rendering raw encoded text)
4. Decoded Base64-encoded `footer-group.json`
5. Stripped invalid `/* */` comment headers from 12 JSON template files
6. Resolved 6 merge conflicts in `bigdawgs-product-form.liquid` (kept local version with advanced features)
7. Fixed JS syntax error: `removeBtn IdremoveBtnId` → `removeBtnId` in `setupUploadZone` function
8. Fixed broken link: `/products/custom-card-sticker` → `/products/custom-card-stickers` (showcase gallery CTA)
9. Fixed broken link: `/products/card-stand` → `/products/3d-printed-card-stand` (footer + about page)
10. Removed $2 secondary art charge — toggle/upload retained, no pricing impact
11. Removed AJAX dual-cart-add path and hardcoded variant ID `47276076957890`
12. Simplified all form submissions to single POST
13. Added variant validation safety net — blocks submission if no matching variant found
