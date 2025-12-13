import { supabase, Profile } from './supabase';
export type { Profile };

// Helper to get current session token
const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Generic Fetch Wrapper
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = await getToken();
    if (!token) {
        // Redirect to login if no token found (auth session lost)
        // Check if we are already on the auth page to avoid loops
        if (window.location.pathname !== '/') {
            window.location.href = '/';
        }
        throw new Error("No Auth Token - Redirecting to Login");
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };

    const url = `${BASE_URL}${endpoint}`;
    const res = await fetch(url, { ...options, headers });

    // Check for JSON content type
    const contentType = res.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    if (!res.ok) {
        if (isJson) {
            const errJson = await res.json();
            throw new Error(errJson.message || errJson.error || `API Error: ${res.status}`);
        }
        const errText = await res.text();
        // Handle HTML error pages (e.g., Nginx 404/502)
        if (errText.trim().startsWith('<')) {
            console.error(`API Error (${res.status}) on ${endpoint}: Received HTML`, errText.substring(0, 200));
            throw new Error(`Server Error (${res.status}): Please check connection.`);
        }
        throw new Error(errText || `API Error: ${res.status}`);
    }

    // Success - parse JSON if applicable
    if (isJson) {
        return res.json();
    }
    // Fallback for non-JSON success (rare)
    return res.text();
};

const publicFetch = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        }
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API Request Failed');
    }
    return response.json();
};

export const api = {
    // --- User: Core ---
    getProfile: () => apiFetch('/api/user/profile'),
    getUserTasks: () => apiFetch('/api/user_tasks'),
    getLeaderboard: () => apiFetch('/api/leaderboard'),
    getCompletedGames: () => apiFetch('/api/user/completed_games'),
    getUserPairings: () => apiFetch('/api/user/pairings'),
    toggleUserTask: (taskId: string) => apiFetch(`/api/user/tasks/${taskId}/toggle`, { method: 'POST' }),
    getAppSettings: () => publicFetch('/api/app_settings'),
    getNews: () => apiFetch('/api/user/news'),
    getTasks: () => publicFetch('/api/tasks'), // Public/All tasks
    getProfiles: () => publicFetch('/api/profiles'), // Public? needed for dropdowns?

    // --- Private / Social ---
    getClassmates: () => apiFetch('/api/users/classmates'),
    getNotifications: () => apiFetch('/api/notifications'),
    markNotificationsRead: (ids: string[]) => apiFetch('/api/notifications/mark_read', { method: 'POST', body: JSON.stringify({ ids }) }),
    markNewsRead: (id: string) => apiFetch(`/api/news/${id}/read`, { method: 'POST' }),

    // --- Public/Shared ---
    getProfileById: (id: string) => apiFetch(`/api/profiles/${id}`),
    getProfileLikes: (id: string) => apiFetch(`/api/profiles/${id}/likes`),
    toggleProfileLike: (id: string) => apiFetch(`/api/profiles/${id}/toggle_like`, { method: 'POST' }),

    getChatMessages: () => apiFetch('/api/chat'),
    sendChatMessage: (message: string, id?: string) => apiFetch('/api/chat', { method: 'POST', body: JSON.stringify({ message, id }) }),

    // --- User: Games ---
    dailyCheckin: (date: string) => apiFetch('/api/game/daily_checkin', { method: 'POST', body: JSON.stringify({ checkin_date: date }) }),
    getDailyStatus: () => apiFetch('/api/game/daily/status'),
    sendDailyReaction: (emoji: string) => apiFetch('/api/game/daily/reaction', { method: 'POST', body: JSON.stringify({ emoji }) }),

    submitMemoryScore: (score: number) => apiFetch('/api/game/memory/score', { method: 'POST', body: JSON.stringify({ score }) }), // Keep for score submission?
    completeMemoryGame: (moves: number) => apiFetch('/api/game/memory/complete', { method: 'POST', body: JSON.stringify({ moves }) }),

    getActiveTicTacToe: (partnerId: string) => apiFetch(`/api/game/tictactoe/active?partnerId=${partnerId}`),
    createTicTacToe: (partnerId: string) => apiFetch('/api/game/tictactoe/create', { method: 'POST', body: JSON.stringify({ partnerId }) }),
    moveTicTacToe: (gameId: string, index: number, board: any[]) => apiFetch('/api/game/tictactoe/move', { method: 'POST', body: JSON.stringify({ gameId, index, board: board }) }),
    makeTicTacToeMove: (gameId: string, index: number, board: any[]) => apiFetch('/api/game/tictactoe/move', { method: 'POST', body: JSON.stringify({ gameId, index, board: board }) }), // Alias

    getKollywoodWords: (category: string) => apiFetch(`/api/game/kollywood/words?category=${category}`),
    solveKollywoodWord: (wordId: number, guess: string) => apiFetch('/api/game/kollywood/solve', { method: 'POST', body: JSON.stringify({ word_id: wordId, guess }) }),
    resetKollywood: () => apiFetch('/api/game/kollywood/reset', { method: 'POST' }),

    completeRPS: (win: boolean) => apiFetch('/api/game/rps/complete', { method: 'POST', body: JSON.stringify({ win }) }),

    // --- New Games (Phase 3) ---
    // Jumbled Words
    getJumbledWords: () => apiFetch('/api/game/jumbled_words'),
    solveJumbledWord: (wordId: string, answer: string) => apiFetch('/api/game/jumbled_words/solve', { method: 'POST', body: JSON.stringify({ wordId, answer }) }),
    resetJumbledWords: () => apiFetch('/api/admin/reset_jumbled_words', { method: 'POST' }),

    // Crossword
    getCrossword: () => apiFetch('/api/game/crossword'),
    solveCrossword: (clueId: string, answer: string) => apiFetch('/api/game/crossword/solve', { method: 'POST', body: JSON.stringify({ clueId, answer }) }),
    resetCrossword: () => apiFetch('/api/admin/reset_crossword', { method: 'POST' }),

    // Bad Description
    getBadDescriptions: () => apiFetch('/api/game/bad_description'),
    solveBadDescription: (questionId: string, answer: string) => apiFetch('/api/game/bad_description/solve', { method: 'POST', body: JSON.stringify({ questionId, answer }) }),
    resetBadDescription: () => apiFetch('/api/admin/reset_bad_description', { method: 'POST' }),

    // Bingo
    getBingoCard: () => apiFetch('/api/game/bingo/card'),
    initBingoCard: () => apiFetch('/api/game/bingo/card/init', { method: 'POST' }),
    getBingoState: () => apiFetch('/api/game/bingo/state'),
    adminCallBingoWord: (word: string) => apiFetch('/api/admin/bingo/call', { method: 'POST', body: JSON.stringify({ word }) }),
    resetBingo: () => apiFetch('/api/admin/reset_bingo', { method: 'POST' }),

    getBonusTask: () => apiFetch('/api/user/bonus_task'),
    getBonusTaskQuestions: (taskId: string) => apiFetch(`/api/user/bonus_task/${taskId}/questions`),
    submitBonusTask: (taskId: string, answers: any[]) => apiFetch('/api/user/bonus_task/submit', { method: 'POST', body: JSON.stringify({ task_id: taskId, answers }) }),

    chatWithAI: (message: string) => apiFetch('/api/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }),

    // --- User: Polls ---
    getPolls: () => apiFetch('/api/polls'),
    votePoll: (pollId: string, optionIndex: number) => apiFetch(`/api/polls/${pollId}/vote`, { method: 'POST', body: JSON.stringify({ option_index: optionIndex }) }),

    // --- Admin: Core ---
    getAdminProfiles: () => adminFetch('/api/admin/profiles'),
    getAdminLogs: () => adminFetch('/api/admin/logs'),
    getAdminPairings: () => adminFetch('/api/admin/pairings'),
    getAdminTasks: () => adminFetch('/api/admin/tasks'),
    updateAdminSettings: (updates: any) => adminFetch('/api/admin/settings', { method: 'POST', body: JSON.stringify(updates) }),

    // --- Admin: Users ---
    deleteAdminUser: (id: string) => adminFetch(`/api/admin/users/${id}`, { method: 'DELETE' }),
    toggleAdminStatus: (id: string, is_admin: boolean) => adminFetch(`/api/admin/users/${id}/toggle_admin`, { method: 'POST', body: JSON.stringify({ is_admin }) }),
    toggleBanStatus: (id: string, is_banned: boolean, ban_reason?: string) => adminFetch(`/api/admin/users/${id}/toggle_ban`, { method: 'POST', body: JSON.stringify({ is_banned, ban_reason }) }),
    sendHeartbeat: () => apiFetch('/api/user/heartbeat', { method: 'POST' }),
    logUserAction: (action: string, details: any) => apiFetch('/api/user/log', { method: 'POST', body: JSON.stringify({ action, details }) }),
    submitGameScore: (gameId: string, score: number) => apiFetch('/api/user/games/score', { method: 'POST', body: JSON.stringify({ game_id: gameId, score }) }),

    // --- Admin: Pairings ---
    createAdminPairing: (user_id: string, secret_santa_id: string) => adminFetch('/api/admin/pairings/manual', { method: 'POST', body: JSON.stringify({ user_id, secret_santa_id }) }),
    deleteAdminPairing: (id: string) => adminFetch(`/api/admin/pairings/${id}`, { method: 'DELETE' }),
    resetAdminPairings: () => adminFetch('/api/admin/pairings', { method: 'DELETE' }),
    generatePairings: () => adminFetch('/api/admin/generate_pairings', { method: 'POST' }), // Old Logic
    generatePairingsNIT: () => adminFetch('/api/admin/create_pairings_nit', { method: 'POST' }), // New Logic
    getPairingAnalysis: () => adminFetch('/api/admin/pairing_analysis'),
    // --- Admin: Tasks ---
    createAdminTask: (task: any) => adminFetch('/api/admin/tasks', { method: 'POST', body: JSON.stringify(task) }),
    deleteAdminTask: (id: string) => adminFetch(`/api/admin/tasks/${id}`, { method: 'DELETE' }),

    // --- Admin: Bonus Tasks ---
    createAdminBonusTask: (task: any) => adminFetch('/api/admin/bonus_tasks', { method: 'POST', body: JSON.stringify(task) }),
    deleteAdminBonusTask: (id: string) => adminFetch(`/api/admin/bonus_tasks/${id}`, { method: 'DELETE' }),
    toggleAdminBonusTask: (id: string, is_active: boolean) => adminFetch(`/api/admin/bonus_tasks/${id}/toggle`, { method: 'POST', body: JSON.stringify({ is_active }) }),
    getBonusTasks: () => adminFetch('/api/admin/bonus_tasks'),
    createNews: (data: any) => adminFetch('/api/admin/news', { method: 'POST', body: JSON.stringify(data) }),
    deleteNews: (id: string) => adminFetch(`/api/admin/news/${id}`, { method: 'DELETE' }),
    getNewsStats: () => adminFetch('/api/admin/news/stats'),
    deleteBonusTask: (id: string) => adminFetch(`/api/admin/bonus_tasks/${id}`, { method: 'DELETE' }),
    toggleBonusTask: (id: string, isActive: boolean) => adminFetch(`/api/admin/bonus_tasks/${id}/toggle`, { method: 'POST', body: JSON.stringify({ is_active: isActive }) }),
};

// --- Admin API Extensions ---

export const setAdminToken = (token: string) => {
    localStorage.setItem('admin_token', token);
};

export const getAdminToken = () => {
    return localStorage.getItem('admin_token');
};

export const removeAdminToken = () => {
    localStorage.removeItem('admin_token');
};

const adminFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAdminToken();
    if (!token) throw new Error("No Admin Token");

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };

    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
        removeAdminToken();
        window.location.href = '/admin/login';
        throw new Error("Unauthorized");
    }

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Admin API Request Failed');
    }
    return response.json();
};

export const adminApi = {
    login: async (credentials: any) => {
        const response = await fetch(`${BASE_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        if (!response.ok) throw new Error('Login failed');
        return response.json();
    },
    getProfiles: () => adminFetch('/api/admin/profiles'),
    getLogs: () => adminFetch('/api/admin/logs'),
    getPairings: () => adminFetch('/api/admin/pairings'),
    generatePairings: () => adminFetch('/admin/generate_pairings', { method: 'POST' }), // Old Logic
    generatePairingsNIT: () => adminFetch('/admin/create_pairings_nit', { method: 'POST' }), // New Logic
    resetKRatings: () => adminFetch('/admin/reset_k_ratings', { method: 'POST' }),
    toggleGame: (game: string, enable: boolean) => adminFetch('/admin/toggle_game', { method: 'POST', body: JSON.stringify({ game, enable }) }),
    resetDay: () => adminFetch('/admin/reset_day', { method: 'POST' }),
    deleteChatMessage: (id: string) => adminFetch(`/api/admin/chat/${id}`, { method: 'DELETE' }),

    // --- Admin: Polls ---
    createPoll: (poll: any) => adminFetch('/api/admin/polls', { method: 'POST', body: JSON.stringify(poll) }),
    deletePoll: (id: string) => adminFetch(`/api/admin/polls/${id}`, { method: 'DELETE' }),
    togglePoll: (id: string, is_active: boolean) => adminFetch(`/api/admin/polls/${id}/toggle`, { method: 'POST', body: JSON.stringify({ is_active }) }),
    toggleMaintenanceBypass: (id: string, bypass: boolean) => adminFetch(`/api/admin/users/${id}/toggle_bypass`, { method: 'POST', body: JSON.stringify({ bypass }) }),
};



