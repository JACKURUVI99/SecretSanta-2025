import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
// @ts-ignore
import confetti from 'canvas-confetti';
import { RefreshCw, Check } from 'lucide-react';

type Word = {
    id: string;
    jumbled: string;
    hint: string;
    length: number;
    isCompleted: boolean;
};

export default function JumbledWordsGame() {
    const [words, setWords] = useState<Word[]>([]);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [feedback, setFeedback] = useState<Record<string, 'correct' | 'wrong' | null>>({});

    useEffect(() => {
        fetchWords();
        const interval = setInterval(fetchWords, 15000);
        return () => clearInterval(interval);
    }, []);

    const fetchWords = async () => {
        try {
            const data = await api.getJumbledWords();
            setWords(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSolve = async (wordId: string) => {
        const guess = answers[wordId];
        if (!guess) return;

        try {
            const res = await api.solveJumbledWord(wordId, guess);
            if (res.success) {
                setFeedback(prev => ({ ...prev, [wordId]: 'correct' }));
                confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
                fetchWords(); // Refresh to update status
            } else {
                setFeedback(prev => ({ ...prev, [wordId]: 'wrong' }));
                setTimeout(() => setFeedback(prev => ({ ...prev, [wordId]: null })), 2000);
            }
        } catch (e) {
            alert('Error submitting answer');
        }
    };

    if (loading) return <div className="p-4 text-center">Loading Puzzles...</div>;

    return (
        <div className="bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_black] relative overflow-hidden">

            {/* Decorative Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>

            <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-2 relative z-10">
                <h3 className="font-black text-2xl uppercase flex items-center gap-2">
                    🔤 Jumbled Words
                </h3>
                <button onClick={fetchWords} className="hover:rotate-180 transition-transform duration-500">
                    <RefreshCw />
                </button>
            </div>

            <div className="grid gap-4 relative z-10">
                {words.map((w) => (
                    <div key={w.id} className={`p-4 border-2 border-black transition-all ${w.isCompleted ? 'bg-green-100 opacity-75' : 'bg-white hover:shadow-[4px_4px_0px_0px_black]'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">HINT: {w.hint}</p>
                                <h4 className="font-black text-xl tracking-widest font-mono text-blue-600">{w.jumbled}</h4>
                            </div>
                            {w.isCompleted ? (
                                <span className="bg-[#00A86B] text-white text-xs font-black px-2 py-1 border border-black transform rotate-2">SOLVED</span>
                            ) : (
                                <span className="text-xs font-bold bg-yellow-300 px-2 py-1 border border-black">{w.length} Letters</span>
                            )}
                        </div>

                        {!w.isCompleted && (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    maxLength={w.length}
                                    placeholder="Your Answer..."
                                    className={`w-full border-2 border-black p-2 font-bold uppercase outline-none focus:shadow-[2px_2px_0px_0px_black] transition-all
                                        ${feedback[w.id] === 'wrong' ? 'border-red-500 bg-red-50' : ''}
                                        ${feedback[w.id] === 'correct' ? 'border-green-500 bg-green-50' : ''}
                                    `}
                                    value={answers[w.id] || ''}
                                    onChange={(e) => setAnswers({ ...answers, [w.id]: e.target.value })}
                                />
                                <button
                                    onClick={() => handleSolve(w.id)}
                                    className="bg-black text-white px-3 font-bold hover:bg-gray-800 border-2 border-transparent active:scale-95 transition-transform"
                                >
                                    <Check size={18} />
                                </button>
                            </div>
                        )}
                        {feedback[w.id] === 'wrong' && <p className="text-red-600 text-xs font-black mt-1 animate-bounce">Try Again!</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}
