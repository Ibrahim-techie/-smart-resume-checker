const formatDate = (date) => {
  if (!date) return 'Unknown date';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

const JobCard = ({ job, onEdit, onDelete, onToggle, onUseForRanking, deleting = false }) => (
  <article className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-xl font-bold text-slate-950">{job.title}</h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {job.location || 'Remote'}
          </span>
          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
            {job.experienceLevel}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {job.company || 'Company not specified'} • Posted {formatDate(job.createdAt)}
        </p>
        {job.requiredSkills?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {job.requiredSkills.map((skill) => (
              <span key={skill} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onToggle(job)}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            job.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {job.isActive ? 'Active' : 'Inactive'}
        </button>
        <button
          type="button"
          onClick={() => onUseForRanking(job._id)}
          className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Use for Ranking
        </button>
        <button
          type="button"
          onClick={() => onEdit(job)}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          title="Edit job"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(job._id)}
          disabled={deleting}
          className="rounded-md px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
          title="Delete job"
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </article>
);

export default JobCard;
