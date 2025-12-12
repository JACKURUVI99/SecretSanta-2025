import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Megaphone, Pin } from 'lucide-react';
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
            const { data } = await supabase
                .from('news_feed')
                .select('*')
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(5);
            setNews(data || []);
        } catch (error) {
            console.error('Error fetching news:', error);
        } finally {
            setLoading(false);
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
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_black] mb-6">
            <div className="bg-[#C41E3A] text-white p-4 border-b-4 border-black flex items-center gap-2">
                <Megaphone size={24} strokeWidth={3} />
                <h2 className="text-xl font-black uppercase">News & Announcements</h2>
            </div>
            <div className="divide-y-4 divide-black">
                {news.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-[#E0E7FF] transition-colors relative">
                        {item.is_pinned && (
                            <div className="absolute top-2 right-2">
                                <Pin size={16} className="text-[#C41E3A] fill-[#C41E3A]" />
                            </div>
                        )}
                        <h3 className="font-black uppercase text-lg mb-2 flex items-center gap-2">
                            {item.title}
                            {item.is_pinned && (
                                <span className="bg-[#FFD700] text-black text-xs px-2 py-1 border-2 border-black">
                                    PINNED
                                </span>
                            )}
                        </h3>
                        <p className="font-bold text-gray-800">{item.content}</p>
                        <p className="text-xs text-gray-500 font-bold mt-2 uppercase">
                            {new Date(item.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
