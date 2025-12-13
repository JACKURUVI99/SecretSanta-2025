import { useState, useEffect } from 'react';
import { api, adminApi } from '../../lib/api';
import { Trash2, BarChart2 } from 'lucide-react';

interface Poll {
    id: string;
    question: string;
    options: string[]; // JSONB array from backend
    is_active: boolean;
    total_votes?: number[];
}

export default function AdminPolls() {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [newQuestion, setNewQuestion] = useState('');
    const [newOptions, setNewOptions] = useState<string[]>(['', '']); // Start with 2 options

    useEffect(() => {
        fetchPolls();
    }, []);

    const fetchPolls = async () => {
        try {
            const data = await api.getPolls(); // Keep using public getter for list
            // `getPolls` currently gets active ones. Admin might want to see all?
            // Let's assume for now admin sees what users see + active toggle powers.
            // Ideally we need `getAdminPolls`. Let's assume `getPolls` returns all for now or we add an admin specific one later.
            // Actually `api.ts` defines `getPolls` as `apiFetch('/api/polls')` which has RLS.
            // Let's stick with user view for now to keep it simple, or upgrade API if needed.
            setPolls(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePoll = async (e: React.FormEvent) => {
        e.preventDefault();
        const validOptions = newOptions.filter(o => o.trim() !== '');
        if (validOptions.length < 2) return alert("Need at least 2 options");

        try {
            await adminApi.createPoll({ question: newQuestion, options: validOptions });
            setNewQuestion('');
            setNewOptions(['', '']);
            fetchPolls();
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this poll?")) return;
        try {
            await adminApi.deletePoll(id);
            fetchPolls();
        } catch (e: any) { alert(e.message); }
    };

    const handleOptionChange = (index: number, value: string) => {
        const updated = [...newOptions];
        updated[index] = value;
        setNewOptions(updated);
    };

    const addOption = () => setNewOptions([...newOptions, '']);

    return (
        <div className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_black]">
            <h2 className="text-2xl font-black uppercase mb-6 flex items-center gap-2">
                <BarChart2 /> Manage Polls
            </h2>

            {/* Create Form */}
            <form onSubmit={handleCreatePoll} className="mb-8 p-4 bg-gray-50 border-2 border-black">
                <h3 className="font-bold mb-4 uppercase">Create New Poll</h3>
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Poll Question (e.g. Best Christmas Movie?)"
                        value={newQuestion}
                        onChange={e => setNewQuestion(e.target.value)}
                        className="w-full p-2 border-2 border-black font-bold"
                        required
                    />
                    <div className="space-y-2">
                        {newOptions.map((opt, idx) => (
                            <input
                                key={idx}
                                type="text"
                                placeholder={`Option ${idx + 1} `}
                                value={opt}
                                onChange={e => handleOptionChange(idx, e.target.value)}
                                className="w-full p-2 border-2 border-black text-sm"
                            />
                        ))}
                    </div>
                    <button type="button" onClick={addOption} className="text-xs font-bold underline">+ Add Option</button>

                    <button type="submit" className="w-full bg-black text-white p-2 font-black uppercase hover:bg-gray-800">
                        Create Poll
                    </button>
                </div>
            </form>

            <div className="space-y-4">
                {polls.map(poll => (
                    <div key={poll.id} className="border-4 border-black p-4 flex justify-between items-start">
                        <div>
                            <h4 className="font-black text-lg">{poll.question}</h4>
                            <ul className="text-sm list-disc list-inside text-gray-600">
                                {poll.options.map((o, i) => <li key={i}>{o}</li>)}
                            </ul>
                        </div>
                        <button onClick={() => handleDelete(poll.id)} className="bg-red-500 text-white p-2 border-2 border-black hover:bg-red-600">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
