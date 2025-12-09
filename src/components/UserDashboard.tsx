import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Profile, Task, UserTask, Pairing, AppSettings } from '../lib/supabase';
import SnowBackground from './SnowBackground';
import ProfileModal from './ProfileModal';
import Leaderboard from './Leaderboard';
import { Gift, LogOut, User, Trophy, Calendar } from 'lucide-react';

export default function UserDashboard() {
  const { profile, signOut } = useAuth();
  const [tasks, setTasks] = useState<(Task & { userTask?: UserTask })[]>([]);
  const [secretSanta, setSecretSanta] = useState<Profile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'santa'>('tasks');

  useEffect(() => {
    if (profile) {
      fetchTasks();
      fetchSecretSanta();
      fetchSettings();
    }
  }, [profile]);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('*')
      .single();
    setSettings(data);
  };

  const fetchTasks = async () => {
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .order('task_date', { ascending: false });

    if (tasksData) {
      const { data: userTasksData } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('user_id', profile!.id);

      const tasksWithCompletion = tasksData.map(task => ({
        ...task,
        userTask: userTasksData?.find(ut => ut.task_id === task.id),
      }));

      setTasks(tasksWithCompletion);
    }
  };

  const fetchSecretSanta = async () => {
    const { data: pairing } = await supabase
      .from('pairings')
      .select('secret_santa_id')
      .eq('user_id', profile!.id)
      .maybeSingle();

    if (pairing) {
      const { data: santa } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', pairing.secret_santa_id)
        .single();

      setSecretSanta(santa);
    }
  };

  const toggleTask = async (task: Task & { userTask?: UserTask }) => {
    if (task.userTask) {
      await supabase
        .from('user_tasks')
        .update({
          completed: !task.userTask.completed,
          completed_at: !task.userTask.completed ? new Date().toISOString() : null,
        })
        .eq('id', task.userTask.id);
    } else {
      await supabase
        .from('user_tasks')
        .insert({
          user_id: profile!.id,
          task_id: task.id,
          completed: true,
          completed_at: new Date().toISOString(),
        });
    }

    const completedTasks = await supabase
      .from('user_tasks')
      .select('*, tasks(*)')
      .eq('user_id', profile!.id)
      .eq('completed', true);

    const totalPoints = completedTasks.data?.reduce((sum, ut: any) => sum + (ut.tasks?.points || 0), 0) || 0;

    await supabase
      .from('profiles')
      .update({ points: totalPoints })
      .eq('id', profile!.id);

    fetchTasks();
  };

  const getDaysUntilGifting = () => {
    if (!settings?.gifting_day) return 0;
    const today = new Date();
    const giftingDay = new Date(settings.gifting_day);
    const diff = giftingDay.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-blue-300 to-white relative">
      <SnowBackground />

      <div className="relative z-10">
        <header className="bg-red-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🎅</span>
              <div>
                <h1 className="text-2xl font-bold">Secret Santa</h1>
                <p className="text-sm opacity-90">Ho Ho Ho!</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowProfile(true)}
                className="bg-white text-red-600 px-4 py-2 rounded-full font-semibold hover:bg-red-50 transition flex items-center gap-2"
              >
                <User size={18} />
                <span className="hidden sm:inline">Profile</span>
              </button>
              <button
                onClick={signOut}
                className="bg-red-700 px-4 py-2 rounded-full font-semibold hover:bg-red-800 transition flex items-center gap-2"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-6 border-4 border-red-400">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{profile?.favorite_emoji}</span>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{profile?.name}</h2>
                  <p className="text-gray-600 text-sm">{profile?.roll_number}</p>
                </div>
              </div>
              <p className="text-gray-700 text-sm mt-3">{profile?.bio || 'No bio yet'}</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-xl p-6 border-4 border-yellow-600 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Trophy size={32} />
                <div>
                  <p className="text-sm opacity-90">Your Points</p>
                  <h2 className="text-4xl font-bold">{profile?.points}</h2>
                </div>
              </div>
              <button
                onClick={() => setShowLeaderboard(true)}
                className="mt-4 w-full bg-white text-orange-600 py-2 rounded-lg font-semibold hover:bg-yellow-50 transition"
              >
                View Leaderboard
              </button>
            </div>

            <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl shadow-xl p-6 border-4 border-green-700 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Calendar size={32} />
                <div>
                  <p className="text-sm opacity-90">Days Until Gifting</p>
                  <h2 className="text-4xl font-bold">{getDaysUntilGifting()}</h2>
                </div>
              </div>
              {settings && (
                <p className="text-sm mt-2 opacity-90">
                  {new Date(settings.gifting_day).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 py-3 rounded-xl font-bold transition ${
                activeTab === 'tasks'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-300'
              }`}
            >
              Daily Tasks
            </button>
            <button
              onClick={() => setActiveTab('santa')}
              className={`flex-1 py-3 rounded-xl font-bold transition ${
                activeTab === 'santa'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-300'
              }`}
            >
              My Secret Santa
            </button>
          </div>

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-4 border-gray-300">
                  <span className="text-6xl mb-4 block">🎄</span>
                  <p className="text-gray-600 text-lg">No tasks yet! Check back soon.</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-2xl shadow-xl p-6 border-4 border-blue-400 hover:border-blue-500 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-800">{task.title}</h3>
                          <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                            +{task.points} pts
                          </span>
                        </div>
                        <p className="text-gray-600">{task.description}</p>
                        <p className="text-gray-500 text-sm mt-2">
                          {new Date(task.task_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleTask(task)}
                        className={`px-6 py-3 rounded-xl font-bold transition ${
                          task.userTask?.completed
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {task.userTask?.completed ? '✓ Done' : 'Mark Done'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'santa' && (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-4 border-red-400">
              {secretSanta ? (
                <>
                  <span className="text-6xl mb-4 block">🎁</span>
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">Your Secret Santa</h2>
                  <div className="inline-block bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl p-8 shadow-lg">
                    <span className="text-5xl block mb-3">{secretSanta.favorite_emoji}</span>
                    <p className="text-2xl font-bold">{secretSanta.name}</p>
                    <p className="text-sm opacity-90 mt-2">{secretSanta.roll_number}</p>
                  </div>
                  {secretSanta.bio && (
                    <div className="mt-6 bg-gray-100 rounded-xl p-4">
                      <p className="text-gray-700 italic">"{secretSanta.bio}"</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <span className="text-6xl mb-4 block">⏳</span>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Pairings Not Ready</h2>
                  <p className="text-gray-600">
                    Your Secret Santa will be revealed soon! Check back later.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
    </div>
  );
}
