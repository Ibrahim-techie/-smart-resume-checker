import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const JobSeekerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedResume, setExpandedResume] = useState(null);
  const [loadingPreviewId, setLoadingPreviewId] = useState(null);

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

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  useEffect(() => {
    if (activeTab === 'my-resumes') {
      fetchResumes();
    }
  }, [activeTab, fetchResumes]);

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
    setUploadSuccess(false);
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

      setUploadSuccess(true);
      setSelectedFile(null);

      setTimeout(() => {
        setUploadSuccess(false);
        setActiveTab('my-resumes');
        fetchResumes();
      }, 1500);
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed. Please try again.');
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
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Unable to delete resume');
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewText = async (resumeId) => {
    if (expandedId === resumeId) {
      setExpandedId(null);
      setExpandedResume(null);
      return;
    }

    setLoadingPreviewId(resumeId);

    try {
      const { data } = await api.get(`/resume/${resumeId}`);
      setExpandedResume(data);
      setExpandedId(resumeId);
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Failed to fetch resume details');
    } finally {
      setLoadingPreviewId(null);
    }
  };

  const isDuplicateError = uploadError.toLowerCase().includes('already uploaded');

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
          </div>
        </div>

        {activeTab === 'upload' && (
          <section className="mt-8">
            <div className="mx-auto max-w-2xl">
              {uploadSuccess && (
                <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  ✅ Resume uploaded! Redirecting to your resumes...
                </div>
              )}

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

            {uploadError && !uploadSuccess && (
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

                  return (
                  <article
                    key={resume._id}
                    className={`rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition ${
                      deletingId === resume._id ? 'opacity-50' : 'opacity-100'
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
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
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            statusStyles[resume.status] || statusStyles.pending
                          }`}
                        >
                          {statusLabels[resume.status] || statusLabels.pending}
                        </span>
                        <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">
                          ATS Score:{' '}
                          <span className="font-bold text-slate-900">
                            {resume.atsScore === null || resume.atsScore === undefined ? '–' : resume.atsScore}
                          </span>
                        </div>

                        {resume.status === 'completed' && (
                          <button
                            type="button"
                            onClick={() => handleViewText(resume._id)}
                            disabled={loadingPreviewId === resume._id}
                            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary-200 hover:text-primary-700 disabled:opacity-60"
                          >
                            {expandedId === resume._id ? '⌃ Hide Text' : '⌄ View Extracted Text'}
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

                    {resume.status === 'failed' && (
                      <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                        File may be image-based or corrupted.
                      </p>
                    )}

                    {expandedId === resume._id && (
                      <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-semibold text-slate-900">Text Preview</h3>
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            ~{wordCount} words extracted
                          </span>
                        </div>
                        <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-slate-900 p-4 font-mono text-sm leading-6 text-slate-100">
                          {previewText
                            ? `${previewText.slice(0, 300)}${previewText.length > 300 ? '...' : ''}`
                            : 'No extracted text available yet.'}
                        </pre>
                      </div>
                    )}
                  </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default JobSeekerDashboard;
