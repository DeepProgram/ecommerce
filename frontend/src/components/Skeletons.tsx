export function ProductCardSkeleton() {
  return (
    <div className="product-card animate-pulse">
      <div className="aspect-square bg-gray-200 rounded-lg mb-12"></div>
      <div className="h-16 bg-gray-200 rounded mb-8"></div>
      <div className="h-16 bg-gray-200 rounded w-3/4 mb-12"></div>
      <div className="flex justify-between items-center">
        <div className="h-20 bg-gray-200 rounded w-1/3"></div>
        <div className="h-12 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
  );
}

export function ProductListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-16">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Desktop Breadcrumb */}
      <div className="hidden md:block bg-white">
        <div className="max-w-[1280px] mx-auto px-16 md:px-24">
          <div className="py-12 border-b border-gray-200 animate-pulse">
            <div className="flex items-center gap-8">
              <div className="h-13 bg-gray-200 rounded w-40"></div>
              <span className="text-gray-300">›</span>
              <div className="h-13 bg-gray-200 rounded w-60"></div>
              <span className="text-gray-300">›</span>
              <div className="h-13 bg-gray-200 rounded w-80"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto">
        <div className="md:flex md:gap-24 lg:gap-32">
          {/* Image Side */}
          <div className="md:flex-1 md:px-24 md:py-32">
            <div className="h-[300px] md:h-auto md:aspect-square bg-gray-200 md:rounded-xl animate-pulse"></div>
            <div className="hidden md:flex gap-8 mt-12 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-48 h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>

          {/* Info Side */}
          <div className="md:flex-1 px-16 md:px-0 md:pr-24 py-32 md:py-32 animate-pulse">
            <div className="space-y-20">
              <div className="h-24 bg-gray-200 rounded w-3/4"></div>
              <div className="h-40 bg-gray-200 rounded w-1/3"></div>
              <div className="h-16 bg-gray-200 rounded w-1/2"></div>
              <div className="h-16 bg-gray-200 rounded w-2/3"></div>
              <div className="flex gap-8">
                <div className="h-40 bg-gray-200 rounded w-60"></div>
                <div className="h-40 bg-gray-200 rounded w-60"></div>
                <div className="h-40 bg-gray-200 rounded w-60"></div>
              </div>
              <div className="h-48 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CartItemSkeleton() {
  return (
    <div className="flex gap-16 p-16 border-b border-gray-200 animate-pulse">
      <div className="w-80 h-80 bg-gray-200 rounded"></div>
      <div className="flex-1">
        <div className="h-16 bg-gray-200 rounded mb-8"></div>
        <div className="h-12 bg-gray-200 rounded w-1/2 mb-12"></div>
        <div className="h-20 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="container-padding py-24 animate-pulse">
      <div className="h-32 bg-gray-200 rounded mb-24 w-1/3"></div>
      <div className="space-y-12">
        <div className="h-16 bg-gray-200 rounded"></div>
        <div className="h-16 bg-gray-200 rounded"></div>
        <div className="h-16 bg-gray-200 rounded w-4/5"></div>
      </div>
    </div>
  );
}
