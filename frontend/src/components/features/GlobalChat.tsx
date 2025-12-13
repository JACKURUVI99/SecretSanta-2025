import { useEffect, useState, useRef } from 'react';
import { Profile } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { MessageCircle, X, Send, Move } from 'lucide-react';
import ProfileModal from './ProfileModal';
import { api } from '../../lib/api';

type Message = {
    id: string;
    user_id: string;
    message: string;
    created_at: string;
    profiles: Profile;
};

type GlobalChatProps = {
    mode?: 'floating' | 'embedded';
    isAdminView?: boolean;
};

export default function GlobalChat({ mode = 'floating', isAdminView = false, isOpen: propsIsOpen, onToggle }: GlobalChatProps & { isOpen?: boolean; onToggle?: () => void }) {
    const { profile } = useAuth();
    // If propsIsOpen is provided, use it (controlled). Otherwise use internal state (uncontrolled/embedded)
    const [internalIsOpen, setInternalIsOpen] = useState(mode === 'embedded');
    const isControlled = propsIsOpen !== undefined;
    const isOpen = isControlled ? propsIsOpen : internalIsOpen;

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [viewProfile, setViewProfile] = useState<Profile | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchMessages();

        // POLL instead of Realtime
        const interval = setInterval(() => {
            fetchMessages();
        }, 30000); // 30 seconds polling (Reduced from 5s to save bandwidth)

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async () => {
        try {
            const data = await api.getChatMessages();
            if (data) {
                setMessages(data);
            }
        } catch (e) {
            console.error("Fetch messages failed", e);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !profile) return;

        const msgContent = newMessage.trim();
        const tempId = crypto.randomUUID();

        setNewMessage('');

        const newMsg: Message = {
            id: tempId,
            user_id: profile.id,
            message: msgContent,
            created_at: new Date().toISOString(),
            profiles: profile
        };

        // 1. Optimistic Update
        setMessages(prev => [...prev, newMsg]);

        // 2. Save to DB
        try {
            await api.sendChatMessage(msgContent, tempId);
        } catch (error) {
            console.error("Failed to save message to DB:", error);
            alert("Failed to send message. Please reload.");
        }
    };

    const handleProfileClick = async (userId: string) => {
        try {
            import('../../lib/api').then(async ({ api }) => {
                const data = await api.getProfileById(userId);
                if (data) {
                    setViewProfile(data);
                }
            });
        } catch (e) {
            console.error("Fetch profile failed", e);
        }
    };

    // Override isOpen logic for embedded mode
    // If embedded, always show. If floating, depend on state.
    const showChat = mode === 'embedded' ? true : isOpen;

    const handleDelete = async (msgId: string) => {
        if (!confirm("Are you sure you want to delete this message?")) return;
        try {
            // Dynamically import adminApi to avoid circular deps if any, or just use it.
            // But API definition is in same file usually.
            const { adminApi } = await import('../../lib/api');
            await adminApi.deleteChatMessage(msgId);
            setMessages(prev => prev.filter(m => m.id !== msgId));
        } catch (e) {
            console.error("Delete failed", e);
            alert("Failed to delete. Are you an admin logged in?");
        }
    };

    // Toggle handler
    const handleToggle = () => {
        if (isControlled && onToggle) {
            onToggle();
        } else {
            setInternalIsOpen(!internalIsOpen);
        }
    };

    return (
        <>
            <div
                className={mode === 'embedded'
                    ? `flex flex-col h-full w-full bg-white`
                    : `fixed z-[99] flex flex-col items-end transition-opacity duration-200 ${showChat ? 'opacity-100' : 'opacity-100'}`}
                style={mode === 'floating' ? {
                    right: '1.5rem', // Fixed right-6
                    bottom: '1.5rem', // Fixed bottom-6 to match SantaChat level
                } : {}}
            >
                {showChat && (
                    <div className={mode === 'embedded' ? "flex flex-col h-full w-full" : "bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] w-[90vw] md:w-80 h-96 mb-20 flex flex-col fixed bottom-4 right-4 z-[100]"}>
                        <div
                            className="bg-[#9333EA] text-white p-3 border-b-4 border-black flex justify-between items-center"
                        >
                            <div className="flex items-center gap-2">
                                <Move size={16} />
                                <span className="font-black uppercase">Global Chat</span>
                            </div>
                            {mode === 'floating' && (
                                <button
                                    onClick={handleToggle}
                                    className="hover:text-black transition-colors"
                                >
                                    <X size={20} strokeWidth={3} />
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f5f3ff]">
                            {messages.map(msg => {
                                const isMe = msg.user_id === profile?.id;
                                const isAdmin = profile?.is_admin || isAdminView;
                                return (
                                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : ''}`}>
                                            <div
                                                className="text-2xl cursor-pointer hover:scale-110 transition-transform"
                                                title={`View ${msg.profiles?.name}'s Profile`}
                                                onClick={() => handleProfileClick(msg.user_id)}
                                            >
                                                {msg.profiles?.favorite_emoji}
                                            </div>
                                            <div className={`group relative p-2 border-2 border-black shadow-[2px_2px_0px_0px_black] text-sm font-bold ${isMe ? 'bg-[#FFD700] text-black' : 'bg-white text-black'
                                                }`}>
                                                {msg.message}
                                                {isAdmin && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); }}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity border-2 border-black w-6 h-6 flex items-center justify-center text-[10px]"
                                                        title="Delete Message"
                                                    >
                                                        X
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {!isMe && (
                                            <span
                                                onClick={() => handleProfileClick(msg.user_id)}
                                                className="text-[10px] font-bold text-gray-500 ml-10 mt-1 uppercase cursor-pointer hover:text-black hover:underline"
                                            >
                                                {msg.profiles?.name}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={sendMessage} className="p-3 bg-white border-t-4 border-black flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Say something..."
                                className="flex-1 px-2 py-1 border-2 border-black font-bold text-sm focus:outline-none focus:shadow-[2px_2px_0px_0px_black] transition-all"
                            />
                            <button
                                type="submit"
                                className="bg-black text-white p-2 border-2 border-black hover:-translate-y-1 hover:shadow-[2px_2px_0px_0px_gray] transition-all"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                )}

                {!showChat && mode === 'floating' && (
                    <button
                        id="global-chat-btn"
                        onClick={handleToggle}
                        className="bg-[#9333EA] text-white w-16 h-16 p-0 border-4 border-black rounded-full shadow-[6px_6px_0px_0px_black] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_black] transition-all active:scale-95 flex items-center justify-center"
                        title="Open Global Chat"
                    >
                        <MessageCircle className="w-8 h-8" strokeWidth={3} />
                    </button>
                )}
            </div>
            {/* Profile Modal */}
            {viewProfile && (
                <ProfileModal
                    onClose={() => setViewProfile(null)}
                    viewOnly={true}
                    targetProfile={viewProfile}
                />
            )}
        </>
    );
}
