export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto w-full animate-pulse">
      <div className="h-7 skeleton w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-4 space-y-3">
            <div className="w-9 h-9 skeleton rounded-lg" />
            <div className="h-8 skeleton w-16" />
            <div className="h-3 skeleton w-24" />
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="card p-4 space-y-3">
            <div className="h-5 skeleton w-32" />
            {[...Array(4)].map((_, j) => (
              <div key={j} className="flex gap-3">
                <div className="w-7 h-7 skeleton rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 skeleton w-full" />
                  <div className="h-3 skeleton w-24" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
