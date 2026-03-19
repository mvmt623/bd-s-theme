#!/usr/bin/env node
/**
 * Big Dawgs — Create Flat Sticker Variants
 *
 * Wipes existing variants on "Custom Flat Stickers" product
 * and creates 22 new variants with 3 options: Size / Finish / Quantity
 *
 * USAGE:
 *   1. Install the Shopify CLI: npm install -g @shopify/cli
 *   2. Get your admin API access token from:
 *      Shopify Admin → Settings → Apps and sales channels → Develop apps → Create an app
 *      → Configure Admin API scopes: write_products → Install → reveal token
 *   3. Run: SHOPIFY_ACCESS_TOKEN=shpat_xxxxx node scripts/create-flat-sticker-variants.js
 *
 *   OR use the store's existing custom app token if one exists.
 */

const STORE = 'big-dawgs-store-2.myshopify.com';
const PRODUCT_ID = 8413124919490; // Custom Flat Stickers
const API_VERSION = '2024-10';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

if (!TOKEN) {
  console.error('\n❌ Missing SHOPIFY_ACCESS_TOKEN environment variable.');
  console.error('   Run: SHOPIFY_ACCESS_TOKEN=shpat_xxxxx node scripts/create-flat-sticker-variants.js\n');
  console.error('   To get a token:');
  console.error('   1. Go to Shopify Admin → Settings → Apps and sales channels → Develop apps');
  console.error('   2. Create app → Configure Admin API scopes → enable write_products');
  console.error('   3. Install app → Admin API access token → Reveal once\n');
  process.exit(1);
}

const BASE = `https://${STORE}/admin/api/${API_VERSION}`;

// ── VARIANT DEFINITIONS ──
// Option1: Size, Option2: Finish (Matte or Holo), Option3: Quantity
// Holo covers both Holographic and Cracked Ice (same pricing)
const VARIANTS = [
  // 2x2 Matte
  { size: '2x2', finish: 'Matte', qty: '15',  price: '10.00' },
  { size: '2x2', finish: 'Matte', qty: '50',  price: '20.00' },
  { size: '2x2', finish: 'Matte', qty: '100', price: '35.00' },
  { size: '2x2', finish: 'Matte', qty: '250', price: '80.00' },
  { size: '2x2', finish: 'Matte', qty: '500', price: '150.00' },
  // 2x2 Holo (Holographic + Cracked Ice)
  { size: '2x2', finish: 'Holo', qty: '15',  price: '13.00' },
  { size: '2x2', finish: 'Holo', qty: '50',  price: '25.00' },
  { size: '2x2', finish: 'Holo', qty: '100', price: '45.00' },
  { size: '2x2', finish: 'Holo', qty: '250', price: '100.00' },
  { size: '2x2', finish: 'Holo', qty: '500', price: '175.00' },
  // 3x3 Matte
  { size: '3x3', finish: 'Matte', qty: '6',   price: '5.00' },
  { size: '3x3', finish: 'Matte', qty: '24',  price: '18.00' },
  { size: '3x3', finish: 'Matte', qty: '48',  price: '32.00' },
  { size: '3x3', finish: 'Matte', qty: '100', price: '60.00' },
  { size: '3x3', finish: 'Matte', qty: '250', price: '135.00' },
  { size: '3x3', finish: 'Matte', qty: '500', price: '250.00' },
  // 3x3 Holo (Holographic + Cracked Ice)
  { size: '3x3', finish: 'Holo', qty: '6',   price: '6.00' },
  { size: '3x3', finish: 'Holo', qty: '24',  price: '20.00' },
  { size: '3x3', finish: 'Holo', qty: '48',  price: '36.00' },
  { size: '3x3', finish: 'Holo', qty: '100', price: '70.00' },
  { size: '3x3', finish: 'Holo', qty: '250', price: '150.00' },
  { size: '3x3', finish: 'Holo', qty: '500', price: '275.00' },
];

async function shopifyFetch(path, options = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': TOKEN,
      ...options.headers
    }
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Shopify API ${res.status}: ${body.substring(0, 500)}`);
  }

  // Respect rate limits
  const remaining = res.headers.get('X-Shopify-Shop-Api-Call-Limit');
  if (remaining) {
    const [used, max] = remaining.split('/').map(Number);
    if (used > max - 5) {
      console.log('  ⏳ Rate limit approaching, waiting 2s...');
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  return res.json();
}

async function main() {
  console.log('\n🐕 Big Dawgs — Flat Sticker Variant Creator\n');

  // 1. Fetch current product
  console.log('📦 Fetching current product...');
  const { product } = await shopifyFetch(`/products/${PRODUCT_ID}.json`);
  console.log(`   Title: ${product.title}`);
  console.log(`   Existing variants: ${product.variants.length}`);
  console.log(`   Existing options: ${product.options.map(o => o.name).join(', ')}`);

  // 2. Delete all existing variants (keep one — Shopify requires at least 1)
  console.log('\n🗑️  Deleting existing variants...');
  const keepId = product.variants[0].id;
  for (let i = 1; i < product.variants.length; i++) {
    const vid = product.variants[i].id;
    await shopifyFetch(`/products/${PRODUCT_ID}/variants/${vid}.json`, { method: 'DELETE' });
    process.stdout.write(`   Deleted ${vid} (${i}/${product.variants.length - 1})\r`);
  }
  console.log(`\n   ✅ Deleted ${product.variants.length - 1} variants (kept 1 placeholder)`);

  // 3. Update product options to Size / Finish / Quantity
  console.log('\n🔧 Updating product options...');
  await shopifyFetch(`/products/${PRODUCT_ID}.json`, {
    method: 'PUT',
    body: JSON.stringify({
      product: {
        id: PRODUCT_ID,
        options: [
          { name: 'Size' },
          { name: 'Finish' },
          { name: 'Quantity' }
        ],
        variants: [{
          id: keepId,
          option1: VARIANTS[0].size,
          option2: VARIANTS[0].finish,
          option3: VARIANTS[0].qty,
          price: VARIANTS[0].price,
          inventory_management: null,
          requires_shipping: true
        }]
      }
    })
  });
  console.log('   ✅ Options set to: Size / Finish / Quantity');

  // 4. Create remaining 21 variants
  console.log('\n🏗️  Creating 22 variants...');
  console.log('   (first variant already set via product update)\n');

  let created = 1; // already have the first one
  for (let i = 1; i < VARIANTS.length; i++) {
    const v = VARIANTS[i];
    const variant = {
      option1: v.size,
      option2: v.finish,
      option3: v.qty,
      price: v.price,
      inventory_management: null,
      requires_shipping: true,
      taxable: true
    };

    try {
      await shopifyFetch(`/products/${PRODUCT_ID}/variants.json`, {
        method: 'POST',
        body: JSON.stringify({ variant })
      });
      created++;
      console.log(`   ✅ ${created}/22: ${v.size} / ${v.finish} / ${v.qty} → $${v.price}`);
    } catch (err) {
      console.error(`   ❌ Failed: ${v.size}/${v.finish}/${v.qty}: ${err.message}`);
    }

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 300));
  }

  // 5. Verify
  console.log('\n📋 Verifying...');
  const { product: final } = await shopifyFetch(`/products/${PRODUCT_ID}.json`);
  console.log(`   Total variants: ${final.variants.length}`);
  console.log(`   Options: ${final.options.map(o => `${o.name} (${o.values.join(', ')})`).join(' | ')}`);

  console.log('\n✅ Done! All flat sticker variants created.');
  console.log('   Next: deploy the theme with `shopify theme push --theme 150085337282 --force`\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
