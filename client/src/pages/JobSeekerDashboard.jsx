import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const JobSeekerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-5 font-sans">
      <div className="w-full max-w-md rounded-lg bg-white p-10 text-center shadow-lg shadow-slate-200/80">
        <h1 className="mb-2 font-display text-2xl font-bold text-slate-800">Welcome, {user?.name}! 👋</h1>
        <p className="mb-1 text-slate-500">
          Role: <span className="font-medium text-primary-600">Job Seeker</span>
        </p>
        <p className="mb-6 text-sm text-slate-400">Resume upload & analysis coming in Phase 2</p>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md bg-red-50 px-6 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
