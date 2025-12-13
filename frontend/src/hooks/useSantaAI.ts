import { useState, useCallback } from 'react';

export interface ChatMessage {
    id: string;
    role: 'user' | 'santa';
    content: string;
    highlightId?: string; // ID of the element to highlight
}

// Define interactions with Highlight IDs
const SANTA_RESPONSES: Record<string, { text: string, highlight?: string }> = {
    'default': { text: "Ho Ho Ho! I am Santa AI! 🎅 Ask me 'Who made this?' or 'How to play'!" },
    'hello': { text: "Merry Christmas! 🎄 I am Santa AI, your magical assistant. How can I help?" },
    'hi': { text: "Hello there! I am Santa AI. Ready to explore?" },
    'who are you': { text: "I am Santa AI! 🎅 A digital elf helper sitting on your screen." },
    'what is this': { text: "This is the Secret Santa 2025 platform for NIT Trichy!" },
    'why': { text: "I am a new feature designed to guide you. I can point out buttons and explain rules! 👉" },
    'new': { text: "Yes, I am brand new! Fresh from the North Pole (server)." },
    'creator': { text: "I was created by Harish Annavisamy! He coded my Christmas Spirit. 👨‍💻" },
    'made': { text: "I was crafted by Harish Annavisamy! He taught me how to talk to you." },
    'harish': { text: "Harish Annavisamy is the wizard who built this entire platform!" },

    // Interactive Responses
    'how to play': {
        text: "It's simple:\n1. Check your Tasks below.\n2. Play Games.\n3. Wait for the Reveal!",
        highlight: 'tasks-tab-btn'
    },
    'tasks': {
        text: "Tasks are right here! Complete them daily for +4 Points.",
        highlight: 'tasks-tab-btn'
    },
    'leaderboard': {
        text: "Click the Trophy icon to see the top elves! 🏆",
        highlight: 'leaderboard-btn'
    },
    'games': {
        text: "We have Movie Challenges and Tic-Tac-Toe. Look for them in the Games tab!",
        highlight: 'tasks-tab-btn'
    },
    'chat': {
        text: "Chat with everyone globally using the button on the right! 👉",
        highlight: 'global-chat-btn' // We need to add this ID
    },
    'profile': {
        text: "You can edit your profile by clicking your name or the Profile button.",
        highlight: 'profile-btn'
    },
    'joke': { text: "What do you call a snowman with a six-pack? ... An abdominal snowman! ⛄" },
};

export function useSantaAI() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', role: 'santa', content: SANTA_RESPONSES['default'].text }
    ]);
    const [isTyping, setIsTyping] = useState(false);

    const callGroqAI = async (userPrompt: string): Promise<{ text: string, highlight?: string }> => {
        // Use Backend Proxy
        try {
            // We need the auth token for the backend call!
            // Actually, verifyToken middleware requires it.
            // But this hook doesn't have easy access to `api` helper or token directly unless we use `api.ts`.
            // Let's use the `api` helper if possible, or fetch with token from session.
            // Since `useSantaAI` is a hook, let's use `apiFetch` style or just use `auth` context if available?
            // Easier: import `api` from lib/api.ts

            // Dynamic import to avoid cycles? No, lib/api is safe.
            const { api } = await import('../lib/api');
            const result = await api.chatWithAI(userPrompt);
            return result;

        } catch (error: any) {
            console.error("AI Error:", error);
            return { text: "My reindeer ate the internet cable! 🦌 (Network Error)" };
        }
    };

    const sendMessage = useCallback(async (content: string) => {
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        // Always use Backend Proxy for AI
        const { text, highlight } = await callGroqAI(content);
        const santaMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'santa',
            content: text,
            highlightId: highlight
        };
        setMessages(prev => [...prev, santaMsg]);
        setIsTyping(false);
        triggerHighlight(highlight);
    }, []);

    const triggerHighlight = (id?: string) => {
        if (!id) return;
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // RUBBER BAND ANIMATION
                el.classList.add('animate-rubber', 'ring-4', 'ring-[#00FF00]');
                setTimeout(() => {
                    el.classList.remove('animate-rubber', 'ring-4', 'ring-[#00FF00]');
                }, 1500); // 1.5s is enough for rubber band
            }
        }, 100);
    };

    return { messages, sendMessage, isTyping };
}
