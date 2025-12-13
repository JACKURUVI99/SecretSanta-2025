import { useState, useEffect } from 'react';
import { Profile } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Heart } from 'lucide-react';
interface ViewProfileModalProps {
    userId: string;
    onClose: () => void;
}
export default function ViewProfileModal({ userId, onClose }: ViewProfileModalProps) {
    const { user } = useAuth(); // Current User
    const [profile, setProfile] = useState<Profile | null>(null);
    const [likes, setLikes] = useState(0);
    const [hasLiked, setHasLiked] = useState(false);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetchProfileData();
    }, [userId]);

    const fetchProfileData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Profile
            import('../../lib/api').then(async ({ api }) => {
                const profileData = await api.getProfileById(userId);
                setProfile(profileData);

                // 2. Fetch Likes & Status
                const { count, hasLiked: liked } = await api.getProfileLikes(userId);
                setLikes(count);
                setHasLiked(liked);

                setLoading(false);
            });
        } catch (error) {
            console.error("Failed to load profile:", error);
            setLoading(false);
        }
    };

    const toggleLike = async () => {
        if (!user || user.id === userId) return;

        // Optimistic UI
        const previousLiked = hasLiked;
        const previousLikes = likes;

        setHasLiked(!previousLiked);
        setLikes(prev => previousLiked ? prev - 1 : prev + 1);

        try {
            import('../../lib/api').then(({ api }) => {
                api.toggleProfileLike(userId);
            });
        } catch (error) {
            // Revert on error
            setHasLiked(previousLiked);
            setLikes(previousLikes);
        }
    };
    if (!profile && !loading) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm font-mono">
            <div className="bg-white shadow-[12px_12px_0px_0px_black] max-w-md w-full border-4 border-black relative">
                <div className="bg-[#9333EA] text-white p-6 flex items-center justify-between border-b-4 border-black">
                    <h2 className="text-2xl font-black uppercase tracking-tight">Access Profile</h2>
                    <button
                        onClick={onClose}
                        className="hover:rotate-90 transition-transform bg-black text-white p-1"
                    >
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>
                <div className="p-8 text-center">
                    {loading ? (
                        <div className="animate-spin text-4xl mb-4 text-center block">⌛</div>
                    ) : (
                        <>
                            <div className="inline-block relative">
                                <span className="text-8xl block mb-6 filter drop-shadow-[6px_6px_0px_black] transform hover:scale-110 transition-transform cursor-default">
                                    {profile?.favorite_emoji}
                                </span>
                                {profile?.is_admin && (
                                    <span className="absolute -top-2 -right-4 bg-black text-white px-2 py-1 text-xs font-bold uppercase rotate-12">
                                        Admin
                                    </span>
                                )}
                            </div>
                            <h2 className="text-3xl font-black uppercase text-black mb-1">{profile?.name}</h2>
                            <p className="inline-block bg-black text-white px-2 py-1 font-bold text-sm mb-6">
                                {profile?.roll_number}
                            </p>
                            {profile?.bio && (
                                <div className="bg-[#E0E7FF] border-2 border-black p-4 mb-6 shadow-[4px_4px_0px_0px_black]">
                                    <p className="text-black font-bold italic">"{profile.bio}"</p>
                                </div>
                            )}
                            {profile?.instagram_id && (
                                <a
                                    href={`https://instagram.com/${profile.instagram_id.replace('@', '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-500 text-white px-4 py-2 font-bold mb-6 hover:scale-105 transition-transform border-2 border-black shadow-[3px_3px_0px_0px_black]"
                                >
                                    <span>📸</span>
                                    <span>@{profile.instagram_id.replace('@', '')}</span>
                                </a>
                            )}
                            <div className="flex items-center justify-center gap-6">
                                <div className="text-center">
                                    <span className="block text-2xl font-black">{profile?.points}</span>
                                    <span className="text-xs uppercase font-bold text-gray-500">Points</span>
                                </div>
                                <button
                                    onClick={toggleLike}
                                    disabled={user?.id === userId}
                                    className={`flex flex-col items-center group ${user?.id === userId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Heart
                                        size={32}
                                        strokeWidth={3}
                                        className={`transition-all ${hasLiked ? 'fill-[#C41E3A] text-[#C41E3A]' : 'text-black group-hover:scale-110'}`}
                                    />
                                    <span className="text-xs uppercase font-bold text-gray-500 mt-1">{likes} Likes</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
