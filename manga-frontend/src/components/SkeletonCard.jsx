export default function SkeletonCard(){
  return (
    <div className="animate-pulse rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
      <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-800" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/5"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-2/5"></div>
      </div>
    </div>
  )
}
