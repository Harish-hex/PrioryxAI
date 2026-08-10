export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 p-6 bg-white min-h-screen">
      <div className="h-8 bg-slate-100 rounded-xl w-1/3" />
      <div className="h-4 bg-slate-100 rounded w-1/2" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
