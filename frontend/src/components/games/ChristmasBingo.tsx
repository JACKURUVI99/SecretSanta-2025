import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
// @ts-ignore
import confetti from 'canvas-confetti';
// import { RefreshCw, Trophy } from 'lucide-react'; // Unused

export default function ChristmasBingo() {
    const [grid, setGrid] = useState<string[][]>([]);
    const [calledWords, setCalledWords] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [marked, setMarked] = useState<Record<string, boolean>>({ '2-2': true }); // Free space

    useEffect(() => {
        initGame();
        const interval = setInterval(fetchState, 5000); // Poll for new words every 5s
        return () => clearInterval(interval);
    }, []);

    const initGame = async () => {
        setLoading(true);
        try {
            const cardData = await api.getBingoCard();
            setGrid(cardData);
            await fetchState();
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchState = async () => {
        try {
            const words = await api.getBingoState();
            setCalledWords(words);
        } catch (e) { console.error(e); }
    };

    const isCalled = (word: string) => calledWords.includes(word) || word === 'FREE';

    // Check for Win Conditions (Client-side visual check)
    // In a real money game, backend would verify. For fun, client is fine.
    const checkWin = () => {
        // Rows
        for (let r = 0; r < 5; r++) {
            if (grid[r].every((w, c) => marked[`${r}-${c}`] && isCalled(w))) return true;
        }
        // Cols
        for (let c = 0; c < 5; c++) {
            if (grid.every((row, r) => marked[`${r}-${c}`] && isCalled(row[c]))) return true;
        }
        // Diagonals
        if ([0, 1, 2, 3, 4].every(i => marked[`${i}-${i}`] && isCalled(grid[i][i]))) return true;
        if ([0, 1, 2, 3, 4].every(i => marked[`${i}-${4 - i}`] && isCalled(grid[i][4 - i]))) return true;

        return false;
    };

    const handleCellClick = (r: number, c: number, word: string) => {
        if (word === 'FREE' || !isCalled(word)) {
            // Optional: Allow marking only if called? Or allow pre-marking?
            // User requested "Host calls... First to complete wins".
            // Usually Bingo allows marking matching words only.
            if (!isCalled(word) && word !== 'FREE') {
                alert("This word hasn't been called yet!");
                return;
            }
        }

        const key = `${r}-${c}`;
        const newMarked = { ...marked, [key]: !marked[key] };
        setMarked(newMarked);

        // Check win immediately
        // (Hack: need to use the new state, but checkWin uses 'marked' state)
        // Let's just do a quick check with the updated object
        // Re-implementing checkWin logic briefly for immediate feedback
        // ... Or just rely on user clicking "BINGO!" button? 
        // Let's add a BINGO button to claim.
    };

    const claimBingo = () => {
        if (checkWin()) {
            confetti({ particleCount: 200, spread: 150, origin: { y: 0.6 }, colors: ['#ff0000', '#00ff00', '#ffffff'] });
            alert("🎄 BINGO! 🎅\nYou have won! Scream 'BINGO' to claim your prize!");
        } else {
            alert("Not yet! Keep watching for Santa's words.");
        }
    }

    if (loading) return <div>Loading Ticket...</div>;

    return (
        <div className="bg-red-700 p-4 border-4 border-yellow-400 shadow-[8px_8px_0px_0px_black] text-white">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-3xl uppercase text-yellow-300 drop-shadow-[2px_2px_0px_black] animate-pulse">
                    🎅 Christmas Bingo
                </h3>
                <div className="bg-black/30 p-2 rounded border border-yellow-400/50">
                    <p className="text-xs font-bold text-yellow-200">LAST CALLED:</p>
                    <p className="font-black text-xl animate-bounce">{calledWords[calledWords.length - 1] || '-'}</p>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-1 md:gap-2 mb-6 bg-yellow-400 p-2 border-2 border-black">
                {grid.map((row, r) => (
                    row.map((word, c) => {
                        const isMarked = marked[`${r}-${c}`];
                        const isFree = word === 'FREE';
                        return (
                            <div
                                key={`${r}-${c}`}
                                onClick={() => handleCellClick(r, c, word)}
                                className={`aspect-square flex items-center justify-center text-center p-1 cursor-pointer transition-all duration-200 border-2 border-black
                                    ${isFree ? 'bg-yellow-300 text-red-600 font-black text-xs md:text-sm rotate-3' : ''}
                                    ${isMarked && !isFree ? 'bg-green-600 text-white scale-95 shadow-inner' : 'bg-white text-black hover:bg-gray-100'}
                                `}
                            >
                                <span className={`font-bold text-[10px] md:text-sm leading-tight ${isMarked ? 'line-through decoration-red-500 decoration-4' : ''}`}>
                                    {word}
                                </span>
                            </div>
                        );
                    })
                ))}
            </div>

            <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-yellow-200">
                    Called: {calledWords.length} words
                </p>
                <button
                    onClick={claimBingo}
                    className="bg-yellow-400 text-red-700 px-6 py-2 font-black text-xl border-4 border-black shadow-[4px_4px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all hover:bg-white hover:rotate-2">
                    BINGO! 🎁
                </button>
            </div>

            {/* Scroll of called words */}
            <div className="mt-4 bg-black/40 p-2 text-xs font-mono h-16 overflow-y-auto border border-white/20">
                <span className="text-gray-400">HISTORY: </span>
                {calledWords.join(', ')}
            </div>
        </div>
    );
}
