import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { BarChart2, CheckCircle } from 'lucide-react';

interface Poll {
    id: string;
    question: string;
    options: string[];
    user_vote?: number | null; // index of option user voted for
    total_votes?: number[]; // array of counts per option [10, 5, 2]
}

export default function PollsWidget() {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPolls();
        // Poll for updates every 30s
        const interval = setInterval(fetchPolls, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchPolls = async () => {
        try {
            const data = await api.getPolls();
            setPolls(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (pollId: string, optionIndex: number) => {
        // Optimistic Update
        setPolls(prev => prev.map(p => {
            if (p.id !== pollId) return p;
            const newTotals = [...(p.total_votes || p.options.map(() => 0))];
            newTotals[optionIndex] = (newTotals[optionIndex] || 0) + 1;
            // If changing vote, simpler logic needed, but let's assume 1 vote per poll allowed logic in backend handles switch or replace
            // For simplicity, just mark as voted visually immediately
            return { ...p, user_vote: optionIndex, total_votes: newTotals };
        }));

        try {
            await api.votePoll(pollId, optionIndex);
            fetchPolls(); // Sync real data
        } catch (e: any) {
            alert(e.message);
            fetchPolls(); // Revert
        }
    };

    if (loading) return null;
    if (polls.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="bg-[#9333EA] text-white p-3 border-4 border-black shadow-[4px_4px_0px_0px_black] inline-block mb-4 transform -rotate-1">
                <h2 className="text-xl font-black uppercase flex items-center gap-2">
                    <BarChart2 size={24} />
                    Community Polls
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {polls.map(poll => {
                    const totalVotesCount = poll.total_votes?.reduce((a, b) => a + b, 0) || 0;

                    return (
                        <div key={poll.id} className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_black]">
                            <h3 className="text-xl font-black uppercase mb-4">{poll.question}</h3>

                            <div className="space-y-3">
                                {poll.options.map((option, idx) => {
                                    const votes = poll.total_votes?.[idx] || 0;
                                    const percent = totalVotesCount > 0 ? Math.round((votes / totalVotesCount) * 100) : 0;
                                    const isVoted = poll.user_vote === idx;

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleVote(poll.id, idx)}
                                            disabled={poll.user_vote !== undefined && poll.user_vote !== null}
                                            className={`relative w-full text-left border-4 border-black p-3 font-bold uppercase transition-all overflow-hidden ${isVoted ? 'bg-[#FFD700]' : 'hover:bg-gray-50 bg-white'
                                                }`}
                                        >
                                            {/* Progress Bar Background */}
                                            {(poll.user_vote !== undefined && poll.user_vote !== null) && (
                                                <div
                                                    className="absolute top-0 left-0 h-full bg-gray-200 z-0 transition-all duration-500"
                                                    style={{ width: `${percent}%` }}
                                                ></div>
                                            )}

                                            <div className="relative z-10 flex justify-between items-center">
                                                <span className="flex items-center gap-2">
                                                    {isVoted && <CheckCircle size={16} />}
                                                    {option}
                                                </span>
                                                {(poll.user_vote !== undefined && poll.user_vote !== null) && (
                                                    <span className="text-xs bg-black text-white px-1">{percent}%</span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-4 text-right text-xs font-bold text-gray-500">
                                {totalVotesCount} Votes
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
