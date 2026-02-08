import { CartItemSkeleton } from '@/components/Skeletons';

export default function CartLoading() {
  return (
    <main className="bg-white md:bg-gray-50 md:min-h-[calc(100vh-56px)]">
      <div className="hidden md:block bg-white border-b border-gray-200">
        <div className="max-w-[1280px] mx-auto px-16 md:px-24 py-12 animate-pulse">
          <div className="h-12 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto">
        <div className="px-16 md:px-24 pt-20 pb-16 md:py-24 animate-pulse">
          <div className="h-28 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="h-12 bg-gray-200 rounded w-1/4"></div>
        </div>

        <div className="md:flex md:gap-24 lg:gap-32">
          <div className="flex-1 px-16 md:px-24 md:pr-0 pb-24 md:pb-32 space-y-16">
            {[1, 2, 3].map((i) => (
              <CartItemSkeleton key={i} />
            ))}
          </div>

          <div className="md:w-[360px] lg:w-[380px] flex-shrink-0 px-16 md:px-0 md:pr-24 pb-32">
            <div className="bg-white border border-gray-200 rounded-xl p-20 shadow-sm animate-pulse">
              <div className="h-16 bg-gray-200 rounded w-1/2 mb-16"></div>
              <div className="space-y-12">
                <div className="h-12 bg-gray-200 rounded w-full"></div>
                <div className="h-12 bg-gray-200 rounded w-5/6"></div>
                <div className="h-12 bg-gray-200 rounded w-4/5"></div>
              </div>
              <div className="border-t border-gray-200 my-16"></div>
              <div className="h-16 bg-gray-200 rounded w-2/3 mb-16"></div>
              <div className="h-40 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
