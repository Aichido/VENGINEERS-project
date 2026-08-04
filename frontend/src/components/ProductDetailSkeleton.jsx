export default function ProductDetailSkeleton() {
  return (
    <main>
      {/* Breadcrumb */}
      <section className="bg-gray-50 py-4 md:py-6">
        <div className="container">
          <div className="h-4 w-48 bg-gray-300 rounded animate-pulse" />
        </div>
      </section>

      <section className="py-12 md:py-20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-12 md:mb-20">
            {/* Gallery skeleton */}
            <div className="animate-pulse">
              <div className="h-96 md:h-[500px] rounded-lg bg-gray-200 mb-4" />
              <div className="flex gap-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="w-20 h-20 md:w-24 md:h-24 rounded-lg bg-gray-200 flex-shrink-0" />
                ))}
              </div>
            </div>

            {/* Info skeleton */}
            <div className="animate-pulse">
              <div className="h-6 w-24 bg-gray-400 rounded mb-4" />
              <div className="h-10 w-4/5 bg-gray-400 rounded mb-3" />
              <div className="h-10 w-3/5 bg-gray-400 rounded mb-6" />
              <div className="h-4 w-full bg-gray-400 rounded mb-2" />
              <div className="h-4 w-full bg-gray-400 rounded mb-2" />
              <div className="h-4 w-2/3 bg-gray-400 rounded mb-8" />
              <div className="h-8 w-32 bg-gray-400 rounded mb-8" />
              <div className="flex gap-3 mb-8">
                <div className="h-14 w-40 bg-gray-400 rounded" />
                <div className="h-14 w-28 bg-gray-400 rounded" />
                <div className="h-14 w-28 bg-gray-400 rounded" />
              </div>
              <div className="h-14 w-full bg-gray-400 rounded" />
            </div>
          </div>

          {/* Additional details skeleton */}
          <div className="border-t border-gray-500 pt-12 md:pt-20 animate-pulse">
            <div className="h-8 w-56 bg-gray-400 rounded mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              <div className="space-y-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="h-4 w-full bg-gray-400 rounded" />
                ))}
              </div>
              <div className="space-y-3">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="h-4 w-full bg-gray-400 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
