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
  {
    name: 'Royal Flush Cap',
    description: 'Snapback with an embroidered gold crown.',
    price: 29.99,
    imageUrl: 'https://picsum.photos/seed/cap/600/400',
    totalStock: 30,
  },
  {
    name: 'All-In Leather Wallet',
    description: 'Slim bifold that fits your whole bankroll.',
    price: 79.99,
    imageUrl: 'https://picsum.photos/seed/wallet/600/400',
    totalStock: 12,
  },
  {
    name: 'Midnight Chips Set',
    description: 'Casino-weight clay chips in a locking case.',
    price: 129.0,
    imageUrl: 'https://picsum.photos/seed/chips/600/400',
    totalStock: 4,
  },
  {
    name: 'Ace of Spades Tee',
    description: 'Heavyweight cotton, gold foil print.',
    price: 34.99,
    imageUrl: 'https://picsum.photos/seed/tee/600/400',
    totalStock: 40,
  },
  {
    name: 'Blackjack Bomber Jacket',
    description: 'Satin bomber with a jackpot-gold lining.',
    price: 189.99,
    imageUrl: 'https://picsum.photos/seed/bomber/600/400',
    totalStock: 6,
  },
  {
    name: 'Jackpot Bluetooth Speaker',
    description: 'Pocket speaker that goes surprisingly loud.',
    price: 64.99,
    imageUrl: 'https://picsum.photos/seed/speaker/600/400',
    totalStock: 15,
  },
  {
    name: 'High Stakes Power Bank',
    description: '20,000 mAh — never fold on a dead battery.',
    price: 44.99,
    imageUrl: 'https://picsum.photos/seed/powerbank/600/400',
    totalStock: 25,
  },
  {
    name: 'Velvet Rope Belt',
    description: 'Full-grain leather with a brushed-gold buckle.',
    price: 54.99,
    imageUrl: 'https://picsum.photos/seed/belt/600/400',
    totalStock: 3,
  },
  {
    name: 'Double Down Earbuds',
    description: 'Noise-cancelling, 30-hour case.',
    price: 99.99,
    imageUrl: 'https://picsum.photos/seed/earbuds/600/400',
    totalStock: 10,
  },
  {
    name: 'Lucky Strike Lighter',
    description: 'Windproof brushed-brass flip lighter.',
    price: 24.99,
    imageUrl: 'https://picsum.photos/seed/lighter/600/400',
    totalStock: 35,
  },
  {
    name: 'Penthouse Silk Robe',
    description: 'Floor-length robe for winners only.',
    price: 119.0,
    imageUrl: 'https://picsum.photos/seed/robe/600/400',
    totalStock: 2,
  },
  {
    name: 'Card Shark Cufflinks',
    description: 'Enamel suit-icon cufflinks, gift boxed.',
    price: 49.99,
    imageUrl: 'https://picsum.photos/seed/cufflinks/600/400',
    totalStock: 20,
  },
  {
    name: 'Neon Dice Keychain',
    description: 'Glow-in-the-dark resin dice.',
    price: 12.99,
    imageUrl: 'https://picsum.photos/seed/dice/600/400',
    totalStock: 60,
  },
  {
    name: 'VIP Lounge Slippers',
    description: 'Memory-foam slides with a gold trim.',
    price: 27.99,
    imageUrl: 'https://picsum.photos/seed/slippers/600/400',
    totalStock: 28,
  },
  {
    name: 'Big Blind Duffel',
    description: 'Weekend duffel with a shoe compartment.',
    price: 89.0,
    imageUrl: 'https://picsum.photos/seed/duffel/600/400',
    totalStock: 14,
  },
  {
    name: 'Golden Ticket Notebook',
    description: 'Gilded-edge hardcover, dotted pages.',
    price: 18.99,
    imageUrl: 'https://picsum.photos/seed/notebook/600/400',
    totalStock: 45,
  },
  {
    name: 'Roulette Wall Clock',
    description: 'Spinning-wheel face, silent sweep.',
    price: 59.99,
    imageUrl: 'https://picsum.photos/seed/clock/600/400',
    totalStock: 9,
  },
  {
    name: 'Cash Money Socks (3-Pack)',
    description: 'Combed cotton, dollar-sign pattern.',
    price: 16.99,
    imageUrl: 'https://picsum.photos/seed/socks/600/400',
    totalStock: 55,
  },
  {
    name: 'Whiskey & Cards Gift Set',
    description: 'Two tumblers and a premium deck.',
    price: 74.99,
    imageUrl: 'https://picsum.photos/seed/whiskey/600/400',
    totalStock: 4,
  },
  {
    name: 'Grand Prize Beanie',
    description: 'Chunky-knit beanie with a gold pom.',
    price: 22.99,
    imageUrl: 'https://picsum.photos/seed/beanie/600/400',
    totalStock: 33,
  },
  {
    name: 'Full House Hoodie',
    description: 'Oversized fleece with a suit-print interior.',
    price: 84.99,
    imageUrl: 'https://picsum.photos/seed/fullhouse/600/400',
    totalStock: 16,
  },
  {
    name: 'Snake Eyes Ring',
    description: 'Stainless signet ring, two-dice motif.',
    price: 39.99,
    imageUrl: 'https://picsum.photos/seed/ring/600/400',
    totalStock: 5,
  },
  {
    name: 'Comp Suite Umbrella',
    description: 'Auto-open windproof umbrella, gold canopy.',
    price: 32.99,
    imageUrl: 'https://picsum.photos/seed/umbrella/600/400',
    totalStock: 22,
  },
  {
    name: 'Marker Money Clip',
    description: 'Machined titanium, holds a fat stack.',
    price: 46.0,
    imageUrl: 'https://picsum.photos/seed/moneyclip/600/400',
    totalStock: 3,
  },
  {
    name: 'Dealer Button Coaster Set',
    description: 'Four felt-backed coasters, casino green.',
    price: 21.99,
    imageUrl: 'https://picsum.photos/seed/coaster/600/400',
    totalStock: 48,
  },
  {
    name: 'Nightshift Croupier Vest',
    description: 'Tailored vest with satin lapels.',
    price: 109.0,
    imageUrl: 'https://picsum.photos/seed/vest/600/400',
    totalStock: 7,
  },
  {
    name: 'Hot Streak Beach Towel',
    description: 'Quick-dry towel with a flaming-seven print.',
    price: 28.99,
    imageUrl: 'https://picsum.photos/seed/towel/600/400',
    totalStock: 26,
  },
  {
    name: 'Bankroll Travel Case',
    description: 'Hard-shell carry-on with a combo lock.',
    price: 159.0,
    imageUrl: 'https://picsum.photos/seed/luggage/600/400',
    totalStock: 5,
  },
  {
    name: 'Pit Boss Pen',
    description: 'Weighted metal rollerball, gift tube.',
    price: 26.99,
    imageUrl: 'https://picsum.photos/seed/pen/600/400',
    totalStock: 38,
  },
  {
    name: 'Loaded Dice Cufflink Box',
    description: 'Velvet-lined valet tray for your wins.',
    price: 42.5,
    imageUrl: 'https://picsum.photos/seed/valet/600/400',
    totalStock: 11,
  },
  {
    name: 'Showgirl Feather Scarf',
    description: 'Statement scarf with a metallic thread.',
    price: 37.99,
    imageUrl: 'https://picsum.photos/seed/scarf/600/400',
    totalStock: 2,
  },
  {
    name: 'Last Call Flask',
    description: 'Brushed 8oz flask with a funnel.',
    price: 23.99,
    imageUrl: 'https://picsum.photos/seed/flask/600/400',
    totalStock: 31,
  },
  {
    name: 'Jackpot Bell Desk Toy',
    description: 'Chrome call bell that dings on a win.',
    price: 15.99,
    imageUrl: 'https://picsum.photos/seed/bell/600/400',
    totalStock: 42,
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
