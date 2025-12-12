import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './components/AuthPage';
import GlobalChat from './components/GlobalChat';
import UserDashboard from './components/UserDashboard';
// import AdminDashboard from './components/AdminDashboard';
import Footer from './components/Footer';
import ChristmasBackground from './components/ChristmasBackground';
import MaintenanceScreen from './components/MaintenanceScreen';
function App() {
  const { user, profile, loading, refreshProfile, dbError } = useAuth();
  // Fetch maintenance mode on load
  const [isMaintenance, setIsMaintenance] = useState(false);
  useEffect(() => {
    supabase.rpc('get_public_settings').then(({ data }) => {
      if (data && (data as any).maintenance_mode) {
        setIsMaintenance(true);
      }
    });
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
  // 🎅 Play Ho Ho Ho Sound when loading
  useEffect(() => {
    // Audio effect removed due to 403 errors and autoplay policies
    // const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-santa-claus-laugh-414.mp3');
    // const playAudio = async () => {
    //   try {
    //     await audio.play();
    //   } catch (err) {
    //     console.log('Audio autoplay blocked by browser policy');
    //   }
    // };
    // if (loading) { // Original condition
    //   playAudio();
    // }
  }, [loading]); // Keep original dependency array
  // 🚨 CRITICAL DB ERROR SCREEN
  if (dbError === 'recursive_policy') {
    return (
      <div className="min-h-screen bg-red-900 text-white flex flex-col items-center justify-center p-8 font-mono">
        <div className="max-w-2xl bg-black border-4 border-red-500 p-6 shadow-2xl">
          <h1 className="text-3xl font-bold mb-4 text-red-500 animate-pulse">⚠️ SYSTEM LOCKED</h1>
          <p className="mb-4 text-lg">
            The database has detected a security deadlock (Infinite Recursion).
            <br />
            You must unlock it manually to proceed.
          </p>
          <div className="bg-gray-900 p-4 rounded mb-4 overflow-x-auto">
            <p className="text-gray-400 text-sm mb-2">RUN THIS SIMPLE COMMAND IN SUPABASE SQL EDITOR:</p>
            <code className="text-green-400 text-xs whitespace-pre select-all">
              {`-- NUCLEAR UNLOCK
BEGIN;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
COMMIT;
NOTIFY pgrst, 'reload schema';`}
            </code>
            <p className="text-xs text-red-400 mt-2">
              Note: This temporarily disables security to let you in. We can fix permissions later.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded transition-colors"
          >
            I RAN THE UNLOCK COMMAND - RELOAD
          </button>
        </div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-[#E0E7FF] flex flex-col items-center justify-center">
        <div className="composition-layer"></div>
        <ChristmasBackground />
        <div className="z-10 text-center animate-bounce">
          <span className="text-6xl filter drop-shadow-[4px_4px_0px_black]">🎅</span>
          <p className="mt-4 font-black uppercase text-2xl tracking-widest">Loading...</p>
        </div>
      </div>
    );
  }
  const getPage = () => {
    if (!user) return <AuthPage />;
    if (!profile) {
      return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans relative">
          <div className="composition-layer"></div>
          { }
          <ChristmasBackground />
          <div className="z-10 text-center animate-pulse bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_black]">
            <span className="text-4xl block mb-4">🎁</span>
            <h2 className="text-xl font-black text-black uppercase mb-2">Unwrapping Profile...</h2>
            <p className="text-sm font-bold text-gray-600">getting your details from DAuth</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-xs font-bold text-blue-600 hover:underline uppercase"
            >
              Taking too long? Reload
            </button>
          </div>
        </div>
      );
    }
    if (isMaintenance && !profile.is_admin) {
      return <MaintenanceScreen />;
    }
    // if (profile.is_admin) return <><AdminDashboard /><GlobalChat /></>;
    return <><UserDashboard /><GlobalChat /></>;
  };
  return (
    <>
      <div className="bg-noise"></div> { }
      {getPage()}
      <Footer />
    </>
  );
}
export default App;
