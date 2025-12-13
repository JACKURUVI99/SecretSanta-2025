import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X, Instagram } from 'lucide-react';
import { Profile } from '../../lib/supabase';
import { api } from '../../lib/api';
const EMOJI_OPTIONS = ['🎅', '⛄', '🎄', '🎁', '❄️', '⭐', '🔔', '🦌', '🍪', '☃️', '🎊', '🎉'];
interface ProfileModalProps {
  onClose: () => void;
  viewOnly?: boolean;
  readonly?: boolean; // Alias for viewOnly
  targetProfile?: Profile | null;
  profile?: Profile | null; // Alias for targetProfile
}
export default function ProfileModal({ onClose, viewOnly, readonly, targetProfile, profile: propProfile }: ProfileModalProps) {
  const isViewOnly = viewOnly || readonly || false;
  const target = targetProfile || propProfile || null;
  const { profile, updateProfile } = useAuth();

  const activeProfile = isViewOnly ? target : profile;
  const [name, setName] = useState(activeProfile?.name || '');
  const [bio, setBio] = useState(activeProfile?.bio || '');
  const [favoriteEmoji, setFavoriteEmoji] = useState(activeProfile?.favorite_emoji || '🎅');
  const [instagramId, setInstagramId] = useState(activeProfile?.instagram_id || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeProfile) {
      setName(activeProfile.name);
      setBio(activeProfile.bio || '');
      setFavoriteEmoji(activeProfile.favorite_emoji || '🎅');
      setInstagramId(activeProfile.instagram_id || '');
    }
  }, [activeProfile]);

  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    if (activeProfile?.id) {
      api.getProfileLikes(activeProfile.id).then(data => {
        setLikes(data.count || 0);
        setHasLiked(data.hasLiked || false);
      });
    }
  }, [activeProfile?.id]);

  const handleLike = async () => {
    if (!activeProfile) return;
    // Optimistic
    const newStatus = !hasLiked;
    setHasLiked(newStatus);
    setLikes(prev => newStatus ? prev + 1 : prev - 1);

    try {
      await api.toggleProfileLike(activeProfile.id);
    } catch (e) {
      // Revert
      setHasLiked(!newStatus);
      setLikes(prev => !newStatus ? prev + 1 : prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewOnly) return; // Prevention
    setLoading(true);
    try {
      await updateProfile({
        name,
        bio,
        favorite_emoji: favoriteEmoji,
        instagram_id: instagramId
      });
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };
  if (!activeProfile && isViewOnly) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm font-mono">
      <div className="bg-white shadow-[12px_12px_0px_0px_black] max-w-lg w-full max-h-[90vh] overflow-y-auto border-4 border-black relative z-[101]">
        <div className="bg-[#C41E3A] text-white p-6 flex items-center justify-between border-b-4 border-black">
          <h2 className="text-2xl font-black uppercase tracking-tight">
            {isViewOnly ? "Profile View" : "Edit Profile"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="hover:rotate-90 transition-transform bg-black text-white p-1 cursor-pointer"
          >
            <X size={24} strokeWidth={3} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          { }
          <div className="text-center mb-6 relative">
            <div className="text-6xl mb-2 filter drop-shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
              {isViewOnly ? activeProfile?.favorite_emoji : favoriteEmoji}
            </div>
            {isViewOnly && (
              <div className="flex justify-center mt-2">
                <button
                  type="button"
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 border-black font-bold uppercase transition-all ${hasLiked ? 'bg-[#C41E3A] text-white shadow-[2px_2px_0px_black] translate-y-[2px] shadow-none' : 'bg-white text-black shadow-[4px_4px_0px_black] hover:-translate-y-1'}`}
                >
                  <span>{hasLiked ? '❤️' : '🤍'}</span>
                  <span>{likes} {likes === 1 ? 'Like' : 'Likes'}</span>
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-black text-black uppercase mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              readOnly={isViewOnly}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-3 border-4 border-black font-bold transition-all ${isViewOnly ? 'bg-gray-100 cursor-default' : 'focus:outline-none focus:shadow-[4px_4px_0px_0px_black]'}`}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-black text-black uppercase mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              readOnly={isViewOnly}
              onChange={(e) => setBio(e.target.value)}
              className={`w-full px-4 py-3 border-4 border-black font-bold transition-all h-24 resize-none ${isViewOnly ? 'bg-gray-100 cursor-default' : 'focus:outline-none focus:shadow-[4px_4px_0px_0px_black]'}`}
              placeholder={isViewOnly ? "No bio set." : "Tell everyone about yourself..."}
            />
          </div>
          <div>
            <label className="block text-sm font-black text-black uppercase mb-2 flex items-center gap-2">
              <Instagram size={16} /> Instagram ID
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 font-bold text-gray-500">@</span>
              <input
                type="text"
                value={instagramId}
                readOnly={isViewOnly}
                onChange={(e) => setInstagramId(e.target.value.replace('@', ''))} // Strip @ if user types it
                className={`w-full pl-8 pr-4 py-3 border-4 border-black font-bold transition-all ${isViewOnly ? 'bg-gray-100 cursor-default' : 'focus:outline-none focus:shadow-[4px_4px_0px_0px_black]'}`}
                placeholder="username"
              />
            </div>
            {isViewOnly && instagramId && (
              <a
                href={`https://instagram.com/${instagramId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 text-sm font-bold text-[#C41E3A] hover:underline uppercase"
              >
                Visit Profile →
              </a>
            )}
          </div>
          {!isViewOnly && (
            <div>
              <label className="block text-sm font-black text-black uppercase mb-3">
                Favorite Emoji
              </label>
              <div className="grid grid-cols-6 gap-3">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFavoriteEmoji(emoji)}
                    className={`text-4xl p-3 border-4 transition-all ${favoriteEmoji === emoji
                      ? 'border-black bg-[#FFD700] shadow-[4px_4px_0px_0px_black] transform -translate-y-1'
                      : 'border-white hover:border-black hover:bg-gray-50'
                      }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!isViewOnly && (
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#C41E3A] text-white font-black uppercase py-4 border-4 border-black shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_black] active:translate-y-0 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
