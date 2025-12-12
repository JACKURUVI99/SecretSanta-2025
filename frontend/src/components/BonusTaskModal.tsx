import { useState } from 'react';
import { supabase, BonusTask } from '../lib/supabase';
import { X, Trash2 } from 'lucide-react';
interface Question {
    id: string;
    question_type: 'mcq' | 'fill_blank' | 'checkbox';
    question_text: string;
    options?: string[];
    correct_answer: string | string[];
    is_case_sensitive?: boolean;
}
interface BonusTaskModalProps {
    onClose: () => void;
    onSave: () => void;
    task?: Partial<BonusTask> & { questions?: Question[] };
}
export default function BonusTaskModal({ onClose, onSave, task }: BonusTaskModalProps) {
    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [taskDate, setTaskDate] = useState(task?.task_date || new Date().toISOString().split('T')[0]);
    const [questions, setQuestions] = useState<Question[]>(task?.questions || []);
    const addQuestion = (type: 'mcq' | 'fill_blank' | 'checkbox') => {
        const newQuestion: Question = {
            id: crypto.randomUUID(),
            question_type: type,
            question_text: '',
            options: type === 'mcq' || type === 'checkbox' ? ['', '', '', ''] : undefined,
            correct_answer: type === 'checkbox' ? [] : '',
            is_case_sensitive: type === 'fill_blank' ? false : undefined
        };
        setQuestions([...questions, newQuestion]);
    };
    const updateQuestion = (id: string, field: string, value: unknown) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
    };
    const updateOption = (questionId: string, optionIndex: number, value: string) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId && q.options) {
                const newOptions = [...q.options];
                newOptions[optionIndex] = value;
                return { ...q, options: newOptions };
            }
            return q;
        }));
    };
    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };
    const saveTask = async () => {
        try {
            // Insert task
            const { data: task, error: taskError } = await supabase
                .from('bonus_tasks')
                .insert({
                    title,
                    description,
                    task_date: taskDate,
                    total_points: questions.length * 4
                })
                .select()
                .single();
            if (taskError) throw taskError;
            // Insert questions
            const questionsToInsert = questions.map((q, index) => ({
                task_id: task.id,
                question_type: q.question_type,
                question_text: q.question_text,
                options: q.options ? JSON.stringify(q.options) : null,
                correct_answer: JSON.stringify(q.correct_answer),
                points: 4,
                question_order: index,
                is_case_sensitive: q.is_case_sensitive || false
            }));
            const { error: questionsError } = await supabase
                .from('task_questions')
                .insert(questionsToInsert);
            if (questionsError) throw questionsError;
            alert('Task created successfully!');
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving task:', error);
            alert('Failed to create task');
        }
    };
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4 overflow-y-auto backdrop-blur-sm">
            <div className="bg-black shadow-[0px_0px_20px_#00FF00] max-w-4xl w-full border-4 border-[#00FF00] my-8">
                <div className="bg-black text-[#00FF00] p-6 flex items-center justify-between border-b-4 border-[#00FF00] sticky top-0 z-10">
                    <h2 className="text-2xl font-black uppercase">Create Bonus Task</h2>
                    <button onClick={onClose} className="hover:text-white transition-colors">
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-black uppercase mb-2 text-[#00FF00]">Task Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-black text-[#00FF00] px-4 py-3 border-4 border-[#00FF00] font-bold focus:shadow-[0px_0px_10px_#00FF00] outline-none"
                                placeholder="Daily Quiz Challenge"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-black uppercase mb-2 text-[#00FF00]">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-black text-[#00FF00] px-4 py-3 border-4 border-[#00FF00] font-bold h-20 resize-none focus:shadow-[0px_0px_10px_#00FF00] outline-none"
                                placeholder="Answer these questions correctly!"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-black uppercase mb-2 text-[#00FF00]">Task Date</label>
                            <input
                                type="date"
                                value={taskDate}
                                onChange={(e) => setTaskDate(e.target.value)}
                                className="px-4 py-3 bg-black text-[#00FF00] border-4 border-[#00FF00] font-bold focus:shadow-[0px_0px_10px_#00FF00] outline-none"
                                required
                            />
                        </div>
                    </div>
                    {}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black uppercase text-[#00FF00]">Questions ({questions.length})</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => addQuestion('mcq')}
                                    className="bg-blue-600 text-white px-3 py-2 border-2 border-blue-400 font-bold text-sm uppercase hover:shadow-[0px_0px_10px_blue]"
                                >
                                    + MCQ
                                </button>
                                <button
                                    onClick={() => addQuestion('fill_blank')}
                                    className="bg-green-600 text-white px-3 py-2 border-2 border-green-400 font-bold text-sm uppercase hover:shadow-[0px_0px_10px_green]"
                                >
                                    + Fill Blank
                                </button>
                                <button
                                    onClick={() => addQuestion('checkbox')}
                                    className="bg-yellow-600 text-white px-3 py-2 border-2 border-yellow-400 font-bold text-sm uppercase hover:shadow-[0px_0px_10px_yellow]"
                                >
                                    + Checkbox
                                </button>
                            </div>
                        </div>
                        {questions.map((q, index) => (
                            <div key={q.id} className="bg-black p-4 border-4 border-[#00FF00] relative shadow-[2px_2px_0px_0px_#00FF00]">
                                <button
                                    onClick={() => removeQuestion(q.id)}
                                    className="absolute top-2 right-2 text-red-500 hover:text-red-400"
                                >
                                    <Trash2 size={20} />
                                </button>
                                <div className="mb-3">
                                    <span className="bg-[#00FF00] text-black px-2 py-1 text-xs font-black uppercase">
                                        Q{index + 1} - {q.question_type.replace('_', ' ')}
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    value={q.question_text}
                                    onChange={(e) => updateQuestion(q.id, 'question_text', e.target.value)}
                                    className="w-full bg-black text-[#00FF00] px-3 py-2 border-2 border-[#00FF00] font-bold mb-3 focus:shadow-[0px_0px_5px_#00FF00] outline-none"
                                    placeholder="Enter question..."
                                />
                                {q.question_type === 'mcq' && q.options && (
                                    <div className="space-y-2">
                                        {q.options.map((opt, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name={`correct-${q.id}`}
                                                    checked={q.correct_answer === String.fromCharCode(65 + i)}
                                                    onChange={() => updateQuestion(q.id, 'correct_answer', String.fromCharCode(65 + i))}
                                                    className="w-4 h-4 accent-[#00FF00]"
                                                />
                                                <input
                                                    type="text"
                                                    value={opt}
                                                    onChange={(e) => updateOption(q.id, i, e.target.value)}
                                                    className="flex-1 bg-black text-[#00FF00] px-3 py-2 border-2 border-[#00FF00] font-bold focus:shadow-[0px_0px_5px_#00FF00] outline-none"
                                                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {q.question_type === 'fill_blank' && (
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            value={q.correct_answer as string}
                                            onChange={(e) => updateQuestion(q.id, 'correct_answer', e.target.value)}
                                            className="w-full bg-black text-[#00FF00] px-3 py-2 border-2 border-[#00FF00] font-bold focus:shadow-[0px_0px_5px_#00FF00] outline-none"
                                            placeholder="Correct answer..."
                                        />
                                        <label className="flex items-center gap-2 text-[#00FF00]">
                                            <input
                                                type="checkbox"
                                                checked={q.is_case_sensitive}
                                                onChange={(e) => updateQuestion(q.id, 'is_case_sensitive', e.target.checked)}
                                                className="w-4 h-4 accent-[#00FF00]"
                                            />
                                            <span className="font-bold text-sm">Case Sensitive</span>
                                        </label>
                                    </div>
                                )}
                                {q.question_type === 'checkbox' && q.options && (
                                    <div className="space-y-2">
                                        {q.options.map((opt, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={(q.correct_answer as string[]).includes(String.fromCharCode(65 + i))}
                                                    onChange={(e) => {
                                                        const letter = String.fromCharCode(65 + i);
                                                        const current = q.correct_answer as string[];
                                                        const updated = e.target.checked
                                                            ? [...current, letter]
                                                            : current.filter(l => l !== letter);
                                                        updateQuestion(q.id, 'correct_answer', updated);
                                                    }}
                                                    className="w-4 h-4 accent-[#00FF00]"
                                                />
                                                <input
                                                    type="text"
                                                    value={opt}
                                                    onChange={(e) => updateOption(q.id, i, e.target.value)}
                                                    className="flex-1 bg-black text-[#00FF00] px-3 py-2 border-2 border-[#00FF00] font-bold focus:shadow-[0px_0px_5px_#00FF00] outline-none"
                                                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {questions.length === 0 && (
                            <div className="text-center py-8 text-gray-500 font-bold border-2 border-dashed border-gray-700">
                                No questions added yet. Click a button above to add one!
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-6 border-t-4 border-[#00FF00] bg-black sticky bottom-0">
                    <button
                        onClick={saveTask}
                        disabled={!title || questions.length === 0}
                        className="w-full bg-[#00FF00] text-black font-black uppercase py-4 border-4 border-[#00FF00] shadow-[0px_0px_15px_#00FF00] hover:bg-white hover:text-black hover:shadow-[0px_0px_20px_white] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Create Task ({questions.length} questions, {questions.length * 4} max points)
                    </button>
                </div>
            </div>
        </div>
    );
}
