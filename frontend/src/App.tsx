import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { api } from './lib/api';
import AuthPage from './components/features/AuthPage';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import ChristmasBackground from './components/common/ChristmasBackground';
import MaintenanceScreen from './components/common/MaintenanceScreen';

const NUCLEAR_CODE = "-- NUCLEAR UNLOCK\\n" +
  "BEGIN;\\n" +
  "ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;\\n" +
  "ALTER TABLE public.game_stats DISABLE ROW LEVEL SECURITY;\\n" +
  "ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;\\n" +
  "ALTER TABLE public.user_tasks DISABLE ROW LEVEL SECURITY;\\n" +
  "ALTER TABLE public.pairings DISABLE ROW LEVEL SECURITY;\\n" +
  "ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;\\n" +
  "COMMIT;\\n" +
  "NOTIFY pgrst, 'reload schema';";

function AppContent() {
  const { user, profile, loading, refreshProfile, dbError } = useAuth();
  const [isMaintenance, setIsMaintenance] = useState(false);

  // Fetch maintenance mode on load
  useEffect(() => {
    api.getAppSettings().then((data) => {
      // Robust handling for Array vs Object response
      const settings = Array.isArray(data) && data.length > 0 ? data[0] : (data && typeof data === 'object' ? data : null);
      if (settings && settings.maintenance_mode) {
        setIsMaintenance(true);
      }
    }).catch(err => console.error("Failed to load settings:", err));
  }, []);

  useEffect(() => {
    if (user && !profile && !loading && !dbError) {
      console.log('User logged in but no profile. Polling for profile...');
      const interval = setInterval(() => {
        refreshProfile?.();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [user, profile, loading, refreshProfile, dbError]);

  if (dbError === 'recursive_policy') {
    return (
      <div className="min-h-screen bg-red-900 text-white flex flex-col items-center justify-center p-8 font-mono">
        <div className="max-w-2xl bg-black border-4 border-red-500 p-6 shadow-2xl">
          <h1 className="text-3xl font-bold mb-4 text-red-500 animate-pulse">⚠️ SYSTEM LOCKED</h1>
          <p className="mb-4 text-lg">The database has detected a deadlock.</p>
          <div className="bg-gray-900 p-4 rounded mb-4 overflow-x-auto">
            <code className="text-green-400 text-xs whitespace-pre select-all block bg-black p-2 rounded">
              {NUCLEAR_CODE}
            </code>
          </div>
          <button onClick={() => window.location.reload()} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded">
            I RAN THE UNLOCK COMMAND - RELOAD
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E0E7FF] flex flex-col items-center justify-center">
        <ChristmasBackground />
        <div className="z-10 text-center animate-bounce">
          <span className="text-6xl filter drop-shadow-[4px_4px_0px_black]">🎅</span>
          <p className="mt-4 font-black uppercase text-2xl tracking-widest">Loading...</p>
        </div>
      </div>
    );
  }

  // Auth Guard
  if (!user) return <AuthPage />;
  if (!profile) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      Creating Profile...
    </div>
  );

  return (
    <Routes>
      <Route path="/admin" element={
        profile.is_admin ? <AdminDashboard /> : <Navigate to="/" />
      } />
      <Route path="/" element={
        (isMaintenance && !profile.is_admin && !profile.bypass_maintenance)
          ? <MaintenanceScreen />
          : <ErrorBoundary><UserDashboard /></ErrorBoundary>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

const App = () => {
  return <AppContent />;
};

export default App;
