export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded-lg bg-slate-200" />
          <div className="h-4 w-40 rounded bg-slate-100" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-slate-100" />
      </div>

      {/* Search */}
      <div className="h-10 w-72 rounded-lg bg-slate-100" />

      {/* Count */}
      <div className="h-3 w-40 rounded bg-slate-100" />

      {/* Table */}
      <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
        {/* Header row */}
        <div className="flex gap-6 px-6 py-3 border-b border-slate-100">
          <div className="h-3 w-20 rounded bg-slate-200" />
          <div className="h-3 w-16 rounded bg-slate-200" />
          <div className="ml-auto h-3 w-16 rounded bg-slate-200" />
        </div>
        {/* Rows */}
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-6 py-3.5 border-b border-slate-50">
            <div className="h-4 w-52 rounded bg-slate-100" />
            <div className="flex gap-1.5">
              <div className="h-5 w-20 rounded-full bg-slate-100" />
              <div className="h-5 w-16 rounded-full bg-slate-100" />
            </div>
            <div className="ml-auto h-3 w-24 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
