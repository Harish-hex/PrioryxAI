export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto p-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/3 mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}
            className="h-36 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
