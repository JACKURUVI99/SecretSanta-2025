import { useAuth } from './contexts/AuthContext';
import AuthPage from './components/AuthPage';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-400 via-blue-300 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">❄️</div>
          <p className="text-2xl font-bold text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthPage />;
  }

  if (profile.is_admin) {
    return <AdminDashboard />;
  }

  return <UserDashboard />;
}

export default App;
