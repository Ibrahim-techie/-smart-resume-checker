import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from '../utils/toast';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const user = await login(formData.email, formData.password);
      toast.success('Logged in successfully.');
      navigate(user.role === 'recruiter' ? '/recruiter' : '/dashboard', { replace: true });
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to login right now');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-slate-50 font-sans lg:grid-cols-2">
      <section className="hidden bg-slate-950 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="font-display text-xl font-bold">
          Smart Resume Checker
        </Link>
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-sky-300">Welcome back</p>
          <h1 className="font-display text-4xl font-bold leading-tight">
            Pick up where your resume workflow left off.
          </h1>
          <p className="mt-5 max-w-md leading-7 text-slate-300">
            Job seekers and recruiters share one secure login, with dashboards routed by account role.
          </p>
        </div>
        <p className="text-sm text-slate-500">JWT authentication foundation for Phase 1.</p>
      </section>

      <main className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl shadow-slate-200/80">
          <Link to="/" className="mb-8 inline-block font-display text-lg font-bold text-slate-950 lg:hidden">
            Smart Resume Checker
          </Link>
          <h2 className="font-display text-3xl font-bold text-slate-950">Login</h2>
          <p className="mt-2 text-slate-500">Enter your credentials to continue.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-md border border-slate-300 px-4 py-3 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Password</span>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-md border border-slate-300 px-4 py-3 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                placeholder="Enter your password"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary-600 px-5 py-3 font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary-700 hover:text-primary-900">
              Register
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
