import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Task, UserTask, AppSettings, Profile } from '../lib/supabase';
import {
  CheckCircle,
  X,
  Menu,
  User,
  LogOut,
  Users,
  Download,
  Trophy,
  HelpCircle,
  Calendar,
  MessageCircle
} from 'lucide-react';
// @ts-ignore
import confetti from 'canvas-confetti';

import ChristmasBackground from './common/ChristmasBackground';
import ProfileModal from './features/ProfileModal';
import ClassmatesModal from './features/ClassmatesModal';
import Leaderboard from './features/Leaderboard';
import KollywoodGame from './games/KollywoodGame';
import NewsFeed from './features/NewsFeed';
import TodaysBonusTask from './features/TodaysBonusTask';
import DailyGame from './games/DailyGame';
import TicTacToe from './games/TicTacToe';
import SantaGuide from './features/SantaGuide';
import GlobalChat from './features/GlobalChat';
import JumbledWordsGame from './games/JumbledWordsGame';
// @ts-ignore
import CrosswordGame from './games/CrosswordGame';
import BadDescriptionGame from './games/BadDescriptionGame';
// @ts-ignore
import ChristmasBingo from './games/ChristmasBingo';

import MemoryGame from './games/MemoryGame';
import SerialLights from './features/SerialLights';

import FlappySanta from './games/FlappySanta';
import VisualTutorial from './features/VisualTutorial';
import PollsWidget from './features/PollsWidget';
import TermsModal from './common/TermsModal';

export default function UserDashboard() {
  const { user, profile, refreshProfile, logout } = useAuth();
  const [tasks, setTasks] = useState<(Task & { userTask?: UserTask })[]>([]);
  const [secretSanta, setSecretSanta] = useState<Profile | null>(null);
  const [myGiftee, setMyGiftee] = useState<Profile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showClassmates, setShowClassmates] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [gameTab, setGameTab] = useState<'giftee_tictactoe' | 'santa_tictactoe' | 'grinch' | 'flappy'>('giftee_tictactoe');
  const [activeTurnGames, setActiveTurnGames] = useState({ santa: false, giftee: false });
  const [completedGames, setCompletedGames] = useState<string[]>([]);
  const [bypassMaintenance, setBypassMaintenance] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false); // New
  const [showTerms, setShowTerms] = useState(false);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Defined handleTermsAccepted
  const handleTermsAccepted = async () => {
    await refreshProfile();
    setShowTerms(false);
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome} `);
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  // Check turns for notifications
  const checkGameTurns = useCallback(async () => {
    if (!profile) return;
    let santaTurn = false;
    let gifteeTurn = false;

    // Check Santa Turn
    if (secretSanta) {
      try {
        const data = await api.getActiveTicTacToe(secretSanta.id);
        if (data && data.turn === profile.id) santaTurn = true;
      } catch (e) { /* ignore */ }
    }

    // Check Giftee Turn
    if (myGiftee) {
      try {
        const data = await api.getActiveTicTacToe(myGiftee.id);
        if (data && data.turn === profile.id) gifteeTurn = true;
      } catch (e) { /* ignore */ }
    }
    setActiveTurnGames({ santa: santaTurn, giftee: gifteeTurn });
  }, [profile, secretSanta, myGiftee]);

  const fetchTasks = useCallback(async () => {
    if (!profile) return;
    try {
      const allTasks = await api.getTasks();
      const userCompletions = await api.getUserTasks();

      if (allTasks) {
        const mergedTasks = allTasks.map((t: any) => ({
          ...t,
          userTask: userCompletions?.find((uc: any) => uc.task_id === t.id),
        }));
        setTasks(mergedTasks);
      }
    } catch (e) { console.error(e); }
  }, [profile]);


  const fetchSettings = useCallback(async () => {
    try {
      const data = await api.getAppSettings();
      if (Array.isArray(data) && data.length > 0) {
        setAppSettings(data[0]);
      } else if (data && typeof data === 'object') {
        setAppSettings(data);
      }
    } catch (e) {
      console.error('Error fetching settings:', e);
    }
  }, []);

  const fetchPairingData = useCallback(async () => {
    try {
      const { secretSanta, myGiftee } = await api.getUserPairings();
      setSecretSanta(secretSanta);
      setMyGiftee(myGiftee);
    } catch (e) {
      // console.error(e); // Can fail if no pairings
    }
  }, []);

  const fetchCompletedGames = useCallback(async () => {
    try {
      const data = await api.getCompletedGames();
      if (data) setCompletedGames(data);
    } catch (e) { console.error("Failed to fetch games", e); }
  }, []);

  // Use appSettings because 'settings' comes from AuthContext and might be stale or differently named locally
  // But wait, useAuth provides settings too. Let's use local appSettings for consistent polling updates if we want
  // actually useAuth settings is updated on refreshProfile.
  // The local `appSettings` is fetched via polling.

  // Polling Effect
  // Heartbeat Effect (Every 2 minutes)
  useEffect(() => {
    if (!profile?.id) return;
    const beat = () => {
      api.sendHeartbeat().catch(err => console.error("Heartbeat failed", err));
    };
    beat(); // Initial beat
    const interval = setInterval(beat, 60000); // 1 min (Standard for online status)
    return () => clearInterval(interval);
  }, [profile?.id]);

  // Data Polling Effect
  useEffect(() => {
    if (!profile?.id) return;

    fetchTasks();
    fetchSettings();
    fetchPairingData();
    fetchCompletedGames();

    const interval = setInterval(() => {
      fetchTasks();
      fetchSettings();
      fetchCompletedGames();
      checkGameTurns();
    }, 15000); // Increased to 15s to reduce load

    return () => clearInterval(interval);
  }, [profile?.id]);

  // Realtime Settings Bucket - REMOVED for Proxy Compliance
  // We rely on the polling effect (every 15s) above.



  // Only show banned screen if profile is loaded and banned
  if (profile?.is_banned) {
    return (
      <div className="min-h-screen bg-[#C41E3A] font-mono flex items-center justify-center flex-col text-center p-4">
        <ChristmasBackground />
        <div className="bg-white border-4 border-black p-8 shadow-[10px_10px_0px_0px_black] max-w-lg z-10 animate-bounce-in relative">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-4xl font-black font-mountains text-black mb-2 uppercase">Banned</h1>
          <p className="font-bold text-gray-700 mb-6 whitespace-pre-line">
            {profile.ban_reason || "Violation of rules"}
          </p>

          <div className="flex flex-col gap-3">
            <a
              href="mailto:help@secretsanta.nit?subject=Ban Appeal"
              className="bg-yellow-400 text-black px-6 py-3 border-2 border-black font-black uppercase shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 transition-all block w-full"
            >
              Report Issue
            </a>
            <button
              onClick={logout}
              className="bg-[#C41E3A] text-white px-6 py-3 border-2 border-black font-black uppercase shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 transition-all w-full"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check maintenance with appSettings
  if (appSettings?.maintenance_mode && !profile?.is_admin && !profile?.bypass_maintenance && !bypassMaintenance) {
    return (
      <div className="min-h-screen bg-[#C41E3A] font-mono flex items-center justify-center flex-col text-center p-4">
        <ChristmasBackground />
        <div className="bg-white border-4 border-black p-8 shadow-[10px_10px_0px_0px_black] max-w-lg z-10 animate-bounce-in">
          <h1 className="text-4xl filter drop-shadow-md mb-4">🚧 🎅 🚧</h1>
          <h2 className="text-2xl font-black uppercase mb-4 text-[#C41E3A]">Under Construction</h2>
          <p className="font-bold text-gray-700 mb-6">Values are being recalibrated by the Elves. Please wait...</p>
          <div className="animate-pulse bg-[#00A86B] text-white px-4 py-2 font-black uppercase inline-block border-2 border-black shadow-[4px_4px_0px_0px_black]">
            Check back soon!
          </div>

          {/* Special Unlock for User 107124039 */}
          {profile?.roll_number === '107124039' && (
            <div className="mt-6 border-t-2 border-black pt-4">
              <p className="text-xs font-bold text-gray-500 mb-2">Psst... Hey {profile.name}!</p>
              <button
                onClick={() => setBypassMaintenance(true)}
                className="bg-black text-white px-4 py-2 font-black uppercase border-2 border-white shadow-[2px_2px_0px_black] hover:-translate-y-1 transition-all"
              >
                🔓 Unlock Maintenance
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const toggleTask = async (task: Task & { userTask?: UserTask }) => {
    try {
      if (!task.id) return;
      await api.toggleUserTask(task.id);
      fetchTasks();
      refreshProfile(); // Update points
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e: any) { alert(e.message); }
  };

  const getDaysUntilGifting = () => {
    if (!appSettings?.gifting_day) return 0;
    const today = new Date();
    const giftingDay = new Date(appSettings.gifting_day);
    const diff = giftingDay.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };


  /* WINTER THEME & LAYOUT FIXES */
  return (
    <div className="min-h-screen bg-[#C41E3A] font-mono relative pb-40 overflow-x-hidden">
      <ChristmasBackground />
      <SerialLights />

      {/* Navigation Bar - Reverted Style */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white border-b-4 border-black p-3 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="font-black font-mountains text-3xl md:text-4xl uppercase tracking-tighter leading-none text-black">
              Secret Santa '25
            </span>
          </div>

          {/* Desktop Buttons */}


          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setShowTutorial(true)}
              className="bg-[#FFD700] text-black px-4 py-2 border-[3px] border-black font-bold uppercase shadow-hard hover:-translate-y-[-2px] transition-all flex items-center gap-2 transform rotate-1 hover:rotate-0"
            >
              <HelpCircle size={20} />
              <span className="text-lg">Info</span>
            </button>
            <button
              onClick={() => setShowClassmates(true)}
              className="bg-white text-black px-4 py-2 border-2 border-black font-bold uppercase shadow-[4px_4px_0px_0px_black] hover:-translate-y-[-2px] transition-all flex items-center gap-2"
            >
              <Users size={18} />
              <span>Classmates</span>
            </button>
            <button
              onClick={() => setShowChat(true)}
              className="bg-[#9333EA] text-white px-4 py-2 border-2 border-black font-bold uppercase shadow-[4px_4px_0px_0px_black] hover:-translate-y-[-2px] transition-all flex items-center gap-2"
            >
              <MessageCircle size={18} />
              <span>Global Chat</span>
            </button>
            <button
              onClick={() => setShowLeaderboard(true)}
              className="bg-white text-black px-4 py-2 border-2 border-black font-bold uppercase shadow-[4px_4px_0px_0px_black] hover:-translate-y-[-2px] transition-all flex items-center gap-2"
            >
              <Trophy size={18} />
              <span>Leaderboard</span>
            </button>
            <button
              onClick={() => setShowProfile(true)}
              className="bg-white text-black px-4 py-2 border-2 border-black font-bold uppercase shadow-[4px_4px_0px_0px_black] hover:-translate-y-[-2px] transition-all flex items-center gap-2"
            >
              <User size={18} />
              <span>Profile</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md cursor-pointer transition-colors" onClick={() => logout()}>
              <LogOut size={16} />
              <span className="font-bold">Logout</span>
            </div>
          </div>

          {/* Mobile Menu & Leaderboard Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setShowTutorial(true)}
              className="p-2 bg-yellow-400 text-black border-2 border-black shadow-[2px_2px_0px_black] active:translate-y-[2px] active:shadow-none"
            >
              <HelpCircle size={24} />
            </button>
            <button
              onClick={() => setShowLeaderboard(true)}
              className="p-2 bg-yellow-400 text-black border-2 border-black shadow-[2px_2px_0px_black] active:translate-y-[2px] active:shadow-none"
            >
              <Trophy size={24} />
            </button>
            <button
              className="p-2 bg-white text-black border-2 border-black shadow-[2px_2px_0px_black] active:translate-y-[2px] active:shadow-none"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav >

      {isMenuOpen && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          ></div>

          <div className="relative w-72 bg-[#FFCC00] h-full border-l-4 border-black shadow-[-8px_8px_0px_0px_rgba(0,0,0,0.5)] flex flex-col gap-6 animate-slide-in-right overflow-y-auto p-6">
            <div className="absolute inset-0 opacity-10 paper-texture pointer-events-none"></div>

            <div className="relative z-10 flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black font-mountains text-black uppercase tracking-wider">Menu</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 bg-white border-2 border-black hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_black]"
              >
                <X size={24} className="text-black" />
              </button>
            </div>

            <div className="relative z-10 flex flex-col gap-4">
              {/* PWA Install Button */}
              {deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="bg-[#00FF00] text-black px-4 py-4 border-4 border-black font-black flex items-center gap-3 hover:-translate-y-1 transition-all shadow-[4px_4px_0px_black] animate-pulse"
                >
                  <Download size={24} />
                  INSTALL APP
                </button>
              )}
              <button
                onClick={() => { setShowProfile(true); setIsMenuOpen(false); }}
                className="bg-white text-black px-4 py-4 border-4 border-black font-black flex items-center gap-3 hover:-translate-y-1 transition-all shadow-[4px_4px_0px_black]"
              >
                <User size={24} />
                MY PROFILE
              </button>
              <button
                onClick={() => { setShowClassmates(true); setIsMenuOpen(false); }}
                className="bg-white text-black px-4 py-4 border-4 border-black font-black flex items-center gap-3 hover:-translate-y-1 transition-all shadow-[4px_4px_0px_black]"
              >
                <Users size={24} />
                CLASSMATES
              </button>
              <button
                onClick={() => { setShowChat(true); setIsMenuOpen(false); }}
                className="bg-[#9333EA] text-white px-4 py-4 border-4 border-black font-black flex items-center gap-3 hover:-translate-y-1 transition-all shadow-[4px_4px_0px_black]"
              >
                <MessageCircle size={24} />
                GLOBAL CHAT
              </button>
              <button
                onClick={() => { logout(); setIsMenuOpen(false); }}
                className="bg-[#C41E3A] text-white px-4 py-4 border-4 border-black font-black flex items-center gap-3 hover:-translate-y-1 transition-all shadow-[4px_4px_0px_black]"
              >
                <LogOut size={24} />
                LOGOUT
              </button>
            </div>
          </div>
        </div>
      )
      }

      <main className="relative max-w-7xl mx-auto px-4 py-8 pt-28 space-y-8 pb-52">
        {/* Guide & Chat */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SantaGuide />
          {/* SantaChat was here but it's fixed, so position doesn't matter much in grid but cleaner to move out */}
        </div>

        {/* News Feed */}
        {/* News Feed - Self-contained */}
        <NewsFeed />


        {/* Polls Section */}
        <section>
          <PollsWidget />
        </section>

        <section>
          {completedGames.length > 0 && <DailyGame onGameComplete={fetchCompletedGames} />}
        </section>

        {/* Tasks Section */}
        <section id="tasks-section">
          <div className="flex items-center justify-between mb-6">
            <div className="bg-yellow-400 text-black p-3 border-4 border-black shadow-[4px_4px_0px_0px_black] transform rotate-1">
              <h2 className="text-xl font-black uppercase flex items-center gap-2">
                <CheckCircle size={24} />
                Your Tasks
              </h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map(task => (
              <div key={task.id}
                className={`bg - white border - 4 border - black p - 4 shadow - [8px_8px_0px_0px_black] transition - all hover: -translate - y - 1 relative overflow - hidden ${task.userTask?.completed ? 'opacity-80' : ''} `}
              >
                {task.userTask?.completed && (
                  <div className="absolute top-0 right-0 bg-[#00A86B] text-white text-xs font-black px-2 py-1 border-l-2 border-b-2 border-black">
                    DONE
                  </div>
                )}
                <h3 className="font-black text-xl mb-2">{task.title}</h3>
                <p className="font-bold text-gray-600 mb-4 text-sm">{task.description}</p>

                <div className="flex items-center justify-between mt-auto">
                  <span className="font-black text-[#C41E3A] bg-yellow-100 px-2 py-1 border-2 border-black text-sm">{task.points} PTS</span>
                  <button
                    onClick={() => toggleTask(task)}
                    disabled={task.userTask?.completed}
                    className={`px - 4 py - 2 border - 2 border - black font - black uppercase text - sm shadow - [2px_2px_0px_0px_black] transition - all 
                                        ${task.userTask?.completed
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-[#00FF00] text-black hover:bg-[#00cc00] active:translate-y-1 active:shadow-none'
                      } `}
                  >
                    {task.userTask?.completed ? 'Completed' : 'Complete'}
                  </button>
                </div>
              </div>
            ))}

          </div>
        </section>

        {/* Daily Game Section Replaced with FlashCard if needed, but keeping logic */}
        <div className="mt-8">
          <TodaysBonusTask />
        </div>

        {/* Dashboard Stats / Main Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* 1. Identity Card - White */}
          <div className="bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_black] relative h-full flex flex-col justify-between">
            <div className="absolute -top-3 -right-2 bg-black text-white px-2 py-0.5 text-xs font-bold uppercase">Identity</div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 border-2 border-black rounded-full flex items-center justify-center overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} alt="Avatar" className="w-full h-full" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase leading-tight">{profile?.name || 'Loading...'}</h2>
                <div className="bg-white border border-black px-1 text-xs font-mono mt-1 inline-block">{profile?.roll_number}</div>
              </div>
            </div>
            <div className="mt-4 border-t-2 border-dashed border-gray-400 pt-2">
              <p className="font-hand text-gray-600 text-sm italic">"{profile?.bio || 'Ready for Christmas!'}"</p>
            </div>
          </div>

          {/* 2. Points Card - Yellow */}
          <div className="bg-[#FFD700] border-4 border-black p-4 shadow-[8px_8px_0px_0px_black] relative h-full flex flex-col items-center justify-center text-center">
            <div className="absolute -top-3 -right-2 bg-black text-white px-2 py-0.5 text-xs font-bold uppercase">Score</div>
            <div className="text-xs font-black uppercase tracking-widest mb-1">Your Points</div>
            <div className="text-5xl font-black flex items-center gap-2">
              <Trophy size={40} strokeWidth={2.5} />
              {profile?.points || 0}
            </div>
            <button
              onClick={() => setShowLeaderboard(true)}
              className="mt-4 bg-white text-black text-xs font-black uppercase px-6 py-2 border-2 border-black shadow-[2px_2px_0px_0px_black] hover:translate-y-[-2px] transition-all"
            >
              View Leaderboard
            </button>
          </div>

          {/* 3. Countdown Card - Green */}
          <div className="bg-[#00A86B] border-4 border-black p-4 shadow-[8px_8px_0px_0px_black] relative h-full text-white flex flex-col justify-between">
            <div className="absolute -top-3 -right-2 bg-white text-black border border-black px-2 py-0.5 text-xs font-bold uppercase">Countdown</div>
            <div className="flex items-start justify-between">
              <Calendar size={32} />
              <div className="text-right">
                <div className="text-xs font-bold uppercase opacity-80">Days Until Gifting</div>
                <div className="text-4xl font-black">
                  {appSettings?.show_gifting_day ? getDaysUntilGifting() : '??'}
                </div>
              </div>
            </div>
            <div className="mt-4 bg-black/20 p-2 font-mono text-xs text-center border border-white/50">
              {appSettings?.show_gifting_day && appSettings?.gifting_day
                ? new Date(appSettings.gifting_day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : 'Run! Santa is coming!'}
            </div>
          </div>
        </div>

        {/* Quick Action Buttons Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => { document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="bg-[#C41E3A] text-white h-16 border-4 border-black shadow-[8px_8px_0px_0px_black] font-black uppercase text-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-3"
          >
            Daily Tasks
          </button>
          <button
            onClick={() => { document.getElementById('pairing-zone')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="bg-white text-black h-16 border-4 border-black shadow-[8px_8px_0px_0px_black] font-black uppercase text-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
          >
            My Secret Santa
          </button>
        </div>

        {/* Secret Santa & Giftee Section */}
        <section className="mt-12" id="pairing-zone">
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_black]">
            <h2 className="text-2xl font-black uppercase mb-6 text-center border-b-4 border-black pb-4">
              🎁 Pairing Zone 🎁
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* My Giftee */}
              <div className="bg-[#C41E3A] p-4 border-4 border-black shadow-[4px_4px_0px_0px_black] relative">
                <div className="absolute -top-3 -left-3 bg-[#9333EA] text-white px-3 py-1 border-2 border-black font-black uppercase text-sm transform -rotate-3">
                  Your Giftee
                </div>
                {myGiftee ? (
                  <div className="text-center mt-4">
                    <div className="text-6xl mb-2">{myGiftee.favorite_emoji || '👤'}</div>
                    <h3 className="font-black text-2xl uppercase mb-2">{myGiftee.name}</h3>
                    <div className="inline-block bg-white px-3 py-1 border-2 border-black font-mono font-bold text-sm mb-4">
                      {myGiftee.roll_number}
                    </div>
                    <button
                      onClick={() => setSelectedProfile(myGiftee)}
                      className="w-full bg-black text-white py-2 font-black uppercase border-2 border-black hover:bg-gray-800 transition-colors"
                    >
                      View Profile
                    </button>

                    {/* Game Console for Giftee */}
                    <div className="mt-6 border-t-2 border-black pt-4">
                      <button
                        onClick={() => { setGameTab('giftee_tictactoe'); }}
                        className={`w - full py - 2 border - 2 border - black font - black uppercase mb - 2 shadow - [2px_2px_0px_0px_black] flex items - center justify - center gap - 2 ${activeTurnGames.giftee ? 'bg-yellow-400 animate-pulse' : 'bg-white hover:bg-gray-50'} `}
                      >
                        Challenge {myGiftee.name} {activeTurnGames.giftee && '🔴'}
                      </button>
                      {activeTurnGames.giftee && <div className="text-xs font-bold text-red-600 animate-bounce">YOUR TURN!</div>}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 opacity-50">
                    <div className="text-4xl mb-2">🎁</div>
                    <p className="font-bold">Pairing is in progress...</p>
                  </div>
                )}
              </div>

              {/* Secret Santa */}
              <div className="bg-[#FFF8DC] p-4 border-4 border-black shadow-[4px_4px_0px_0px_black] relative">
                <div className="absolute -top-3 -right-3 bg-[#FFD700] text-black px-3 py-1 border-2 border-black font-black uppercase text-sm transform rotate-3">
                  Your Santa
                </div>
                {secretSanta ? (
                  <div className="text-center mt-4">
                    <div className="text-6xl mb-2">🎅❓</div>
                    <h3 className="font-black text-2xl uppercase mb-2">Secret Santa</h3>
                    <p className="font-bold text-gray-600 mb-4 text-sm">Someone is watching...</p>

                    {/* Santa Game Console */}
                    <div className="mt-6 border-t-2 border-black pt-4">
                      <button
                        onClick={() => { setGameTab('santa_tictactoe'); }}
                        className={`w - full py - 2 border - 2 border - black font - black uppercase mb - 2 shadow - [2px_2px_0px_0px_black] flex items - center justify - center gap - 2 ${activeTurnGames.santa ? 'bg-yellow-400 animate-pulse' : 'bg-white hover:bg-gray-50'} `}
                      >
                        Challenge Santa {activeTurnGames.santa && '🔴'}
                      </button>
                      {activeTurnGames.santa && <div className="text-xs font-bold text-red-600 animate-bounce">YOUR TURN!</div>}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 opacity-50">
                    <div className="text-4xl mb-2">🎅</div>
                    <p className="font-bold">Santa is preparing...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Game Modal */}
        {(gameTab === 'giftee_tictactoe' && myGiftee) && (
          <div className="mt-8">
            <div className="bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_black]">
              <div className="flex justify-between items-center mb-4 border-b-4 border-black pb-2">
                <h3 className="font-black text-lg uppercase">Tic-Tac-Toe vs {myGiftee.name}</h3>
              </div>
              <TicTacToe partnerId={myGiftee.id} isSanta={false} />
            </div>
          </div>
        )}

        {/* Fun Zone: New Games */}
        <section className="mb-8" id="fun-zone">
          {appSettings?.show_games && (
            <>
              {appSettings?.show_jumbled_words && (
                <div className="mb-8">
                  <JumbledWordsGame />
                </div>
              )}
              {appSettings?.show_bad_description && (
                <div className="mb-8">
                  <BadDescriptionGame />
                </div>
              )}
              {appSettings?.show_crossword && (
                <div className="mb-8">
                  <CrosswordGame />
                </div>
              )}
              {appSettings?.show_bingo && (
                <div className="mb-8">
                  <ChristmasBingo />
                </div>
              )}
            </>
          )}
        </section>

        {(gameTab === 'santa_tictactoe' && secretSanta) && (
          <div className="mt-8">
            <div className="bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_black]">
              <div className="flex justify-between items-center mb-4 border-b-4 border-black pb-2">
                <h3 className="font-black text-lg uppercase">Tic-Tac-Toe vs Santa</h3>
              </div>
              <TicTacToe partnerId={secretSanta.id} isSanta={true} />
            </div>
          </div>
        )}

        {/* General Game Sections */}
        <h2 className="text-3xl font-black font-mountains text-center mt-12 mb-6 uppercase tracking-wider relative inline-block w-full">
          <span className="relative z-10 bg-[#C41E3A] px-4">Fun Zone</span>
          <div className="absolute top-1/2 left-0 w-full h-1 bg-black -z-0"></div>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {appSettings?.show_games && (
            <>
              <KollywoodGame />
              <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_black]">
                <MemoryGame onGameComplete={fetchCompletedGames} />
              </div>{appSettings?.show_flappy_santa && <FlappySanta onGameComplete={fetchCompletedGames} />}
            </>
          )}
        </div>
        {/* Footer - Restored Pill Style */}
        {/* Footer - Larger & Single Line */}
        {/* Footer - Optimized for Mobile & Desktop */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[40] pointer-events-none w-full text-center px-2">
          <a
            href="https://instagram.com/_harishwasinnocent"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center font-black text-black bg-white px-3 py-2 md:px-6 md:py-3 border-[3px] md:border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] transition-all cursor-pointer pointer-events-auto whitespace-nowrap text-xs md:text-base no-underline gap-2 transform hover:rotate-1"
          >
            <span>Made with ❤️ by HarishAnnavisamy</span>
          </a>
        </div>

        {showTerms && <TermsModal onAccepted={handleTermsAccepted} />}

        {/* Modals */}
        {
          showProfile && (
            <ProfileModal onClose={() => setShowProfile(false)} />
          )
        }
        {
          showClassmates && (
            <ClassmatesModal onClose={() => setShowClassmates(false)} />
          )
        }
        {
          selectedProfile && (
            <ProfileModal
              onClose={() => setSelectedProfile(null)}
              viewOnly={true}
              targetProfile={selectedProfile}
            />
          )
        }
        {
          showLeaderboard && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white w-full max-w-2xl max-h-[80vh] overflow-y-auto border-4 border-black p-4 shadow-[10px_10px_0px_0px_black] relative">
                <button onClick={() => setShowLeaderboard(false)} className="absolute top-4 right-4 text-black hover:rotate-90 transition-transform"><X size={32} /></button>
                <Leaderboard onClose={() => setShowLeaderboard(false)} />
              </div>
            </div>
          )
        }
        {/* Global Chat Modal */}
        {showChat && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg h-[80vh] border-4 border-black shadow-[8px_8px_0px_0px_white] relative flex flex-col">
              <button
                onClick={() => setShowChat(false)}
                className="absolute -top-4 -right-4 bg-red-600 text-white p-2 border-2 border-black font-bold hover:bg-red-700 shadow-[4px_4px_0px_0px_black] z-[210] rounded-full"
              >
                <X size={24} />
              </button>
              <div className="flex-1 w-full h-full overflow-hidden">
                <GlobalChat mode="embedded" />
              </div>
            </div>
          </div>
        )}

        {/* Tutorial Modal */}
        {showTutorial && <VisualTutorial onClose={() => setShowTutorial(false)} />}
      </main>
    </div >
  );
}

