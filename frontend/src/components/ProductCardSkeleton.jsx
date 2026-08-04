export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden h-full flex flex-col animate-pulse">
      <div className="h-48 sm:h-56 md:h-64 bg-gray-200" />

      <div className="p-4 md:p-6 flex flex-col flex-grow">
        <div className="h-5 w-20 bg-gray-400 rounded mb-3" />
        <div className="h-5 w-3/4 bg-gray-400 rounded mb-2" />
        <div className="h-4 w-full bg-gray-400 rounded mb-1.5" />
        <div className="h-4 w-2/3 bg-gray-400 rounded mb-4 flex-grow-0" />
        <div className="h-6 w-24 bg-gray-400 rounded mb-4" />
        <div className="h-10 w-full bg-gray-400 rounded" />
      </div>
    </div>
  )
}
