export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-52 rounded-lg bg-slate-200" />
          <div className="h-4 w-80 rounded bg-slate-100" />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-100 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 rounded bg-slate-100" />
              <div className="h-8 w-8 rounded-lg bg-slate-100" />
            </div>
            <div className="h-8 w-16 rounded bg-slate-200" />
            <div className="h-3 w-32 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-8 w-28 rounded-lg bg-slate-100" />
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-slate-100 bg-white p-6 space-y-4">
        <div className="space-y-1">
          <div className="h-5 w-32 rounded bg-slate-200" />
          <div className="h-3 w-64 rounded bg-slate-100" />
        </div>
        <div className="space-y-3 pt-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 w-48 rounded bg-slate-100" />
              <div className="h-6 rounded bg-slate-200" style={{ width: `${60 - i * 10}%` }} />
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
        <div className="p-6 space-y-1 border-b border-slate-100">
          <div className="h-5 w-32 rounded bg-slate-200" />
          <div className="h-3 w-48 rounded bg-slate-100" />
        </div>
        <div className="divide-y divide-slate-50">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="h-4 w-4 rounded bg-slate-100" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-64 rounded bg-slate-200" />
                <div className="h-3 w-48 rounded bg-slate-100" />
              </div>
              <div className="h-4 w-16 rounded bg-slate-100" />
              <div className="h-4 w-8 rounded bg-slate-200" />
              <div className="h-4 w-8 rounded bg-slate-200" />
              <div className="h-4 w-8 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
