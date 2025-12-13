import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { X } from 'lucide-react';
export default function SantaGuide() {
    const { profile } = useAuth();
    const [message, setMessage] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    useEffect(() => {
        if (!profile) return;

        const checkNotifications = async () => {
            try {
                // 1. Check Profile Completeness
                if (!profile.bio || !profile.instagram_id || profile.favorite_emoji === '🎅') {
                    if (Math.random() < 0.3) {
                        showSanta("Hey! Your profile looks a bit empty! 📝\nFill it out so your classmates know it's you!");
                        return;
                    }
                }

                // 2. Fetch Notifications
                const notifs = await api.getNotifications();
                if (notifs && notifs.length > 0) {
                    const first = notifs[0];
                    showSanta(first.message); // Show the first one
                    // Mark as read immediately to avoid looping logic for now
                    // Ideally we queue them, but for MVP popping one is fine.
                    await api.markNotificationsRead([first.id]);
                } else {
                    // Random Greetings if no notifs
                    if (Math.random() < 0.1) {
                        const greetings = [
                            "Don't forget to check your tasks! 📝",
                            "Have you watered the reindeer today? 🦌",
                            "Someone might have sent you a message! 💬",
                            "Keep that streak alive! 🔥",
                            "Check out who's in your class! 🏫"
                        ];
                        showSanta(greetings[Math.floor(Math.random() * greetings.length)]);
                    }
                }
            } catch (e) { console.error(e); }
        };

        const interval = setInterval(checkNotifications, 10000); // Check every 10s
        checkNotifications(); // check immediately

        return () => clearInterval(interval);
    }, [profile]);
    const showSanta = (msg: string) => {
        setMessage(msg);
        setIsVisible(true);
        setIsAnimating(true);
        setTimeout(() => {
            setIsVisible(false);
        }, 10000);
    };
    if (!isVisible) return null;
    return (
        <div className={`fixed bottom-24 md:bottom-4 right-4 z-[9999] flex flex-col items-end pointer-events-none ${isAnimating ? 'animate-bounce-in' : ''}`}>
            { }
            <div className="bg-white border-4 border-black p-4 rounded-t-xl rounded-bl-xl shadow-[4px_4px_0px_0px_black] mb-2 max-w-xs relative pointer-events-auto">
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute -top-2 -left-2 bg-red-500 text-white border-2 border-black rounded-full p-1 hover:scale-110 transition-transform"
                >
                    <X size={12} strokeWidth={4} />
                </button>
                <p className="font-bold text-sm whitespace-pre-line">{message}</p>
                <div className="absolute bottom-[-10px] right-4 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-black border-r-[10px] border-r-transparent"></div>
                <div className="absolute bottom-[-6px] right-4 w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-white border-r-[8px] border-r-transparent"></div>
            </div>
            { }
            { }
            <div className="relative pointer-events-auto cursor-pointer hover:scale-110 transition-transform origin-bottom" onClick={() => showSanta("Ho Ho Ho!")}>
                <div className="text-6xl filter drop-shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">🎅</div>
                <div className="absolute -bottom-2 -right-1 text-2xl">🤚</div>
            </div>
            <style>{`
        @keyframes bounce-in {
            0% { transform: translateY(100px); opacity: 0; }
            60% { transform: translateY(-20px); opacity: 1; }
            100% { transform: translateY(0); }
        }
        .animate-bounce-in {
            animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
        </div>
    );
}
