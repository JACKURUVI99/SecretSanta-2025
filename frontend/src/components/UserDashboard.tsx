import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Profile, Task, UserTask, AppSettings } from '../lib/supabase';
import { api } from '../lib/api';
import ChristmasBackground from './ChristmasBackground';
import ProfileModal from './ProfileModal';
import Leaderboard from './Leaderboard';
import KollywoodGame from './KollywoodGame';
import NewsFeed from './NewsFeed';
import TodaysBonusTask from './TodaysBonusTask';
import DailyGame from './DailyGame';
import GlobalChat from './GlobalChat';
import TicTacToe from './TicTacToe';
import SantaRPS from './SantaRPS';
import SantaGuide from './SantaGuide';
import SantaChat from './SantaChat'; // New AI Chat
import MemoryGame from './MemoryGame';
import { LogOut, User, Trophy, Calendar, Menu, X } from 'lucide-react';
import SerialLights from './SerialLights';

export default function UserDashboard() {
  const { profile, signOut, refreshProfile } = useAuth();
  const [tasks, setTasks] = useState<(Task & { userTask?: UserTask })[]>([]);
  const [secretSanta, setSecretSanta] = useState<Profile | null>(null);
  const [myGiftee, setMyGiftee] = useState<Profile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'santa'>('tasks');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [gameTab, setGameTab] = useState<'giftee_tictactoe' | 'santa_tictactoe' | 'grinch'>('giftee_tictactoe');
  const [activeTurnGames, setActiveTurnGames] = useState({ santa: false, giftee: false });
  const [completedGames, setCompletedGames] = useState<string[]>([]);

  // Check turns for notifications
  const checkGameTurns = useCallback(async () => {
    if (!profile) return;
    let santaTurn = false;
    let gifteeTurn = false;

    // Check Santa Turn
    if (secretSanta) {
      try {
        const data = await api.getActiveGame(secretSanta.id);
        if (data && data.turn === profile.id) santaTurn = true;
      } catch (e) { /* ignore */ }
    }

    // Check Giftee Turn
    if (myGiftee) {
      try {
        const data = await api.getActiveGame(myGiftee.id);
        if (data && data.turn === profile.id) gifteeTurn = true;
      } catch (e) { /* ignore */ }
    }
    setActiveTurnGames({ santa: santaTurn, giftee: gifteeTurn });
  }, [profile, secretSanta, myGiftee]);

  const handleDayClick = async (date: number) => {
    const today = new Date().getDate(); // Simple check for now
    if (date > today) return;
    // Logic for opening game modal ...
    // Note: Daily checkin happens inside DailyGame component usually?
    // UserDashboard has lines 153 for checkin. Let's find where it is.
  };


  const fetchSettings = useCallback(async () => {
    // Attempt to fetch from app_settings first (preferred)
    const { data: appSettingsData, error } = await supabase
      .from('app_settings')
      .select('*')
      .limit(1)
      .single();

    let finalData = appSettingsData;

    // Fallback to admin_settings if app_settings fails or is empty (legacy support)
    if (error || !finalData) {
      const { data: adminData } = await supabase
        .from('admin_settings')
        .select('*')
        .limit(1)
        .single();
      if (adminData) finalData = adminData;
    }

    if (finalData) setSettings(finalData);
  }, []);

  const fetchTasks = useCallback(async () => {
    if (!profile) return;

    // 1. Fetch All tasks
    const { data: allTasks } = await supabase
      .from('tasks')
      .select('*')
      .order('task_date', { ascending: false });

    if (!allTasks) return;

    // 2. Fetch User Completions (VIA PROXY)
    // const { data: userCompletions } = await supabase.from('user_tasks').select('*').eq('user_id', profile.id);

    // New Backend Proxy Call
    const userCompletions = await api.getUserTasks();

    // 3. Merge
    const mergedTasks = allTasks.map((t) => ({
      ...t,
      userTask: userCompletions?.find((uc) => uc.task_id === t.id),
    }));

    setTasks(mergedTasks);
  }, [profile]);

  const fetchPairingData = useCallback(async () => {
    if (!profile) return;

    // 1. Who is my Santa? (I am the user_id)
    const { data: mySantaPairing } = await supabase
      .from('pairings')
      .select('secret_santa_id')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (mySantaPairing) {
      const { data: realSanta } = await supabase.from('profiles').select('*').eq('id', mySantaPairing.secret_santa_id).single();
      setSecretSanta(realSanta);
    }

    // 2. Who is my Giftee? (I am the secret_santa_id)
    const { data: myTargetPairing } = await supabase
      .from('pairings')
      .select('user_id')
      .eq('secret_santa_id', profile.id)
      .maybeSingle();

    if (myTargetPairing) {
      const { data: targetUser } = await supabase.from('profiles').select('*').eq('id', myTargetPairing.user_id).single();
      setMyGiftee(targetUser);
    }
  }, [profile]);

  const checkDailyLogin = useCallback(async () => {
    if (!profile) return;
    const today = new Date().toISOString().split('T')[0];

    // Check if already checked in
    const { data: existing } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', profile.id)
      .eq('checkin_date', today)
      .single();

    if (!existing) {
      // Create checkin
      // Submit Checkin via Proxy
      try {
        await api.dailyCheckin(today);
      } catch (e) { /* ignore if already checked in */ }
      // Award points? (Logic might be in trigger or RPC, staying safe here)
    }
  }, [profile]);

  const fetchCompletedGames = useCallback(async () => {
    if (!profile) return;
    const today = new Date().toISOString().split('T')[0];
    const completed: string[] = [];

    // Check Memory Game
    const { data: mem } = await supabase.from('memory_game_scores').select('id').eq('user_id', profile.id).gte('created_at', today).limit(1);
    if (mem && mem.length > 0) completed.push('memory');

    // Check TicTacToe (Giftee) - if game is finished today
    if (myGiftee) {
      const { data: ttt } = await supabase.from('tictactoe_games')
        .select('status')
        .or(`and(player_x.eq.${profile.id},player_o.eq.${myGiftee.id}),and(player_x.eq.${myGiftee.id},player_o.eq.${profile.id})`)
        .eq('status', 'finished')
        .gte('created_at', today)
        .limit(1);
      if (ttt && ttt.length > 0) completed.push('tictactoe');
    }

    // Check Santa Games
    if (secretSanta) {
      const { data: tttSanta } = await supabase.from('tictactoe_games')
        .select('status')
        .or(`and(player_x.eq.${profile.id},player_o.eq.${secretSanta.id}),and(player_x.eq.${secretSanta.id},player_o.eq.${profile.id})`)
        .eq('status', 'finished')
        .gte('created_at', today)
        .limit(1);
      if (tttSanta && tttSanta.length > 0) completed.push('santa_tictactoe');

      // Check RPS
      /* 
      // Need a table for RPS or check logic
      const { data: rps } = ... 
      */
    }

    setCompletedGames(completed);
  }, [profile, myGiftee, secretSanta]);


  // Init Effect: Fetch settings immediately
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Main Effect: Depends on profile and settings being loaded
  useEffect(() => {
    if (profile && settings) {
      fetchTasks();
      checkDailyLogin();
      fetchPairingData();
      fetchCompletedGames();
      checkGameTurns(); // Initial check

      // 🔄 POLLING BACKUP (Refreshes data every 4 seconds)
      const interval = setInterval(() => {
        fetchTasks();
        fetchSettings();
        fetchCompletedGames();
        refreshProfile(); // Keep points in sync periodically
        checkGameTurns(); // Poll for turns
      }, 4000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [profile, settings, fetchTasks, checkDailyLogin, fetchPairingData, fetchCompletedGames, checkGameTurns, fetchSettings, refreshProfile]);

  if (settings?.maintenance_mode && !profile?.is_admin) {
    return (
      <div className="min-h-screen bg-[#E0E7FF] font-mono flex items-center justify-center flex-col text-center p-4">
        <ChristmasBackground />
        <div className="bg-white border-4 border-black p-8 shadow-[10px_10px_0px_0px_black] max-w-lg z-10 animate-bounce-in">
          <h1 className="text-4xl filter drop-shadow-md mb-4">🚧 🎅 🚧</h1>
          <h2 className="text-2xl font-black uppercase mb-4 text-[#C41E3A]">struction</h2>
          <p className="font-bold text-gray-700 mb-6">Values are being recalibrated by the Elves. PLease wait...</p>
          <div className="animate-pulse bg-[#00A86B] text-white px-4 py-2 font-black uppercase inline-block border-2 border-black shadow-[4px_4px_0px_0px_black]">
            Check back soon!
          </div>
        </div>
      </div>
    );
  }

  const toggleTask = async (task: Task & { userTask?: UserTask }) => {
    // SECURE: Use RPC to toggle and update points server-side
    // This prevents users from manipulating their own score via API
    try {
      const { error } = await supabase.rpc('toggle_dashboard_task', {
        p_user_id: profile!.id,
        p_task_id: task.id
      });
      if (error) throw error;
      // Optimistic update or refetch
      fetchTasks();
      refreshProfile(); // 🔄 IMMEDIATE POINTS SYNC
    } catch (err) {
      console.error("Error toggling task:", err);
      alert("Failed to update task");
    }
  };

  const getDaysUntilGifting = () => {
    if (!settings?.gifting_day) return 0;
    const today = new Date();
    const giftingDay = new Date(settings.gifting_day);
    const diff = giftingDay.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-[#E0E7FF] font-mono relative">
      <ChristmasBackground />
      <SerialLights /> { }

      <div className="relative z-10">
        <header className="bg-white border-b-4 border-black shadow-[0px_4px_0px_0px_rgba(0,0,0,0.1)] sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl animate-bounce">🎅</span>
              <div>
                <h1 className="text-2xl md:text-3xl font-black font-mountains text-black tracking-wide" style={{ textShadow: "2px 2px 0px #C41E3A" }}>Secret Santa'25</h1>
                <p className="text-xs font-bold text-white bg-[#C41E3A] px-2 py-0.5 inline-block border-2 border-black transform -rotate-2 shadow-[2px_2px_0px_ black]">Ho Ho Ho! 🎄</p>
              </div>
            </div>
            { }
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => setShowProfile(true)}
                className="bg-white text-black px-4 py-2 border-2 border-black font-bold uppercase shadow-[4px_4px_0px_0px_black] hover:translate-y-[-2px] transition-all flex items-center gap-2"
              >
                <User size={18} />
                <span>Profile</span>
              </button>
              <button
                onClick={signOut}
                className="bg-[#C41E3A] text-white px-4 py-2 border-2 border-black font-bold uppercase shadow-[4px_4px_0px_0px_black] hover:translate-y-[-2px] transition-all flex items-center gap-2"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
            { }
            <button
              className="md:hidden p-2 bg-yellow-400 text-black border-2 border-black shadow-[2px_2px_0px_black] active:translate-y-[2px] active:shadow-none"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu size={28} />
            </button>
          </div>
        </header>
        { }
        {isMenuOpen && (
          <div className="fixed inset-0 z-[200] flex justify-end">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsMenuOpen(false)}
            ></div>

            {/* Menu Content - Comic Style */}
            <div className="relative w-72 bg-[#FFCC00] h-full border-l-4 border-black shadow-[-8px_8px_0px_0px_rgba(0,0,0,0.5)] flex flex-col gap-6 animate-slide-in-right overflow-y-auto p-6">
              {/* Pattern */}
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
                <button
                  onClick={() => { setShowProfile(true); setIsMenuOpen(false); }}
                  className="bg-white text-black px-4 py-4 border-4 border-black font-black flex items-center gap-3 hover:-translate-y-1 transition-all shadow-[4px_4px_0px_black]"
                >
                  <User size={24} />
                  MY PROFILE
                </button>
                <button
                  onClick={() => { signOut(); setIsMenuOpen(false); }}
                  className="bg-[#C41E3A] text-white px-4 py-4 border-4 border-black font-black flex items-center gap-3 hover:-translate-y-1 transition-all shadow-[4px_4px_0px_black]"
                >
                  <LogOut size={24} />
                  LOGOUT
                </button>
                <button
                  onClick={() => { window.open('mailto:harish@example.com?subject=Secret Santa Report'); setIsMenuOpen(false); }}
                  className="bg-white text-black px-4 py-4 border-4 border-black font-black flex items-center gap-3 hover:-translate-y-1 transition-all shadow-[4px_4px_0px_black]"
                >
                  <span className="text-xl">⚠️</span>
                  REPORT ISSUE
                </button>
              </div>

              <div className="mt-auto text-center font-black text-xs uppercase tracking-widest text-black pt-6 border-t-4 border-black/10 relative z-10">
                <p>Secret Santa '25</p>
                <p className="mt-1 flex items-center justify-center gap-1">Made with <span className="animate-pulse">❤️</span></p>
              </div>
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 py-8 pb-32">
          {settings?.show_news && <NewsFeed />}
          {settings?.show_bonus_tasks && <TodaysBonusTask />}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            { }
            <div className="comic-box paper-texture p-6 h-full flex flex-col justify-between relative group hover:rotate-1">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-1 font-black uppercase text-sm -rotate-1 border-2 border-white shadow-lg z-20">Elf Identity</div>
              {/* Tape */}
              <div className="absolute top-0 right-1/2 w-8 h-32 bg-yellow-200/50 transform rotate-45 border-l border-r border-white/40"></div>

              <div className="flex flex-col items-center mt-6 relative z-10">
                <div className="w-32 h-32 bg-white border-4 border-black rounded-full flex items-center justify-center text-6xl shadow-[4px_4px_0px_black] mb-4">
                  <span className="group-hover:scale-110 transition-transform">{profile?.favorite_emoji}</span>
                </div>
                <h2 className="text-3xl font-black text-black uppercase text-center leading-none mb-1">{profile?.name}</h2>
                <div className="bg-[#C41E3A] text-white px-3 py-1 font-black text-sm border-2 border-black shadow-[2px_2px_0px_black] rotate-2">
                  #{profile?.roll_number}
                </div>
              </div>
              <p className="text-center font-bold font-mono text-gray-700 mt-4 leading-tight bg-white p-2 border-2 border-black border-dashed">
                "{profile?.bio || 'An elf of few words...'}"
              </p>
            </div>
            { }
            <div className="comic-box comic-yellow p-6 relative overflow-visible h-full flex flex-col justify-between">
              <div className="absolute top-0 right-0 stamp transform rotate-12 bg-white opacity-100 shadow-sm">SCORE</div>

              <div className="flex items-center gap-4 mb-2 mt-8 relative z-10">
                <div className="bg-white p-3 border-4 border-black shadow-[4px_4px_0px_black]">
                  <Trophy size={40} strokeWidth={3} className="text-black" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-black tracking-widest">Current Score</p>
                  <h2 className="text-7xl font-black text-black leading-none drop-shadow-sm">{profile?.points}</h2>
                </div>
              </div>
              <button
                onClick={() => setShowLeaderboard(true)}
                className="mt-6 w-full bg-white text-black border-4 border-black py-3 font-black uppercase hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_black] transition-all shadow-[4px_4px_0px_black]"
              >
                View Leaderboard
              </button>
            </div>
            { }
            <div className="comic-box comic-green text-white p-6 relative overflow-hidden h-full flex flex-col justify-between">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>

              <div className="absolute top-2 right-2 border-2 border-white px-2 py-0.5 font-black uppercase text-xs transform rotate-2">COUNTDOWN</div>

              {settings?.show_gifting_day ? (
                <>
                  <div className="flex items-center gap-4 mb-2 mt-6 relative z-10">
                    <div className="bg-white p-3 border-4 border-black shadow-[4px_4px_0px_black]">
                      <Calendar size={40} strokeWidth={3} className="text-black" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-white tracking-widest">Days Remaining</p>
                      <h2 className="text-7xl font-black text-white leading-none text-shadow-md">{getDaysUntilGifting()}</h2>
                    </div>
                  </div>
                  {settings.gifting_day && (
                    <div className="mt-4 bg-black text-white p-2 border-2 border-white text-center font-black uppercase shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
                      Target: {new Date(settings.gifting_day).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      }).toUpperCase()}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[100px] relative z-10">
                  <div className="text-6xl mb-2 animate-bounce">🎁</div>
                  <div className="bg-black text-white px-4 py-2 font-black border-2 border-white uppercase tracking-widest transform -rotate-2">
                    SOON...
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-4 mb-6">
            { }
            {settings?.show_news && (
              <div className="w-full mb-6">
                <NewsFeed />
              </div>
            )}
          </div>
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 py-4 border-4 border-black font-black uppercase text-lg shadow-[6px_6px_0px_0px_black] transition-all hover:-translate-y-1 ${activeTab === 'tasks'
                ? 'bg-[#FFD700] text-black'
                : 'bg-white text-black hover:bg-gray-50'
                }`}
            >
              Daily Games
            </button>
            {settings?.show_secret_santa && (
              <button
                onClick={() => setActiveTab('santa')}
                className={`flex-1 py-4 border-4 border-black font-black uppercase text-lg shadow-[6px_6px_0px_0px_black] transition-all hover:-translate-y-1 ${activeTab === 'santa'
                  ? 'bg-[#00A86B] text-white'
                  : 'bg-white text-black hover:bg-gray-50'
                  }`}
              >
                My Secret Santa
              </button>
            )}
          </div>
          {activeTab === 'tasks' && (
            <div className="space-y-6">


              {settings?.show_kollywood && <KollywoodGame />}
              { }
              {settings?.show_games && (
                <div className="my-8">
                  <DailyGame />
                </div>
              )}
              { }
              {settings?.show_memory_game && !completedGames.includes('memory') ? (
                <div className="my-8">
                  <MemoryGame onGameComplete={() => {
                    fetchCompletedGames();
                    refreshProfile();
                  }} />
                </div>
              ) : settings?.show_memory_game && (
                <div className="my-8 bg-gray-100/50 p-6 border-2 border-dashed border-gray-300 rounded-lg text-center opacity-75">
                  <p className="font-bold text-gray-500">✅ Memory Game Completed</p>
                  <p className="text-xs">Come back tomorrow!</p>
                </div>
              )}
              { }
              {tasks.length > 0 && settings?.show_bonus_tasks && (
                <div className="mt-8 pt-8 border-t-4 border-black">
                  <h3 className="text-xl font-black uppercase mb-4">Bonus Tasks</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasks.filter(t => !t.userTask?.completed).length === 0 && (
                      <div className="col-span-full text-center py-10 bg-white/50 rounded-lg border-2 border-dashed border-gray-400">
                        <p className="text-xl font-bold text-gray-600">🎉 All tasks completed! Great job! 🎅</p>
                        <p className="text-sm">Check back later for bonus tasks.</p>
                      </div>
                    )}
                    {tasks.filter(t => !t.userTask?.completed).map((task) => (
                      <div
                        key={task.id}
                        className={`bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_black] transition-all hover:-translate-y-2 relative overflow-hidden group ${task.is_bonus ? 'bg-gradient-to-br from-yellow-100 to-yellow-300' : ''
                          }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-black text-black uppercase">{task.title}</h3>
                              <span className="bg-[#FFD700] text-black border-2 border-black px-3 py-1 text-sm font-black shadow-[2px_2px_0px_0px_black]">
                                +{task.points} pts
                              </span>
                            </div>
                            <p className="text-gray-800 font-bold">{task.description}</p>
                          </div>
                          <button
                            onClick={() => toggleTask(task)}
                            className="px-6 py-3 border-2 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_black] transition-all hover:-translate-y-1 active:translate-y-0 active:shadow-none bg-white text-black hover:bg-gray-50"
                          >
                            Mark Done
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'santa' && (
            <div className="space-y-6">
              { }
              {settings?.show_tictactoe && (
                <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] p-4 mb-8">
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {myGiftee && (
                      <button
                        onClick={() => setGameTab('giftee_tictactoe')}
                        className={`flex-1 min-w-[140px] px-4 py-2 border-2 border-black font-black uppercase text-xs sm:text-sm shadow-[2px_2px_0px_0px_black] transition-all relative ${gameTab === 'giftee_tictactoe' ? 'bg-[#00A86B] text-white' : 'bg-white text-black'}`}
                      >
                        Vs Giftee
                        {/* Notification Dot */}
                        {activeTurnGames.giftee && (
                          <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-600 rounded-full border-2 border-white animate-pulse"></span>
                        )}
                      </button>
                    )}
                    {secretSanta && (
                      <button
                        onClick={() => setGameTab('santa_tictactoe')}
                        className={`flex-1 min-w-[140px] px-4 py-2 border-2 border-black font-black uppercase text-xs sm:text-sm shadow-[2px_2px_0px_0px_black] transition-all relative ${gameTab === 'santa_tictactoe' ? 'bg-[#C41E3A] text-white' : 'bg-white text-black'}`}
                      >
                        Vs Santa
                        {/* Notification Dot */}
                        {activeTurnGames.santa && (
                          <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-600 rounded-full border-2 border-white animate-pulse"></span>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => setGameTab('grinch')}
                      className={`flex-1 min-w-[140px] px-4 py-2 border-2 border-black font-black uppercase text-xs sm:text-sm shadow-[2px_2px_0px_0px_black] transition-all ${gameTab === 'grinch' ? 'bg-black text-white' : 'bg-white text-black'}`}
                    >
                      Beat Grinch 👹
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="min-h-[300px] flex items-center justify-center">
                    {gameTab === 'giftee_tictactoe' && myGiftee && (
                      <div className="w-full max-w-sm">
                        <h3 className="font-black font-mountains text-xl mb-2 text-[#00A86B] text-center">Challenge Your Giftee</h3>
                        <p className="text-sm font-bold text-gray-700 mb-4 text-center">Play with {myGiftee.name}!</p>
                        {!completedGames.includes('tictactoe') ? (
                          <TicTacToe
                            partnerId={myGiftee.id}
                            isSanta={false}
                            onGameComplete={() => {
                              fetchCompletedGames();
                              refreshProfile();
                            }}
                          />
                        ) : (
                          <div className="bg-gray-100/50 p-6 border-2 border-dashed border-gray-300 rounded-lg text-center opacity-75">
                            <p className="font-bold text-gray-500">✅ Tic-Tac-Toe Played</p>
                            <p className="text-xs">Come back tomorrow!</p>
                          </div>
                        )}
                      </div>
                    )}

                    {gameTab === 'santa_tictactoe' && secretSanta && (
                      <div className="w-full max-w-sm">
                        <h3 className="font-black font-mountains text-xl mb-2 text-[#C41E3A] text-center">Secret Santa Tic-Tac-Toe</h3>
                        <p className="text-sm font-bold text-gray-700 mb-4 text-center">Play with your Santa!</p>
                        {!completedGames.includes('santa_tictactoe') ? (
                          <TicTacToe
                            partnerId={secretSanta.id}
                            isSanta={true}
                            gameId="santa_tictactoe"
                            onGameComplete={() => {
                              fetchCompletedGames();
                              checkDailyLogin();
                              refreshProfile();
                            }}
                          />
                        ) : (
                          <div className="bg-gray-100/50 p-6 border-2 border-dashed border-gray-300 rounded-lg text-center opacity-75">
                            <p className="font-bold text-gray-500">✅ Daily Challenge Completed</p>
                            <p className="text-xs">Come back tomorrow!</p>
                          </div>
                        )}
                      </div>
                    )}

                    {gameTab === 'grinch' && secretSanta && (
                      <div className="w-full max-w-sm text-center">
                        <div className="text-4xl mb-2 filter drop-shadow-lg animate-bounce">👹</div>
                        <h3 className="font-black font-mountains text-xl mb-2 text-gray-800">Beat The Grinch</h3>
                        <p className="text-sm font-bold text-gray-700 mb-4">Win points instantly!</p>
                        {!completedGames.includes('santa_rps') ? (
                          <SantaRPS
                            partnerId={secretSanta.id}
                            isSanta={true}
                            onGameComplete={() => {
                              fetchCompletedGames();
                              checkDailyLogin();
                              refreshProfile();
                            }}
                          />
                        ) : (
                          <div className="bg-gray-100/50 p-6 border-2 border-dashed border-gray-300 rounded-lg text-center opacity-75">
                            <p className="font-bold text-gray-500">✅ Grinch Defeated</p>
                            <p className="text-xs">Come back tomorrow!</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              { }
              <div className="relative frost-glass p-8 text-center transform rotate-1 border-t-8 border-[#00A86B]">
                {/* Decoration */}
                <div className="absolute top-0 right-0 p-2 opacity-20 transform rotate-12">
                  <svg width="60" height="40" viewBox="0 0 24 24" fill="none" stroke="#00A86B" strokeWidth="2"><path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5H12zM12 7h4.5a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 0 0 5H12z"></path></svg>
                </div>
                <h2 className="text-3xl font-black font-mountains mb-4 text-[#00A86B]">You are Gifting...</h2>

                <div className="bg-white/90 p-6 rounded-lg inline-block transform -rotate-1 relative shadow-xl max-w-full border-4 border-[#00A86B]">
                  {/* Badge */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-[#00A86B] rounded-full border-2 border-white shadow-sm"></div>
                  {myGiftee ? (
                    <div
                      className="cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => {
                        setSelectedProfile(myGiftee);
                      }}
                    >
                      <span className="text-6xl mb-4 block filter drop-shadow-md">🎁</span>
                      <p className="text-3xl md:text-4xl font-black uppercase mb-2 text-black hover:text-[#00A86B] transition-colors break-words">{myGiftee.name}</p>
                      <p className="text-xl font-bold text-[#00A86B] animate-pulse">
                        Favorite Emoji: {myGiftee.favorite_emoji}
                      </p>
                      {myGiftee.bio && (
                        <div className="mt-4 bg-gray-50 p-2 max-w-sm mx-auto rounded border border-gray-200">
                          <p className="text-gray-600 font-bold italic text-sm md:text-base">"{myGiftee.bio}"</p>
                        </div>
                      )}
                      <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-wide">Click card to view details</p>
                    </div>
                  ) : (
                    <p className="text-2xl font-black uppercase text-gray-400">Not Assigned Yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      { }
      { }
      <GlobalChat />
      {/* Puppet Guide */}
      <SantaGuide />

      {/* AI Chatbot */}
      <SantaChat />
      { }
      {
        showProfile && (
          <ProfileModal
            onClose={() => setShowProfile(false)}
          />
        )
      }
      { }
      {
        selectedProfile && (
          <ProfileModal
            profile={selectedProfile}
            readonly={true}
            onClose={() => setSelectedProfile(null)}
          />
        )
      }
      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}

    </div >
  );
}
