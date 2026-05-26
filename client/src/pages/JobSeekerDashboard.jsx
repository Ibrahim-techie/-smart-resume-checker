import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const statusStyles = {
  pending: 'bg-slate-100 text-slate-600',
  processing: 'bg-yellow-100 text-yellow-700 animate-pulse',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
};

const statusLabels = {
  pending: 'Queued',
  processing: 'Extracting text...',
  completed: 'Text Extracted ✅',
  failed: 'Extraction Failed',
};

const formatFileSize = (bytes = 0) => {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (date) => {
  if (!date) return 'Unknown date';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

const FileIcon = ({ fileType }) => (
  <div
    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-xl ${
      fileType === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
    }`}
  >
    {fileType === 'pdf' ? '🔴' : '🔵'}
  </div>
);

const SkeletonCards = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((item) => (
      <div key={item} className="animate-pulse rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-slate-200" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-2/3 rounded bg-slate-200" />
            <div className="h-3 w-1/2 rounded bg-slate-200" />
          </div>
          <div className="h-8 w-24 rounded bg-slate-200" />
        </div>
      </div>
    ))}
  </div>
);

const getScoreMeta = (score) => {
  if (typeof score !== 'number') {
    return { color: '#94a3b8', label: 'Pending' };
  }

  if (score >= 86) return { color: '#10b981', label: 'Excellent' };
  if (score >= 66) return { color: '#3b82f6', label: 'Good' };
  if (score >= 41) return { color: '#f59e0b', label: 'Fair' };
  return { color: '#ef4444', label: 'Poor' };
};

const ScoreRing = ({ score, size = 88 }) => {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = typeof score === 'number' ? Math.max(0, Math.min(score, 100)) : 0;
  const offset = circumference - (normalizedScore / 100) * circumference;
  const { color, label } = getScoreMeta(score);
  const displayScore = typeof score === 'number'
    ? (Number.isInteger(score) ? score : score.toFixed(1))
    : '–';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} aria-label={`Score ${typeof score === 'number' ? displayScore : 'pending'}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.22}
          fontWeight="700"
          fill={color}
        >
          {displayScore}
        </text>
      </svg>
      <span className="mt-1 text-xs font-medium" style={{ color }}>
        {label}
      </span>
    </div>
  );
};

const CategoryBar = ({ label, score = 0, max = 1 }) => {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-36 text-xs text-slate-600">{label}</span>
      <div className="h-2 flex-1 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-primary-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-12 text-right text-xs font-medium text-slate-500">
        {score}/{max}
      </span>
    </div>
  );
};

const breakdownOrder = [
  ['contact', 'Contact Info'],
  ['sections', 'Section Complete'],
  ['content', 'Content Quality'],
  ['keywords', 'Keywords'],
  ['formatting', 'ATS Formatting'],
];

const getMatchLabel = (score) => {
  if (score >= 76) return { label: 'Strong Match', color: '#10b981' };
  if (score >= 56) return { label: 'Good Match', color: '#3b82f6' };
  if (score >= 31) return { label: 'Partial Match', color: '#f59e0b' };
  return { label: 'Weak Match', color: '#ef4444' };
};

const MatchedBadge = ({ label }) => (
  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
    ✓ {label}
  </span>
);

const MissingBadge = ({ label }) => (
  <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
    ✗ {label}
  </span>
);

const JobSeekerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedResume, setExpandedResume] = useState(null);
  const [loadingExpandId, setLoadingExpandId] = useState(null);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jdTitle, setJdTitle] = useState('');
  const [jdText, setJdText] = useState('');
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [matchError, setMatchError] = useState('');
  const [matchHistory, setMatchHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedMatchId, setExpandedMatchId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [deletingMatchId, setDeletingMatchId] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const fetchResumes = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoadingResumes(true);
    }

    try {
      const { data } = await api.get('/resume/my-resumes');
      setResumes(data);
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Unable to load resumes');
    } finally {
      if (!silent) {
        setLoadingResumes(false);
      }
    }
  }, []);

  const fetchMatchHistory = useCallback(async (resumeId) => {
    if (!resumeId) return;

    setLoadingHistory(true);
    try {
      const { data } = await api.get(`/jd/history/${resumeId}`);
      setMatchHistory(data);
    } catch (error) {
      setMatchError(error.response?.data?.message || 'Failed to load match history');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  useEffect(() => {
    if (activeTab === 'my-resumes') {
      fetchResumes();
    }
  }, [activeTab, fetchResumes]);

  useEffect(() => {
    if (activeTab === 'jd-match') {
      fetchResumes({ silent: true });
    }
  }, [activeTab, fetchResumes]);

  useEffect(() => {
    setMatchResult(null);
    setExpandedMatchId(null);
    setShowHistory(false);
    if (selectedResumeId) {
      fetchMatchHistory(selectedResumeId);
    } else {
      setMatchHistory([]);
    }
  }, [fetchMatchHistory, selectedResumeId]);

  useEffect(() => {
    if (activeTab !== 'my-resumes') return undefined;

    const hasInProgress = resumes.some((resume) => resume.status === 'pending' || resume.status === 'processing');
    if (!hasInProgress) return undefined;

    const interval = setInterval(() => {
      fetchResumes({ silent: true });
    }, 4000);

    return () => clearInterval(interval);
  }, [activeTab, fetchResumes, resumes]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setUploadError('');
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    handleFileSelect(event.dataTransfer.files?.[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);

      await api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Resume uploaded! Analysis starting...');
      setSelectedFile(null);

      setTimeout(() => {
        setActiveTab('my-resumes');
        fetchResumes();
      }, 1500);
    } catch (err) {
      const message = err.response?.data?.message || 'Upload failed. Please try again.';
      if (message.toLowerCase().includes('already uploaded')) {
        toast.warning("You've already uploaded this exact file.");
      } else {
        toast.error(message);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (resumeId) => {
    setDeletingId(resumeId);

    try {
      await api.delete(`/resume/${resumeId}`);
      setResumes((current) => current.filter((resume) => resume._id !== resumeId));
      setConfirmDeleteId(null);
      toast.success('Resume deleted.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to delete resume');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExpand = async (resumeId) => {
    if (expandedId === resumeId) {
      setExpandedId(null);
      setExpandedResume(null);
      return;
    }

    setLoadingExpandId(resumeId);

    try {
      const { data } = await api.get(`/resume/${resumeId}`);
      setExpandedResume(data);
      setExpandedId(resumeId);
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Failed to fetch resume details');
    } finally {
      setLoadingExpandId(null);
    }
  };

  const handleGetSuggestions = async (resumeId) => {
    setLoadingSuggestions(true);

    try {
      const { data } = await api.post('/ai/suggest', { resumeId });
      setExpandedResume((current) => ({
        ...current,
        geminiSuggestions: data.suggestions,
        lastSuggestedAt: data.generatedAt || data.cachedAt,
        cached: data.cached,
      }));

      if (data.cached) {
        toast.info('Showing cached suggestions. Click Regenerate for fresh tips.');
      } else {
        toast.success('AI suggestions generated!');
      }
    } catch (error) {
      if (error.response?.status === 429) {
        toast.warning('AI quota reached. Try again in a minute.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to get suggestions.');
      }
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleClearSuggestions = async (resumeId) => {
    try {
      await api.delete(`/ai/suggest/${resumeId}`);
      setExpandedResume((current) => ({
        ...current,
        geminiSuggestions: null,
        lastSuggestedAt: null,
        cached: false,
      }));
      toast.info('Cleared. Click Get AI Tips to regenerate.');
    } catch (error) {
      toast.error('Failed to clear suggestions.');
    }
  };

  const handleMatch = async () => {
    if (!selectedResumeId || !jdText.trim()) return;

    setMatching(true);
    setMatchError('');
    setMatchResult(null);

    try {
      const { data } = await api.post('/jd/match', {
        resumeId: selectedResumeId,
        jdText: jdText.trim(),
        jdTitle: jdTitle.trim() || 'Untitled Position',
      });
      setMatchResult(data.match);
      setShowHistory(false);
      fetchMatchHistory(selectedResumeId);
    } catch (error) {
      const message = error.response?.data?.message || 'Match analysis failed. Try again.';
      setMatchError(message);
      toast.error(message);
    } finally {
      setMatching(false);
    }
  };

  const handleDeleteMatch = async (matchId) => {
    setDeletingMatchId(matchId);
    setMatchError('');

    try {
      await api.delete(`/jd/${matchId}`);
      setMatchHistory((current) => current.filter((match) => match._id !== matchId));
      if (matchResult?._id === matchId) {
        setMatchResult(null);
      }
      if (expandedMatchId === matchId) {
        setExpandedMatchId(null);
      }
      toast.success('Match deleted.');
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to delete match';
      setMatchError(message);
      toast.error(message);
    } finally {
      setDeletingMatchId(null);
    }
  };

  const isDuplicateError = uploadError.toLowerCase().includes('already uploaded');
  const completedResumes = resumes.filter((resume) => resume.status === 'completed');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-slate-950">Smart Resume Checker</h1>
            <p className="text-sm text-slate-500">Resume upload workspace</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-700">{user?.name}</span>
            <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
              Job Seeker
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="border-b border-slate-200">
          <div className="flex gap-8">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`border-b-2 px-1 pb-3 text-sm transition ${
                activeTab === 'upload'
                  ? 'border-primary-600 font-semibold text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Upload Resume
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('my-resumes')}
              className={`border-b-2 px-1 pb-3 text-sm transition ${
                activeTab === 'my-resumes'
                  ? 'border-primary-600 font-semibold text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              My Resumes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('jd-match')}
              className={`border-b-2 px-1 pb-3 text-sm transition ${
                activeTab === 'jd-match'
                  ? 'border-primary-600 font-semibold text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              JD Match
            </button>
          </div>
        </div>

        {activeTab === 'upload' && (
          <section className="mt-8">
            <div className="mx-auto max-w-2xl">
              {uploadError && (
                <div
                  className={`mb-5 rounded-lg border px-4 py-3 text-sm font-medium ${
                    isDuplicateError
                      ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {isDuplicateError ? "⚠️ You've already uploaded this exact file." : uploadError}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`w-full rounded-xl border-2 p-10 text-center transition ${
                  dragOver
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-dashed border-slate-300 bg-white hover:border-primary-300'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(event) => handleFileSelect(event.target.files?.[0])}
                />
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-primary-50 text-3xl">
                  📄
                </span>
                <span className="mt-5 block font-display text-2xl font-bold text-slate-950">
                  Drag & drop your resume here
                </span>
                <span className="mt-2 block text-slate-500">or click to browse files</span>
                <span className="mt-5 inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  PDF • DOCX • Max 5MB
                </span>
              </button>

              {selectedFile && (
                <div className="mt-5 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-2xl">
                      {selectedFile.type === 'application/pdf' ? '🔴' : '🔵'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-950">{selectedFile.name}</p>
                      <p className="text-sm text-slate-500">
                        {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown file type'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="rounded-md px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="mt-6 flex w-full items-center justify-center rounded-md bg-primary-600 px-5 py-3 font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {uploading && (
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {uploading ? 'Uploading...' : 'Upload Resume'}
              </button>
            </div>
          </section>
        )}

        {activeTab === 'my-resumes' && (
          <section className="mt-8">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-950">My Resumes</h2>
                <p className="mt-1 text-sm text-slate-500">Uploaded resumes are processed automatically by the extraction service.</p>
              </div>
              <button
                type="button"
                onClick={fetchResumes}
                className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary-200 hover:text-primary-700"
              >
                Refresh
              </button>
            </div>

            {uploadError && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {uploadError}
              </div>
            )}

            {loadingResumes ? (
              <SkeletonCards />
            ) : resumes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-3xl">
                  📄
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-slate-950">No resumes yet</h3>
                <p className="mt-2 text-slate-500">Upload your first resume to get started.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className="mt-6 rounded-md bg-primary-600 px-5 py-3 font-semibold text-white transition hover:bg-primary-700"
                >
                  Upload Resume
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {resumes.map((resume) => {
                  const previewText = expandedId === resume._id ? expandedResume?.parsedText || '' : '';
                  const wordCount = previewText ? previewText.split(/\s+/).filter(Boolean).length : 0;
                  const analysis = expandedId === resume._id ? expandedResume?.analysisResult : null;
                  const keywords = analysis?.breakdown?.keywords?.found_keywords?.slice(0, 15) || [];
                  const strengths = analysis?.summary?.strengths || [];
                  const improvements = analysis?.summary?.improvements || [];
                  const canExpand = resume.status === 'completed' && resume.atsScore !== null && resume.atsScore !== undefined;

                  return (
                  <article
                    key={resume._id}
                    className={`rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition ${
                      deletingId === resume._id ? 'opacity-50' : 'opacity-100'
                    }`}
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <FileIcon fileType={resume.fileType} />
                        <div className="min-w-0">
                          <a
                            href={resume.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block truncate font-semibold text-slate-950 hover:text-primary-700"
                            title={resume.originalName}
                          >
                            {resume.originalName}
                          </a>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatFileSize(resume.fileSize)} • Uploaded {formatDate(resume.uploadedAt)}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                statusStyles[resume.status] || statusStyles.pending
                              }`}
                            >
                              {statusLabels[resume.status] || statusLabels.pending}
                            </span>
                            {resume.status === 'failed' && (
                              <span className="text-xs font-medium text-red-600">
                                File may be image-based or corrupted.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-3 sm:justify-end">
                        <ScoreRing score={resume.atsScore} />

                        {canExpand && (
                          <button
                            type="button"
                            onClick={() => handleExpand(resume._id)}
                            disabled={loadingExpandId === resume._id}
                            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary-200 hover:text-primary-700 disabled:opacity-60"
                          >
                            {expandedId === resume._id ? 'Hide Analysis' : 'View Analysis'}
                          </button>
                        )}

                        {confirmDeleteId === resume._id ? (
                          <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm">
                            <span className="font-medium text-red-700">Delete this resume?</span>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="font-semibold text-slate-500 hover:text-slate-800"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(resume._id)}
                              disabled={deletingId === resume._id}
                              className="font-semibold text-red-700 hover:text-red-900 disabled:opacity-60"
                            >
                              {deletingId === resume._id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(resume._id)}
                            className="rounded-md p-2 text-lg transition hover:bg-red-50"
                            aria-label={`Delete ${resume.originalName}`}
                            title="Delete resume"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>

                    {resume.status === 'completed' && (resume.atsScore === null || resume.atsScore === undefined) && (
                      <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Re-upload to get score.
                      </p>
                    )}

                    {expandedId === resume._id && analysis && (
                      <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-display text-lg font-bold text-slate-950">Category Scores</h3>
                          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                            ~{wordCount} words extracted
                          </span>
                        </div>

                        <div className="space-y-3">
                          {breakdownOrder.map(([key, label]) => {
                            const item = analysis.breakdown?.[key];
                            if (!item) return null;
                            return <CategoryBar key={key} label={label} score={item.score} max={item.max} />;
                          })}
                        </div>

                        <div className="mt-6 grid gap-5 lg:grid-cols-2">
                          <div>
                            <h4 className="font-semibold text-emerald-700">✅ Strengths</h4>
                            {strengths.length > 0 ? (
                              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                                {strengths.map((item) => (
                                  <li key={item}>• {item}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-3 text-sm text-slate-500">No strengths detected yet.</p>
                            )}
                          </div>

                          <div>
                            <h4 className="font-semibold text-amber-700">🔧 Improvements Needed</h4>
                            {improvements.length > 0 ? (
                              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                                {improvements.map((item) => (
                                  <li key={item}>• {item}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="mt-3 text-sm text-slate-500">No major improvements detected.</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-6 border-t border-slate-100 pt-5">
                          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-700">✨ AI Coach Suggestions</h4>
                              <p className="mt-0.5 text-xs text-slate-400">
                                Powered by Gemini · Personalized tips beyond rule-based analysis
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {expandedResume?.geminiSuggestions?.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleClearSuggestions(expandedResume._id)}
                                  className="text-xs text-slate-400 transition hover:text-slate-600"
                                >
                                  Regenerate
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleGetSuggestions(expandedResume._id)}
                                disabled={loadingSuggestions}
                                className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-700 disabled:bg-violet-300"
                              >
                                {loadingSuggestions && (
                                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                )}
                                {loadingSuggestions
                                  ? 'Generating...'
                                  : expandedResume?.geminiSuggestions?.length > 0
                                    ? 'View Suggestions'
                                    : 'Get AI Tips'}
                              </button>
                            </div>
                          </div>

                          {expandedResume?.geminiSuggestions?.length > 0 && (
                            <div className="space-y-2">
                              {expandedResume.geminiSuggestions.map((tip, index) => (
                                <div key={tip} className="flex gap-3 rounded-lg border border-violet-100 bg-violet-50 p-3">
                                  <span className="shrink-0 text-sm font-bold text-violet-400">{index + 1}.</span>
                                  <p className="text-sm leading-relaxed text-violet-900">{tip}</p>
                                </div>
                              ))}
                              {expandedResume.lastSuggestedAt && (
                                <p className="mt-1 text-right text-xs text-slate-400">
                                  Generated {new Date(expandedResume.lastSuggestedAt).toLocaleDateString()}
                                  {expandedResume.cached ? ' · Cached' : ''}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mt-6">
                          <h4 className="font-semibold text-slate-900">🏷️ Keywords Detected</h4>
                          {keywords.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {keywords.map((keyword) => (
                                <span
                                  key={keyword}
                                  className="rounded-full border border-primary-100 bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700"
                                >
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-sm text-slate-500">No technical keywords detected.</p>
                          )}
                        </div>

                        <div className="mt-6">
                          <h4 className="font-semibold text-slate-900">Text Preview</h4>
                          <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-slate-900 p-4 font-mono text-sm leading-6 text-slate-100">
                            {previewText
                              ? `${previewText.slice(0, 300)}${previewText.length > 300 ? '...' : ''}`
                              : 'No extracted text available yet.'}
                          </pre>
                        </div>
                      </div>
                    )}
                  </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {activeTab === 'jd-match' && (
          <section className="mt-8 space-y-6">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="pb-6">
                <h2 className="font-display text-2xl font-bold text-slate-950">
                  Match Your Resume to a Job Description
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Choose a completed resume, paste the role details, and compare keyword coverage.
                </p>
              </div>

              {matchError && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {matchError}
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                <div className="space-y-6">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Select Resume</span>
                    <select
                      value={selectedResumeId}
                      onChange={(event) => setSelectedResumeId(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">-- Select a resume --</option>
                      {completedResumes.map((resume) => (
                        <option key={resume._id} value={resume._id}>
                          {resume.originalName} — ATS {resume.atsScore ?? '?'}/100
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Job Title</span>
                    <input
                      type="text"
                      value={jdTitle}
                      onChange={(event) => setJdTitle(event.target.value)}
                      placeholder="Senior React Developer"
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary-500"
                    />
                  </label>

                  {completedResumes.length === 0 && (
                    <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      Upload and complete analysis for at least one resume before matching a JD.
                    </div>
                  )}
                </div>

                <div>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Paste Job Description</span>
                    <textarea
                      value={jdText}
                      onChange={(event) => setJdText(event.target.value.slice(0, 5000))}
                      maxLength={5000}
                      rows={8}
                      placeholder="Paste the full job description here..."
                      className="mt-2 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm outline-none transition focus:ring-2 focus:ring-primary-500"
                    />
                  </label>
                  <p className="mt-1 text-right text-xs text-slate-400">
                    {jdText.length} / 5000 characters
                  </p>

                  <button
                    type="button"
                    onClick={handleMatch}
                    disabled={!selectedResumeId || !jdText.trim() || matching}
                    className="mt-6 flex w-full items-center justify-center rounded-md bg-primary-600 px-5 py-3 font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {matching && (
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    {matching ? 'Analyzing Match...' : 'Analyze Match'}
                  </button>
                </div>
              </div>
            </div>

            {matchResult && (
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-6 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-display text-xl font-bold text-slate-950">
                      Match Results — "{matchResult.jdTitle}"
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Created {formatDate(matchResult.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <ScoreRing score={matchResult.matchScore} size={104} />
                    <span
                      className="mt-2 rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        backgroundColor: `${getMatchLabel(matchResult.matchScore).color}14`,
                        color: getMatchLabel(matchResult.matchScore).color,
                      }}
                    >
                      {getMatchLabel(matchResult.matchScore).label}
                    </span>
                  </div>
                </div>

                <div className="space-y-6 py-6">
                  <div>
                    <h4 className="font-semibold text-emerald-700">
                      Matched Keywords ({matchResult.matchedKeywords?.length || 0})
                    </h4>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {matchResult.matchedKeywords?.length ? (
                        matchResult.matchedKeywords.map((keyword) => (
                          <MatchedBadge key={keyword} label={keyword} />
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">No JD keywords were found in this resume.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-red-600">
                      Missing Keywords ({matchResult.missingKeywords?.length || 0})
                    </h4>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {matchResult.missingKeywords?.length ? (
                        matchResult.missingKeywords.map((keyword) => (
                          <MissingBadge key={keyword} label={keyword} />
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">No missing JD keywords detected.</span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                    <h4 className="font-semibold text-amber-900">Suggestions</h4>
                    {matchResult.suggestions?.length ? (
                      <ul className="mt-3 space-y-2 text-sm text-amber-800">
                        {matchResult.suggestions.map((suggestion) => (
                          <li key={suggestion}>• {suggestion}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-amber-800">No suggestions generated for this match.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-950">Previous Matches</h3>
                  <p className="mt-1 text-sm text-slate-500">History is scoped to the selected resume.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistory((current) => !current)}
                  disabled={!selectedResumeId}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary-200 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {showHistory ? 'Hide History' : 'Show History'}
                </button>
              </div>

              {showHistory && (
                <div className="pt-6">
                  {loadingHistory ? (
                    <div className="animate-pulse space-y-3">
                      {[1, 2].map((item) => (
                        <div key={item} className="h-20 rounded-xl bg-slate-100" />
                      ))}
                    </div>
                  ) : !selectedResumeId ? (
                    <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      Select a resume to view previous matches.
                    </p>
                  ) : matchHistory.length === 0 ? (
                    <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      No previous matches for this resume.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {matchHistory.map((match) => {
                        const expanded = expandedMatchId === match._id;
                        const meta = getMatchLabel(match.matchScore);

                        return (
                          <article key={match._id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <button
                                type="button"
                                onClick={() => setExpandedMatchId(expanded ? null : match._id)}
                                className="min-w-0 text-left"
                              >
                                <span className="block truncate font-semibold text-slate-950">{match.jdTitle}</span>
                                <span className="mt-1 block text-sm text-slate-500">{formatDate(match.createdAt)}</span>
                              </button>

                              <div className="flex items-center gap-3">
                                <span
                                  className="rounded-full px-3 py-1 text-xs font-semibold"
                                  style={{ backgroundColor: `${meta.color}14`, color: meta.color }}
                                >
                                  {Number(match.matchScore).toFixed(1)} • {meta.label}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMatch(match._id)}
                                  disabled={deletingMatchId === match._id}
                                  className="rounded-md px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                                >
                                  {deletingMatchId === match._id ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            </div>

                            {expanded && (
                              <div className="space-y-6 pt-6">
                                <div>
                                  <h4 className="font-semibold text-emerald-700">
                                    Matched Keywords ({match.matchedKeywords?.length || 0})
                                  </h4>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {match.matchedKeywords?.length ? (
                                      match.matchedKeywords.map((keyword) => (
                                        <MatchedBadge key={keyword} label={keyword} />
                                      ))
                                    ) : (
                                      <span className="text-sm text-slate-500">No matched keywords.</span>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold text-red-600">
                                    Missing Keywords ({match.missingKeywords?.length || 0})
                                  </h4>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {match.missingKeywords?.length ? (
                                      match.missingKeywords.map((keyword) => (
                                        <MissingBadge key={keyword} label={keyword} />
                                      ))
                                    ) : (
                                      <span className="text-sm text-slate-500">No missing keywords.</span>
                                    )}
                                  </div>
                                </div>

                                <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                                  <h4 className="font-semibold text-amber-900">Suggestions</h4>
                                  <ul className="mt-3 space-y-2 text-sm text-amber-800">
                                    {(match.suggestions || []).map((suggestion) => (
                                      <li key={suggestion}>• {suggestion}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default JobSeekerDashboard;
