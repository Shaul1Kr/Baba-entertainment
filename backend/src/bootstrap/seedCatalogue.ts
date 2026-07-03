import { ItemModel } from '../infrastructure/persistence/mongoose/schemas.js';
import { logger } from '../infrastructure/logging/logger.js';

/**
 * Demo flash-sale catalogue. Single source of truth shared by both the
 * `npm run seed` CLI (destructive reset) and the startup auto-seed (fill-if-empty).
 */
export const DEMO_ITEMS = [
  {
    name: 'Golden Jackpot Hoodie',
    description: 'Limited-run gold-threaded hoodie. Blink and it’s gone.',
    price: 89.99,
    imageUrl: 'https://picsum.photos/seed/hoodie/600/400',
    totalStock: 10,
  },
  {
    name: 'Neon Ace Sneakers',
    description: 'Light-up soles, casino-floor ready.',
    price: 149.0,
    imageUrl: 'https://picsum.photos/seed/sneakers/600/400',
    totalStock: 5,
  },
  {
    name: 'High Roller Watch',
    description: 'Solid-feel chronograph with an amber dial.',
    price: 299.5,
    imageUrl: 'https://picsum.photos/seed/watch/600/400',
    totalStock: 3,
  },
  {
    name: 'Lucky 7 Backpack',
    description: 'Everyday carry with a jackpot-red lining.',
    price: 59.99,
    imageUrl: 'https://picsum.photos/seed/backpack/600/400',
    totalStock: 20,
  },
  {
    name: 'Vegas Nights Sunglasses',
    description: 'Polarised, gold frames, pure swagger.',
    price: 39.99,
    imageUrl: 'https://picsum.photos/seed/sunglasses/600/400',
    totalStock: 2,
  },
  {
    name: 'Diamond Hands Mug',
    description: 'Keeps your coffee hot through any downswing.',
    price: 19.99,
    imageUrl: 'https://picsum.photos/seed/mug/600/400',
    totalStock: 50,
  },
];

/**
 * Seed the demo catalogue ONLY if the Item collection is empty (missing
 * catalogue data on a fresh app). Idempotent and safe to run on every startup —
 * once items exist it does nothing, so restarts never duplicate items.
 *
 * Scope is intentionally Item-only: CartItem/Order/User being empty is the
 * correct state for a fresh app and must NOT be seeded.
 *
 * @returns the number of items inserted (0 if the catalogue was already present)
 */
export async function seedItemsIfEmpty(): Promise<number> {
  const existing = await ItemModel.countDocuments();
  if (existing > 0) {
    logger.info(
      { component: 'seed', event: 'catalogue.present', itemCount: existing },
      'catalogue present — skipping auto-seed',
    );
    return 0;
  }
  const created = await ItemModel.insertMany(DEMO_ITEMS);
  logger.info(
    { component: 'seed', event: 'catalogue.seeded', itemCount: created.length },
    'empty catalogue — auto-seeded demo items',
  );
  return created.length;
}
