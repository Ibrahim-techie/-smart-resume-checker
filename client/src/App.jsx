import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import JobSeekerDashboard from './pages/JobSeekerDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';

const getDashboardPath = (role) => (role === 'recruiter' ? '/recruiter' : '/dashboard');

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to={getDashboardPath(user.role)} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={getDashboardPath(user.role)} replace /> : <RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRole="jobseeker">
            <JobSeekerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter"
        element={
          <ProtectedRoute allowedRole="recruiter">
            <RecruiterDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster richColors position="top-right" />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
