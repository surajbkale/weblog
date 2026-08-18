export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      {/* Author header skeleton */}
      <div className="flex gap-6 mb-12">
        <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex-1 space-y-3 pt-2">
          <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-48" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        </div>
      </div>
      {/* Posts grid skeleton */}
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="aspect-[16/9] bg-gray-200 dark:bg-gray-700" />
            <div className="p-5 space-y-3">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
