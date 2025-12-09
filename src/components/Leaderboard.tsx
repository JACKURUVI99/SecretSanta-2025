import { useEffect, useState } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { X, Trophy, Medal, Award } from 'lucide-react';

export default function Leaderboard({ onClose }: { onClose: () => void }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('points', { ascending: false })
        .limit(10);

      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="text-yellow-500" size={28} />;
    if (index === 1) return <Medal className="text-gray-400" size={24} />;
    if (index === 2) return <Award className="text-orange-600" size={24} />;
    return null;
  };

  const getRankColor = (index: number) => {
    if (index === 0) return 'from-yellow-400 to-yellow-600';
    if (index === 1) return 'from-gray-300 to-gray-500';
    if (index === 2) return 'from-orange-400 to-orange-600';
    return 'from-blue-400 to-blue-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-4 border-yellow-500">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-6 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Trophy size={32} />
            <h2 className="text-2xl font-bold">Leaderboard</h2>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin text-4xl">❄️</div>
              <p className="text-gray-600 mt-4">Loading...</p>
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl block mb-4">🎄</span>
              <p className="text-gray-600">No participants yet!</p>
            </div>
          ) : (
            profiles.map((profile, index) => (
              <div
                key={profile.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border-4 ${
                  index < 3 ? 'bg-gradient-to-r ' + getRankColor(index) + ' text-white' : 'bg-gray-100 border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center w-12 h-12">
                  {getRankIcon(index) || (
                    <span className="text-xl font-bold text-gray-600">{index + 1}</span>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{profile.favorite_emoji}</span>
                    <div>
                      <h3 className={`font-bold ${index < 3 ? 'text-white' : 'text-gray-800'}`}>
                        {profile.name}
                      </h3>
                      <p className={`text-sm ${index < 3 ? 'text-white opacity-90' : 'text-gray-600'}`}>
                        {profile.roll_number}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-3xl font-bold ${index < 3 ? 'text-white' : 'text-gray-800'}`}>
                    {profile.points}
                  </div>
                  <div className={`text-sm ${index < 3 ? 'text-white opacity-90' : 'text-gray-600'}`}>
                    points
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
