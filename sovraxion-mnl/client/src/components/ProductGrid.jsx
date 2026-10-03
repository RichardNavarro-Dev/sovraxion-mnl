import { PackageSearch, RefreshCw } from 'lucide-react';
import ProductCard from './ProductCard';

function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] bg-onyx-700" />
      <div className="space-y-2 border-x border-b border-white/5 bg-onyx-800 p-4">
        <div className="h-2 w-16 bg-onyx-600" />
        <div className="h-3 w-3/4 bg-onyx-600" />
        <div className="h-3 w-1/3 bg-onyx-600" />
        <div className="h-11 bg-onyx-700" />
      </div>
    </div>
  );
}

export default function ProductGrid({ products = [], loading = false, error = null, onRetry, emptyMessage = 'No products found.', columns = 4 }) {
  const cols = columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4';

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 border border-red-500/20 bg-red-500/5 px-6 py-14 text-center" role="alert">
        <p className="text-sm text-red-300">{error.message || 'Unable to load products.'}</p>
        {onRetry && (
          <button onClick={onRetry} className="btn-ghost h-10" data-testid="button-retry-products">
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 ${cols}`} aria-busy="true" aria-label="Loading products">
        {Array.from({ length: columns === 3 ? 6 : 8 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="flex flex-col items-center gap-3 border border-white/10 px-6 py-16 text-center">
        <PackageSearch className="h-8 w-8 text-gold/70" aria-hidden="true" />
        <p className="text-sm text-white/60">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 ${cols}`} data-testid="grid-products">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} />
      ))}
    </div>
  );
}
