const getScoreMeta = (score) => {
  if (score >= 86) return 'bg-emerald-100 text-emerald-700';
  if (score >= 66) return 'bg-blue-100 text-blue-700';
  if (score >= 41) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
};

const formatDate = (date) => {
  if (!date) return 'Unknown';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

const CandidateCard = ({ candidate }) => (
  <article className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h3 className="font-display text-lg font-bold text-slate-950">{candidate.name}</h3>
        <p className="mt-1 text-sm text-slate-500">{candidate.email}</p>
        <p className="mt-3 text-sm text-slate-600">
          Resume: <span className="font-medium">{candidate.resumeName}</span>
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Joined {formatDate(candidate.joinedAt)} • Uploaded {formatDate(candidate.uploadedAt)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${getScoreMeta(candidate.atsScore ?? 0)}`}>
          ATS: {candidate.atsScore ?? '–'}/100
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
          Match: {typeof candidate.matchScore === 'number' ? `${candidate.matchScore.toFixed(1)}%` : '–'}
        </span>
      </div>
    </div>
  </article>
);

export default CandidateCard;
