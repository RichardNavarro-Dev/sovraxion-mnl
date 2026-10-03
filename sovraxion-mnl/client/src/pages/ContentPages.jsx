import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Minus, Plus } from 'lucide-react';
import { ARTICLES, FAQS } from '../data/content';
import { resolveImage } from '../lib/api';
import { useApi } from '../lib/hooks';

function PageHead({ eyebrow, title, intro }) {
  return (
    <header className="border-b border-white/10 pb-10">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 font-display text-5xl font-semibold uppercase leading-[0.9] tracking-wide text-bone sm:text-7xl">{title}</h1>
      {intro && <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/60">{intro}</p>}
    </header>
  );
}

export function CollectionsPage() {
  const { data, loading } = useApi('/api/products');
  const products = data?.products || [];
  const collections = (data?.collections || []).map((name) => {
    const items = products.filter((p) => p.collectionName === name);
    return { name, count: items.length, image: items[0]?.imageUrl, from: items.length ? Math.min(...items.map((p) => p.price)) : 0 };
  });
  return (
    <div className="mx-auto max-w-[1440px] px-5 pt-32 sm:px-8">
      <PageHead eyebrow="Curated drops" title="Collections" intro="Each collection is built around one idea — from hand-dyed one-of-ones to the heavyweight honeycomb essentials." />
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading &&
          Array.from({ length: 3 }, (_, i) => <div key={i} className="aspect-[4/5] animate-pulse bg-onyx-800" />)}
        {collections.map((c) => (
          <Link key={c.name} to={`/shop?collection=${encodeURIComponent(c.name)}`} className="group relative block aspect-[4/5] overflow-hidden bg-onyx-800" data-testid={`link-collection-page-${c.name.toLowerCase().replace(/\s+/g, '-')}`}>
            {c.image && <img src={resolveImage(c.image)} alt="" className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105" />}
            <span className="absolute inset-0 bg-gradient-to-t from-onyx via-onyx/30 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 p-7">
              <span className="eyebrow">{c.count} pieces · from ₱{c.from.toLocaleString('en-PH')}</span>
              <span className="mt-2 flex items-center justify-between font-display text-4xl font-semibold uppercase text-bone">
                {c.name} <ArrowRight className="h-6 w-6 text-gold transition-transform group-hover:translate-x-1" />
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function OurStoryPage() {
  return (
    <div className="pt-24">
      <section className="relative overflow-hidden">
        <img src="./products/hero-campaign.jpg" alt="SOVRAXION MNL crew on a Manila rooftop at night" className="h-[60vh] w-full object-cover object-[70%_center]" />
        <div className="absolute inset-0 bg-gradient-to-t from-onyx via-onyx/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1440px] px-5 pb-12 sm:px-8">
          <p className="eyebrow">Our story</p>
          <h1 className="mt-3 max-w-4xl font-display text-5xl font-semibold uppercase leading-[0.9] text-bone sm:text-7xl">Sovereign by design. Made in Manila.</h1>
        </div>
      </section>
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1.4fr]">
        <p className="font-display text-2xl font-medium leading-snug text-gold-grad">“Sovraxion” fuses sovereignty and action — the idea that what you wear should be a statement you own.</p>
        <div className="space-y-6 text-base leading-relaxed text-white/65">
          <p>SOVRAXION MNL started in Parañaque City with a single dye bucket and a stack of heavyweight blanks. We wanted streetwear that felt premium without pretending to be imported — pieces that carry the energy of Manila nights, jeepney neon and golden-hour bay sunsets.</p>
          <p>The honeycomb is our emblem because it is the strongest structure in nature: every cell holds up the next. That is how we see our community — crews who stack up together, which is exactly why Stacked Payday rewards bigger hauls.</p>
          <p>Every order is still packed by hand and every GCash and Maya payment is checked personally by the owner. Small batch. Gold standard. No shortcuts.</p>
          <div className="grid grid-cols-3 gap-px border border-white/10 bg-white/10 pt-0">
            {[
              ['240–420', 'GSM fabrics'],
              ['1 of 1', 'Hand-dyed pieces'],
              ['100%', 'Owner-verified orders'],
            ].map(([n, l]) => (
              <div key={l} className="bg-onyx-900 p-5">
                <p className="font-display text-2xl font-semibold text-gold">{n}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/45">{l}</p>
              </div>
            ))}
          </div>
          <Link to="/shop" className="btn-gold mt-4">Shop the collection</Link>
        </div>
      </div>
    </div>
  );
}

export function FAQPage() {
  const [open, setOpen] = useState('0-0');
  return (
    <div className="mx-auto max-w-4xl px-5 pt-32 sm:px-8">
      <PageHead eyebrow="Help centre" title="FAQ" intro="Payments, Stacked Payday, shipping and sizing — answered." />
      {FAQS.map((group, gi) => (
        <section key={group.group} className="mt-12">
          <h2 className="eyebrow mb-4">{group.group}</h2>
          <ul className="divide-y divide-white/10 border-y border-white/10">
            {group.items.map((item, ii) => {
              const id = `${gi}-${ii}`;
              const isOpen = open === id;
              return (
                <li key={id}>
                  <button onClick={() => setOpen(isOpen ? '' : id)} className="flex w-full items-center justify-between gap-6 py-5 text-left" aria-expanded={isOpen} data-testid={`button-faq-${id}`}>
                    <span className="font-display text-lg font-medium text-bone">{item.q}</span>
                    {isOpen ? <Minus className="h-4 w-4 flex-none text-gold" /> : <Plus className="h-4 w-4 flex-none text-white/50" />}
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pb-5 pr-10 text-sm leading-relaxed text-white/60">
                        {item.a}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function ArticlesPage() {
  const [lead, ...rest] = ARTICLES;
  return (
    <div className="mx-auto max-w-[1440px] px-5 pt-32 sm:px-8">
      <PageHead eyebrow="Journal" title="Articles" intro="Process notes, drop stories and everything behind the gold." />
      <Link to={`/articles/${lead.slug}`} className="group mt-10 grid gap-8 lg:grid-cols-2" data-testid={`link-article-lead-${lead.slug}`}>
        <div className="aspect-[16/11] overflow-hidden bg-onyx-800"><img src={lead.image} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /></div>
        <div className="self-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">{new Date(lead.date).toLocaleDateString('en-PH', { dateStyle: 'long' })} · {lead.readTime}</p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-bone group-hover:text-gold">{lead.title}</h2>
          <p className="mt-4 text-base text-white/60">{lead.excerpt}</p>
          <span className="mt-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-gold">Read article <ArrowRight className="h-4 w-4" /></span>
        </div>
      </Link>
      <div className="mt-16 grid gap-8 md:grid-cols-2">
        {rest.map((a) => (
          <Link key={a.slug} to={`/articles/${a.slug}`} className="group" data-testid={`link-article-card-${a.slug}`}>
            <div className="aspect-[16/10] overflow-hidden bg-onyx-800"><img src={a.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /></div>
            <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-white/40">{a.readTime}</p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-bone group-hover:text-gold">{a.title}</h3>
            <p className="mt-2 text-sm text-white/55">{a.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ArticleDetailPage() {
  const { slug } = useParams();
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) return <NotFoundPage />;
  return (
    <article className="mx-auto max-w-3xl px-5 pt-32 sm:px-8">
      <Link to="/articles" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/50 hover:text-gold"><ArrowLeft className="h-4 w-4" /> All articles</Link>
      <p className="mt-8 text-[11px] uppercase tracking-[0.2em] text-gold">{new Date(article.date).toLocaleDateString('en-PH', { dateStyle: 'long' })} · {article.readTime}</p>
      <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-bone sm:text-5xl">{article.title}</h1>
      <img src={article.image} alt="" className="mt-10 aspect-[16/10] w-full object-cover" />
      <div className="mt-10 space-y-6 text-lg leading-relaxed text-white/70">
        {article.body.map((p, i) => <p key={i}>{p}</p>)}
      </div>
      <Link to="/shop" className="btn-gold mt-12">Shop the pieces</Link>
    </article>
  );
}

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 pt-28 text-center">
      <p className="font-display text-8xl font-bold text-gold-grad">404</p>
      <p className="mt-4 font-display text-2xl font-semibold text-bone">This page went off-grid.</p>
      <Link to="/" className="btn-gold mt-8">Back home</Link>
    </div>
  );
}

export function ForbiddenPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 pt-28 text-center" data-testid="view-forbidden">
      <p className="font-display text-8xl font-bold text-gold-grad">403</p>
      <p className="mt-4 font-display text-2xl font-semibold text-bone">Owner access only.</p>
      <p className="mt-2 text-sm text-white/50">This area is restricted to the SOVRAXION MNL store owner.</p>
      <Link to="/" className="btn-gold mt-8">Back to store</Link>
    </div>
  );
}
