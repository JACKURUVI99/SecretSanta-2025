import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Megaphone, Pin, Check } from 'lucide-react';

interface NewsItem {
    id: string;
    title: string;
    content: string;
    created_at: string;
    is_pinned: boolean;
}

export default function NewsFeed() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNews();
        // Poll for news updates every 15 seconds
        const interval = setInterval(fetchNews, 15000);
        return () => clearInterval(interval);
    }, []);

    const fetchNews = async () => {
        try {
            const data = await api.getNews();
            // Assuming getNews returns only unread user-specific news now
            setNews(data || []);
        } catch (error) {
            console.error('Error fetching news:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (id: string) => {
        // Optimistic update
        setNews(prev => prev.filter(n => n.id !== id));
        try {
            await api.markNewsRead(id);
        } catch (e) {
            console.error(e);
            fetchNews(); // Revert on failure
        }
    };

    if (loading) {
        return (
            <div className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_black]">
                <div className="animate-pulse text-center">Loading news...</div>
            </div>
        );
    }

    if (news.length === 0) return null;

    return (
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] mb-6 animate-fade-in">
            <div className="bg-[#C41E3A] text-white p-4 border-b-4 border-black flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Megaphone size={24} strokeWidth={3} />
                    <h2 className="text-xl font-black uppercase">News & Announcements</h2>
                </div>
                <div className="text-xs font-bold bg-white text-[#C41E3A] px-2 py-0.5 border-2 border-black">
                    {news.length} New
                </div>
            </div>
            <div className="divide-y-4 divide-black">
                {news.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-[#E0E7FF] transition-colors relative group">
                        {item.is_pinned && (
                            <div className="absolute top-2 right-2">
                                <Pin size={16} className="text-[#C41E3A] fill-[#C41E3A]" />
                            </div>
                        )}
                        <h3 className="font-black uppercase text-lg mb-2 flex items-center gap-2 pr-8">
                            {item.title}
                            {item.is_pinned && (
                                <span className="bg-[#FFD700] text-black text-xs px-2 py-1 border-2 border-black">
                                    PINNED
                                </span>
                            )}
                        </h3>
                        <p className="font-bold text-gray-800 mb-4">{item.content}</p>

                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500 font-bold uppercase">
                                {new Date(item.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                            <button
                                onClick={() => handleMarkRead(item.id)}
                                className="bg-white text-black text-xs font-black uppercase px-3 py-1 border-2 border-black shadow-[2px_2px_0px_black] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none flex items-center gap-1"
                            >
                                <Check size={14} /> Got it
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
