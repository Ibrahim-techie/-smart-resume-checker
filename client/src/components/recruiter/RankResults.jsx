import RankedCandidateCard from './RankedCandidateCard';

const formatDate = (date) => {
  if (!date) return 'Unknown';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

const RankResults = ({ result, ranked }) => {
  if (!result) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <h3 className="font-display text-xl font-bold text-slate-950">No ranking yet</h3>
        <p className="mt-2 text-slate-500">Select a job and run ranking to see candidate matches.</p>
      </div>
    );
  }

  if (!ranked.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <h3 className="font-display text-xl font-bold text-slate-950">No completed resumes found</h3>
        <p className="mt-2 text-slate-500">Candidates need to upload and analyze their resumes first.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="border-b border-slate-100 pb-5">
        <h3 className="font-display text-2xl font-bold text-slate-950">
          Ranked Results for: "{result.jobTitle}"
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {result.total} candidates • Ranked at {formatDate(result.rankedAt)}
        </p>
      </div>
      <div className="mt-5 space-y-4">
        {ranked.map((candidate, index) => (
          <RankedCandidateCard key={candidate.resumeId} candidate={candidate} rank={index + 1} />
        ))}
      </div>
    </div>
  );
};

export default RankResults;
