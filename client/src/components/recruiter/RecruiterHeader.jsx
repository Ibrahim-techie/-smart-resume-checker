const RecruiterHeader = ({ user, onLogout }) => (
  <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
    <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-xl font-bold text-slate-950">Smart Resume Checker</h1>
        <span className="mt-1 inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
          Recruiter Portal
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-700">{user?.name}</span>
        <button type="button" onClick={onLogout} className="rounded-md bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100">
          Logout
        </button>
      </div>
    </div>
  </header>
);

export default RecruiterHeader;
