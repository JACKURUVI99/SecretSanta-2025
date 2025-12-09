import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Upload } from 'lucide-react';

const EMOJI_OPTIONS = ['🎅', '⛄', '🎄', '🎁', '❄️', '⭐', '🔔', '🦌', '🍪', '☃️', '🎊', '🎉'];

export default function ProfileModal({ onClose }: { onClose: () => void }) {
  const { profile, updateProfile } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [favoriteEmoji, setFavoriteEmoji] = useState(profile?.favorite_emoji || '🎅');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({ name, bio, favorite_emoji: favoriteEmoji });
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border-4 border-red-500">
        <div className="bg-red-600 text-white p-6 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold">Edit Profile</h2>
          <button
            onClick={onClose}
            className="hover:bg-red-700 p-2 rounded-full transition"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-red-500 focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-red-500 focus:outline-none transition h-24 resize-none"
              placeholder="Tell everyone about yourself..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Favorite Emoji
            </label>
            <div className="grid grid-cols-6 gap-3">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFavoriteEmoji(emoji)}
                  className={`text-4xl p-3 rounded-xl border-2 transition ${
                    favoriteEmoji === emoji
                      ? 'border-red-500 bg-red-50 scale-110'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-3 px-4 rounded-xl hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
