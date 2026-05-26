import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const roles = [
  {
    id: 'jobseeker',
    icon: '📄',
    title: 'Job Seeker',
    description: 'Analyze your resume, get ATS score, improve faster',
  },
  {
    id: 'recruiter',
    icon: '🏢',
    title: 'Recruiter',
    description: 'Upload JDs, rank candidates, streamline hiring',
  },
];

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'jobseeker',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const roleFromUrl = searchParams.get('role');
    if (roleFromUrl === 'jobseeker' || roleFromUrl === 'recruiter') {
      setFormData((current) => ({ ...current, role: roleFromUrl }));
    }
  }, [searchParams]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const user = await register(formData.name, formData.email, formData.password, formData.role);
      toast.success('Account created successfully.');
      navigate(user.role === 'recruiter' ? '/recruiter' : '/dashboard', { replace: true });
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to register right now');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-10 font-sans">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-lg bg-white shadow-xl shadow-slate-200/80 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="bg-slate-950 p-8 text-white sm:p-10">
          <Link to="/" className="font-display text-xl font-bold">
            Smart Resume Checker
          </Link>
          <div className="mt-16 max-w-md">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-emerald-300">Create account</p>
            <h1 className="font-display text-4xl font-bold leading-tight">
              Choose the workspace that matches your role.
            </h1>
            <p className="mt-5 leading-7 text-slate-300">
              One authentication flow supports both resume analysis and candidate ranking in later phases.
            </p>
          </div>
        </section>

        <main className="p-6 sm:p-10">
          <h2 className="font-display text-3xl font-bold text-slate-950">Register</h2>
          <p className="mt-2 text-slate-500">Start with a role-aware account.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {roles.map((role) => {
                const selected = formData.role === role.id;

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setFormData((current) => ({ ...current, role: role.id }))}
                    className={`rounded-lg border p-5 text-left transition ${
                      selected
                        ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary-100'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="text-2xl" aria-hidden="true">
                      {role.icon}
                    </span>
                    <span className="mt-3 block font-display text-lg font-semibold text-slate-950">
                      {role.title}
                    </span>
                    <span className="mt-2 block text-sm leading-6 text-slate-500">{role.description}</span>
                  </button>
                );
              })}
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Full Name</span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-2 w-full rounded-md border border-slate-300 px-4 py-3 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                placeholder="Your full name"
              />
            </label>

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

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Password</span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="mt-2 w-full rounded-md border border-slate-300 px-4 py-3 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  placeholder="Minimum 6 characters"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Confirm Password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="mt-2 w-full rounded-md border border-slate-300 px-4 py-3 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  placeholder="Re-enter password"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary-600 px-5 py-3 font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary-700 hover:text-primary-900">
              Login
            </Link>
          </p>
        </main>
      </div>
    </div>
  );
};

export default RegisterPage;
