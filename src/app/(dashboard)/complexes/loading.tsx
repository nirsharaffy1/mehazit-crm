export default function ComplexesLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto w-full animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 skeleton w-28" />
        <div className="h-9 skeleton w-28 rounded-lg" />
      </div>
      <div className="grid gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-1.5">
                <div className="h-4 skeleton w-48" />
                <div className="h-3 skeleton w-32" />
              </div>
              <div className="h-5 skeleton w-16 rounded-full" />
            </div>
            <div className="h-1.5 skeleton rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
