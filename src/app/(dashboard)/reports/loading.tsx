export default function ReportsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto w-full animate-pulse">
      <div className="h-7 skeleton w-24" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-4 text-center space-y-2">
            <div className="h-8 skeleton w-12 mx-auto" />
            <div className="h-3 skeleton w-20 mx-auto" />
          </div>
        ))}
      </div>
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-line"><div className="h-5 skeleton w-32" /></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-b border-line last:border-0">
            <div className="h-4 skeleton flex-1" />
            <div className="h-4 skeleton w-16" />
            <div className="h-4 skeleton w-16" />
            <div className="h-4 skeleton w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}
