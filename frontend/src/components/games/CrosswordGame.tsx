import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
// @ts-ignore
import confetti from 'canvas-confetti';

export default function CrosswordGame() {
    const [grid, setGrid] = useState<string[][]>([]);
    const [clues, setClues] = useState<any[]>([]);
    const [solvedWords, setSolvedWords] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputs, setInputs] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchGame();
        const interval = setInterval(fetchGame, 15000);
        return () => clearInterval(interval);
    }, []);

    const fetchGame = async () => {
        try {
            const data = await api.getCrossword();
            setGrid(data.grid);
            setClues(data.clues);
            setSolvedWords(data.solved);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleSolve = async (clueId: string) => {
        const ans = inputs[clueId];
        if (!ans) return;
        try {
            const res = await api.solveCrossword(clueId, ans);
            if (res.success) {
                confetti({ particleCount: 30, spread: 40 });
                fetchGame();
            } else {
                alert("Wrong answer!");
            }
        } catch (e) { alert("Error"); }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_black]">
            <h3 className="font-black text-2xl uppercase mb-4 border-b-4 border-black">Mini Crossword</h3>
            <div className="flex flex-col md:flex-row gap-6">

                {/* Grid Visualizer (Simple) */}
                <div className="bg-gray-800 p-4 border-4 border-black">
                    {grid.map((row, rIdx) => (
                        <div key={rIdx} className="flex">
                            {row.map((cell, cIdx) => {
                                const isBlack = cell === '#';
                                // Find if this cell is part of a solved word? (Complex logic simplified)
                                // For now, let's just show the grid letters if solved, else blank blocks for valid cells
                                return (
                                    <div key={cIdx} className={`w-8 h-8 md:w-10 md:h-10 border border-gray-600 flex items-center justify-center font-bold font-mono text-white
                                        ${isBlack ? 'bg-black' : 'bg-white text-black'}`}>
                                        {/* Ideally checking if word related to this cell is solved */}
                                        {!isBlack && (cell)}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                    <p className="text-white text-xs mt-2 text-center text-gray-400">*Grid shows Solution for Reference (Mock)*</p>
                </div>

                {/* Clues */}
                <div className="flex-1 space-y-4">
                    {clues.map(clue => {
                        const isSolved = solvedWords.includes(clue.id);
                        return (
                            <div key={clue.id} className={`p-3 border-2 border-black ${isSolved ? 'bg-green-100 opacity-60' : 'bg-gray-50'}`}>
                                <span className="font-black text-xs bg-black text-white px-1 mr-2">{clue.num} {clue.dir}</span>
                                <span className="font-bold">{clue.hint}</span>
                                {!isSolved && (
                                    <div className="flex mt-2 gap-2">
                                        <input
                                            type="text"
                                            placeholder="Answer"
                                            className="w-full border-2 border-black p-1 font-mono uppercase"
                                            value={inputs[clue.id] || ''}
                                            onChange={e => setInputs({ ...inputs, [clue.id]: e.target.value })}
                                        />
                                        <button onClick={() => handleSolve(clue.id)} className="bg-black text-white px-2 font-bold">→</button>
                                    </div>
                                )}
                                {isSolved && <span className="block mt-1 text-green-700 font-mono font-bold text-sm">ANSWER: {clue.answer}</span>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
