import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CandidateCard from '../components/recruiter/CandidateCard';
import JobCard from '../components/recruiter/JobCard';
import JobForm from '../components/recruiter/JobForm';
import LoadingCards from '../components/recruiter/LoadingCards';
import RankResults from '../components/recruiter/RankResults';
import RecruiterHeader from '../components/recruiter/RecruiterHeader';
import StatsBar from '../components/recruiter/StatsBar';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const tabs = [
  ['jobs', 'My Jobs'],
  ['candidates', 'Candidates'],
  ['rank', 'Rank Candidates'],
];

const RecruiterDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('jobs');
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [ranked, setRanked] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [ranking, setRanking] = useState(false);
  const [rankResult, setRankResult] = useState(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [minAtsFilter, setMinAtsFilter] = useState(0);
  const [sortCandidatesBy, setSortCandidatesBy] = useState('atsScore');
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState(null);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const { data } = await api.get('/recruiter/stats');
      setStats(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load recruiter stats');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const { data } = await api.get('/recruiter/jobs');
      setJobs(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load jobs');
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  const fetchCandidates = useCallback(async () => {
    setLoadingCandidates(true);
    try {
      const { data } = await api.get('/recruiter/candidates');
      setCandidates(data.candidates || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load candidates');
    } finally {
      setLoadingCandidates(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchJobs();
  }, [fetchJobs, fetchStats]);

  useEffect(() => {
    if (activeTab === 'candidates') fetchCandidates();
  }, [activeTab, fetchCandidates]);

  const filteredCandidates = useMemo(() => (
    candidates
      .filter((candidate) => (candidate.atsScore ?? 0) >= minAtsFilter)
      .sort((a, b) => {
        if (sortCandidatesBy === 'matchScore') {
          return (b.matchScore ?? 0) - (a.matchScore ?? 0);
        }
        return (b.atsScore ?? 0) - (a.atsScore ?? 0);
      })
  ), [candidates, minAtsFilter, sortCandidatesBy]);

  const activeJobs = jobs.filter((job) => job.isActive);

  const resetJobForm = () => {
    setShowJobForm(false);
    setEditingJob(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSaveJob = async (payload) => {
    setSavingJob(true);
    setError('');
    try {
      if (editingJob) {
        await api.put(`/recruiter/jobs/${editingJob._id}`, payload);
      } else {
        await api.post('/recruiter/jobs', payload);
      }
      resetJobForm();
      await Promise.all([fetchJobs(), fetchStats()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save job');
    } finally {
      setSavingJob(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Delete this job post?')) return;
    setDeletingJobId(jobId);
    setError('');
    try {
      await api.delete(`/recruiter/jobs/${jobId}`);
      if (selectedJobId === jobId) setSelectedJobId('');
      await Promise.all([fetchJobs(), fetchStats()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete job');
    } finally {
      setDeletingJobId(null);
    }
  };

  const handleToggleJob = async (job) => {
    setError('');
    try {
      await api.put(`/recruiter/jobs/${job._id}`, { isActive: !job.isActive });
      await Promise.all([fetchJobs(), fetchStats()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update job');
    }
  };

  const handleUseForRanking = (jobId) => {
    setSelectedJobId(jobId);
    setActiveTab('rank');
    setRankResult(null);
    setRanked([]);
  };

  const handleRank = async () => {
    if (!selectedJobId) return;
    setRanking(true);
    setRankResult(null);
    setError('');
    try {
      const { data } = await api.post('/recruiter/rank', { jobId: selectedJobId });
      setRankResult(data);
      setRanked(data.ranked || []);
      await Promise.all([fetchJobs(), fetchStats()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Ranking failed');
    } finally {
      setRanking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <RecruiterHeader user={user} onLogout={handleLogout} />

      <main className="mx-auto max-w-6xl px-5 py-8">
        <StatsBar stats={stats} loading={loadingStats} />

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 border-b border-slate-200">
          <div className="flex gap-8">
            {tabs.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`border-b-2 px-1 pb-3 text-sm transition ${
                  activeTab === id
                    ? 'border-primary-600 font-semibold text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'jobs' && (
          <section className="mt-8 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-950">My Jobs</h2>
                <p className="mt-1 text-sm text-slate-500">Create job descriptions and use them to rank candidates.</p>
              </div>
              <button type="button" onClick={() => { setEditingJob(null); setShowJobForm(true); }} className="rounded-md bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700">
                Post New Job
              </button>
            </div>

            {(showJobForm || editingJob) && (
              <JobForm initialJob={editingJob} onCancel={resetJobForm} onSubmit={handleSaveJob} saving={savingJob} />
            )}

            {loadingJobs ? <LoadingCards /> : jobs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <h3 className="font-display text-xl font-bold text-slate-950">No jobs posted yet</h3>
                <p className="mt-2 text-slate-500">Post your first job to start ranking candidates.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCard
                    key={job._id}
                    job={job}
                    onEdit={(item) => { setEditingJob(item); setShowJobForm(false); }}
                    onDelete={handleDeleteJob}
                    onToggle={handleToggleJob}
                    onUseForRanking={handleUseForRanking}
                    deleting={deletingJobId === job._id}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'candidates' && (
          <section className="mt-8 space-y-6">
            <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Min ATS Score: {minAtsFilter}</span>
                  <input type="range" min="0" max="100" value={minAtsFilter} onChange={(event) => setMinAtsFilter(Number(event.target.value))} className="mt-3 w-full" />
                </label>
                <button type="button" onClick={() => setSortCandidatesBy((current) => (current === 'atsScore' ? 'matchScore' : 'atsScore'))} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Sort by {sortCandidatesBy === 'atsScore' ? 'ATS Score' : 'Match Score'} ↕
                </button>
              </div>
            </div>

            {loadingCandidates ? <LoadingCards /> : filteredCandidates.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <h3 className="font-display text-xl font-bold text-slate-950">No candidates found</h3>
                <p className="mt-2 text-slate-500">No candidates have uploaded completed resumes yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCandidates.map((candidate) => (
                  <CandidateCard key={candidate.userId} candidate={candidate} />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'rank' && (
          <section className="mt-8 space-y-6">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Select Job to Rank Against</span>
                <select value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">-- Select an active job --</option>
                  {activeJobs.map((job) => <option key={job._id} value={job._id}>{job.title}</option>)}
                </select>
              </label>
              <button type="button" onClick={handleRank} disabled={!selectedJobId || ranking} className="mt-6 flex w-full items-center justify-center rounded-md bg-primary-600 px-5 py-3 font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                {ranking && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                {ranking ? 'Matching resumes... This may take a moment.' : 'Run Ranking'}
              </button>
            </div>
            <RankResults result={rankResult} ranked={ranked} />
          </section>
        )}
      </main>
    </div>
  );
};

export default RecruiterDashboard;
