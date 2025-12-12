import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Gift, Bell } from 'lucide-react';
interface SantaRPSProps {
    partnerId: string;
    isSanta: boolean;
    onGameComplete?: () => void;
}
// Santa beats Elf (Authority)
// Elf beats Reindeer (Rides it?) - Logic choice: Santa > Elf > Reindeer > Santa
// Let's do:
// Santa (Rock) beats Elf (Scissors)
// Elf (Scissors) beats Reindeer (Paper)
// Reindeer (Paper) beats Santa (Rock)
type Move = 'santa' | 'elf' | 'reindeer' | null;

export default function SantaRPS({ partnerId, isSanta, onGameComplete }: SantaRPSProps) {
    const [myMove, setMyMove] = useState<Move>(null);
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Simplified: Just local play for fun vs Computer for now to guarantee functionality immediately
    // Or real-time? Real-time is complex. Let's do a simple Daily Luck Game fitting the "Other Game" request.
    const playMove = (move: Move) => {
        setLoading(true);
        setTimeout(() => {
            const moves: Move[] = ['santa', 'elf', 'reindeer'];
            const cpuMove = moves[Math.floor(Math.random() * 3)];

            setMyMove(move);
            let win = false;

            if (move === cpuMove) {
                setResult(`Draw! Both chose ${move?.toUpperCase()}`);
            } else if (
                (move === 'santa' && cpuMove === 'elf') ||
                (move === 'elf' && cpuMove === 'reindeer') ||
                (move === 'reindeer' && cpuMove === 'santa')
            ) {
                setResult(`You Won! ${move?.toUpperCase()} beats ${cpuMove?.toUpperCase()}`);
                win = true;
            } else {
                setResult(`The Grinch Won! ${cpuMove?.toUpperCase()} beats ${move?.toUpperCase()}`);
            }

            setLoading(false);

            // Award point and Notify Parent
            if (win) {
                supabase.rpc('award_points', { p_points: 5, p_description: 'Valid Win vs Grinch' }).then(() => {
                    supabase.rpc('mark_game_completed', { p_game_id: 'santarps' }).then(() => {
                        if (onGameComplete) onGameComplete();
                    });
                });
            } else {
                // Even if lost, mark as completed if it's a daily limit
                supabase.rpc('mark_game_completed', { p_game_id: 'santarps' }).then(() => {
                    if (onGameComplete) onGameComplete();
                });
            }
        }, 1000);
    };
    return (
        <div className="bg-white/80 p-4 rounded-xl text-center">
            <h3 className="font-bold text-lg mb-2 text-[#C41E3A]">🎅 vs 🧝 vs 🦌</h3>
            <p className="text-sm mb-4 font-bold text-gray-600">Single Player vs Bot</p>
            {!result ? (
                <div className="flex justify-center gap-4">
                    <button onClick={() => playMove('santa')} disabled={loading} className="text-4xl hover:scale-125 transition-transform" title="Santa (Rock)">🎅</button>
                    <button onClick={() => playMove('elf')} disabled={loading} className="text-4xl hover:scale-125 transition-transform" title="Elf (Paper)">🧝</button>
                    <button onClick={() => playMove('reindeer')} disabled={loading} className="text-4xl hover:scale-125 transition-transform" title="Reindeer (Scissors)">🦌</button>
                </div>
            ) : (
                <div className="animate-pop">
                    <p className="font-black text-lg mb-2">{result}</p>
                    <button onClick={() => { setResult(null); setMyMove(null); }} className="bg-[#00A86B] text-white px-4 py-1 rounded-full font-bold text-sm">Play Again</button>
                </div>
            )}
            {loading && (
                <div className="mt-4 flex flex-col items-center gap-2">
                    <p className="font-bold text-[#C41E3A] animate-pulse">The Grinch is thinking...</p>
                </div>
            )}
        </div>
    );
}
