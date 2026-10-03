import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, X } from 'lucide-react';
import ProductGrid from '../components/ProductGrid';
import { useApi } from '../lib/hooks';
import { useCartStore } from '../store/useCartStore';

const CATEGORIES = ['Tees', 'Hoodies', 'Bottoms', 'Accessories', 'Collectibles'];
const SORTS = [
  { v: 'newest', l: 'Newest' },
  { v: 'popular', l: 'Best selling' },
  { v: 'price-asc', l: 'Price: low to high' },
  { v: 'price-desc', l: 'Price: high to low' },
  { v: 'name', l: 'Name A–Z' },
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const collection = params.get('collection') || '';
  const sale = params.get('sale') === 'true';
  const search = params.get('search') || '';
  const sort = params.get('sort') || 'newest';
  const inStock = params.get('inStock') === 'true';

  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (category && CATEGORIES.includes(category)) q.set('category', category);
    if (collection) q.set('collection', collection);
    if (sale) q.set('sale', 'true');
    if (search) q.set('search', search);
    if (inStock) q.set('inStock', 'true');
    q.set('sort', sort);
    return q.toString();
  }, [category, collection, sale, search, sort, inStock]);

  const { data, loading, error, reload } = useApi(`/api/products?${query}`);
  const syncWithCatalog = useCartStore((s) => s.syncWithCatalog);
  useEffect(() => {
    if (data?.products && !category && !collection && !sale && !search && !inStock) syncWithCatalog(data.products);
  }, [data, category, collection, sale, search, inStock, syncWithCatalog]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const title = sale ? 'Sale' : search ? `“${search}”` : collection || category || 'Shop all';
  const activeFilters = [
    category && { k: 'category', l: category },
    collection && { k: 'collection', l: collection },
    sale && { k: 'sale', l: 'On sale' },
    search && { k: 'search', l: `Search: ${search}` },
    inStock && { k: 'inStock', l: 'In stock' },
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-[1440px] px-5 pt-32 sm:px-8">
      <header className="border-b border-white/10 pb-8">
        <p className="eyebrow">{sale ? 'Marked down' : 'Catalog'}</p>
        <h1 className="mt-2 font-display text-4xl font-semibold uppercase tracking-wide text-bone sm:text-6xl" data-testid="text-shop-title">{title}</h1>
        <p className="mt-3 text-sm text-white/50">{loading ? 'Loading…' : `${data?.count ?? 0} products`} · Prices in ₱ · Stacked Payday discounts apply in bag</p>
      </header>

      <div className="z-30 -mx-5 sm:sticky sm:top-24 flex flex-wrap items-center gap-2 border-b border-white/10 bg-onyx/90 px-5 py-3 backdrop-blur-xl sm:-mx-8 sm:px-8">
        <button onClick={() => update('category', '')} className={`chip ${!category ? 'border-gold text-gold' : 'hover:border-white/30'}`} data-testid="filter-all">All</button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => update('category', category === c ? '' : c)} className={`chip ${category === c ? 'border-gold text-gold' : 'hover:border-white/30'}`} data-testid={`filter-${c.toLowerCase()}`}>
            {c}
          </button>
        ))}
        <button onClick={() => update('sale', sale ? '' : 'true')} className={`chip ${sale ? 'border-gold bg-gold text-onyx' : 'hover:border-white/30'}`} data-testid="filter-sale">Sale</button>
        <label className="chip cursor-pointer hover:border-white/30">
          <input type="checkbox" checked={inStock} onChange={(e) => update('inStock', e.target.checked ? 'true' : '')} className="accent-[#d4af37]" data-testid="filter-instock" />
          In stock
        </label>
        <label className="relative ml-auto">
          <span className="sr-only">Sort products</span>
          <select value={sort} onChange={(e) => update('sort', e.target.value)} className="h-9 appearance-none border border-white/10 bg-onyx-900 pl-3 pr-8 text-[11px] uppercase tracking-[0.16em] text-bone outline-none focus:border-gold" data-testid="select-sort">
            {SORTS.map((s) => (
              <option key={s.v} value={s.v}>{s.l}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        </label>
      </div>

      {activeFilters.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {activeFilters.map((f) => (
            <button key={f.k} onClick={() => update(f.k, '')} className="chip border-gold/40 text-gold-pale hover:border-gold" data-testid={`chip-remove-${f.k}`}>
              {f.l} <X className="h-3 w-3" />
            </button>
          ))}
          <button onClick={() => setParams({}, { replace: true })} className="text-[11px] uppercase tracking-[0.18em] text-white/50 hover:text-gold">Clear all</button>
        </div>
      )}

      <div className="mt-8">
        <ProductGrid products={data?.products || []} loading={loading} error={error} onRetry={reload} emptyMessage="Nothing matches those filters yet. Try another category." />
      </div>
    </div>
  );
}
