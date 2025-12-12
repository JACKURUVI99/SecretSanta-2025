import { useEffect, useState, useRef } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, X, Send, Move } from 'lucide-react';
import ProfileModal from './ProfileModal';

type Message = {
    id: string;
    user_id: string;
    message: string;
    created_at: string;
    profiles: Profile; // Changed to full Profile type for modal
};

export default function GlobalChat() {
    const { profile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [isDragging, setIsDragging] = useState(false);

    // Profile Viewing State
    const [viewProfile, setViewProfile] = useState<Profile | null>(null);

    const dragRef = useRef<{ startX: number, startY: number, initialLeft: number, initialTop: number } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Removed unused channelRef

    useEffect(() => {
        fetchMessages();

        // POLL instead of Realtime (User requested disabled WebSockets)
        const interval = setInterval(() => {
            fetchMessages();
        }, 5000); // 5 seconds polling

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async () => {
        const { data } = await supabase
            .from('global_chat')
            .select('*, profiles(*)') // Fetch ALL profile fields
            .order('created_at', { ascending: false })
            .limit(50);

        if (data) {
            setMessages(data.reverse());
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

        // 1. Optimistic Update (Instant for Sender)
        setMessages(prev => [...prev, newMsg]);

        // 2. Save to DB (Poller will pick it up on next tick for others)
        const { error } = await supabase
            .from('global_chat')
            .insert({
                id: tempId,
                user_id: profile.id,
                message: msgContent
            });

        if (error) {
            console.error("Failed to save message to DB:", error);
            alert("Failed to send message. Please reload.");
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialLeft: rect.left,
            initialTop: rect.top
        };
    };

    useEffect(() => {
        const handleWindowMove = (e: MouseEvent) => {
            if (!isDragging || !dragRef.current) return;

            const deltaX = e.clientX - dragRef.current.startX;
            const deltaY = e.clientY - dragRef.current.startY;

            setPosition(prev => ({
                x: prev.x - deltaX,
                y: prev.y - deltaY
            }));

            dragRef.current.startX = e.clientX;
            dragRef.current.startY = e.clientY;
        };

        const handleWindowUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleWindowMove);
            window.addEventListener('mouseup', handleWindowUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleWindowMove);
            window.removeEventListener('mouseup', handleWindowUp);
        };
    }, [isDragging]);

    const handleProfileClick = async (userId: string) => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (data) {
            setViewProfile(data);
        }
    };

    return (
        <>
            <div
                className={`fixed z-[40] flex flex-col items-end transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-90 hover:opacity-100'}`}
                style={{
                    right: `${position.x}px`,
                    bottom: `${position.y}px`,
                    cursor: isDragging ? 'grabbing' : 'default'
                }}
            >
                {isOpen && (
                    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] w-80 h-96 mb-4 flex flex-col">
                        <div
                            className="bg-[#9333EA] text-white p-3 border-b-4 border-black flex justify-between items-center cursor-move active:cursor-grabbing"
                            onMouseDown={handleMouseDown}
                        >
                            <div className="flex items-center gap-2">
                                <Move size={16} />
                                <span className="font-black uppercase">Global Chat</span>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="hover:text-black transition-colors"
                            >
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f5f3ff]">
                            {messages.map(msg => {
                                const isMe = msg.user_id === profile?.id;
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
                                            <div className={`p-2 border-2 border-black shadow-[2px_2px_0px_0px_black] text-sm font-bold ${isMe ? 'bg-[#FFD700] text-black' : 'bg-white text-black'
                                                }`}>
                                                {msg.message}
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

                {!isOpen && (
                    <button
                        id="global-chat-btn"
                        onClick={() => setIsOpen(true)}
                        onMouseDown={handleMouseDown}
                        className="bg-[#9333EA] text-white p-4 border-4 border-black rounded-full shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_black] transition-all active:scale-95 cursor-move"
                        title="Open Global Chat"
                    >
                        <MessageCircle size={32} strokeWidth={3} />
                    </button>
                )}
            </div>
            { }
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
