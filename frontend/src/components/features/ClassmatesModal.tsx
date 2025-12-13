import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Profile } from '../../lib/supabase';
import { X, User } from 'lucide-react';
import ProfileModal from './ProfileModal';

export default function ClassmatesModal({ onClose }: { onClose: () => void }) {
    const [classmates, setClassmates] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const [activeTab, setActiveTab] = useState<'grid' | 'leaderboard'>('grid');

    useEffect(() => {
        fetchClassmates();
    }, []);

    const fetchClassmates = async () => {
        try {
            const data = await api.getClassmates();
            setClassmates(data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const getSortedClassmates = () => {
        return [...classmates].sort((a, b) => (b.points || 0) - (a.points || 0));
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[150] p-4 backdrop-blur-sm animate-fade-in font-mono">
            <div className="bg-white border-4 border-black w-full max-w-2xl h-[80vh] flex flex-col shadow-[12px_12px_0px_0px_black] relative">
                <div className="bg-[#FFD700] p-4 border-b-4 border-black flex justify-between items-center">
                    <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                        <User fill="black" /> Classmates ({classmates.length})
                    </h2>
                    <button onClick={onClose} className="bg-white border-2 border-black p-1 hover:bg-black hover:text-white transition-colors">
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>

                <div className="flex border-b-4 border-black">
                    <button
                        onClick={() => setActiveTab('grid')}
                        className={`flex-1 py-3 font-black uppercase transition-colors ${activeTab === 'grid' ? 'bg-[#E0E7FF] text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        👥 Class Grid
                    </button>
                    <button
                        onClick={() => setActiveTab('leaderboard')}
                        className={`flex-1 py-3 font-black uppercase transition-colors ${activeTab === 'leaderboard' ? 'bg-[#E0E7FF] text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        🏆 Class Leaderboard
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-[#E0E7FF] flex flex-col gap-4">
                    {/* Notice */}
                    <div className="bg-blue-100 border-2 border-blue-600 p-2 text-xs font-bold text-blue-800 text-center uppercase">
                        Showing peers from your Class & Section
                    </div>

                    {loading ? (
                        <div className="text-center font-bold text-xl py-10 animate-pulse">Loading class list...</div>
                    ) : classmates.length === 0 ? (
                        <div className="text-center font-bold text-gray-500 py-10">No classmates found using app yet! 🕵️</div>
                    ) : (
                        activeTab === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {classmates.map(user => (
                                    <div key={user.id}
                                        onClick={() => setSelectedProfile(user)}
                                        className="bg-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 transition-all cursor-pointer flex items-center gap-4 group">
                                        <span className="text-4xl group-hover:scale-110 transition-transform">{user.favorite_emoji || '🎅'}</span>
                                        <div>
                                            <h3 className="font-black text-lg uppercase leading-tight line-clamp-1">{user.name}</h3>
                                            <p className="text-xs font-bold bg-black text-white inline-block px-1 mt-1">#{user.roll_number}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {getSortedClassmates().map((user, index) => (
                                    <div key={user.id}
                                        onClick={() => setSelectedProfile(user)}
                                        className={`flex items-center p-3 border-4 border-black shadow-[4px_4px_0px_0px_black] bg-white cursor-pointer hover:-translate-y-1 transition-transform ${index < 3 ? 'bg-yellow-50' : ''}`}
                                    >
                                        <div className={`w-10 h-10 flex items-center justify-center font-black text-lg border-2 border-black mr-4 shadow-[2px_2px_0px_black] ${index === 0 ? 'bg-[#FFD700]' : index === 1 ? 'bg-gray-300' : index === 2 ? 'bg-[#CD7F32]' : 'bg-white'}`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 flex items-center gap-3">
                                            <span className="text-2xl">{user.favorite_emoji || '🎅'}</span>
                                            <div>
                                                <h3 className="font-black uppercase leading-tight line-clamp-1">{user.name}</h3>
                                                <p className="text-xs font-bold text-gray-500">#{user.roll_number}</p>
                                            </div>
                                        </div>
                                        <div className="font-black text-xl text-[#00A86B]">
                                            {user.points} pts
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>

            {selectedProfile && (
                <ProfileModal
                    profile={selectedProfile}
                    readonly={true}
                    onClose={() => setSelectedProfile(null)}
                />
            )}
        </div>
    );
}
