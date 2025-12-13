import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { Loader2 } from 'lucide-react';

type GameState = {
    id: string;
    board: (string | null)[];
    turn: string | null; // user_id
    player_x: string;
    player_o: string;
    winner: string | null;
    is_draw: boolean;
};

export default function TicTacToe({ partnerId, isSanta, onGameComplete, gameId = 'tictactoe' }: { partnerId: string, isSanta: boolean, onGameComplete?: () => void, gameId?: string }) {
    const { profile } = useAuth();
    const [game, setGame] = useState<GameState | null>(null);
    const [loading, setLoading] = useState(true);

    // Initial Fetch & Polling Setup
    useEffect(() => {
        let isMounted = true;
        fetchActiveGame();

        // POLL Updates every 3 seconds (Replaces Realtime)
        const interval = setInterval(async () => {
            if (!isMounted) return;
            // Only poll if we have a game, OR if we are waiting for one?
            // Actually, we should poll to see if THEY created one too.
            try {
                const data = await api.getActiveTicTacToe(partnerId);
                if (isMounted && data) {
                    // Check if state changed significantly or just strict sync
                    setGame(prev => {
                        // Simple optimization: only update if changed
                        if (JSON.stringify(prev) !== JSON.stringify(data)) return data;
                        return prev;
                    });
                }
            } catch (e) { /* ignore poll errors */ }
        }, 3000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [partnerId]);

    // Handle Completion (Legacy Side Effect)
    useEffect(() => {
        if (game?.winner || game?.is_draw) {
            // Note: Server handles backend state. Frontend just notifies parent.
            // RPC 'mark_game_completed' logic might need to be on server if it awards points external to the game table.
            // For now, assume server update handled the game state.
            const timer = setTimeout(() => {
                if (onGameComplete) onGameComplete();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [game?.winner, game?.is_draw]);

    const fetchActiveGame = async () => {
        try {
            const data = await api.getActiveTicTacToe(partnerId);
            setGame(data); // Null or Game object
        } catch (e) {
            console.error(e);
            setGame(null);
        } finally {
            setLoading(false);
        }
    };

    const createGame = async () => {
        setLoading(true);
        try {
            const data = await api.createTicTacToe(partnerId);
            setGame(data);
        } catch (e) {
            console.error(e);
            alert("Failed to start game");
        } finally {
            setLoading(false);
        }
    };

    const makeMove = async (index: number) => {
        if (!game || !profile) return;
        if (game.turn !== profile.id || game.board[index] || game.winner || game.is_draw) return;

        // Optimistic UI Update
        const newBoard = [...game.board];
        const symbol = game.player_x === profile.id ? 'X' : 'O';
        newBoard[index] = symbol;
        const newGame = { ...game, board: newBoard, turn: game.player_x === profile.id ? game.player_o : game.player_x }; /* approximate optimization */
        setGame(newGame);

        try {
            const updated = await api.makeTicTacToeMove(game.id, index, newBoard);
            setGame(updated);
        } catch (e) {
            console.error(e);
            // Revert on error? Fetch fresh.
            fetchActiveGame();
        }
    };
    /* unused helper
    const calculateWinner = (squares: (string | null)[]) => {
      // ...
    };
    */
    if (loading) return <div className="p-4"><Loader2 className="animate-spin" /></div>;
    if (!game || (game.winner || game.is_draw)) {
        const resultMessage = game?.winner === profile?.id ? "🏆 YOU WON! (+2 pts)" :
            game?.winner ? "😞 YOU LOST! (+2 pts)" :
                game?.is_draw ? "🤝 DRAW! (+2 pts)" : "";

        return (
            <div className="text-center p-6 bg-white border-4 border-black shadow-[4px_4px_0px_0px_black]">
                {game && <p className="font-black text-xl mb-4">{resultMessage}</p>}
                <button
                    onClick={createGame}
                    className="bg-[#C41E3A] text-white px-6 py-3 border-4 border-black font-black uppercase text-lg hover:-translate-y-1 shadow-[4px_4px_0px_0px_black] transition-all"
                >
                    {game ? 'Play Again' : 'Challenge to Tic-Tac-Toe'}
                </button>
                {game && <p className="text-xs font-bold text-gray-500 mt-2">Points are awarded automatically.</p>}
            </div>
        );
    }
    const isMyTurn = game.turn === profile?.id;
    const partnerName = isSanta ? "Secret Santa" : "Your Giftee";
    return (
        <div className="bg-white p-4 border-4 border-black shadow-[4px_4px_0px_0px_black] max-w-xs mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-black uppercase">Vs {partnerName}</h3>
                <span className={`px-2 py-1 text-xs font-black border-2 border-black ${isMyTurn ? 'bg-[#00A86B] text-white' : 'bg-gray-200'}`}>
                    {isMyTurn ? 'YOUR TURN' : 'THEIR TURN'}
                </span>
            </div>
            <div className="grid grid-cols-3 gap-2 bg-black border-2 border-black p-2">
                {(game.board || Array(9).fill(null)).map((cell, i) => (
                    <button
                        key={i}
                        onClick={() => makeMove(i)}
                        disabled={!!cell || !isMyTurn}
                        className="h-16 bg-white flex items-center justify-center text-4xl font-black hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                        <span className={cell === 'X' ? 'text-[#C41E3A]' : 'text-[#00A86B]'}>
                            {cell}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
