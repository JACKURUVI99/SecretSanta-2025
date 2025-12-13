import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Profile, Task, Pairing, AppSettings, BonusTask } from '../../lib/supabase';
import { api, adminApi } from '../../lib/api';
import ChristmasBackground from '../common/ChristmasBackground';
import BonusTaskModal from './BonusTaskModal';
import GlobalChat from '../features/GlobalChat';
import ProfileModal from '../features/ProfileModal';
import AdminPolls from './AdminPolls';
import { LogOut, Users, Shuffle, Calendar, Settings, Activity, Plus, Heart, Info, MessageSquare, Trophy } from 'lucide-react';
type TabType = 'users' | 'pairings' | 'tasks' | 'settings' | 'news' | 'bonus_tasks' | 'games' | 'logs' | 'chat' | 'leaderboard' | 'polls';
export default function AdminDashboard() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [pairings, setPairings] = useState<(Pairing & { user?: Profile; secretSanta?: Profile })[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    points: 10,
    task_date: new Date().toISOString().split('T')[0]
  });
  const [newsForm, setNewsForm] = useState({ title: '', content: '', is_pinned: false });
  const [news, setNews] = useState<{ id: string; title: string; content: string; is_pinned: boolean; created_at: string }[]>([]);
  const [newsStats, setNewsStats] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [userTaskProgress] = useState<Record<string, { completed: number; total: number }>>({});
  const [bonusTasks, setBonusTasks] = useState<BonusTask[]>([]);
  const [showBonusTaskModal, setShowBonusTaskModal] = useState(false);
  const [currentTask, setCurrentTask] = useState<(Partial<BonusTask> & { questions?: any[] }) | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  // Admin Security State
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // Manual Pairing State
  const [showManualPairing, setShowManualPairing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedSanta, setSelectedSanta] = useState<string>('');
  // Leaderboard & Profile View
  const [leaderboard, setLeaderboard] = useState<Profile[]>([]);
  const [viewProfile, setViewProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetchProfiles();
    fetchPairings();
    fetchTasks();
    fetchSettings();
    fetchNews();
    fetchNewsStats();
    fetchUserTaskProgress();
    fetchBonusTasks();
    fetchLogs();
    fetchLeaderboard();
  }, []);
  const fetchLeaderboard = async () => {
    try {
      const data = await api.getLeaderboard();
      setLeaderboard(data || []);
    } catch (e) { console.error(e); }
  };
  const fetchLogs = async () => {
    try {
      const data = await api.getAdminLogs();
      setLogs(data || []);
    } catch (e) { console.error(e); }
  };
  const fetchNewsStats = async () => {
    try {
      const data = await api.getNewsStats();
      setNewsStats(data || {});
    } catch (e) { console.error(e); }
  };
  const fetchProfiles = async () => {
    try {
      const data = await api.getAdminProfiles(); // using admin endpoint
      setProfiles(data || []);
    } catch (e) { console.error(e); }
  };
  const fetchPairings = async () => {
    try {
      const data = await api.getAdminPairings();
      setPairings(data || []);
    } catch (e) { console.error(e); }
  };
  // --- Restored Functions ---
  const fetchTasks = async () => {
    try {
      const data = await api.getAdminTasks();
      setTasks(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchSettings = async () => {
    try {
      const data = await api.getAppSettings();
      // API returns a single object now, not an array
      if (data) setSettings(data);
    } catch (e) { console.error(e); }
  };

  // ... (in render)



  const fetchNews = async () => {
    try {
      const data = await api.getNews();
      setNews(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchUserTaskProgress = async () => {
    // Currently not implemented in API, stubbing silently
  };

  const fetchBonusTasks = async () => {
    try {
      // defined in api.ts as getBonusTasks (will add shortly)
      const data = await api.getBonusTasks();
      setBonusTasks(data || []);
    } catch (e) { console.error(e); }
  };



  const deleteNews = async (id: string) => {
    if (!confirm('Delete this news item?')) return;
    try {
      await api.deleteNews(id);
      fetchNews();
    } catch (e: any) { alert(e.message); }
  };

  const createBonusTask = async () => {
    // Implement modal logic or direct API
    setShowBonusTaskModal(true);
    setCurrentTask(null); // Clear for new
  };

  const deleteBonusTask = async (id: string) => {
    if (!confirm('Delete this bonus task?')) return;
    try {
      await api.deleteBonusTask(id);
      fetchBonusTasks();
    } catch (e: any) { alert(e.message); }
  };

  const toggleBonusTaskStatus = async (id: string, current: boolean) => {
    try {
      await api.toggleBonusTask(id, !current);
      fetchBonusTasks();
    } catch (e: any) { alert(e.message); }
  };

  // Security & Reset Handlers
  const handleDirectPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    // Call API
    alert("Password change not yet linked to backend API");
  };

  const sendResetOtp = async () => {
    alert("OTP Service not configured");
    setOtpSent(true);
  };

  const verifyAndResetPassword = async () => {
    alert("OTP Verification not configured");
  };

  // --- End Restored Functions ---


  // ... generatePairings ...
  // ... generatePairings ...
  const generatePairings = async () => {
    if (!confirm('This will Generate NIT Pairings (Class-Based). This will wipe existing pairings. Continue?')) return;

    setLoading(true);
    try {
      // Use the NIT specific generation which handles buckets and class logic
      const res = await api.generatePairingsNIT();
      alert(`Successfully created ${res.count} pairings!`);
      setShowPairingAnalysis(false); // Hide analysis if open
      fetchPairings();
    } catch (e: any) {
      alert("Error generating pairings: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // New Class-Based Pairing
  const [pairingStats, setPairingStats] = useState<{ buckets: any; totalStudents: number } | null>(null);
  const [showPairingAnalysis, setShowPairingAnalysis] = useState(false);

  const fetchPairingAnalysis = async () => {
    try {
      const data = await api.getPairingAnalysis();
      setPairingStats(data);
      setShowPairingAnalysis(true);
    } catch (e: any) { alert(e.message); }
  };

  const generateNITPairings = async () => {
    if (!confirm('Genering NIT Pairings will WIPE existing ones. Ensure you have analyzed first. Continue?')) return;
    setLoading(true);
    try {
      const res = await api.generatePairingsNIT();
      alert(`Successfully created ${res.count} pairings!`);
      fetchPairings();
      setShowPairingAnalysis(false);
    } catch (e: any) {
      alert("Error generating pairings: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const deletePairing = async (id: string) => {
    const { error } = await supabase.from('pairings').delete().eq('id', id);
    if (error) {
      console.error('Delete pairing error:', error);
      alert(`Failed to delete pairing: ${error.message} \n\nThis might be an RLS permission issue.Make sure you ran FIX_ADMIN_PERMISSIONS.sql`);
      return;
    }
    fetchPairings();
    alert('Pairing deleted successfully!');
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.deleteAdminUser(id);
      fetchProfiles();
    } catch (e: any) { alert(e.message); }
  };

  const handleResetPairings = async () => {
    if (!confirm('RESET ALL PAIRINGS? This cannot be undone.')) return;
    try {
      await api.resetAdminPairings();
      fetchPairings();
    } catch (e: any) { alert(e.message); }
  };

  // New Function to Reset Daily Words
  const handleResetDailyWords = async () => {
    if (!confirm("Are you sure? This will reset Todays Movie Words for ALL users. They will get new words upon refresh.")) return;
    setLoading(true);
    const { error } = await supabase.rpc('reset_all_user_daily_words');
    if (error) {
      alert('Error resetting words: ' + error.message);
    } else {
      alert('Daily words reset successfully!');
    }
    setLoading(false);
  };
  const createManualPairing = async () => {
    if (!selectedUser || !selectedSanta) return;
    try {
      await api.createAdminPairing(selectedUser, selectedSanta);
      setSelectedSanta('');
      setSelectedUser('');
      fetchPairings();
      setShowManualPairing(false);
    } catch (e: any) { alert(e.message); }
  };
  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAdminTask(taskForm);
      setTaskForm({ title: '', description: '', points: 10, task_date: new Date().toISOString().split('T')[0] });
      fetchTasks();
      setShowTaskModal(false);
    } catch (e: any) { alert(e.message); }
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Delete task?')) return;
    try {
      await api.deleteAdminTask(id);
      fetchTasks();
    } catch (e: any) { alert(e.message); }
  };
  const updateSettings = async (updates: Partial<AppSettings>) => {
    if (!settings) return;
    try {
      await api.updateAdminSettings(updates);
    } catch (e: any) {
      console.error('Error updating settings:', e);
      alert(`Failed to update settings: ${e.message} `);
      return;
    }
    await fetchSettings();

    // ⚡ Realtime Broadcast Disabled Temporarily due to WebSocket Issues
    /*
    const channel = supabase.channel('system_channel');
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'refresh_settings',
          payload: {}
        });
        supabase.removeChannel(channel);
      }
    });
    */
  };



  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    if (!confirm('Toggle Admin Status?')) return;
    try {
      await api.toggleAdminStatus(userId, !currentStatus);
      fetchProfiles();
    } catch (e: any) { alert(e.message); }
  };
  const toggleBan = async (userId: string, currentStatus: boolean) => {
    let reason = '';
    if (!currentStatus) { // Banning
      const input = prompt("Enter reason for banning this user:");
      if (input === null) return; // Cancelled
      reason = input;
    } else {
      if (!confirm(`Are you sure you want to UNBAN this user ? `)) return;
    }

    try {
      await api.toggleBanStatus(userId, !currentStatus, reason);
      fetchProfiles();
    } catch (e: any) { alert(e.message); }
  };
  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <input
                type="text"
                placeholder="Search users..."
                className="bg-white text-black border-2 border-black px-4 py-2 font-bold focus:outline-none focus:shadow-[4px_4px_0px_0px_black] transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="font-bold bg-white text-black border-2 border-black px-4 py-2 shadow-[4px_4px_0px_0px_black] flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showOnlineOnly} onChange={e => setShowOnlineOnly(e.target.checked)} className="w-5 h-5 accent-[#00A86B]" />
                  Only Online
                </label>
                <span>| Total: {profiles.length}</span>
              </div>
            </div>
            <div className="overflow-x-auto bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_black]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-4 border-black text-sm uppercase">
                    <th className="p-3 font-black">Name</th>
                    <th className="p-3 font-black">Status</th>
                    <th className="p-3 font-black">Roll No</th>
                    <th className="p-3 font-black">Tasks</th>
                    <th className="p-3 font-black">Points</th>
                    <th className="p-3 font-black">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {profiles.filter(p => {
                    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.roll_number.includes(searchQuery);
                    const isOnline = p.last_seen && (new Date().getTime() - new Date(p.last_seen).getTime() < 5 * 60 * 1000);
                    if (showOnlineOnly && !isOnline) return false;
                    return matchesSearch;
                  }).map(p => (
                    <tr key={p.id} className="border-b-2 border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-bold flex items-center gap-2">
                        {p.is_admin && <span className="bg-[#FFD700] text-black text-xs px-2 py-0.5 font-black uppercase rounded-full border border-black">Admin</span>}
                        {p.is_banned && <span className="bg-red-600 text-white text-xs px-2 py-0.5 font-black uppercase rounded-full border border-black">BANNED</span>}
                        {p.is_banned && <span className="bg-red-600 text-white text-xs px-2 py-0.5 font-black uppercase rounded-full border border-black">BANNED</span>}
                        <button onClick={() => setViewProfile(p)} className="hover:underline hover:text-[#C41E3A] transition-colors text-left flex items-center gap-2">
                          {p.name}
                          {p.last_seen && (new Date().getTime() - new Date(p.last_seen).getTime() < 5 * 60 * 1000) && (
                            <span className="w-3 h-3 bg-[#00FF00] rounded-full border border-black shadow-[1px_1px_0px_black]" title="Online Now"></span>
                          )}
                        </button>
                      </td>
                      <td className="p-3 font-mono text-xs font-bold text-gray-500">
                        {p.last_seen ? (
                          (new Date().getTime() - new Date(p.last_seen).getTime() < 5 * 60 * 1000)
                            ? <span className="text-[#00A86B] animate-pulse">● Online</span>
                            : new Date(p.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        ) : '-'}
                      </td>
                      <td className="p-3 font-mono text-gray-600">{p.roll_number}</td>
                      <td className="p-3 text-gray-600">
                        {userTaskProgress[p.id]?.completed || 0}/{userTaskProgress[p.id]?.total || 0}
                      </td>
                      <td className="p-3 font-black text-[#00A86B]">{p.points}</td>
                      <td className="p-3 flex gap-2">
                        <button onClick={() => deleteUser(p.id)} className="text-red-500 hover:text-red-700 font-bold">[DEL]</button>
                        <button onClick={() => toggleAdmin(p.id, p.is_admin || false)} className="text-yellow-600 hover:text-yellow-800 font-bold" title="Toggle Admin">[{p.is_admin ? '-ADM' : '+ADM'}]</button>
                        <button onClick={() => toggleBan(p.id, p.is_banned || false)} className={`font-bold ${p.is_banned ? 'text-green-600' : 'text-purple-600'}`}>[{p.is_banned ? 'UNBAN' : 'BAN'}]</button>
                        <button onClick={() => { setSelectedUser(p.id); setShowManualPairing(true); }} className="text-blue-600 hover:text-blue-800 font-bold">[PAIR]</button>
                        <button onClick={async () => {
                          try {
                            await adminApi.toggleMaintenanceBypass(p.id, !p.bypass_maintenance);
                            fetchProfiles();
                          } catch (e) { alert("Failed to toggle bypass"); }
                        }} className={`font-bold ${p.bypass_maintenance ? 'text-orange-600' : 'text-gray-400'}`} title="Bypass Maintenance">
                          [{p.bypass_maintenance ? 'BYPASSING' : 'BYPASS'}]
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'pairings':
        return (
          <div className="space-y-4">
            <div className="flex gap-4 mb-6">
              <button onClick={generatePairings} disabled={loading} className="bg-[#00FF00] text-black px-6 py-3 border-4 border-[#00FF00] font-black uppercase shadow-[0px_0px_10px_#00FF00] hover:bg-white transition-all">
                Auto-Generate Pairings
              </button>
              <button onClick={handleResetPairings} disabled={loading} className="bg-red-600 text-white px-6 py-3 border-4 border-red-600 font-black uppercase shadow-[0px_0px_10px_red] hover:bg-red-500 transition-all">
                Reset All
              </button>
              <button onClick={() => setShowManualPairing(true)} className="bg-white text-black px-6 py-3 border-4 border-black font-black uppercase shadow-[4px_4px_0px_0px_black] hover:bg-black hover:text-white transition-all">
                + Manual Pair
              </button>
              <button onClick={fetchPairingAnalysis} className="bg-[#9333EA] text-white px-6 py-3 border-4 border-black font-black uppercase shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 transition-all">
                Analyze Classes
              </button>
            </div>

            {showPairingAnalysis && pairingStats && (
              <div className="bg-white border-4 border-black p-4 mb-4 shadow-[4px_4px_0px_0px_black]">
                <h3 className="font-black text-xl mb-2">Class Pairing Analysis</h3>
                <p className="font-bold mb-2">Total Students: {pairingStats.totalStudents}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto mb-4 border border-black p-2">
                  {Object.entries(pairingStats.buckets).map(([key, val]: [string, any]) => (
                    <div key={key} className={`text - xs p - 1 border font - bold ${val.count < 2 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'} `}>
                      {key}: {val.count} {val.count < 2 ? '(SKIP)' : ''}
                    </div>
                  ))}
                </div>
                <button onClick={generateNITPairings} className="w-full bg-[#00FF00] text-black font-black uppercase py-3 border-2 border-black shadow-[4px_4px_0px_0px_black] hover:-translate-y-1">
                  CONFIRM & GENERATE NIT PAIRINGS
                </button>
              </div>
            )}
            <div className="flex gap-4 mb-6">
              {pairings.length === 0 ? (
                <div className="text-center py-12 bg-black border-4 border-dashed border-green-800 rounded-xl">
                  <p className="font-bold text-xl text-green-700">No pairings generated yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pairings.map(p => (
                    <div key={p.id} className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_black] flex justify-between items-center transition-transform hover:-translate-y-1">
                      <div className="flex items-center gap-2 font-bold">
                        <span className="text-[#C41E3A]">{p.secretSanta?.name || 'Unknown'}</span>
                        <span className="mx-2 text-gray-400">---🎁--&gt;</span>
                        <span className="text-[#00A86B]">{p.user?.name || 'Unknown'}</span>
                      </div>
                      <button onClick={() => deletePairing(p.id)} className="text-red-500 hover:text-red-700 font-black px-2">[X]</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-8 max-w-4xl">
            {settings && (
              <>
                <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_black]">
                  <h3 className="text-xl font-black uppercase mb-4 border-b-4 border-black pb-2">System Controls</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'registration_open', label: 'Registration Open' },
                      { key: 'show_leaderboard', label: 'Show Leaderboard' },
                      { key: 'show_secret_santa', label: 'Enable Santa Module' },
                      { key: 'secret_santa_reveal', label: 'Reveal Secret Santas' },
                      { key: 'show_bonus_tasks', label: 'Bonus Tasks' },
                      { key: 'maintenance_mode', label: 'Maintenance Mode' },
                      { key: 'show_gifting_day', label: 'Show Gifting Date' },
                      { key: 'show_games', label: 'Enable Games' },
                      { key: 'show_santa_run', label: '🎅 3D Santa Run' }
                    ].map((setting) => (
                      <div key={setting.key} className="flex items-center justify-between bg-gray-50 p-3 border-2 border-black cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => updateSettings({ [setting.key]: !settings[setting.key as keyof AppSettings] })}>
                        <span className="font-bold">{setting.label}</span>
                        <div className={`w-12 h-6 rounded-full border-2 border-black relative transition-colors ${settings[setting.key as keyof AppSettings] ? 'bg-[#00A86B]' : 'bg-gray-300'} `}>
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full border-2 border-black transition-all bg-white ${settings[setting.key as keyof AppSettings] ? 'right-1' : 'left-1'} `}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_black]">
                  <h3 className="text-xl font-black uppercase mb-4 border-b-4 border-black pb-2 text-black">Event Timing</h3>
                  <div>
                    <label className="block font-bold mb-2 text-black">Gifting Day</label>
                    <input
                      type="date"
                      value={settings.gifting_day ? new Date(settings.gifting_day).toISOString().split('T')[0] : ''}
                      onChange={(e) => updateSettings({ gifting_day: e.target.value })}
                      className="bg-gray-50 border-2 border-black p-2 font-bold w-full md:w-auto text-black focus:shadow-[4px_4px_0px_0px_black] focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="bg-black border-4 border-red-600 p-6 shadow-[0px_0px_15px_red] border-t-8 border-t-red-600">
                  <h3 className="text-xl font-black uppercase mb-4 text-red-600 flex items-center gap-2">
                    Security Override
                  </h3>
                  <div className="bg-red-900/10 p-6 border-2 border-red-600 border-dashed rounded-lg">
                    <h4 className="font-bold text-red-600 uppercase mb-4">Admin Credentials Rotation</h4>
                    {!showPasswordReset ? (
                      <button onClick={() => setShowPasswordReset(true)} className="bg-red-600 text-white px-6 py-2 border-2 border-red-500 font-bold uppercase shadow-[4px_4px_0px_0px_red] hover:-translate-y-1 transition-all">
                        Change Admin Password
                      </button>
                    ) : (
                      <div className="max-w-md">
                        <form onSubmit={handleDirectPasswordChange} className="space-y-4 mb-8 border-b-2 border-red-800 pb-6">
                          <h5 className="font-bold text-sm uppercase text-red-400">Method 1: Direct Change (Requires Current Pwd)</h5>
                          <input type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full bg-black text-red-500 border-2 border-red-600 p-2 placeholder:font-bold placeholder:text-red-900" />
                          <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-black text-red-500 border-2 border-red-600 p-2 placeholder:font-bold placeholder:text-red-900" />
                          <button disabled={loading} className="w-full bg-red-600 text-black font-bold uppercase py-3 border-2 border-red-500 shadow-[4px_4px_0px_0px_red] hover:-translate-y-1 transition-all">Update Password</button>
                        </form>
                        <div className="space-y-4">
                          <h5 className="font-bold text-sm uppercase text-red-400">Method 2: Emergency OTP Reset</h5>
                          {!otpSent ? (
                            <button onClick={sendResetOtp} disabled={loading} className="w-full bg-yellow-500 text-black font-bold uppercase py-3 border-2 border-yellow-600 shadow-[4px_4px_0px_0px_yellow] hover:-translate-y-1 transition-all">
                              Send OTP to Email
                            </button>
                          ) : (
                            <div className="space-y-3">
                              <input type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} className="w-full bg-black text-[#00FF00] border-2 border-[#00FF00] p-2 font-mono text-center tracking-widest text-xl" />
                              <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-black text-[#00FF00] border-2 border-[#00FF00] p-2" />
                              <button onClick={verifyAndResetPassword} disabled={loading} className="w-full bg-[#00A86B] text-white font-bold uppercase py-3 border-2 border-black shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 transition-all">
                                Confirm Reset
                              </button>
                            </div>
                          )}
                        </div>
                        <button onClick={() => setShowPasswordReset(false)} className="mt-4 text-sm font-bold underline text-red-500 hover:text-red-400">Cancel</button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      case 'news':
        return (
          <div className="space-y-6">
            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_black]">
              <h3 className="font-black uppercase text-xl mb-4 text-black">Post Announcement</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Title"
                  className="w-full bg-gray-50 text-black border-2 border-black p-3 font-bold text-lg focus:shadow-[4px_4px_0px_0px_black] outline-none"
                  value={newsForm.title}
                  onChange={e => setNewsForm({ ...newsForm, title: e.target.value })}
                />
                <textarea
                  placeholder="Content..."
                  className="w-full bg-gray-50 text-black border-2 border-black p-3 h-32 font-medium focus:shadow-[4px_4px_0px_0px_black] outline-none"
                  value={newsForm.content}
                  onChange={e => setNewsForm({ ...newsForm, content: e.target.value })}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-bold cursor-pointer select-none text-black">
                    <input
                      type="checkbox"
                      checked={newsForm.is_pinned}
                      onChange={e => setNewsForm({ ...newsForm, is_pinned: e.target.checked })}
                      className="w-5 h-5 border-2 border-black accent-[#00A86B] bg-gray-50"
                    />
                    Pin to Top
                  </label>
                  <button onClick={logout} className="bg-red-600 text-white px-4 py-2 font-bold uppercase border-2 border-black hover:bg-red-700 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
                    LOGOUT
                  </button>
                </div>
              </div>
            </div>
            <div className="grid gap-4">
              {news.map(n => (
                <div key={n.id} className="bg-white border-2 border-black p-6 relative shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 transition-all group">
                  {n.is_pinned && <span className="absolute top-2 right-2 text-2xl">📌</span>}

                  <div className="absolute top-2 right-10 md:right-12">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 border border-black cursor-help" title={newsStats[n.id]?.join(', ') || 'No readers yet'}>
                      <Info size={14} />
                      {newsStats[n.id]?.length || 0} Reads
                    </div>
                  </div>

                  <button onClick={() => deleteNews(n.id)} className="absolute bottom-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 font-bold hover:underline transition-opacity">Delete</button>
                  <h4 className="font-black text-xl mb-2 text-black">{n.title}</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{n.content}</p>
                  <p className="text-xs font-bold text-gray-500 mt-4 uppercase">{new Date(n.created_at).toLocaleString()}</p>

                  {/* Readers List (Simple expandable or tooltip used above) */}
                  {newsStats[n.id] && newsStats[n.id].length > 0 && (
                    <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
                      <p className="text-xs font-black uppercase text-gray-400 mb-1">Read By:</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{newsStats[n.id].slice(0, 10).join(', ')}{newsStats[n.id].length > 10 ? ` + ${newsStats[n.id].length - 10} more` : ''}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case 'tasks':
        return (
          <div className="space-y-6">
            <button onClick={() => setShowTaskModal(true)} className="bg-[#9333EA] text-white px-6 py-3 border-4 border-[#00FF00] font-black uppercase shadow-[0px_0px_10px_#00FF00] hover:-translate-y-1 transition-all w-full md:w-auto">
              + Create New Task
            </button>
            <div className="space-y-4">
              {tasks.map(t => (
                <div key={t.id} className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_black] flex justify-between items-center group">
                  <div>
                    <div className="font-black text-lg text-black">{t.title}</div>
                    <div className="text-sm font-medium text-gray-700">{t.description}</div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <div className="font-black text-[#FFD700]">{t.points} pts</div>
                      <div className="text-xs font-bold text-gray-500">{new Date(t.task_date).toLocaleDateString()}</div>
                    </div>
                    <button onClick={() => deleteTask(t.id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors" title="Delete Task">
                      <LogOut className="rotate-180" size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'bonus_tasks':
        return (
          <div className="space-y-4">
            <button
              onClick={createBonusTask}
              className="bg-[#F59E0B] text-black px-6 py-3 border-4 border-[#00FF00] font-black uppercase shadow-[0px_0px_10px_#00FF00] hover:-translate-y-1 transition-all w-full md:w-auto"
            >
              + Create Bonus Task
            </button>
            <div className="grid grid-cols-1 gap-4">
              {bonusTasks.map(t => (
                <div key={t.id} className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_black] relative">
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-[#F59E0B] text-black border border-black px-2 py-0.5 text-xs font-black uppercase shadow-[2px_2px_0px_0px_black]">BONUS</span>
                    <div className="flex gap-2">
                      <button onClick={() => { setCurrentTask(t); setShowBonusTaskModal(true); }} className="text-blue-600 font-bold text-xs uppercase hover:underline">Edit</button>
                      <button onClick={() => deleteBonusTask(t.id)} className="text-red-500 font-bold text-xs uppercase hover:underline">Delete</button>
                      <button onClick={() => toggleBonusTaskStatus(t.id, t.is_active)} className={`text - xs font - bold border border - black px - 2 ${t.is_active ? 'bg-[#00A86B] text-white' : 'bg-gray-100 text-gray-500'} `}>
                        {t.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </div>
                  </div>
                  <h4 className="font-black text-lg text-black">{t.title}</h4>
                  <p className="text-sm text-gray-700 mt-1">{t.description}</p>
                  <div className="mt-2 text-xs font-bold text-gray-500 font-mono">
                    PTS: {t.total_points}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'games':
        return (
          <div className="space-y-4">
            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_black]">
              <h3 className="font-black uppercase text-xl mb-4">Game Management</h3>
              <p className="font-bold mb-4">Manage game availability and settings here.</p>

              {settings && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Launch Control */}
                  <div className="col-span-1 md:col-span-2 mb-4 bg-red-100 p-4 border-4 border-red-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-black uppercase text-xl text-red-600">🚀 LAUNCH SECRET SANTA 2025</h4>
                        <p className="font-bold text-xs text-red-800">Enabling this will force ALL users to accept Terms & Rules.</p>
                      </div>
                      <div className="flex items-center justify-between bg-white p-2 border-2 border-black cursor-pointer hover:bg-gray-50 transition-colors w-40"
                        onClick={() => updateSettings({ game_rules_active: !settings.game_rules_active })}>
                        <span className="font-bold text-xs">{settings.game_rules_active ? 'ACTIVE' : 'INACTIVE'}</span>
                        <div className={`w-12 h-6 rounded-full border-2 border-black relative transition-colors ${settings.game_rules_active ? 'bg-[#00A86B]' : 'bg-gray-300'} `}>
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full border-2 border-black transition-all bg-white ${settings.game_rules_active ? 'right-1' : 'left-1'} `}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Core Games */}
                  {[
                    { key: 'show_games', label: '🎮 Enable Games Module (Global)' },
                    { key: 'show_tictactoe', label: '⭕❌ Tic-Tac-Toe' },
                    { key: 'show_memory_game', label: '🧠 Memory Game' },
                    { key: 'show_santa_run', label: '🎅 Santa Run' },
                    { key: 'show_flappy_santa', label: '🐦 Flappy Santa' },
                    { key: 'show_jumbled_words', label: '🔤 Jumbled Words' },
                    { key: 'show_bad_description', label: '❓ Bad Description' },
                    { key: 'show_crossword', label: '🧩 Mini Crossword' },
                    { key: 'show_bingo', label: '🎅 Christmas Bingo' }
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between bg-gray-50 p-3 border-2 border-black cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => updateSettings({ [setting.key]: !settings[setting.key as keyof AppSettings] })}>
                      <span className="font-bold">{setting.label}</span>
                      <div className={`w-12 h-6 rounded-full border-2 border-black relative transition-colors ${settings[setting.key as keyof AppSettings] ? 'bg-[#00A86B]' : 'bg-gray-300'} `}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full border-2 border-black transition-all bg-white ${settings[setting.key as keyof AppSettings] ? 'right-1' : 'left-1'} `}></div>
                      </div>
                    </div>
                  ))
                  }

                  {/* Bingo Console */}
                  {
                    settings.show_bingo && (
                      <div className="col-span-1 md:col-span-2 mt-4 bg-yellow-100 p-4 border-2 border-black">
                        <h4 className="font-black uppercase text-lg mb-2 flex items-center gap-2">
                          🎅 Bingo Console
                        </h4>
                        <div className="flex gap-4 items-center">
                          <button
                            onClick={async () => {
                              const words = ["Santa", "Reindeer", "Snowman", "Merry", "Christmas", "Tree", "Gift", "Rudolph", "Sleigh", "Elf", "Winter", "Jingle", "Bells", "Stocking", "Candy", "Star", "Angel", "Peace", "Joy", "Noel", "Frosty", "Chimney", "Cookie", "Milk", "Holly"];
                              const state = await api.getBingoState();
                              const available = words.filter(w => !state.includes(w));
                              if (available.length === 0) return alert("All words called!");
                              const next = available[Math.floor(Math.random() * available.length)];
                              await api.adminCallBingoWord(next);
                              alert(`Called: ${next}`);
                            }}
                            className="bg-black text-white px-4 py-2 font-bold hover:bg-gray-800 border-2 border-transparent active:scale-95 transition-transform"
                          >
                            📢 Call Random Word
                          </button>
                          <button onClick={() => { if (confirm('Reset all Bingo Progress?')) api.resetBingo(); }} className="bg-red-500 text-white px-4 py-2 font-bold border-2 border-black">
                            Reset Bingo
                          </button>
                        </div>
                      </div>
                    )
                  }

                  {/* Movie Challenges (Events) */}
                  < div className="col-span-1 md:col-span-2 mt-4 mb-2 border-b-2 border-black pb-1" >
                    <h4 className="font-black uppercase text-sm text-gray-500">Daily Movie Challenges</h4>
                  </div>
                  {[
                    { key: 'show_kollywood', label: '🎬 Kollywood' },
                    { key: 'show_mollywood', label: '🌴 Mollywood' },
                    { key: 'show_tollywood', label: '🎥 Tollywood' },
                    { key: 'show_bollywood', label: '💃 Bollywood' },
                    { key: 'show_hollywood', label: '🍿 Hollywood' }
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between bg-gray-50 p-3 border-2 border-black cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => updateSettings({ [setting.key]: !settings[setting.key as keyof AppSettings] })}>
                      <span className="font-bold">{setting.label}</span>
                      <div className={`w-12 h-6 rounded-full border-2 border-black relative transition-colors ${settings[setting.key as keyof AppSettings] ? 'bg-[#00A86B]' : 'bg-gray-300'} `}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full border-2 border-black transition-all bg-white ${settings[setting.key as keyof AppSettings] ? 'right-1' : 'left-1'} `}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <button onClick={handleResetDailyWords} disabled={loading} className="bg-red-600 text-white px-6 py-3 border-4 border-red-800 font-black uppercase shadow-[4px_4px_0px_0px_red] hover:bg-red-500 transition-all">
                  Reset Today's Movie Words
                </button>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => { if (confirm('Reset all Jumbled Progress?')) api.resetJumbledWords(); }} className="bg-orange-500 text-white px-4 py-2 font-bold border-2 border-black">
                    Reset Jumbled Words
                  </button>
                  <button onClick={() => { if (confirm('Reset all Bad Description Progress?')) api.resetBadDescription(); }} className="bg-purple-500 text-white px-4 py-2 font-bold border-2 border-black">
                    Reset Bad Desc
                  </button>
                  <button onClick={() => { if (confirm('Reset all Crossword Progress?')) api.resetCrossword(); }} className="bg-blue-500 text-white px-4 py-2 font-bold border-2 border-black">
                    Reset Crossword
                  </button>
                </div>
              </div>
            </div>
          </div >
        );
      case 'chat':
        return (
          <div className="max-w-4xl mx-auto">
            <GlobalChat mode="embedded" isAdminView={true} />
          </div>
        );
      case 'leaderboard':
        return (
          <div className="space-y-6">
            <h3 className="font-black text-2xl uppercase mb-4 text-[#FFD700] drop-shadow-[2px_2px_0px_black] flex items-center gap-2">
              <Trophy size={32} /> Leaderboard
            </h3>
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-black text-white uppercase text-sm font-black">
                  <tr>
                    <th className="p-4">Rank</th>
                    <th className="p-4">User</th>
                    <th className="p-4 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black font-bold">
                  {leaderboard.map((p, index) => (
                    <tr key={p.id} className="hover:bg-[#FFFBEB] transition-colors">
                      <td className="p-4 flex items-center gap-2">
                        {index === 0 && <span className="text-2xl">🥇</span>}
                        {index === 1 && <span className="text-2xl">🥈</span>}
                        {index === 2 && <span className="text-2xl">🥉</span>}
                        <span className="font-black text-lg">#{index + 1}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{p.favorite_emoji || '🎅'}</span>
                          <div>
                            <button onClick={() => setViewProfile(p)} className="block hover:underline hover:text-[#C41E3A] transition-colors text-lg uppercase">
                              {p.name}
                            </button>
                            <span className="text-xs text-gray-500 font-mono tracking-widest">{p.roll_number}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-black text-xl text-[#00A86B]">
                        {p.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'logs':
        return (
          <div className="h-full flex flex-col bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_black] min-h-[500px]">
            <div className="flex justify-between items-center mb-4 border-b-4 border-black pb-2">
              <h3 className="font-black uppercase text-xl text-black">Activity Monitor</h3>
              <button onClick={fetchLogs} className="text-xs font-bold uppercase underline text-blue-600 hover:text-blue-800">Refresh</button>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-sm space-y-2 p-2 bg-gray-50 border-2 border-black rounded">
              {logs.length === 0 ? (
                <div className="text-center text-gray-500 font-bold py-10">No recent activity</div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="flex gap-2 border-b border-gray-200 pb-1">
                    <span className="text-gray-500 font-bold text-xs">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                    <span className={`font - bold text - xs uppercase ${log.action_type === 'admin' ? 'text-red-500' :
                      log.action_type === 'auth' ? 'text-blue-600' :
                        log.action_type === 'game' ? 'text-purple-600' :
                          'text-green-600'
                      } `}>{log.details}</span>
                    <span className="text-gray-400 text-xs ml-auto">({log.user_id ? 'USR' : 'SYS'})</span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-2 text-xs font-bold text-gray-400 text-center">Monitoring System Active</div>
          </div>
        );
      case 'polls':
        return <AdminPolls />;
      default:
        return <div>Module Not Found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#E0E7FF] font-mono relative">
      <ChristmasBackground />
      <div className="composition-layer"></div>

      <header className="bg-white border-b-4 border-black sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl filter drop-shadow-md">🎅</span>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-black">Secret Santa</h1>
              <span className="bg-[#C41E3A] text-white text-xs px-2 py-0.5 font-bold uppercase transform -rotate-2 inline-block">Admin Console</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="bg-[#C41E3A] text-white px-4 py-2 border-2 border-black font-bold uppercase shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 transition-all flex items-center gap-2 text-sm"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          <div className="lg:col-span-3 space-y-3">
            {[
              { id: 'users', label: 'Users', icon: Users },
              { id: 'pairings', label: 'Pairings', icon: Shuffle },
              { id: 'tasks', label: 'Tasks', icon: Calendar },
              { id: 'bonus_tasks', label: 'Bonus Tasks', icon: Plus },
              { id: 'settings', label: 'Settings', icon: Settings },
              { id: 'news', label: 'Announcements', icon: Calendar },
              { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
              { id: 'games', label: 'Games', icon: Activity },
              { id: 'chat', label: 'Global Chat', icon: MessageSquare },
              { id: 'polls', label: 'Polls', icon: Heart }, // Added Polls to navigation
              { id: 'logs', label: 'Logs', icon: Activity }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`w-full text-left px-4 py-4 border-2 border-black flex items-center gap-3 font-bold uppercase transition-all shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 ${activeTab === tab.id
                  ? 'bg-[#FFD700] text-black'
                  : 'bg-white text-black hover:bg-gray-50'
                  } `}
              >
                <tab.icon size={20} strokeWidth={2.5} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="lg:col-span-9">
            {renderContent()}
          </div>
        </div>
      </main>

      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
          <div className="bg-white border-4 border-black p-6 w-full max-w-md shadow-[8px_8px_0px_0px_black] animate-pop-in">
            <h3 className="text-xl font-black mb-6 uppercase border-b-4 border-black pb-2 text-black">Create New Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase mb-1 text-black">Title</label>
                <input
                  type="text"
                  placeholder="Task Title..."
                  className="w-full bg-gray-50 text-black border-2 border-black p-3 font-bold focus:shadow-[4px_4px_0px_0px_black] outline-none transition-shadow"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase mb-1 text-black">Description</label>
                <textarea
                  placeholder="Details..."
                  className="w-full bg-gray-50 text-black border-2 border-black p-3 font-medium focus:shadow-[4px_4px_0px_0px_black] outline-none transition-shadow h-24"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold uppercase mb-1 text-black">Points</label>
                  <input
                    type="number"
                    className="w-full bg-gray-50 text-black border-2 border-black p-3 font-bold"
                    value={taskForm.points}
                    onChange={(e) => setTaskForm({ ...taskForm, points: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase mb-1 text-black">Date</label>
                  <input
                    type="date"
                    className="w-full bg-gray-50 text-black border-2 border-black p-3 font-bold"
                    value={taskForm.task_date}
                    onChange={(e) => setTaskForm({ ...taskForm, task_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="flex-1 py-3 border-2 border-[#00FF00] text-[#00FF00] font-bold uppercase hover:bg-green-900/20"
                >
                  Cancel
                </button>
                <button
                  onClick={createTask}
                  className="flex-1 py-3 bg-[#00FF00] text-black border-2 border-[#00FF00] font-black uppercase shadow-[0px_0px_10px_#00FF00] hover:-translate-y-1 transition-all"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBonusTaskModal && (
        <BonusTaskModal
          onClose={() => setShowBonusTaskModal(false)}
          onSave={() => { fetchBonusTasks(); setShowBonusTaskModal(false); }}
          task={currentTask || undefined}
        />
      )}

      {showManualPairing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
          <div className="bg-black border-4 border-[#00FF00] p-6 w-full max-w-md shadow-[0px_0px_20px_#00FF00]">
            <h3 className="text-xl font-black mb-6 uppercase border-b-4 border-[#00FF00] pb-2 text-[#00FF00]">Manual Pairing</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold uppercase mb-2 text-[#00FF00]">User (Receiver)</label>
                <select
                  className="w-full bg-black text-[#00FF00] border-2 border-[#00FF00] p-3 font-bold"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="">Select User...</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.name} ({p.roll_number})</option>)}
                </select>
              </div>
              <div className="flex justify-center -my-2 z-10 relative">
                <div className="bg-[#00FF00] text-black rounded-full p-2 border-2 border-black shadow-lg">⬇️</div>
              </div>
              <div>
                <label className="block text-sm font-bold uppercase mb-2 text-[#00FF00]">Secret Santa (Giver)</label>
                <select
                  className="w-full bg-black text-[#00FF00] border-2 border-[#00FF00] p-3 font-bold"
                  value={selectedSanta}
                  onChange={(e) => setSelectedSanta(e.target.value)}
                >
                  <option value="">Select Santa...</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.name} ({p.roll_number})</option>)}
                </select>
              </div>
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowManualPairing(false)}
                  className="flex-1 py-3 border-2 border-[#00FF00] text-[#00FF00] font-bold uppercase hover:bg-green-900/20"
                >
                  Cancel
                </button>
                <button
                  onClick={createManualPairing}
                  className="flex-1 py-3 bg-[#9333EA] text-white border-2 border-[#00FF00] font-black uppercase shadow-[0px_0px_10px_#00FF00] hover:-translate-y-1 transition-all"
                >
                  Link Pair
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Profile Modal */}
      {viewProfile && (
        <ProfileModal
          onClose={() => setViewProfile(null)}
          viewOnly={true}
          targetProfile={viewProfile}
        />
      )}
    </div>
  );
}
