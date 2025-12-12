import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Trophy, RotateCcw } from 'lucide-react';
const EMOJIS = ['🎅', '🎄', '🎁', '⛄', '🦌', '🔔', '🍪', '🕯️'];
interface Card {
    id: number;
    emoji: string;
    isFlipped: boolean;
    isMatched: boolean;
}
interface MemoryGameProps {
    onGameComplete?: () => void;
}

export default function MemoryGame({ onGameComplete }: MemoryGameProps) {
    const { user, refreshProfile } = useAuth();
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        startNewGame();
    }, []);

    const startNewGame = () => {
        // ... existing shuffle logic ...
        // Duplicate and shuffle emojis
        const gameEmojis = [...EMOJIS, ...EMOJIS]
            .sort(() => Math.random() - 0.5)
            .map((emoji, index) => ({
                id: index,
                emoji,
                isFlipped: false,
                isMatched: false,
            }));
        setCards(gameEmojis);
        setFlippedCards([]);
        setMoves(0);
        setGameOver(false);
    };

    const handleCardClick = (id: number) => {
        if (flippedCards.length === 2 || cards[id].isFlipped || cards[id].isMatched) return;
        const newCards = cards.map(c => c.id === id ? { ...c, isFlipped: true } : c);
        setCards(newCards);
        const newFlipped = [...flippedCards, id];
        setFlippedCards(newFlipped);
        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            checkForMatch(newFlipped, newCards);
        }
    };

    const checkForMatch = (flippedIds: number[], currentCards: Card[]) => {
        const [first, second] = flippedIds;
        if (currentCards[first].emoji === currentCards[second].emoji) {
            const matchedCards = currentCards.map(c =>
                c.id === first || c.id === second ? { ...c, isMatched: true } : c
            );
            setCards(matchedCards);
            setFlippedCards([]);
            if (matchedCards.every(c => c.isMatched)) {
                handleWin(moves + 1);
            }
        } else {
            setTimeout(() => {
                setCards(currentCards.map(c =>
                    c.id === first || c.id === second ? { ...c, isFlipped: false } : c
                ));
                setFlippedCards([]);
            }, 1000);
        }
    };

    const handleWin = async (finalMoves: number) => {
        setGameOver(true);
        if (!user) return;
        setLoading(true);
        try {
            // 1. Award Points FIRST (Priority)
            const { error: pointsError } = await supabase.rpc('award_points', {
                p_points: 10,
                p_description: 'Won Memory Match'
            });
            if (pointsError) console.error("Error awarding points:", pointsError);

            // 2. Update Local Profile Immediately
            await refreshProfile();

            // 3. Mark as Completed (Hide from Menu)
            await supabase.rpc('mark_game_completed', { p_game_id: 'memory' });

            // 4. Submit Score (Leaderboard) - Non-blocking
            const { error: scoreError } = await supabase.rpc('submit_memory_game', {
                p_user_id: user.id,
                p_moves: finalMoves,
                p_time: 0
            });
            if (scoreError) console.error("Error submitting score (Leaderboard might be duplicate):", scoreError);

            // 5. Notify Parent
            if (onGameComplete) onGameComplete();

        } catch (err) {
            console.error('Error in game completion:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#E0E7FF] p-6 border-4 border-black shadow-[8px_8px_0px_0px_black] text-center">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                    <Sparkles className="text-yellow-500" fill="currentColor" />
                    Memory Match
                </h2>
                <div className="font-bold bg-white px-3 py-1 border-2 border-black">Moves: {moves}</div>
            </div>
            {!gameOver ? (
                <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-sm mx-auto">
                    {cards.map(card => (
                        <button
                            key={card.id}
                            onClick={() => handleCardClick(card.id)}
                            className={`aspect-square text-3xl sm:text-4xl flex items-center justify-center border-2 border-black transition-all duration-300 transform ${card.isFlipped || card.isMatched
                                ? 'bg-white rotate-0'
                                : 'bg-black text-transparent rotate-180 hover:bg-gray-800'
                                }`}
                        >
                            {(card.isFlipped || card.isMatched) ? card.emoji : '?'}
                        </button>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <Trophy className="mx-auto text-yellow-500 w-16 h-16 mb-4" />
                    <h3 className="text-3xl font-black uppercase mb-2">You Won!</h3>
                    <p className="font-bold mb-6">Completed in {moves} moves. (+10 Pts)</p>
                    <p className="text-sm font-bold text-gray-500 mb-4">Come back tomorrow!</p>
                </div>
            )}
        </div>
    );
}
