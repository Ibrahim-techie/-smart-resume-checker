const LoadingCards = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((item) => (
      <div key={item} className="animate-pulse rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="h-5 w-1/3 rounded bg-slate-200" />
        <div className="mt-3 h-4 w-1/2 rounded bg-slate-100" />
        <div className="mt-5 h-10 rounded bg-slate-100" />
      </div>
    ))}
  </div>
);

export default LoadingCards;
