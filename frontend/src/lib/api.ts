import { supabase } from './supabase';

// Helper to get current session token
const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Generic Fetch Wrapper
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = await getToken();
    if (!token) throw new Error("No Auth Token");

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };

    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API Request Failed');
    }
    return response.json();
};

export const api = {
    // Tasks
    getUserTasks: () => apiFetch('/api/user_tasks'),

    // Profiles
    getProfiles: () => apiFetch('/api/profiles'),

    // Common
    getAppSettings: () => apiFetch('/api/app_settings'),
    getNews: () => apiFetch('/api/news_feed'),
    getTasks: () => apiFetch('/api/tasks'), // Public/All tasks

    // Admin
    getAdminProfiles: () => apiFetch('/api/admin/profiles'),
    getAdminLogs: () => apiFetch('/api/admin/logs'),
    getAdminPairings: () => apiFetch('/api/admin/pairings'),

    generatePairings: () => apiFetch('/api/admin/generate_pairings', { method: 'POST' }),

    // Games
    dailyCheckin: (date: string) => apiFetch('/api/game/daily_checkin', { method: 'POST', body: JSON.stringify({ checkin_date: date }) }),
    submitMemoryScore: (score: number) => apiFetch('/api/game/memory/score', { method: 'POST', body: JSON.stringify({ score }) }),

    // TicTacToe
    getActiveGame: (partnerId: string) => apiFetch(`/api/game/tictactoe/active?partnerId=${partnerId}`),
    createTicTacToe: (partnerId: string) => apiFetch('/api/game/tictactoe/create', { method: 'POST', body: JSON.stringify({ partnerId }) }),
    makeTicTacToeMove: (gameId: string, index: number, board: any[]) => apiFetch('/api/game/tictactoe/move', { method: 'POST', body: JSON.stringify({ gameId, index, board }) }),
};
