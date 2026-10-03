import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Gift, Truck } from 'lucide-react';
import HeroBanner from '../components/HeroBanner';
import ProductGrid from '../components/ProductGrid';
import { useApi } from '../lib/hooks';
import { useCartStore } from '../store/useCartStore';
import { ARTICLES } from '../data/content';

function SectionHead({ eyebrow, title, to, cta }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl font-semibold uppercase tracking-wide text-bone sm:text-4xl">{title}</h2>
      </div>
      {to && (
        <Link to={to} className="group flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-white/60 hover:text-gold">
          {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

const COLLECTION_TILES = [
  { name: 'Dye Lab', note: 'Hand-dyed oversized tees', image: './products/p-sunkissed-dye.jpg', to: '/shop?collection=Dye%20Lab' },
  { name: 'Hex Core', note: 'Heavyweights & essentials', image: './products/p-midnight-hex.jpg', to: '/shop?collection=Hex%20Core' },
  { name: 'Collectibles', note: 'Keychains & small goods', image: './products/p-puzzled-keychain.jpg', to: '/shop?category=Collectibles' },
];

export default function Home() {
  const { data, loading, error, reload } = useApi('/api/products?sort=popular');
  const syncWithCatalog = useCartStore((s) => s.syncWithCatalog);

  useEffect(() => {
    if (data?.products) syncWithCatalog(data.products);
  }, [data, syncWithCatalog]);

  const products = data?.products || [];
  const featured = products.filter((p) => p.isFeatured).slice(0, 4);
  const dyeLab = products.filter((p) => p.collectionName === 'Dye Lab');

  return (
    <>
      <HeroBanner />

      <section className="mx-auto max-w-[1440px] px-5 pt-20 sm:px-8" aria-labelledby="new-drops">
        <SectionHead eyebrow="Fresh off the line" title="New drops" to="/shop" cta="Shop all" />
        <ProductGrid products={featured.length ? featured : products.slice(0, 4)} loading={loading} error={error} onRetry={reload} />
      </section>

      <section className="mx-auto mt-20 max-w-[1440px] px-5 sm:px-8" aria-label="Collections">
        <div className="grid gap-3 md:grid-cols-3">
          {COLLECTION_TILES.map((c, i) => (
            <motion.div key={c.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6 }}>
              <Link to={c.to} className="group relative block aspect-[4/5] overflow-hidden md:aspect-[3/4]" data-testid={`link-collection-${c.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <img src={c.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-onyx via-onyx/20 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-6">
                  <span className="eyebrow">{c.note}</span>
                  <span className="mt-2 flex items-center justify-between font-display text-3xl font-semibold uppercase text-bone">
                    {c.name}
                    <ArrowRight className="h-6 w-6 text-gold transition-transform group-hover:translate-x-1" />
                  </span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[1440px] px-5 sm:px-8" aria-labelledby="dye-lab">
        <SectionHead eyebrow="Blocks · Blumi · Sunkissed" title="The Dye Lab" to="/shop?collection=Dye%20Lab" cta="View collection" />
        <ProductGrid products={dyeLab} loading={loading} error={error} onRetry={reload} columns={3} />
      </section>

      <section className="mx-auto mt-24 max-w-[1440px] px-5 sm:px-8">
        <div className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-3">
          {[
            { icon: BadgeCheck, t: 'Owner-verified payments', d: 'Every GCash & Maya reference is matched against 09636688618 before your order ships.' },
            { icon: Gift, t: 'Automatic rewards', d: 'Stacked Payday discounts and the free Puzzled Keychain apply live — no codes.' },
            { icon: Truck, t: 'Nationwide shipping', d: 'Packed in Parañaque City and sent anywhere in the Philippines.' },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="bg-onyx-900 p-8">
              <Icon className="h-6 w-6 text-gold" aria-hidden="true" />
              <p className="mt-4 font-display text-lg font-semibold text-bone">{t}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-[1440px] px-5 sm:px-8" aria-labelledby="journal">
        <SectionHead eyebrow="Journal" title="Articles" to="/articles" cta="Read all" />
        <div className="grid gap-6 md:grid-cols-3">
          {ARTICLES.map((a) => (
            <Link key={a.slug} to={`/articles/${a.slug}`} className="group" data-testid={`link-article-${a.slug}`}>
              <div className="aspect-[16/10] overflow-hidden bg-onyx-800">
                <img src={a.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-white/40">{a.readTime}</p>
              <p className="mt-2 font-display text-lg font-semibold leading-snug text-bone group-hover:text-gold">{a.title}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
