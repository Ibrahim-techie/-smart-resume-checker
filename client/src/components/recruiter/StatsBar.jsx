const statItems = [
  ['totalJobs', 'My Jobs'],
  ['activeJobs', 'Active'],
  ['totalCandidates', 'Candidates'],
  ['avgAtsScore', 'Avg ATS'],
];

const StatsBar = ({ stats, loading = false }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {statItems.map(([key, label]) => (
      <div key={key} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        {loading ? (
          <div className="h-8 w-20 animate-pulse rounded bg-slate-100" />
        ) : (
          <p className="font-display text-3xl font-bold text-primary-600">
            {key === 'avgAtsScore' ? `${stats?.[key] ?? '–'}/100` : stats?.[key] ?? 0}
          </p>
        )}
        <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
      </div>
    ))}
  </div>
);

export default StatsBar;
