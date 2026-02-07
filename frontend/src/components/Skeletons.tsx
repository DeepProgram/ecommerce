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
    <div className="container-padding py-24 animate-pulse">
      <div className="grid md:grid-cols-2 gap-32">
        <div className="aspect-square bg-gray-200 rounded-lg"></div>
        
        <div>
          <div className="h-32 bg-gray-200 rounded mb-16"></div>
          <div className="h-20 bg-gray-200 rounded w-1/4 mb-24"></div>
          
          <div className="space-y-12 mb-24">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded w-3/4"></div>
          </div>
          
          <div className="h-48 bg-gray-200 rounded"></div>
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
