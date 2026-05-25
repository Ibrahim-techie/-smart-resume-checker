import { useState } from 'react';

const rankColors = {
  1: 'bg-amber-100 text-amber-700 border-amber-200',
  2: 'bg-slate-100 text-slate-600 border-slate-200',
  3: 'bg-orange-100 text-orange-800 border-orange-200',
};

const getMatchMeta = (score) => {
  if (score >= 70) return { label: 'Strong Match', color: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' };
  if (score >= 50) return { label: 'Good Match', color: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' };
  if (score >= 30) return { label: 'Partial Match', color: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' };
  return { label: 'Weak Match', color: 'bg-red-500', badge: 'bg-red-100 text-red-700' };
};

const KeywordRow = ({ title, keywords, tone }) => (
  <div>
    <p className={`text-sm font-semibold ${tone === 'match' ? 'text-emerald-700' : 'text-red-600'}`}>
      {title} ({keywords?.length || 0})
    </p>
    <div className="mt-2 flex flex-wrap gap-2">
      {keywords?.length ? keywords.slice(0, 12).map((keyword) => (
        <span
          key={keyword}
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            tone === 'match'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border border-red-200 bg-red-50 text-red-600'
          }`}
        >
          {keyword}
        </span>
      )) : <span className="text-sm text-slate-500">None</span>}
    </div>
  </div>
);

const RankedCandidateCard = ({ candidate, rank }) => {
  const [expanded, setExpanded] = useState(rank <= 3);
  const score = typeof candidate.matchScore === 'number' ? candidate.matchScore : 0;
  const meta = getMatchMeta(score);

  return (
    <article className={`rounded-xl border bg-white p-5 shadow-sm ${rank <= 3 ? 'border-primary-100' : 'border-slate-100'}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <span className={`flex h-10 w-12 shrink-0 items-center justify-center rounded-lg border text-sm font-bold ${rankColors[rank] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>
            #{rank}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-bold text-slate-950">{candidate.name}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {candidate.resumeName} • ATS {candidate.atsScore ?? '–'}/100
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.badge}`}>
                {meta.label}
              </span>
              <span className="text-sm font-bold text-slate-900">
                Match: {typeof candidate.matchScore === 'number' ? `${candidate.matchScore.toFixed(1)}%` : '–'}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          {expanded ? 'Hide Details' : 'View Details'}
        </button>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div className="h-2 flex-1 rounded-full bg-slate-100">
          <div className={`h-2 rounded-full ${meta.color}`} style={{ width: `${Math.min(score, 100)}%` }} />
        </div>
        <span className="w-16 text-right text-xs font-semibold text-slate-500">
          {typeof candidate.matchScore === 'number' ? candidate.matchScore.toFixed(1) : '–'}%
        </span>
      </div>

      {expanded && (
        <div className="mt-6 space-y-5 rounded-lg bg-slate-50 p-4">
          <KeywordRow title="Matched" keywords={candidate.matchedKeywords} tone="match" />
          <KeywordRow title="Missing" keywords={candidate.missingKeywords} tone="missing" />
          {candidate.suggestions?.length > 0 && (
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Suggestion</p>
              <p className="mt-2 text-sm text-amber-800">{candidate.suggestions[0]}</p>
            </div>
          )}
        </div>
      )}
    </article>
  );
};

export default RankedCandidateCard;
