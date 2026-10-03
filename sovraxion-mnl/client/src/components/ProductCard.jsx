import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ChevronDown, ShoppingBag } from 'lucide-react';
import { resolveImage } from '../lib/api';
import { formatPeso } from '../lib/format';
import { useCartStore } from '../store/useCartStore';
import { useUIStore } from '../store/useUIStore';

export default function ProductCard({ product, index = 0 }) {
  const addItem = useCartStore((s) => s.addItem);
  const toast = useUIStore((s) => s.toast);
  const setCart = useUIStore((s) => s.setCart);
  const singleSize = product.sizes.length === 1;
  const [size, setSize] = useState(singleSize ? product.sizes[0] : '');
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState(false);

  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= 5;
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const savePct = onSale ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;

  const handleAdd = () => {
    if (!size) {
      setSizeError(true);
      toast('Please select a size first.', 'error');
      return;
    }
    const result = addItem(product, size, 1);
    if (!result.ok) {
      toast(result.message, 'error');
      return;
    }
    setAdded(true);
    toast(`${product.name} (${size}) added to bag.`, 'success');
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <motion.article
      className="group flex flex-col"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay: (index % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
      data-testid={`card-product-${product.slug}`}
    >
      <Link to={`/product/${product.slug}`} className="relative block aspect-[3/4] overflow-hidden bg-onyx-800" data-testid={`link-product-${product.slug}`}>
        <img
          src={resolveImage(product.imageUrl)}
          alt={product.name}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06] ${soldOut ? 'opacity-40 grayscale' : ''}`}
        />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {onSale && <span className="bg-gold-bright px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-onyx">Sale −{savePct}%</span>}
          {product.isFeatured && !onSale && <span className="border border-gold/50 bg-onyx/80 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-gold">New drop</span>}
          {lowStock && <span className="bg-onyx/85 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-red-300">Only {product.stock} left</span>}
        </div>
        {soldOut && (
          <span className="absolute inset-0 flex items-center justify-center font-display text-lg font-semibold uppercase tracking-[0.3em] text-bone">Sold out</span>
        )}
        <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-onyx/80 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />
      </Link>

      <div className="flex flex-1 flex-col border-x border-b border-white/5 bg-onyx-800 p-4">
        <p className="text-[10px] uppercase tracking-[0.26em] text-white/40">{product.collectionName}</p>
        <Link to={`/product/${product.slug}`} className="mt-1.5 font-display text-[15px] font-semibold uppercase leading-snug tracking-wide text-bone hover:text-gold">
          {product.name}
        </Link>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-semibold text-gold" data-testid={`text-price-${product.slug}`}>{formatPeso(product.price)}</span>
          {onSale && <span className="text-xs text-white/35 line-through">{formatPeso(product.compareAtPrice)}</span>}
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <label className="relative">
            <span className="sr-only">Select size for {product.name}</span>
            <select
              value={size}
              disabled={soldOut || singleSize}
              onChange={(e) => {
                setSize(e.target.value);
                setSizeError(false);
              }}
              className={`h-11 w-full appearance-none border bg-onyx-900 pl-3 pr-7 text-[11px] uppercase tracking-[0.06em] sm:tracking-[0.16em] text-bone outline-none transition focus:border-gold disabled:opacity-60 ${
                sizeError ? 'border-red-500/70' : 'border-white/10'
              }`}
              data-testid={`select-size-${product.slug}`}
            >
              {!singleSize && <option value="">Size</option>}
              {product.sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden="true" />
          </label>
          <button
            onClick={handleAdd}
            disabled={soldOut}
            className={`flex h-11 items-center justify-center gap-2 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
              added ? 'bg-emerald-500 text-onyx' : 'bg-gold text-onyx hover:bg-gold-bright'
            } disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40`}
            aria-label={`Add ${product.name} to cart`}
            data-testid={`button-add-${product.slug}`}
          >
            {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
            <span className="hidden sm:inline">{added ? 'Added' : 'Add'}</span>
          </button>
        </div>
        {added && (
          <button onClick={() => setCart(true)} className="mt-2 text-left text-[11px] uppercase tracking-[0.18em] text-gold hover:underline" data-testid={`button-view-bag-${product.slug}`}>
            View bag →
          </button>
        )}
      </div>
    </motion.article>
  );
}
