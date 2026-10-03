import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import ProductGrid from '../components/ProductGrid';
import { TierLadder } from '../components/HeroBanner';
import { resolveImage } from '../lib/api';
import { formatPeso } from '../lib/format';
import { useApi } from '../lib/hooks';
import { useCartStore } from '../store/useCartStore';
import { useUIStore } from '../store/useUIStore';

export default function ProductPage() {
  const { slug } = useParams();
  const { data, loading, error, reload } = useApi(`/api/products/${encodeURIComponent(slug)}`);
  const addItem = useCartStore((s) => s.addItem);
  const toast = useUIStore((s) => s.toast);
  const setCart = useUIStore((s) => s.setCart);
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);

  const product = data?.product;

  useEffect(() => {
    setQty(1);
    setSizeError(false);
    setSize(product?.sizes?.length === 1 ? product.sizes[0] : '');
    window.scrollTo({ top: 0 });
  }, [product]);

  if (loading) {
    return (
      <div className="mx-auto grid max-w-[1440px] animate-pulse gap-10 px-5 pt-32 sm:px-8 lg:grid-cols-2">
        <div className="aspect-[3/4] bg-onyx-800" />
        <div className="space-y-4 pt-6">
          <div className="h-3 w-24 bg-onyx-700" />
          <div className="h-10 w-3/4 bg-onyx-700" />
          <div className="h-6 w-32 bg-onyx-700" />
          <div className="h-24 bg-onyx-800" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-xl px-5 pt-40 text-center">
        <p className="font-display text-3xl font-semibold text-bone">Product not found</p>
        <p className="mt-3 text-sm text-white/50">{error?.message || 'This item may have been archived.'}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={reload} className="btn-ghost">Retry</button>
          <Link to="/shop" className="btn-gold">Back to shop</Link>
        </div>
      </div>
    );
  }

  const soldOut = product.stock <= 0;
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;

  const add = () => {
    if (!size) {
      setSizeError(true);
      return;
    }
    const r = addItem(product, size, qty);
    if (!r.ok) {
      toast(r.message, 'error');
      return;
    }
    toast(`${qty} × ${product.name} (${size}) added.`, 'success');
    setCart(true);
  };

  return (
    <div className="pt-28">
      <nav className="mx-auto flex max-w-[1440px] items-center gap-1.5 px-5 text-[11px] uppercase tracking-[0.18em] text-white/40 sm:px-8" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-gold">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to={`/shop?category=${product.category}`} className="hover:text-gold">{product.category}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate text-white/70">{product.name}</span>
      </nav>

      <div className="mx-auto mt-6 grid max-w-[1440px] gap-10 px-5 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="relative aspect-[3/4] overflow-hidden bg-onyx-800">
          <img src={resolveImage(product.imageUrl)} alt={product.name} className="h-full w-full object-cover" />
          {onSale && <span className="absolute left-4 top-4 bg-gold-bright px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-onyx">Sale</span>}
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">{product.collectionName} · {product.category}</p>
          <h1 className="mt-3 font-display text-4xl font-semibold uppercase leading-[0.95] tracking-wide text-bone sm:text-5xl" data-testid="text-product-name">{product.name}</h1>
          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-3xl font-semibold text-gold" data-testid="text-product-price">{formatPeso(product.price)}</span>
            {onSale && <span className="text-base text-white/35 line-through">{formatPeso(product.compareAtPrice)}</span>}
          </div>
          <p className={`mt-2 text-xs uppercase tracking-[0.18em] ${soldOut ? 'text-red-300' : product.stock <= 5 ? 'text-amber-300' : 'text-emerald-300/80'}`} data-testid="text-stock">
            {soldOut ? 'Sold out' : product.stock <= 5 ? `Only ${product.stock} left` : 'In stock · ships in 1–2 days'}
          </p>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <span className="label mb-0">Size</span>
              {sizeError && <span className="text-xs text-red-300" role="alert">Select a size</span>}
            </div>
            <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  role="radio"
                  aria-checked={size === s}
                  disabled={soldOut}
                  onClick={() => {
                    setSize(s);
                    setSizeError(false);
                  }}
                  className={`h-12 min-w-[3.5rem] border px-4 text-sm font-semibold uppercase tracking-[0.12em] transition ${
                    size === s ? 'border-gold bg-gold text-onyx' : sizeError ? 'border-red-500/60 text-bone' : 'border-white/15 text-bone hover:border-gold'
                  } disabled:opacity-40`}
                  data-testid={`button-size-${s.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <div className="flex h-12 items-center border border-white/15">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-full w-11 items-center justify-center text-white/70 hover:text-gold" aria-label="Decrease quantity" data-testid="button-qty-minus"><Minus className="h-4 w-4" /></button>
              <span className="w-10 text-center tabular-nums" data-testid="text-qty">{qty}</span>
              <button onClick={() => setQty(Math.min(Math.min(20, product.stock || 1), qty + 1))} className="flex h-full w-11 items-center justify-center text-white/70 hover:text-gold" aria-label="Increase quantity" data-testid="button-qty-plus"><Plus className="h-4 w-4" /></button>
            </div>
            <button onClick={add} disabled={soldOut} className="btn-gold flex-1" data-testid="button-add-to-cart">
              <ShoppingBag className="h-4 w-4" /> {soldOut ? 'Sold out' : 'Add to cart'}
            </button>
          </div>

          <p className="mt-8 whitespace-pre-line text-sm leading-relaxed text-white/65">{product.description}</p>

          <ul className="mt-8 space-y-3 border-t border-white/10 pt-6 text-sm text-white/60">
            <li className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-gold" /> Pay with GCash or Maya to SOVRAXION MNL · 09636688618</li>
            <li className="flex items-center gap-3"><Truck className="h-4 w-4 text-gold" /> Nationwide shipping from Parañaque City</li>
          </ul>

          <div className="mt-8 border border-white/10">
            <TierLadder compact />
          </div>
        </div>
      </div>

      {data.related?.length > 0 && (
        <section className="mx-auto mt-24 max-w-[1440px] px-5 sm:px-8">
          <p className="eyebrow">You may also like</p>
          <h2 className="mb-8 mt-2 font-display text-3xl font-semibold uppercase text-bone">Complete the fit</h2>
          <ProductGrid products={data.related} />
        </section>
      )}
    </div>
  );
}
