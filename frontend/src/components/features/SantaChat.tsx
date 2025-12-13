import { useState, useRef, useEffect } from 'react';
import { useSantaAI } from '../../hooks/useSantaAI';
import { Send, Minimize2 } from 'lucide-react';

export default function SantaChat({ isOpen, onToggle }: { isOpen?: boolean; onToggle?: () => void }) {
    // const [isOpen, setIsOpen] = useState(false); // Controlled by parent now
    const [input, setInput] = useState('');
    const { messages, sendMessage, isTyping } = useSantaAI();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendMessage(input);
        setInput('');
    };

    if (isOpen === undefined) return null; // Should be controlled

    return (
        <div className="fixed bottom-4 left-4 z-[100] font-mono">
            {/* Chat Window */}
            {isOpen && (
                <div className="fixed inset-x-0 bottom-0 top-auto w-full h-[60vh] md:static md:w-96 md:h-[500px] md:mb-4 bg-white border-t-4 md:border-4 border-black border-x-4 md:border-x-4 shadow-[0px_-4px_10px_rgba(0,0,0,0.2)] md:shadow-[8px_8px_0px_0px_black] flex flex-col animate-in slide-in-from-bottom-full duration-300 rounded-t-xl md:rounded-lg z-[1000]">
                    {/* Header */}
                    <div className="bg-[#C41E3A] text-white p-3 border-b-4 border-black flex items-center justify-between rounded-t-lg">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl filter drop-shadow-[2px_2px_0px_black]">🎅</span>
                            <div>
                                <h3 className="font-black uppercase leading-tight">Santa AI</h3>
                                <span className="text-xs font-bold text-green-200">● Online</span>
                            </div>
                        </div>
                        <button
                            onClick={onToggle}
                            className="bg-black/20 hover:bg-black/40 p-1.5 rounded transition-colors"
                        >
                            <Minimize2 size={24} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F0FDF4]">
                        <div className="text-center text-xs font-bold text-gray-400 mb-2">
                            - Chat with Santa powered by AI -
                        </div>
                        {messages.length === 0 && (
                            <div className="text-center mt-10 opacity-50">
                                <span className="text-4xl block mb-2">👋</span>
                                <p className="font-bold text-gray-600">Say hello to Santa!</p>
                            </div>
                        )}
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] p-3 border-2 border-black shadow-[2px_2px_0px_0px_black] font-bold text-sm break-words ${msg.role === 'user'
                                        ? 'bg-[#FFD700] text-black'
                                        : 'bg-white text-black'
                                        }`}
                                >
                                    <p>{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white p-3 border-2 border-black shadow-[2px_2px_0px_0px_black] flex gap-1">
                                    <span className="w-2 h-2 bg-black rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                    <span className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} className="p-3 border-t-4 border-black bg-white flex gap-2 pb-safe-area">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask Santa..."
                            className="flex-1 border-2 border-black px-3 py-3 font-bold text-sm focus:outline-none focus:bg-gray-50 min-w-0 md:py-2"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isTyping}
                            className="bg-[#00A86B] text-white px-4 border-2 border-black shadow-[2px_2px_0px_0px_black] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center"
                        >
                            <Send size={24} />
                        </button>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={onToggle}
                    className="fixed bottom-6 left-6 z-[99] bg-[#C41E3A] text-white w-16 h-16 border-4 border-black shadow-[6px_6px_0px_0px_black] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_black] transition-all rounded-full group flex items-center justify-center"
                >
                    <div className="relative">
                        <span className="text-3xl group-hover:scale-110 transition-transform block">🎅</span>
                        <span className="absolute -top-2 -right-2 bg-[#00A86B] text-white text-[10px] font-black px-1.5 py-0.5 border-2 border-black rounded-full animate-bounce">AI</span>
                    </div>
                </button>
            )}
        </div>
    );
}
