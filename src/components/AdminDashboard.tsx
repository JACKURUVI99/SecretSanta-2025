import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Profile, Task, Pairing, AppSettings } from '../lib/supabase';
import SnowBackground from './SnowBackground';
import { LogOut, Users, Gift, Calendar, Settings, Plus, X, Shuffle } from 'lucide-react';

type TabType = 'users' | 'pairings' | 'tasks' | 'settings';

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [pairings, setPairings] = useState<(Pairing & { user?: Profile; secretSanta?: Profile })[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', points: 10, task_date: '' });

  useEffect(() => {
    fetchProfiles();
    fetchPairings();
    fetchTasks();
    fetchSettings();
  }, []);

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });
    setProfiles(data || []);
  };

  const fetchPairings = async () => {
    const { data } = await supabase
      .from('pairings')
      .select('*');

    if (data) {
      const pairingsWithProfiles = await Promise.all(
        data.map(async (pairing) => {
          const { data: user } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', pairing.user_id)
            .single();
          const { data: secretSanta } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', pairing.secret_santa_id)
            .single();
          return { ...pairing, user, secretSanta };
        })
      );
      setPairings(pairingsWithProfiles);
    }
  };

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('task_date', { ascending: false });
    setTasks(data || []);
  };

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('*')
      .single();
    setSettings(data);
  };

  const generatePairings = async () => {
    if (profiles.length < 2) {
      alert('Need at least 2 users to create pairings!');
      return;
    }

    if (!confirm('This will delete existing pairings. Continue?')) return;

    await supabase.from('pairings').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const shuffled = [...profiles].sort(() => Math.random() - 0.5);
    const newPairings = shuffled.map((user, i) => ({
      user_id: user.id,
      secret_santa_id: shuffled[(i + 1) % shuffled.length].id,
    }));

    await supabase.from('pairings').insert(newPairings);
    fetchPairings();
    alert('Pairings created successfully!');
  };

  const deletePairing = async (id: string) => {
    if (!confirm('Delete this pairing?')) return;
    await supabase.from('pairings').delete().eq('id', id);
    fetchPairings();
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('tasks').insert(taskForm);
    setShowTaskModal(false);
    setTaskForm({ title: '', description: '', points: 10, task_date: '' });
    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    await supabase.from('tasks').delete().eq('id', id);
    fetchTasks();
  };

  const updateSettings = async (updates: Partial<AppSettings>) => {
    if (!settings) return;
    await supabase.from('app_settings').update(updates).eq('id', settings.id);
    fetchSettings();
  };

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    await supabase.from('profiles').update({ is_admin: !currentStatus }).eq('id', userId);
    fetchProfiles();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-blue-300 to-white relative">
      <SnowBackground />

      <div className="relative z-10">
        <header className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">👑</span>
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm opacity-90">Manage Secret Santa</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="bg-red-800 px-4 py-2 rounded-full font-semibold hover:bg-red-900 transition flex items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`p-4 rounded-2xl font-bold transition ${
                activeTab === 'users'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-300'
              }`}
            >
              <Users className="mx-auto mb-2" size={24} />
              Users
            </button>
            <button
              onClick={() => setActiveTab('pairings')}
              className={`p-4 rounded-2xl font-bold transition ${
                activeTab === 'pairings'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-300'
              }`}
            >
              <Gift className="mx-auto mb-2" size={24} />
              Pairings
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`p-4 rounded-2xl font-bold transition ${
                activeTab === 'tasks'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-300'
              }`}
            >
              <Calendar className="mx-auto mb-2" size={24} />
              Tasks
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`p-4 rounded-2xl font-bold transition ${
                activeTab === 'settings'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-300'
              }`}
            >
              <Settings className="mx-auto mb-2" size={24} />
              Settings
            </button>
          </div>

          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl shadow-xl border-4 border-blue-400 overflow-hidden">
              <div className="bg-blue-500 text-white p-6">
                <h2 className="text-2xl font-bold">Registered Users ({profiles.length})</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {profiles.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{user.favorite_emoji}</span>
                        <div>
                          <h3 className="font-bold text-gray-800">{user.name}</h3>
                          <p className="text-sm text-gray-600">{user.roll_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                          {user.points} pts
                        </span>
                        <button
                          onClick={() => toggleAdmin(user.id, user.is_admin)}
                          className={`px-4 py-2 rounded-lg font-semibold transition ${
                            user.is_admin
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                          }`}
                        >
                          {user.is_admin ? 'Admin' : 'User'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pairings' && (
            <div className="bg-white rounded-2xl shadow-xl border-4 border-green-400 overflow-hidden">
              <div className="bg-green-500 text-white p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Secret Santa Pairings</h2>
                <button
                  onClick={generatePairings}
                  className="bg-white text-green-600 px-4 py-2 rounded-full font-semibold hover:bg-green-50 transition flex items-center gap-2"
                >
                  <Shuffle size={18} />
                  Generate Random
                </button>
              </div>
              <div className="p-6">
                {pairings.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-6xl block mb-4">🎁</span>
                    <p className="text-gray-600 mb-4">No pairings yet!</p>
                    <button
                      onClick={generatePairings}
                      className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 transition"
                    >
                      Generate Pairings
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pairings.map((pairing) => (
                      <div
                        key={pairing.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-green-50 rounded-xl border-2 border-gray-200"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-center">
                            <span className="text-3xl block">{pairing.user?.favorite_emoji}</span>
                            <p className="text-sm font-bold text-gray-800 mt-1">{pairing.user?.name}</p>
                          </div>
                          <span className="text-2xl">→</span>
                          <div className="text-center">
                            <span className="text-3xl block">{pairing.secretSanta?.favorite_emoji}</span>
                            <p className="text-sm font-bold text-gray-800 mt-1">
                              {pairing.secretSanta?.name}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => deletePairing(pairing.id)}
                          className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="bg-white rounded-2xl shadow-xl border-4 border-yellow-400 overflow-hidden">
              <div className="bg-yellow-500 text-white p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Daily Tasks</h2>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="bg-white text-yellow-600 px-4 py-2 rounded-full font-semibold hover:bg-yellow-50 transition flex items-center gap-2"
                >
                  <Plus size={18} />
                  New Task
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-gray-800">{task.title}</h3>
                          <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                            +{task.points} pts
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">{task.description}</p>
                        <p className="text-gray-500 text-sm mt-2">
                          {new Date(task.task_date).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && settings && (
            <div className="bg-white rounded-2xl shadow-xl border-4 border-purple-400 overflow-hidden">
              <div className="bg-purple-500 text-white p-6">
                <h2 className="text-2xl font-bold">App Settings</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Gifting Day
                  </label>
                  <input
                    type="date"
                    value={settings.gifting_day}
                    onChange={(e) => updateSettings({ gifting_day: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:outline-none transition"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Registration will close on this day
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.registration_open}
                      onChange={(e) => updateSettings({ registration_open: e.target.checked })}
                      className="w-6 h-6 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-lg font-semibold text-gray-700">
                      Registration Open
                    </span>
                  </label>
                  <p className="text-sm text-gray-600 mt-2 ml-9">
                    Allow new users to sign up
                  </p>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                  <h3 className="font-bold text-blue-900 mb-2">Quick Stats</h3>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-3xl font-bold text-blue-600">{profiles.length}</div>
                      <div className="text-sm text-gray-600">Total Users</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-green-600">{pairings.length}</div>
                      <div className="text-sm text-gray-600">Pairings</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border-4 border-yellow-500">
            <div className="bg-yellow-500 text-white p-6 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold">Create New Task</h2>
              <button
                onClick={() => setShowTaskModal(false)}
                className="hover:bg-yellow-600 p-2 rounded-full transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={createTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Task Title
                </label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-yellow-500 focus:outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-yellow-500 focus:outline-none transition h-24 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Points
                </label>
                <input
                  type="number"
                  value={taskForm.points}
                  onChange={(e) => setTaskForm({ ...taskForm, points: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-yellow-500 focus:outline-none transition"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Task Date
                </label>
                <input
                  type="date"
                  value={taskForm.task_date}
                  onChange={(e) => setTaskForm({ ...taskForm, task_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-yellow-500 focus:outline-none transition"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 px-4 rounded-xl hover:from-yellow-600 hover:to-orange-600 transform hover:scale-105 transition shadow-lg"
              >
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
