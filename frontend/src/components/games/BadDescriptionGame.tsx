import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
// @ts-ignore
import confetti from 'canvas-confetti';
import { HelpCircle, Trophy, ArrowRight, XCircle } from 'lucide-react';

type Level = {
    id: string;
    question: string;
    hint?: string;
    options?: string[];
    solved: boolean;
};

export default function BadDescriptionGame() {
    const [levels, setLevels] = useState<Level[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [showHint, setShowHint] = useState(false);
    const [isAnswered, setIsAnswered] = useState(false);

    useEffect(() => {
        fetchLevels();
    }, []);

    const fetchLevels = async () => {
        try {
            const data = await api.getBadDescriptions();
            setLevels(data);
            // Find first unsolved level to start there? Or just start at 0?
            // User request implies simple "Next" flow. Let's start at first unsolved or 0.
            const firstUnsolved = data.findIndex((l: Level) => !l.solved);
            setCurrentIndex(firstUnsolved !== -1 ? firstUnsolved : 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleGuess = async (option: string) => {
        if (isAnswered) return; // Prevent double clicks

        const currentLevel = levels[currentIndex];
        try {
            const res = await api.solveBadDescription(currentLevel.id, option);
            if (res.success) {
                setFeedback('correct');
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                // Mark locally as solved
                const newLevels = [...levels];
                newLevels[currentIndex].solved = true;
                setLevels(newLevels);
            } else {
                setFeedback('wrong');
            }
            setIsAnswered(true);
        } catch (e) {
            alert('Error submitting answer!');
        }
    };

    const handleNext = () => {
        setFeedback(null);
        setIsAnswered(false);
        setShowHint(false);
        if (currentIndex < levels.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // End of game or stay on last
            // Maybe just check if all solved?
        }
    };

    if (loading) return <div>Loading...</div>;

    const currentLevel = levels[currentIndex];
    const isLast = currentIndex === levels.length - 1;
    const allSolved = levels.every(l => l.solved);

    // Completion Screen
    if (allSolved) {
        return (
            <div className="bg-yellow-50 border-4 border-black p-8 shadow-[8px_8px_0px_0px_black] text-center">
                <Trophy className="mx-auto text-yellow-500 mb-4 drop-shadow-[2px_2px_0px_black]" size={64} />
                <h2 className="text-3xl font-black uppercase mb-2">Movie Master!</h2>
                <p className="font-bold flex items-center justify-center gap-2">
                    You've solved all the bad descriptions! 🎬
                </p>
                <div className="mt-6 p-4 bg-white border-2 border-black rotate-1 inline-block shadow-[4px_4px_0px_0px_black]">
                    <span className="text-4xl">⭐⭐⭐⭐⭐</span>
                </div>
            </div>
        );
    }

    if (!currentLevel) return <div>No levels found!</div>;

    return (
        <div className="bg-yellow-50 border-4 border-black p-6 shadow-[8px_8px_0px_0px_black] relative min-h-[400px] flex flex-col">
            <h3 className="font-black text-2xl uppercase mb-6 flex items-center gap-2 border-b-4 border-black pb-2">
                <HelpCircle className="text-purple-600 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" size={32} />
                Bad Descriptions
                <span className="ml-auto text-sm bg-black text-white px-3 py-1 rounded-full">
                    {currentIndex + 1} / {levels.length}
                </span>
            </h3>

            <div className="flex-1 flex flex-col justify-center">
                <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] mb-6 relative">
                    <p className="font-bold text-xl md:text-2xl font-hand leading-tight text-center mb-4">
                        "{currentLevel.question}"
                    </p>

                    {/* Hint Section */}
                    <div className="text-center">
                        {!showHint && !currentLevel.solved && (
                            <button
                                onClick={() => setShowHint(true)}
                                className="text-sm font-bold text-blue-600 underline decoration-wavy hover:text-blue-800"
                            >
                                Need a Hint? 💡
                            </button>
                        )}
                        {(showHint || currentLevel.solved) && currentLevel.hint && (
                            <p className="text-purple-600 font-bold italic bg-purple-50 inline-block px-3 py-1 rounded border border-purple-200 animate-fade-in">
                                Hint: {currentLevel.hint}
                            </p>
                        )}
                    </div>

                    {/* Feedback Overlay or Banner */}
                    {feedback === 'correct' && (
                        <div className="absolute top-0 right-0 bg-green-500 text-white font-black px-4 py-2 rotate-12 shadow-lg border-2 border-black">
                            CORRECT! 🎉
                        </div>
                    )}
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentLevel.options?.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleGuess(option)}
                            disabled={isAnswered || currentLevel.solved}
                            className={`
                                relative p-4 font-bold text-lg border-2 border-black transition-all
                                ${isAnswered && option === currentLevel.question /* Cannot check answer easily here without backend, but we know if we are 'correct' this button might not be the one clicked. 
                                   Actually, we don't know which is correct from frontend data if we hide answer. 
                                   We only know 'solved' is true. 
                                   Let's just disable all.
                                 */
                                    ? '' : ''}
                                ${!isAnswered ? 'hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_black] bg-white active:translate-y-0 active:shadow-none' : 'opacity-50 cursor-not-allowed bg-gray-100'}
                                ${feedback === 'correct' && isAnswered ? 'first-letter:uppercase' : '' /* Visual tweak */}
                            `}
                        >
                            {option}
                        </button>
                    ))}
                </div>

                {/* Navigation Controls */}
                {(isAnswered || currentLevel.solved) && (
                    <div className="mt-8 flex justify-center animate-bounce-in">
                        {feedback === 'wrong' ? (
                            <div className="flex flex-col items-center gap-2">
                                <p className="text-red-600 font-black flex items-center gap-2">
                                    <XCircle /> WRONG! TRY AGAIN?
                                </p>
                                <button
                                    onClick={() => { setFeedback(null); setIsAnswered(false); }}
                                    className="bg-red-500 text-white font-black px-6 py-2 border-2 border-black shadow-[4px_4px_0px_0px_black] hover:translate-y-1 hover:shadow-none transition-all"
                                >
                                    RETRY LEVEL
                                </button>
                            </div>
                        ) : (
                            !isLast && (
                                <button
                                    onClick={handleNext}
                                    className="bg-green-500 text-white font-black text-xl px-8 py-3 border-2 border-black shadow-[6px_6px_0px_0px_black] flex items-center gap-2 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_black] transition-all"
                                >
                                    NEXT QUESTION <ArrowRight strokeWidth={3} />
                                </button>
                            )
                        )}
                        {/* If last and correct, show completion message (handled by allSolved check above if this was last) 
                            or if we are on last and just solved it, allSolved might not be true until re-render?
                            Actually we updated state locally.
                        */}
                    </div>
                )}
            </div>
        </div>
    );
}
