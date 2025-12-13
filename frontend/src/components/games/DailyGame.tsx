import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
// import { supabase } from '../../lib/supabase'; // REMOVING Supabase Access
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle } from 'lucide-react';
const EMOJIS = [
    { id: 'heart', icon: '❤️' },
    { id: 'fire', icon: '🔥' },
    { id: 'laugh', icon: '😂' },
    { id: 'clap', icon: '👏' },
    { id: 'party', icon: '🎉' },
    { id: 'star', icon: '⭐' },
];
interface DailyGameProps {
    onGameComplete?: () => void;
}

export default function DailyGame({ onGameComplete }: DailyGameProps) {
    const { profile } = useAuth();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [reactions, setReactions] = useState<{ id: string; emoji: string; x: number; y: number }[]>([]);
    const [checkedIn, setCheckedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        checkDailyStatus();
        setupRealtime();
        loadCanvasState();
        // Cleanup
        return () => {
            // supabase.removeAllChannels(); // Removed
        };
    }, []);
    const checkDailyStatus = async () => {
        if (!profile) return;
        try {
            const { checkedIn } = await api.getDailyStatus();
            setCheckedIn(checkedIn);
        } catch (e) { console.error(e); } finally {
            setLoading(false);
        }
    };
    const handleCheckIn = async () => {
        if (!profile || checkedIn) return;
        try {
            const today = new Date().toISOString().split('T')[0];
            await api.dailyCheckin(today);
            setCheckedIn(true);
            sendReaction('✅');
        } catch (e) {
            console.error(e);
            // If already checked in, maybe just set true?
            setCheckedIn(true);
        }
    };
    // --- Realtime Canvas Logic ---
    const setupRealtime = () => {
        /*
        // Join the game room
        const channel = supabase.channel('game_room', {
            config: {
                broadcast: { self: false } // Don't receive own messages
            }
        });
        channel
            .on('broadcast', { event: 'canvas_draw' }, ({ payload }) => {
                drawOnCanvas(payload);
            })
            .on('broadcast', { event: 'reaction' }, ({ payload }) => {
                addReaction(payload);
            })
            .on('broadcast', { event: 'clear_canvas' }, () => {
                clearCanvasLocal();
            })
            .subscribe((status, err) => {
               // ...
            });
        return channel;
        */
        return null;
    };
    const loadCanvasState = async () => {
        // For now, we clear canvas daily. Persistent storage can be added via game_canvas_state
        // We could load the last saved image data here
    };
    const showFloatingReaction = (emoji: string) => {
        const id = Math.random().toString(36);
        const x = Math.random() * 80 + 10; // Random X position (10% to 90%)
        setReactions(prev => [...prev, { id, emoji, x, y: 100 }]);
        setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== id));
        }, 2000);
    };
    const sendReaction = async (emoji: string) => {
        if (!profile) return;
        // Optimistic UI
        showFloatingReaction(emoji);
        // Send to DB via API
        try {
            await api.sendDailyReaction(emoji);
        } catch (e) { console.error(e); }
    };
    const startDrawing = () => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.beginPath();
    };
    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.beginPath(); // Reset path
    };
    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = ('clientX' in e ? e.clientX : e.touches[0].clientX) - rect.left;
        const y = ('clientY' in e ? e.clientY : e.touches[0].clientY) - rect.top;
        // We need previous coordinates for smooth lines, but for simplicity here we just draw dots/small lines
        // Ideally we track prevX/prevY in state or ref
        drawOnCanvas(x, y, x, y, '#000000', true);
    };
    const drawOnCanvas = (x: number, y: number, prevX: number, prevY: number, color: string, emit: boolean) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.strokeStyle = color;
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        if (emit) {
            /*
             // Realtime removed for backend migration currently
            */
        }
    };
    return (
        <div className="space-y-6">
            { }
            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_black] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black uppercase mb-2">Daily Attendance</h2>
                        <p className="font-bold text-gray-600">Mark your presence to keep the streak!</p>
                    </div>
                    <button
                        onClick={handleCheckIn}
                        disabled={checkedIn || loading}
                        className={`px-8 py-4 border-4 border-black font-black uppercase text-xl shadow-[4px_4px_0px_0px_black] transition-all transform hover:-translate-y-1 ${checkedIn ? 'bg-[#00A86B] text-white cursor-default' : 'bg-[#FFD700] text-black hover:bg-[#FFED4A]'
                            }`}
                    >
                        {checkedIn ? (
                            <span className="flex items-center gap-2"><CheckCircle strokeWidth={4} /> Done</span>
                        ) : 'Check In'}
                    </button>
                </div>
            </div>
            { }
            <div className="bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_black] relative">
                <div className="bg-black text-white p-2 mb-4 inline-block font-black uppercase transform -rotate-1">
                    Community Canvas (Live!) 🎨
                </div>
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={400}
                    className="w-full h-[400px] border-4 border-dashed border-gray-300 cursor-crosshair touch-none bg-white"
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                    onMouseMove={draw}
                    onTouchStart={startDrawing}
                    onTouchEnd={stopDrawing}
                    onTouchMove={draw}
                />
                { }
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {reactions.map(r => (
                        <div
                            key={r.id}
                            className="absolute text-4xl animate-float-up"
                            style={{ left: `${r.x}%`, bottom: '10px' }}
                        >
                            {r.emoji}
                        </div>
                    ))}
                </div>
            </div>
            { }
            <div className="flex justify-center gap-4">
                {EMOJIS.map(e => (
                    <button
                        key={e.id}
                        onClick={() => sendReaction(e.icon)}
                        className="text-4xl hover:scale-125 transition-transform p-4 bg-white border-4 border-black shadow-[4px_4px_0px_0px_black] rounded-full active:scale-90"
                    >
                        {e.icon}
                    </button>
                ))}
            </div>
            <style>{`
        @keyframes float-up {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            100% { transform: translateY(-300px) scale(1.5); opacity: 0; }
        }
        .animate-float-up {
            animation: float-up 2s ease-out forwards;
        }
      `}</style>
        </div>
    );
}
