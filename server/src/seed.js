import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { Product } from './models/Product.js';
import { User } from './models/User.js';
import { FREEBIE_SLUG } from './utils/discounts.js';

const APPAREL = ['XS', 'S', 'M', 'L', 'XL'];

export const SEED_PRODUCTS = [
  {
    name: 'Blocks Dye Oversized Tee',
    slug: 'blocks-dye-oversized-tee',
    description:
      'Heavyweight 240 GSM combed cotton in a hand-dyed geometric block pattern of onyx, slate and muted gold. Dropped shoulders, boxy fit, and a ribbed collar that keeps its shape wash after wash. Every piece is dyed in small batches in Manila, so no two are exactly alike.',
    price: 899,
    compareAtPrice: 1099,
    category: 'Tees',
    collectionName: 'Dye Lab',
    sizes: APPAREL,
    stock: 48,
    imageUrl: '/products/p-blocks-dye.jpg',
    isFeatured: true,
  },
  {
    name: 'Blumi Dye Oversized Tee',
    slug: 'blumi-dye-oversized-tee',
    description:
      'A blooming spiral of indigo, violet and pale lilac on 240 GSM cotton. Relaxed oversized cut with a soft enzyme wash for a lived-in hand-feel from day one. Small-batch dyed — expect beautiful variation.',
    price: 899,
    category: 'Tees',
    collectionName: 'Dye Lab',
    sizes: APPAREL,
    stock: 36,
    imageUrl: '/products/p-blumi-dye.jpg',
    isFeatured: true,
  },
  {
    name: 'Sunkissed Dye Oversized Tee',
    slug: 'sunkissed-dye-oversized-tee',
    description:
      'Golden-hour gradient from amber to cream, inspired by Manila Bay sunsets. 240 GSM combed cotton, boxy oversized silhouette, pre-shrunk and color-locked so the glow stays.',
    price: 949,
    compareAtPrice: 1149,
    category: 'Tees',
    collectionName: 'Dye Lab',
    sizes: APPAREL,
    stock: 30,
    imageUrl: '/products/p-sunkissed-dye.jpg',
    isFeatured: true,
  },
  {
    name: 'Midnight Hex Heavyweight Hoodie',
    slug: 'midnight-hex-heavyweight-hoodie',
    description:
      'Our signature 420 GSM brushed fleece hoodie with a tonal embossed honeycomb across the chest, double-lined hood and 24k-gold-tone aglets. Built for air-conditioned malls and rainy-season nights.',
    price: 2199,
    category: 'Hoodies',
    collectionName: 'Hex Core',
    sizes: APPAREL,
    stock: 22,
    imageUrl: '/products/p-midnight-hex.jpg',
    isFeatured: true,
  },
  {
    name: 'Aurum Utility Cargo Shorts',
    slug: 'aurum-utility-cargo-shorts',
    description:
      'Water-resistant ripstop nylon cargos with gold-tone hardware, six zip pockets and an adjustable cobra-buckle belt. Quick-dry, 7-inch inseam, ready for commute or convention.',
    price: 1499,
    compareAtPrice: 1799,
    category: 'Bottoms',
    collectionName: 'Hex Core',
    sizes: APPAREL,
    stock: 26,
    imageUrl: '/products/p-aurum-cargo.jpg',
  },
  {
    name: 'Gold Crest Structured Cap',
    slug: 'gold-crest-structured-cap',
    description:
      'Six-panel structured cap in matte black twill with a raised gold hexagon emblem and a brushed-metal strap buckle. One size fits most.',
    price: 699,
    category: 'Accessories',
    collectionName: 'Hex Core',
    sizes: ['One Size'],
    stock: 40,
    imageUrl: '/products/p-crest-cap.jpg',
  },
  {
    name: 'Hexgrid Canvas Tote',
    slug: 'hexgrid-canvas-tote',
    description:
      '16 oz heavy canvas tote printed with our gold honeycomb grid. Reinforced riveted handles, inner zip pocket and a laptop-friendly 15-inch body.',
    price: 549,
    category: 'Accessories',
    collectionName: 'Hex Core',
    sizes: ['One Size'],
    stock: 34,
    imageUrl: '/products/p-hex-tote.jpg',
  },
  {
    name: 'Puzzled Keychain — Collector Edition',
    slug: 'puzzled-keychain-collector-edition',
    description:
      'Zinc-alloy interlocking puzzle keychain with polished gold and gunmetal plating. Numbered collector packaging. The same piece is gifted free on qualifying Stacked Payday orders.',
    price: 299,
    category: 'Collectibles',
    collectionName: 'Collectibles',
    sizes: ['One Size'],
    stock: 60,
    imageUrl: '/products/p-puzzled-keychain.jpg',
  },
];

export const FREEBIE_PRODUCT = {
  name: 'Puzzled Keychain (Free Gift)',
  slug: FREEBIE_SLUG,
  description: 'Complimentary Puzzled Keychain automatically included with Stacked Payday Tier 3 and Tier 4 orders.',
  price: 0,
  category: 'Collectibles',
  collectionName: 'Freebies',
  sizes: ['One Size'],
  stock: 150,
  imageUrl: '/products/p-puzzled-keychain.jpg',
  isFreebie: true,
  isActive: true,
};

export async function ensureSeedData() {
  if ((await Product.countDocuments({ isFreebie: { $ne: true } })) === 0) {
    await Product.insertMany(SEED_PRODUCTS);
    console.log(`[seed] Inserted ${SEED_PRODUCTS.length} catalog products`);
  }
  if (!(await Product.exists({ slug: FREEBIE_SLUG }))) {
    await Product.create(FREEBIE_PRODUCT);
    console.log('[seed] Inserted freebie product (Puzzled Keychain)');
  }
  await ensureOwnerAccount();
}

export async function ensureOwnerAccount() {
  if (!env.OWNER_EMAIL || !env.OWNER_PASSWORD) {
    console.warn('[seed] OWNER_EMAIL / OWNER_PASSWORD not configured — admin dashboard is inaccessible until set.');
    return;
  }
  await User.updateMany({ role: 'admin', email: { $ne: env.OWNER_EMAIL } }, { $set: { role: 'customer' } });
  const owner = await User.findOne({ email: env.OWNER_EMAIL }).select('+password');
  if (!owner) {
    await User.create({ username: env.OWNER_USERNAME, email: env.OWNER_EMAIL, password: env.OWNER_PASSWORD, role: 'admin' });
    console.log(`[seed] Owner account created for ${env.OWNER_EMAIL}`);
    return;
  }
  let changed = false;
  if (owner.role !== 'admin') {
    owner.role = 'admin';
    changed = true;
  }
  if (!(await owner.comparePassword(env.OWNER_PASSWORD))) {
    owner.password = env.OWNER_PASSWORD;
    changed = true;
  }
  if (changed) {
    await owner.save();
    console.log('[seed] Owner account synchronized with environment configuration');
  }
}

const isDirectRun = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isDirectRun) {
  connectDatabase()
    .then(ensureSeedData)
    .then(() => console.log('[seed] Done'))
    .catch((err) => {
      console.error('[seed] Failed:', err);
      process.exitCode = 1;
    })
    .finally(disconnectDatabase);
}
