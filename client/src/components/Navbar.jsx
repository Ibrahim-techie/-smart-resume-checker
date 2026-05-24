import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const dashboardPath = user?.role === 'recruiter' ? '/recruiter' : '/dashboard';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="font-display text-lg font-bold text-slate-900">
          Smart Resume Checker
        </Link>

        <div className="flex items-center gap-3 text-sm font-medium">
          {user ? (
            <>
              <NavLink to={dashboardPath} className="text-slate-600 hover:text-primary-700">
                Dashboard
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="text-slate-600 hover:text-primary-700">
                Login
              </NavLink>
              <NavLink
                to="/register"
                className="rounded-md bg-primary-600 px-4 py-2 text-white transition hover:bg-primary-700"
              >
                Register
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
