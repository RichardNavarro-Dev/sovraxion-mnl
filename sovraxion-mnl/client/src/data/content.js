export const FAQS = [
  {
    group: 'Payments',
    items: [
      {
        q: 'How do I pay with GCash or Maya?',
        a: 'At checkout choose GCash or Maya, then send the exact total to SOVRAXION MNL · 09636688618. Enter the sender name, sender mobile number and the reference number from your receipt, attach a screenshot, and place your order.',
      },
      {
        q: 'How long does payment verification take?',
        a: 'The owner checks every reference number against the 09636688618 transaction history. Orders placed between 9 AM and 9 PM (Manila time) are usually verified within a few hours; the status in My Orders changes from “Pending Payment Verification” to “Processing”.',
      },
      {
        q: 'What if my payment is rejected?',
        a: 'If the reference number cannot be matched, the order is cancelled, the stock is automatically returned, and the reason is shown in My Orders. Message us with your receipt and we will sort it out.',
      },
      {
        q: 'Can I reuse a reference number?',
        a: 'No. Every GCash/Maya reference number can only be attached to one order — the system blocks duplicates automatically.',
      },
    ],
  },
  {
    group: 'Stacked Payday',
    items: [
      {
        q: 'How do the tiered discounts work?',
        a: 'Discounts apply automatically based on your bag subtotal: 8% off ₱750+, 10% off ₱1,500+, 12% off + free Puzzled Keychain at ₱2,500+, and 15% off + free Puzzled Keychain at ₱4,000+. Only the highest tier you reach is applied.',
      },
      {
        q: 'Do I need a promo code?',
        a: 'No codes. The bag recalculates your discount and freebie in real time and the server re-checks it when you place the order.',
      },
      {
        q: 'What if the Puzzled Keychain runs out?',
        a: 'Freebies are reserved from inventory when your order is submitted. If they ever run out, your order notes it and we will reach out with an alternative gift.',
      },
    ],
  },
  {
    group: 'Shipping & sizing',
    items: [
      {
        q: 'Where do you ship?',
        a: 'Nationwide across the Philippines from Parañaque City. Metro Manila orders typically arrive in 1–3 days after processing; provincial orders in 3–7 days. Courier fees are paid on delivery.',
      },
      {
        q: 'How do your tees fit?',
        a: 'Our Dye Lab tees are boxy and oversized. If you prefer a regular fit, size down one. Hoodies are relaxed but true to size.',
      },
      {
        q: 'Can I exchange a size?',
        a: 'Unworn items with tags can be exchanged within 7 days of delivery, subject to stock. Hand-dyed variations are not considered defects.',
      },
    ],
  },
];

export const ARTICLES = [
  {
    slug: 'inside-the-dye-lab',
    title: 'Inside the Dye Lab: How Every Tee Becomes One of One',
    excerpt: 'From folded blanks to color-locked finishes — a walk through the small-batch process behind Blocks, Blumi and Sunkissed.',
    image: './products/p-blocks-dye.jpg',
    date: '2026-09-12',
    readTime: '5 min read',
    body: [
      'Every Dye Lab piece starts as a 240 GSM combed cotton blank, pre-washed so it will not shrink after it leaves our hands. We fold, bind and saturate each shirt by hand, which is exactly why no two pieces ever look the same.',
      'Blocks Dye uses a geometric clamp technique: wooden blocks press the fabric so that the dye pools around clean edges. Blumi Dye is a spiral bloom — the shirt is twisted from the center and dyed in three passes of indigo, violet and lilac. Sunkissed Dye is a gradient dip that moves from amber to cream, inspired by the light over Manila Bay.',
      'After dyeing, every shirt rests for 24 hours, is rinsed in cold water until it runs clear, and then goes through a color-lock wash. The result is a tee that stays vivid through dozens of washes.',
      'Care tip: wash inside-out in cold water for the first three washes, and hang dry out of direct sunlight.',
    ],
  },
  {
    slug: 'stacked-payday-explained',
    title: 'Stacked Payday, Explained',
    excerpt: 'Why we reward bigger hauls with automatic tiered discounts — and how to get the free Puzzled Keychain.',
    image: './products/p-puzzled-keychain.jpg',
    date: '2026-09-25',
    readTime: '3 min read',
    body: [
      'Stacked Payday is our thank-you for crews who shop together. Instead of one-time promo codes, discounts scale with your bag.',
      'Reach ₱750 and you get 8% off. At ₱1,500 it becomes 10%. Cross ₱2,500 and you unlock 12% plus a free Puzzled Keychain, and at ₱4,000 it maxes out at 15% with the keychain included.',
      'Everything is calculated live in your bag and verified again on our server when you check out, so the amount you send through GCash or Maya is always exact.',
    ],
  },
  {
    slug: 'gold-standard-heavyweights',
    title: 'The Gold Standard: Building the Midnight Hex Hoodie',
    excerpt: '420 GSM brushed fleece, embossed honeycomb, and gold-tone hardware. The story of our heaviest piece yet.',
    image: './products/p-midnight-hex.jpg',
    date: '2026-08-30',
    readTime: '4 min read',
    body: [
      'The honeycomb is the core of the SOVRAXION identity — a structure that is strong because every cell supports the next. The Midnight Hex Hoodie carries that idea in a tonal emboss that only shows when light hits it.',
      'We chose a 420 GSM brushed fleece so the hoodie holds its shape and drapes with weight, plus a double-lined hood that stands up on its own. Gold-tone aglets finish the drawcords.',
      'It is built for the way Manila actually feels: freezing malls, rainy commutes, late-night food trips.',
    ],
  },
];
