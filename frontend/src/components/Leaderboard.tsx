import { useEffect, useState } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { X, Trophy, Medal, Award } from 'lucide-react';
import ViewProfileModal from './ViewProfileModal';
export default function Leaderboard({ onClose }: { onClose: () => void }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  // const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchLeaderboard();

    /* 
    // WebSocket Presence Disabled
    const channel = supabase.channel('global_presence')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = new Set<string>();
        for (const id in state) {
          // Check all presence entries for this ID (user can be on multiple devices)
          const presenceEntries = state[id] as any[];
          presenceEntries.forEach(entry => {
            if (entry.user_id) online.add(entry.user_id);
          });
        }
        setOnlineUserIds(online);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    */
  }, []);
  const fetchLeaderboard = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or('is_admin.eq.false,roll_number.eq.107124039')
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
    if (index === 0) return <Trophy className="text-[#FFD700] filter drop-shadow-[2px_2px_0px_black]" size={28} strokeWidth={2.5} />;
    if (index === 1) return <Medal className="text-gray-400 filter drop-shadow-[2px_2px_0px_black]" size={24} strokeWidth={2.5} />;
    if (index === 2) return <Award className="text-[#CD7F32] filter drop-shadow-[2px_2px_0px_black]" size={24} strokeWidth={2.5} />;
    return null;
  };
  const getRankColor = (index: number) => {
    if (index === 0) return 'bg-[#FFD700]';
    if (index === 1) return 'bg-gray-300';
    if (index === 2) return 'bg-[#CD7F32]'; // Bronze
    return 'bg-white';
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm font-mono">
      <div className="bg-white shadow-[12px_12px_0px_0px_black] max-w-2xl w-full max-h-[90vh] overflow-y-auto border-4 border-black relative">
        <div className="bg-[#FFD700] text-black p-3 md:p-6 flex items-center justify-between border-b-4 border-black sticky top-0 z-10 w-full">
          <div className="flex items-center gap-2 md:gap-3">
            <Trophy size={24} className="md:w-8 md:h-8" strokeWidth={3} />
            <h2 className="text-lg md:text-2xl font-black uppercase tracking-tight">Leaderboard</h2>
          </div>
          <button
            onClick={onClose}
            className="hover:rotate-90 transition-transform bg-black text-white p-1"
          >
            <X size={20} className="md:w-6 md:h-6" strokeWidth={3} />
          </button>
        </div>
        <div className="p-3 md:p-6 space-y-3 md:space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin text-4xl filter drop-shadow-[2px_2px_0px_black]">❄️</div>
              <p className="text-black font-bold uppercase mt-4">Loading...</p>
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl block mb-4 filter drop-shadow-[4px_4px_0px_black]">🎄</span>
              <p className="text-black font-bold uppercase">No participants yet!</p>
            </div>
          ) : (
            profiles.map((profile, index) => (
              <div
                key={profile.id}
                onClick={() => setSelectedUserId(profile.id)}
                className={`flex items-center gap-2 md:gap-4 p-2 md:p-4 border-4 border-black shadow-[4px_4px_0px_0px_black] transition-transform hover:-translate-y-1 cursor-pointer ${index < 3 ? getRankColor(index) : 'bg-white'
                  }`}
              >
                <div className="flex items-center justify-center w-8 h-8 md:w-12 md:h-12 font-black text-lg md:text-2xl flex-shrink-0">
                  {getRankIcon(index) || (
                    <span className="text-black">#{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl md:text-2xl filter drop-shadow-[2px_2px_0px_black] flex-shrink-0">{profile.favorite_emoji}</span>
                    <div className="min-w-0">
                      <h3 className="font-black text-black uppercase text-sm md:text-lg leading-tight break-words whitespace-normal">
                        {profile.name}
                      </h3>
                      <p className="text-[10px] md:text-xs font-bold bg-black text-white inline-block px-1 mt-0.5 md:mt-1">
                        {profile.roll_number}
                      </p>
                      {/* {onlineUserIds.has(profile.id) && (
                        <span className="ml-2 inline-flex items-center gap-1 bg-green-500 text-white text-[10px] uppercase font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-[2px_2px_0px_black]">
                          Online
                        </span>
                      )} */}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg md:text-2xl font-black text-black">
                    {profile.points}
                  </div>
                  <div className="text-[10px] md:text-xs font-bold uppercase text-black opacity-80">
                    pts
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {selectedUserId && (
        <ViewProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </div>
  );
}
