import { useState, useEffect } from 'react';
import { AppSettings } from '../../lib/supabase'; // Type only
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Film, Check, X, HelpCircle, Trophy } from 'lucide-react';
interface GameWord {
    out_word_id?: number; // New RPC
    word_id?: number;     // Old RPC fallback
    word: string;
    hint: string;
    status: 'assigned' | 'solved';
}
// DBDiagnosis removed for security
function DBDiagnosis({ category, user_id }: { category: string | null, user_id?: string }) {
    console.log("DBDiagnosis disabled", category, user_id); // keep vars used
    return null;
}

export default function KollywoodGame() {
    const { user, refreshProfile } = useAuth();
    const [words, setWords] = useState<GameWord[]>([]);
    const [guesses, setGuesses] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState<Record<number, 'success' | 'error' | null>>({});
    const [settings, setSettings] = useState<AppSettings | null>(null);
    // New State for Category
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);

    // Helper to handle RPC version mismatch
    const getWordId = (w: GameWord): number => w.out_word_id ?? w.word_id ?? 0;

    useEffect(() => {
        fetchSettings();
    }, []);
    const fetchSettings = async () => {
        try {
            const data = await api.getAppSettings();
            // api returns list, get first
            const settings = data && data.length > 0 ? data[0] : null;

            if (settings) {
                setSettings(settings);
                const enabled: string[] = [];
                if (settings.show_kollywood) enabled.push('Kollywood');
                if (settings.show_mollywood) enabled.push('Mollywood');
                if (settings.show_tollywood) enabled.push('Tollywood');
                if (settings.show_bollywood) enabled.push('Bollywood');
                if (settings.show_hollywood) enabled.push('Hollywood');
                setAvailableCategories(enabled);
                if (enabled.length > 0) {
                    // If activeCategory is currently set but not in enabled, switch to the first available
                    if (activeCategory === null || !enabled.includes(activeCategory)) {
                        setActiveCategory(enabled[0]);
                    }
                } else {
                    setActiveCategory(null); // No categories available
                }
            }
        } catch (e) { console.error(e); }
    };
    useEffect(() => {
        if (user && activeCategory) {
            fetchDailyWords();
        }
    }, [user, activeCategory]);
    const fetchDailyWords = async () => {
        if (!activeCategory || !user) return;
        setLoading(true);
        try {
            const data = await api.getKollywoodWords(activeCategory);
            setWords(data || []);
        } catch (error) {
            console.error('Error fetching words:', error);
        } finally {
            setLoading(false);
        }
    };
    const handleGuessChange = (wordId: number, value: string) => {
        setGuesses(prev => ({ ...prev, [wordId]: value }));
        setFeedback(prev => ({ ...prev, [wordId]: null }));
    };
    const submitGuess = async (wordId: number) => {
        const guess = guesses[wordId];
        if (!guess) return;
        try {
            const { isCorrect } = await api.solveKollywoodWord(wordId, guess);
            if (isCorrect) {
                setFeedback(prev => ({ ...prev, [wordId]: 'success' }));
                setWords(prev => prev.map(w => getWordId(w) === wordId ? { ...w, status: 'solved' } : w));
                // Update points immediately
                await refreshProfile();
            } else {
                setFeedback(prev => ({ ...prev, [wordId]: 'error' }));
            }
        } catch (error) {
            console.error('Error submitting guess:', error);
        }
    };
    const getMaskedWord = (word: string) => {
        if (!word) return '';
        return word.split('').map((char, i) => {
            if (i === 0 || i === word.length - 1 || char === ' ') return char;
            return '_';
        }).join(' ');
    };
    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'Kollywood': return 'bg-[#FFD700]'; // Yellow
            case 'Tollywood': return 'bg-[#FF4500]'; // Orange Red
            case 'Mollywood': return 'bg-[#00A86B]'; // Green
            case 'Bollywood': return 'bg-[#C41E3A]'; // Red
            case 'Hollywood': return 'bg-[#3B82F6]'; // Blue
            default: return 'bg-black';
        }
    };
    if (availableCategories.length === 0) {
        return null;
    }
    if (!activeCategory) return <div className="p-4"><div className="animate-spin text-4xl">🎬</div></div>;
    return (
        <div className="space-y-6">
            { }
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {availableCategories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 font-black uppercase text-xs sm:text-sm border-2 border-black transition-all shadow-[2px_2px_0px_0px_black] hover:-translate-y-1 ${activeCategory === cat
                            ? `${getCategoryColor(cat)} text-white`
                            : 'bg-white text-black hover:bg-gray-50'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
            <div className={`${getCategoryColor(activeCategory)} p-6 border-4 border-black shadow-[8px_8px_0px_0px_black] transition-colors duration-500`}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-black font-mountains uppercase text-white drop-shadow-[2px_2px_0px_black] flex items-center gap-2">
                            <Film size={28} /> {activeCategory} Challenge
                        </h2>
                        <p className="text-white font-bold text-sm drop-shadow-[1px_1px_0px_black]">Guess the 5 movies! (+20 pts each)</p>
                    </div>
                    <div className="bg-black text-white w-16 h-24 font-black text-xl border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] flex flex-col items-center justify-center leading-none gap-1">
                        <span className="text-2xl">{words.filter(w => w.status === 'solved').length}</span>
                        <span className="text-sm opacity-50">/</span>
                        <span className="text-2xl">5</span>
                    </div>
                </div>
            </div>
            {loading ? (
                <div className="bg-white p-12 text-center border-4 border-black shadow-[8px_8px_0px_0px_black]">
                    <div className="inline-block animate-spin text-4xl mb-4">🎬</div>
                    <p className="font-black uppercase">Loading {activeCategory}...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {words.length > 0 ? words.map((gameWord) => {
                        const id = getWordId(gameWord);
                        const isSolved = gameWord.status === 'solved';
                        const status = feedback[id];
                        return (
                            <div
                                key={id}
                                className={`p-6 border-4 border-black shadow-[4px_4px_0px_0px_black] transition-all relative overflow-hidden ${isSolved ? 'bg-[#00A86B] text-white' : 'bg-white'
                                    }`}
                            >
                                {isSolved && (
                                    <div className="absolute top-0 right-0 bg-black text-[#FFD700] px-3 py-1 font-black uppercase text-xs flex items-center gap-1">
                                        <Trophy size={12} /> Solved
                                    </div>
                                )}
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <HelpCircle size={16} className={isSolved ? "text-white" : "text-gray-500"} />
                                        <p className={`font-black uppercase text-sm ${isSolved ? "text-white" : "text-gray-500"}`}>
                                            Hint: {gameWord.hint}
                                        </p>
                                    </div>
                                    <h3 className="text-3xl font-mono font-black tracking-widest uppercase mb-4">
                                        {isSolved ? gameWord.word : getMaskedWord(gameWord.word)}
                                    </h3>
                                </div>
                                {!isSolved && (
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="text"
                                            value={guesses[id] || ''}
                                            onChange={(e) => handleGuessChange(id, e.target.value)}
                                            placeholder="Movie name..."
                                            className={`w-full sm:flex-1 border-4 border-black p-3 font-bold uppercase focus:outline-none transition-all ${status === 'error' ? 'bg-red-50 border-red-500 shake' : 'focus:shadow-[4px_4px_0px_0px_black]'
                                                }`}
                                            onKeyDown={(e) => e.key === 'Enter' && submitGuess(id)}
                                        />
                                        <button
                                            onClick={() => submitGuess(id)}
                                            className="w-full sm:w-auto bg-black text-white px-6 py-3 sm:py-0 font-black uppercase border-4 border-black hover:bg-gray-800 active:translate-y-1 transition-all flex items-center justify-center gap-2"
                                        >
                                            Check
                                        </button>
                                    </div>
                                )}
                                {status === 'error' && (
                                    <p className="text-red-600 font-bold text-xs mt-2 uppercase animate-pulse flex items-center gap-1">
                                        <X size={14} /> Incorrect! Try again.
                                    </p>
                                )}
                                {status === 'success' && (
                                    <p className="text-white font-bold text-xs mt-2 uppercase flex items-center gap-1">
                                        <Check size={14} /> Correct!
                                    </p>
                                )}
                            </div>
                        );
                    }) : (
                        <div className="text-center p-8 bg-white border-4 border-black">
                            <h3 className="text-xl font-black uppercase mb-4">No words loaded? 🤔</h3>
                            <p className="font-bold mb-6">We couldn't find any {activeCategory} words for you today.</p>

                            <div className="bg-gray-100 p-4 border-2 border-black mb-6 text-left text-xs font-mono">
                                <p><strong>Debug Info:</strong></p>
                                <p>Category: {activeCategory}</p>
                                <p>User ID: {user?.id}</p>
                                <p>Status: Loading Finished (0 words returned)</p>
                                <DBDiagnosis category={activeCategory} user_id={user?.id} />
                            </div>

                            <button
                                onClick={async () => {
                                    if (confirm("This will attempt to reset your daily game allocation. Continue?")) {
                                        setLoading(true);
                                        try {
                                            await api.resetKollywood();
                                            alert("Reset successful! Trying to fetch new words...");
                                            window.location.reload();
                                        } catch (e: any) { alert("Reset failed: " + e.message); }
                                        setLoading(false);
                                    }
                                }}
                                className="bg-[#C41E3A] text-white px-6 py-3 border-4 border-black font-black uppercase shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 transition-all"
                            >
                                Force Game Reset
                            </button>
                            <p className="mt-4 text-xs text-gray-500 font-bold">
                                (Tap this if Admin just ran the SQL Fix script!)
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
