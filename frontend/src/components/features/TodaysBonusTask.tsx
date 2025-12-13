import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Gift } from 'lucide-react';
interface BonusTask {
    task_id: string;
    task_title: string;
    task_description: string;
    task_points: number;
    already_submitted: boolean;
    user_score: number;
}
interface Question {
    id: string;
    question_type: 'mcq' | 'fill_blank' | 'checkbox';
    question_text: string;
    options?: string;
    question_order: number;
}
export default function TodaysBonusTask() {
    const { user, refreshProfile } = useAuth();
    const [task, setTask] = useState<BonusTask & {
        max_attempts: number;
        attempts_made: number;
        best_score: number;
        is_fully_completed: boolean;
    } | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<string, unknown>>({});
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ score: number; max_score: number; percentage: number; attempts_left: number } | null>(null);
    useEffect(() => {
        if (user) {
            fetchTodaysTask();
        }
    }, [user]);
    const fetchTodaysTask = async () => {
        if (!user) return;
        try {
            const data = await api.getBonusTask();
            setTask(data);
        } catch (e) { console.error(e); }
    };
    const fetchQuestions = async (taskId: string) => {
        try {
            const data = await api.getBonusTaskQuestions(taskId);
            setQuestions(data || []);
        } catch (e) { console.error(e); }
    };
    const handleStartTask = async () => {
        if (task) {
            await fetchQuestions(task.task_id);
            setShowModal(true);
        }
    };
    const handleAnswerChange = (questionId: string, value: unknown) => {
        setAnswers({ ...answers, [questionId]: value });
    };
    const submitTask = async () => {
        if (!user || !task) return;
        setSubmitting(true);
        try {
            const formattedAnswers = Object.entries(answers).map(([question_id, answer]) => ({
                question_id,
                answer
            }));
            const data = await api.submitBonusTask(task.task_id, formattedAnswers);

            setResult(data);
            await refreshProfile();
            fetchTodaysTask();
        } catch (error: any) {
            alert(error.message || 'Failed to submit task');
            setShowModal(false);
        } finally {
            setSubmitting(false);
        }
    };
    if (!task) return null;
    if (task.is_fully_completed) {
        return null;
    }
    return (
        <>
            <div className="bg-[#9333EA] border-4 border-black shadow-[8px_8px_0px_0px_black] p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Gift size={32} className="text-white" />
                        <div>
                            <h3 className="text-2xl font-black uppercase text-white">{task.task_title}</h3>
                            <p className="font-bold text-white">{task.task_description}</p>
                            { }
                            <div className="mt-2 text-sm font-black bg-black text-white px-2 py-1 inline-block">
                                Attempt {task.attempts_made} / {task.max_attempts}
                                {task.best_score > 0 && ` • Best: ${task.best_score} pts`}
                            </div>
                        </div>
                    </div>
                    {task.attempts_made < task.max_attempts ? (
                        <button
                            onClick={handleStartTask}
                            className="bg-white text-[#9333EA] px-6 py-3 border-4 border-black font-black uppercase shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 transition-all"
                        >
                            {task.attempts_made > 0 ? 'Try Again' : 'Start Task'} ({task.task_points} pts)
                        </button>
                    ) : (
                        <div className="bg-red-500 text-white px-6 py-3 border-4 border-black font-black uppercase">
                            Max Attempts Reached
                        </div>
                    )}
                </div>
            </div>
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white shadow-[12px_12px_0px_0px_black] max-w-2xl w-full border-4 border-black my-8">
                        <div className="bg-[#9333EA] text-white p-6 border-b-4 border-black sticky top-0">
                            <h2 className="text-2xl font-black uppercase">{task.task_title}</h2>
                            <p className="font-bold">{task.task_description}</p>
                        </div>
                        {result ? (
                            <div className="p-8 text-center">
                                <div className={`text-6xl mb-4 ${result.score >= result.max_score / 2 ? 'text-green-500' : 'text-red-500'}`}>
                                    {result.score >= result.max_score / 2 ? '🎉' : '😔'}
                                </div>
                                <h3 className="text-3xl font-black uppercase mb-2">
                                    Score: {result.score} / {result.max_score}
                                </h3>
                                <p className="text-xl font-bold mb-4">
                                    {result.percentage}% Correct
                                </p>
                                {result.attempts_left > 0 ? (
                                    <p className="text-lg font-black text-blue-600 mb-6">
                                        You have {result.attempts_left} attempts left!
                                    </p>
                                ) : (
                                    <p className="text-lg font-black text-red-600 mb-6">
                                        No attempts left!
                                    </p>
                                )}
                                <div className="space-x-4">
                                    <button
                                        onClick={() => {
                                            setShowModal(false);
                                            setResult(null);
                                            setAnswers({});
                                        }}
                                        className="bg-black text-white px-6 py-3 border-4 border-black font-black uppercase"
                                    >
                                        Close
                                    </button>
                                    {result.attempts_left > 0 && result.score < result.max_score && (
                                        <button
                                            onClick={() => {
                                                setResult(null);
                                                setShowModal(false);
                                                setAnswers({});
                                                setTimeout(() => handleStartTask(), 100);
                                            }}
                                            className="bg-[#9333EA] text-white px-6 py-3 border-4 border-black font-black uppercase"
                                        >
                                            Retry Now
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                                    {questions.map((q, index) => (
                                        <div key={q.id} className="bg-gray-50 p-4 border-4 border-black">
                                            <p className="font-black uppercase mb-3">
                                                Q{index + 1}. {q.question_text}
                                            </p>
                                            {q.question_type === 'mcq' && q.options && (
                                                <div className="space-y-2">
                                                    {JSON.parse(q.options).map((opt: string, i: number) => (
                                                        <label key={i} className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name={q.id}
                                                                value={String.fromCharCode(65 + i)}
                                                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                                className="w-4 h-4"
                                                            />
                                                            <span className="font-bold">{String.fromCharCode(65 + i)}. {opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                            {q.question_type === 'fill_blank' && (
                                                <input
                                                    type="text"
                                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                    className="w-full px-4 py-2 border-4 border-black font-bold"
                                                    placeholder="Your answer..."
                                                />
                                            )}
                                            {q.question_type === 'checkbox' && q.options && (
                                                <div className="space-y-2">
                                                    {JSON.parse(q.options).map((opt: string, i: number) => (
                                                        <label key={i} className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                value={String.fromCharCode(65 + i)}
                                                                onChange={(e) => {
                                                                    const current = (answers[q.id] as string[]) || [];
                                                                    const updated = e.target.checked
                                                                        ? [...current, e.target.value]
                                                                        : current.filter((v: string) => v !== e.target.value);
                                                                    handleAnswerChange(q.id, updated);
                                                                }}
                                                                className="w-4 h-4"
                                                            />
                                                            <span className="font-bold">{String.fromCharCode(65 + i)}. {opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="p-6 border-t-4 border-black bg-gray-50 sticky bottom-0 flex justify-between">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="bg-gray-200 text-black px-6 py-4 border-4 border-black font-black uppercase"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={submitTask}
                                        disabled={submitting || Object.keys(answers).length === 0}
                                        className="bg-[#9333EA] text-white px-8 py-4 border-4 border-black font-black uppercase shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 transition-all disabled:opacity-50"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Answers'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
