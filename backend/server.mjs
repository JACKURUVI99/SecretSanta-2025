import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { exec } from 'child_process';
import mongoose from 'mongoose'; // Added Connection
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// --- Supabase Setup ---

// Env Vars
const DAUTH_PUBLIC_KEY = process.env.DAUTH_PUBLIC_KEY;
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Init Supabase Admin Client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:5175',
        'https://secretsantanitt25.site',
        'https://www.secretsantanitt25.site',
        'https://secretsanta-2025.web.app',
        'https://secretsanta-2025.firebaseapp.com',
        'https://secret-santa-2025-c6a5f.web.app',
        'https://secret-santa-2025-c6a5f.firebaseapp.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- Middlewares ---

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        // 1. Try DAuth Verification (if Key available)
        if (DAUTH_PUBLIC_KEY) {
            try {
                const decoded = jwt.verify(token, DAUTH_PUBLIC_KEY, { algorithms: ['RS256'] });
                req.user = decoded;
                req.userId = decoded.sub;
                return next();
            } catch (e) {
                // Ignore and try Supabase
            }
        }

        // 2. Try Supabase Verification
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) throw new Error('Invalid Supabase Token');

        req.user = user;
        req.userId = user.id;

        // Check Ban Status
        const { data: profile } = await supabase.from('profiles').select('is_banned').eq('id', user.id).single();
        if (profile?.is_banned) {
            return res.status(403).json({ error: "You have been banned by the Grinch! 🚫" });
        }

        next();

    } catch (err) {
        console.error("Token Verification Failed:", err.message);
        return res.status(401).json({ error: "Invalid Token" });
    }
};

const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing token' });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Not an admin' });
        }
        req.admin = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// --- Routes ---

// --- Logging Helper ---
const logAdminAction = async (adminUsername, action, details) => {
    try {
        await supabase.from('activity_logs').insert({
            admin_username: adminUsername || 'System',
            action,
            details: typeof details === 'string' ? details : JSON.stringify(details)
        });
    } catch (e) {
        console.error("Log failed:", e.message);
    }
};

// Health Check (Fixes 404 on Root)
app.get('/', (req, res) => {
    res.status(200).send('🎅 Secret Santa Backend is Running! 🎄');
});

// Admin Login
app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    if (
        username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD
    ) {
        const token = jwt.sign(
            { role: 'admin', username },
            process.env.ADMIN_JWT_SECRET,
            { expiresIn: '12h' }
        );
        return res.json({ token });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
});

// Admin Actions
app.post('/api/admin/generate_pairings', verifyAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.rpc('generate_pairings');
        if (error) throw error;
        res.json({ success: true, count: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Pairings Analysis (Class Control)
app.get('/admin/pairing_analysis', verifyAdmin, async (req, res) => {
    try {
        const { data: users, error } = await supabase.from('profiles').select('*');
        if (error) throw error;

        const buckets = {};
        let totalStudents = 0;

        users.forEach(u => {
            if (!u.roll_number || u.is_admin) return;
            const roll = u.roll_number.toString();
            if (roll.length < 9) return; // Strict NIT Format check (9 digits)

            const dept = roll.substring(0, 3); // e.g. 107 (Dept Code)
            // Batch is tricky. User said "124" is batch. Let's stick to first 6 digits approach for class.
            const classId = roll.substring(0, 6); // 107124

            const lastThree = parseInt(roll.substring(roll.length - 3));
            const section = (lastThree % 2 === 0) ? 'B' : 'A';
            const key = `${classId}-${section}`; // DeptBatch-Section

            if (!buckets[key]) buckets[key] = { count: 0, users: [] };
            buckets[key].count++;
            // buckets[key].users.push(u.name); // Optional debug
            totalStudents++;
        });

        res.json({ success: true, buckets, totalStudents });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/admin/reset_k_ratings', verifyAdmin, async (req, res) => {
    try {
        const { error } = await supabase.rpc('reset_k_ratings');
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/admin/toggle_game', verifyAdmin, async (req, res) => {
    const { game, enable } = req.body;
    // Assuming a 'settings' table or RPC. For now just mock success or implement if DB ready.
    // Real implementation would call explicit DB function.
    res.json({ success: true, message: `Toggled ${game} to ${enable}` });
});

app.post('/admin/reset_day', verifyAdmin, async (req, res) => {
    try {
        const { error } = await supabase.rpc('reset_all_user_daily_words');
        if (error) throw error;
        res.json({ success: true, message: "Day reset logic executed" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Admin Data Endpoints ---

app.get('/api/admin/profiles', verifyAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').order('created_at');
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/pairings', verifyAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.from('pairings').select('*, user:profiles!user_id(*), secretSanta:profiles!secret_santa_id(*)');
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/logs', verifyAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100);
        if (error) throw error; // If table missing, might error
        res.json(data || []);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Using 'verifyAdmin' for these getters too since they are used in AdminDashboard
app.get('/api/tasks', async (req, res) => { // Public allow for now, or check token? Frontend uses apiFetch (User Token) usually, but Admin uses it too.
    // Let's allow public read for tasks
    try {
        const { data, error } = await supabase.from('tasks').select('*');
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/app_settings', async (req, res) => {
    try {
        const { data, error } = await supabase.from('app_settings').select('*').single();
        if (error) throw error;
        // Ensure default values if new columns are null
        const settings = {
            ...data,
            game_rules_active: data.game_rules_active ?? false
        };
        res.json(settings);
    } catch (e) {
        // If no row exists, return defaults
        res.json({
            show_games: true,
            show_tictactoe: false,
            show_memory_game: false,
            show_santa_run: false,
            show_flappy_santa: false,
            show_kollywood: false,
            show_jumbled_words: false,
            show_crossword: false,
            show_bad_description: false,
            show_bingo: false,
            game_rules_active: false
        });
    }
});

app.post('/api/settings', verifyAdmin, async (req, res) => {
    try {
        const updates = req.body;
        // Upsert settings (assuming id 1 for singleton)
        const { error } = await supabase.from('app_settings').upsert({ id: 1, ...updates });
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Participation Logic ---
app.post('/api/terms/accept', verifyToken, async (req, res) => {
    try {
        const { error } = await supabase.from('profiles').update({ terms_accepted: true }).eq('id', req.userId);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/users/:id/toggle_bypass', verifyAdmin, async (req, res) => {
    try {
        const { bypass } = req.body;
        const { error } = await supabase.from('profiles').update({ bypass_maintenance: bypass }).eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/terms/decline', verifyToken, async (req, res) => {
    try {
        // DESTRUCTIVE: Delete user account
        // Explicitly using service role key if available, otherwise relying on current client permissions
        // Note: supabase-js admin.deleteUser requires service_role key.
        // If 'supabase' var here is just anon, we might need to use adminSupabase if defined, or just delete profile.

        // Strategy: Delete profile first (triggers cascade usually).
        // Then try auth delete if we have permissions.

        const { error: profileError } = await supabase.from('profiles').delete().eq('id', req.userId);
        if (profileError) throw profileError;

        // Attempt Auth Delete (might fail if not service role, but profile delete effectively removes them from app)
        const { error: authError } = await supabase.auth.admin.deleteUser(req.userId);
        if (authError) console.warn("Could not delete auth user (likely permission issue), but profile is deleted:", authError.message);

        res.json({ success: true });
    } catch (e) {
        console.error("Decline error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/news_feed', async (req, res) => {
    try {
        const { data, error } = await supabase.from('news_feed').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- News Tracking ---
app.get('/api/user/news', verifyToken, async (req, res) => {
    try {
        // Fetch all news
        const { data: allNews } = await supabase.from('news_feed').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
        // Fetch User Reads
        const { data: reads } = await supabase.from('news_reads').select('news_id').eq('user_id', req.userId);
        const readIds = new Set(reads?.map(r => r.news_id) || []);

        // Filter unread
        const unreadNews = allNews?.filter(n => !readIds.has(n.id)) || [];
        // console.log(`[News] User ${req.userId} has ${reads?.length} reads. Unread: ${unreadNews.length}`);
        res.json(unreadNews);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/news/:id/read', verifyToken, async (req, res) => {
    try {
        console.log(`[News] Marking ${req.params.id} as read for ${req.userId}`);
        const { error } = await supabase.from('news_reads').insert({ news_id: req.params.id, user_id: req.userId });
        if (error) {
            console.error('[News] Mark read error:', error);
            if (error.code !== '23505') throw error;
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/news/stats', verifyAdmin, async (req, res) => {
    try {
        const { data: reads } = await supabase.from('news_reads').select('news_id, user:profiles(name)');
        // Aggregate
        const stats = {};
        reads?.forEach(r => {
            if (!stats[r.news_id]) stats[r.news_id] = [];
            stats[r.news_id].push(r.user?.name || 'Unknown');
        });
        res.json(stats);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin ONLY Bonus Tasks
app.get('/api/admin/bonus_tasks', verifyAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.from('bonus_tasks').select('*');
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/news', verifyAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from('news_feed').insert(req.body);
        if (error) throw error;
        await logAdminAction(req.admin?.username, 'POST_NEWS', `Title: ${req.body.title}`);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/news/:id', verifyAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from('news_feed').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update App Settings
app.post('/api/admin/settings', verifyAdmin, async (req, res) => {
    try {
        // App settings is usually a single row, or id provided.
        // Assuming we update the first row or specific ID if passed?
        // AdminDashboard passes an object of updates.
        // We'll update ALL rows? Or just ID 1?
        // Safer to expect ID in body or just update the only row if strictly singleton.
        // Let's assume singleton for now or check ID.
        // But dashboard logic: const { error } = await supabase.from('app_settings').update(updates).eq('id', settings.id);
        // It uses ID. So we should probably expect updates to contain fields?
        // Actually, let's just update the single row if ID is not critical, or find first.
        const updates = req.body;
        // Cleanse updates? RLS handles it?
        // If 'id' is in updates, we use it to match?
        // The dashboard sends `{ [key]: value }`.

        // We need to know WHICH row.
        // Let's fetch the first row ID first if not provided?
        // Or better: update all rows matching 'true' (if singleton).

        // Let's implement robustly:
        // Dashboard implementation uses: .eq('id', settings.id)
        // So we need to handle that. But we don't have settings.id here easily unless we fetch.

        const { data: currentSettings } = await supabase.from('app_settings').select('id').limit(1).single();
        if (!currentSettings) throw new Error("No settings found to update");

        const { error } = await supabase.from('app_settings').update(updates).eq('id', currentSettings.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin Tasks Fetch (Secure)
app.get('/api/admin/tasks', verifyAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.from('tasks').select('*').order('task_date', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});



// --- User Endpoints ---
app.get('/api/user/completed_games', verifyToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const completed = [];

        // 1. Memory Game
        const { data: mem } = await supabase.from('memory_game_scores').select('id').eq('user_id', req.userId).gte('created_at', today).limit(1);
        if (mem && mem.length > 0) completed.push('memory');

        // 2. TicTacToe (Giftee) & Santa
        // Need pairings to know who is who? Or just check games involving user?
        // The frontend logic checks specific pairings. 
        // Let's just check ALL games involving user that are finished today.
        const { data: ttt } = await supabase.from('tictactoe_games')
            .select('*')
            .or(`player_x.eq.${req.userId},player_o.eq.${req.userId}`)
            .eq('status', 'finished')
            .gte('created_at', today);

        if (ttt && ttt.length > 0) {
            // We could differentiate, but frontend just pushes 'tictactoe' and 'santa_tictactoe' if they exist.
            // Let's simplify and return 'tictactoe' if ANY game played?
            // No, frontend distinguishes 'vs Giftee' vs 'vs Santa'.
            // We need to know which one it was.
            // We can check the partner ID.
            const { data: pairings } = await supabase.from('pairings').select('*').or(`user_id.eq.${req.userId},secret_santa_id.eq.${req.userId}`);

            // My Santa is where user_id = me. My Giftee is where secret_santa_id = me.
            const mySantaId = pairings?.find(p => p.user_id === req.userId)?.secret_santa_id;
            const myGifteeId = pairings?.find(p => p.secret_santa_id === req.userId)?.user_id; // ERR: User is secret_santa_id in pairing? No. 
            // pairing: user_id (target), secret_santa_id (santa).
            // If I am Santa, secret_santa_id = me. user_id = giftee.
            const gifteeId = pairings?.find(p => p.secret_santa_id === req.userId)?.user_id;

            ttt.forEach(game => {
                const partner = game.player_x === req.userId ? game.player_o : game.player_x;
                if (partner === mySantaId) completed.push('santa_tictactoe');
                if (partner === gifteeId) completed.push('tictactoe');
            });
        }

        // RPS logic similar...

        res.json({ completed: [...new Set(completed)] });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/user/tasks/:id/toggle', verifyToken, async (req, res) => {
    try {
        const { error } = await supabase.rpc('toggle_dashboard_task', {
            p_user_id: req.userId,
            p_task_id: req.params.id
        });
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/user/profile', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', req.userId).single();
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/user_tasks', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase.from('user_tasks').select('*').eq('user_id', req.userId);
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/leaderboard', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, points, roll_number, favorite_emoji')
            .or('is_admin.eq.false,roll_number.eq.107124039')
            .order('points', { ascending: false })
            .limit(50);
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Public/Shared Endpoints ---

// Public Profile View
app.get('/api/profiles/:id', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', req.params.id).single();
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Profile Likes
app.get('/api/profiles/:id/likes', verifyToken, async (req, res) => {
    try {
        const { count, error } = await supabase.from('profile_likes').select('*', { count: 'exact', head: true }).eq('target_id', req.params.id);
        if (error) throw error;

        // Check if I liked
        const { data: myLike } = await supabase.from('profile_likes').select('*').eq('user_id', req.userId).eq('target_id', req.params.id).maybeSingle();

        res.json({ count: count || 0, hasLiked: !!myLike });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/profiles/:id/toggle_like', verifyToken, async (req, res) => {
    try {
        const targetId = req.params.id;
        const { data: existing } = await supabase.from('profile_likes').select('id').eq('user_id', req.userId).eq('target_id', targetId).maybeSingle();

        if (existing) {
            await supabase.from('profile_likes').delete().eq('id', existing.id);
            res.json({ liked: false });
        } else {
            await supabase.from('profile_likes').insert({ user_id: req.userId, target_id: targetId });

            // Notify the target user!
            if (req.userId !== targetId) {
                const { data: me } = await supabase.from('profiles').select('name').eq('id', req.userId).single();
                await supabase.from('notifications').insert({
                    user_id: targetId,
                    type: 'like',
                    message: `Someone liked your profile! (It was ${me?.name || 'an Elf'})`,
                });
            }

            res.json({ liked: true });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Social: Classmates & Notifications ---

app.get('/api/users/classmates', verifyToken, async (req, res) => {
    try {
        const { data: me } = await supabase.from('profiles').select('roll_number').eq('id', req.userId).single();
        if (!me?.roll_number) return res.json([]);

        const myRoll = me.roll_number.toString();
        if (myRoll.length < 6) return res.json([]);

        const classPrefix = myRoll.substring(0, 6);
        const myLastThree = parseInt(myRoll.substring(myRoll.length - 3));
        if (isNaN(myLastThree)) return res.json([]);

        const mySection = (myLastThree % 2 === 0) ? 'B' : 'A';

        const { data: users } = await supabase.from('profiles')
            .select('id, name, roll_number, favorite_emoji, bio')
            .ilike('roll_number', `${classPrefix}%`)
            .neq('id', req.userId)
            .limit(200);

        if (!users) return res.json([]);

        const classmates = users.filter(u => {
            const r = u.roll_number?.toString() || '';
            if (r.length < 9) return false;
            const lastThree = parseInt(r.substring(r.length - 3));
            if (isNaN(lastThree)) return false;
            const section = (lastThree % 2 === 0) ? 'B' : 'A';
            return section === mySection;
        });

        res.json(classmates);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/notifications', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase.from('notifications')
            .select('*')
            .eq('user_id', req.userId)
            .eq('is_read', false)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/notifications/mark_read', verifyToken, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || ids.length === 0) return res.json({ success: true });

        const { error } = await supabase.from('notifications')
            .update({ is_read: true })
            .in('id', ids)
            .eq('user_id', req.userId);

        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Chat
app.get('/api/chat', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('global_chat')
            .select('*, profiles(*)')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        res.json(data ? data.reverse() : []);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Chat POST (Existing)
app.post('/api/chat', verifyToken, async (req, res) => {
    try {
        const { message, id } = req.body;
        const { error } = await supabase.from('global_chat').insert({
            user_id: req.userId,
            message: message,
            id: id || undefined
        });
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/chat/:id', verifyAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from('global_chat').delete().eq('id', req.params.id);
        if (error) throw error;
        // Optionally log action
        await logAdminAction(req.admin?.username, 'DELETE_CHAT', `Deleted message ${req.params.id}`);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Generic Game Score Submission
app.post('/api/user/games/score', verifyToken, async (req, res) => {
    try {
        const { game_id, score } = req.body;
        if (!score || score <= 0) return res.json({ success: true, message: "No points valid" });

        // Cap points for safety (e.g. max 100 per run to prevent abuse)
        const safeScore = Math.min(score, 100);

        // Award points
        const { error } = await supabase.rpc('award_points', {
            p_points: safeScore,
            p_description: `Played ${game_id}: Scored ${score}`
        });
        if (error) throw error;

        // Log/Record high score if needed (optional)
        // await supabase.from('game_scores').insert({ user_id: req.userId, game: game_id, score });

        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Game Endpoints ---
app.post('/api/game/daily_checkin', verifyToken, async (req, res) => {
    try {
        const { checkin_date } = req.body;
        // Check existing
        const { data: existing } = await supabase.from('daily_checkins').select('id').eq('user_id', req.userId).eq('checkin_date', checkin_date).single();
        if (existing) return res.json({ success: true, message: 'Already checked in' });

        const { error } = await supabase.from('daily_checkins').insert({ user_id: req.userId, checkin_date });
        if (error) throw error;

        // Award points RPC? Or handle here. Assuming trigger handles it or we do it manual.
        // Let's stick to just insert for now.
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/game/memory/score', verifyToken, async (req, res) => {
    try {
        const { score } = req.body; // Score might be time taken?
        // Logic: Insert into memory_game_scores
        const { error } = await supabase.from('memory_game_scores').insert({ user_id: req.userId, score });
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/game/tictactoe/active', verifyToken, async (req, res) => {
    try {
        const partnerId = req.query.partnerId;
        if (!partnerId) return res.status(400).json({ error: "Missing partnerId" });

        if (mongoConnected) {
            const game = await TicTacToeModel.findOne({
                players: { $all: [req.userId, partnerId] },
                winner: null // Active game
            });
            if (game) {
                return res.json({
                    id: game._id.toString(), // Map _id to id
                    player_x: game.players[0],
                    player_o: game.players[1],
                    board: game.board,
                    turn: game.turn,
                    status: 'active'
                });
            } else {
                return res.json(null);
            }
        }

        // Supabase Fallback
        const { data, error } = await supabase.from('tictactoe_games')
            .select('*')
            .or(`and(player_x.eq.${req.userId},player_o.eq.${partnerId}),and(player_x.eq.${partnerId},player_o.eq.${req.userId})`)
            .eq('status', 'active')
            .maybeSingle();

        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/game/tictactoe/create', verifyToken, async (req, res) => {
    try {
        const { partnerId } = req.body;

        if (mongoConnected) {
            // Check active
            const active = await TicTacToeModel.findOne({
                players: { $all: [req.userId, partnerId] },
                winner: null
            });
            if (active) return res.json({ id: active._id.toString(), status: 'active' }); // Minimal active response

            // Create
            const newGame = await TicTacToeModel.create({
                roomId: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                players: [req.userId, partnerId], // Creator is [0] (X)
                board: Array(9).fill(null),
                turn: req.userId,
                winner: null
            });

            return res.json({
                id: newGame._id.toString(),
                player_x: newGame.players[0],
                player_o: newGame.players[1],
                board: newGame.board,
                turn: newGame.turn,
                status: 'active'
            });
        }

        // Supabase Fallback
        const { data: active } = await supabase.from('tictactoe_games')
            .select('id')
            .or(`and(player_x.eq.${req.userId},player_o.eq.${partnerId}),and(player_x.eq.${partnerId},player_o.eq.${req.userId})`)
            .eq('status', 'active')
            .maybeSingle();

        if (active) return res.json(active);

        // Create
        const { data, error } = await supabase.from('tictactoe_games').insert({
            player_x: req.userId, // Creator is X? Or random? Let's say Creator is X
            player_o: partnerId,
            turn: req.userId,
            board: Array(9).fill(null),
            status: 'active'
        }).select().single();

        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/game/tictactoe/move', verifyToken, async (req, res) => {
    try {
        const { gameId, index, board } = req.body;

        if (mongoConnected) {
            // Only try MongoDB if ID looks like an ObjectId (24 hex chars)
            // or just try-catch the findById
            if (mongoose.Types.ObjectId.isValid(gameId)) {
                const game = await TicTacToeModel.findById(gameId);
                if (game) {
                    if (game.turn !== req.userId) return res.status(403).json({ error: "Not your turn" });
                    if (game.board[index] !== null) return res.status(400).json({ error: "Cell occupied" });

                    // Logic
                    const nextTurn = game.players[0] === req.userId ? game.players[1] : game.players[0];
                    const symbol = game.players[0] === req.userId ? 'X' : 'O';

                    const newBoard = [...game.board];
                    newBoard[index] = symbol;

                    // Update
                    game.board = newBoard;
                    game.turn = nextTurn;
                    await game.save();

                    return res.json({ success: true });
                }
            }
            // If not found in Mongo or invalid ID, Fallthrough to Supabase!
        }

        // Supabase Fallback
        const { data: game } = await supabase.from('tictactoe_games').select('*').eq('id', gameId).single();
        if (!game) return res.status(404).json({ error: "Game not found" });
        if (game.turn !== req.userId) return res.status(403).json({ error: "Not your turn" });
        if (game.board[index] !== null) return res.status(400).json({ error: "Cell occupied" });

        // Calculate next state (simple toggle)
        const nextTurn = game.player_x === req.userId ? game.player_o : game.player_x;
        const symbol = game.player_x === req.userId ? 'X' : 'O';

        const newBoard = [...game.board];
        newBoard[index] = symbol;

        // Use RPC or Update
        const { error } = await supabase.from('tictactoe_games').update({
            board: newBoard,
            turn: nextTurn,
            // status? We need win check logic here really.
            // For now, let's allow client to send "winner"? VERY INSECURE.
            // Let's stick to state update.
        }).eq('id', gameId);

        if (error) throw error;
        res.json({ success: true });

    } catch (e) { res.status(500).json({ error: e.message }); }
});


// --- Game: Memory ---
app.post('/api/game/memory/complete', verifyToken, async (req, res) => {
    try {
        const { moves } = req.body;
        // 1. Award Points
        const { error: pErr } = await supabase.rpc('award_points', { p_points: 10, p_description: 'Won Memory Match' });
        if (pErr) console.error(pErr);

        // 2. Mark Completed
        await supabase.rpc('mark_game_completed', { p_game_id: 'memory' });

        // 3. Submit Score
        await supabase.rpc('submit_memory_game', { p_user_id: req.userId, p_moves: moves, p_time: 0 });

        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Game: Daily ---
app.get('/api/game/daily/status', verifyToken, async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('daily_checkins').select('id').eq('user_id', req.userId).eq('checkin_date', today).maybeSingle();
    res.json({ checkedIn: !!data });
});

app.post('/api/game/daily/reaction', verifyToken, async (req, res) => {
    try {
        const { emoji } = req.body;
        await supabase.from('game_reactions').insert({ user_id: req.userId, emoji });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Game: Kollywood ---
app.get('/api/game/kollywood/words', verifyToken, async (req, res) => {
    try {
        const { category } = req.query;
        if (!category) throw new Error("Category required");

        const { data, error } = await supabase.rpc('assign_daily_words', {
            target_user_id: req.userId,
            target_category: category
        });
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/game/kollywood/solve', verifyToken, async (req, res) => {
    try {
        const { word_id, guess } = req.body;
        const { data: isCorrect, error } = await supabase.rpc('solve_word', {
            target_user_id: req.userId,
            target_word_id: word_id,
            guess: guess
        });
        if (error) throw error;
        res.json({ isCorrect });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/game/kollywood/reset', verifyToken, async (req, res) => {
    try {
        const { error } = await supabase.rpc('reset_daily_kollywood', { target_user_id: req.userId });
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Game: Santa RPS ---
app.post('/api/game/rps/complete', verifyToken, async (req, res) => {
    try {
        const { win } = req.body;
        if (win) {
            await supabase.rpc('award_points', { p_points: 5, p_description: 'Valid Win vs Grinch' });
        }
        await supabase.rpc('mark_game_completed', { p_game_id: 'santarps' });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Bonus Task ---
app.get('/api/user/bonus_task', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase.rpc('get_bonus_task_v2', { p_user_id: req.userId });
        if (error) throw error;
        res.json(data && data.length > 0 ? data[0] : null);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/user/bonus_task/:id/questions', verifyToken, async (req, res) => {
    try {
        const { data } = await supabase.from('task_questions').select('*').eq('task_id', req.params.id).order('question_order');
        res.json(data || []);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/user/bonus_task/submit', verifyToken, async (req, res) => {
    try {
        const { task_id, answers } = req.body;
        const { data, error } = await supabase.rpc('submit_bonus_task', {
            p_user_id: req.userId,
            p_task_id: task_id,
            p_answers: answers
        });
        if (error) throw error;
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/user/pairings', verifyToken, async (req, res) => {
    try {
        const { data: pairings } = await supabase.from('pairings').select('*').or(`user_id.eq.${req.userId},secret_santa_id.eq.${req.userId}`);

        let secretSanta = null;
        let myGiftee = null;

        // I am the user_id -> secret_santa_id is my Santa? NO.
        // Pairing table: user_id (the person receiving), secret_santa_id (the person giving).
        // If user_id == me, then secret_santa_id is MY SANTA.
        // If secret_santa_id == me, then user_id is MY GIFTEE.

        const santaPairing = pairings?.find(p => p.user_id === req.userId);
        if (santaPairing) {
            const { data: santa } = await supabase.from('profiles').select('*').eq('id', santaPairing.secret_santa_id).single();
            secretSanta = santa;
        }

        const gifteePairing = pairings?.find(p => p.secret_santa_id === req.userId);
        if (gifteePairing) {
            const { data: giftee } = await supabase.from('profiles').select('*').eq('id', gifteePairing.user_id).single();
            myGiftee = giftee;
        }

        res.json({ secretSanta, myGiftee });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Admin: Users ---
app.delete('/api/admin/users/:id', verifyAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from('profiles').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/users/:id/toggle_admin', verifyAdmin, async (req, res) => {
    try {
        const { is_admin } = req.body; // Expect boolean
        const { error } = await supabase.from('profiles').update({ is_admin }).eq('id', req.params.id);
        if (error) throw error;
        await logAdminAction(req.admin?.username, 'TOGGLE_ADMIN', `User ${req.params.id} admin status: ${is_admin}`);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/users/:id/toggle_bypass', verifyAdmin, async (req, res) => {
    try {
        const { bypass } = req.body;
        const { error } = await supabase.from('profiles').update({ bypass_maintenance: bypass }).eq('id', req.params.id);
        if (error) throw error;
        await logAdminAction(req.admin?.username, 'TOGGLE_BYPASS', `User ${req.params.id} bypass: ${bypass}`);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Heartbeat
app.post('/api/user/heartbeat', verifyToken, async (req, res) => {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ last_seen: new Date().toISOString() })
            .eq('id', req.userId);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// User Logging (for Login/Actions)
app.post('/api/user/log', verifyToken, async (req, res) => {
    try {
        const { action, details } = req.body;
        // Fetch user name for denormalized logging if simpler
        const { data: profile } = await supabase.from('profiles').select('name').eq('id', req.userId).single();

        await supabase.from('activity_logs').insert({
            user_id: req.userId,
            user_name: profile?.name || 'Unknown',
            action,
            details: typeof details === 'string' ? details : JSON.stringify(details),
            admin_username: null // It's a user action
        });
        res.json({ success: true });
    } catch (e) {
        console.error("User Log Failed", e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/users/:id/toggle_ban', verifyAdmin, async (req, res) => {
    try {
        const { is_banned, ban_reason } = req.body;
        const { error } = await supabase
            .from('profiles')
            .update({
                is_banned,
                ban_reason: is_banned ? (ban_reason || 'Violation of rules') : null
            })
            .eq('id', req.params.id);

        if (error) throw error;
        await logAdminAction(req.admin?.username, 'BAN_USER', `Banned User ${req.params.id}. Reason: ${ban_reason || 'None'}`);
        res.json({ success: true });


    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- Admin: Pairings ---
app.post('/api/admin/pairings/manual', verifyAdmin, async (req, res) => {
    try {
        const { user_id, secret_santa_id } = req.body;
        // Check existing
        const { data: existing } = await supabase.from('pairings').select('id').eq('user_id', user_id).single();
        if (existing) {
            await supabase.from('pairings').delete().eq('id', existing.id);
        }
        const { error } = await supabase.from('pairings').insert({ user_id, secret_santa_id });
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/pairings/:id', verifyAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from('pairings').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/pairings', verifyAdmin, async (req, res) => {
    // Reset ALL pairings
    try {
        const { error } = await supabase.from('pairings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});


// --- Admin: Tasks ---
app.post('/api/admin/tasks', verifyAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from('tasks').insert(req.body);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/tasks/:id', verifyAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from('tasks').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Admin: Bonus Tasks ---
app.post('/api/admin/bonus_tasks', verifyAdmin, async (req, res) => {
    try {
        // req.body likely has title, description, points, is_active
        const { error } = await supabase.from('bonus_tasks').insert(req.body);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/bonus_tasks/:id', verifyAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from('bonus_tasks').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/bonus_tasks/:id/toggle', verifyAdmin, async (req, res) => {
    try {
        const { is_active } = req.body;
        const { error } = await supabase.from('bonus_tasks').update({ is_active }).eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});


// --- AI Proxy ---
app.post('/api/ai/chat', verifyToken, async (req, res) => {
    try {
        console.log("AI Chat Request Received");
        const { message } = req.body;
        const apiKey = process.env.GROQ_API_KEY;

        console.log("API Key present:", !!apiKey); // Debug log
        if (apiKey) console.log("API Key length:", apiKey.length); // Debug log

        if (!apiKey) {
            console.error("Missing GROQ_API_KEY in environment variables");
            return res.json({ text: "Ho Ho Ho! My AI brain is missing its key! 🎅 (Server Config Error)" });
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: `You are Santa AI, a magical assistant for the Secret Santa 2025 event at NIT Trichy! 🎅
                        Your goal is to guide students joyfully.
                        
                        Context:
                        - This event is for NIT Trichy students.
                        - You can explain rules, point to "Tasks", "Games", or "Leaderboard".
                        - If asked "Who made you?", answer "Harish Annavisamy! He coded my Christmas Spirit. 👨‍💻"
                        
                        Interactivity:
                        If the user asks about "Tasks", "Leaderboard", "Profile", "Games", or "Chat", you MUST append a JSON object to the end of your response: {"highlight": "element-id"}.
                        IDs: "tasks-tab-btn", "leaderboard-btn", "profile-btn", "global-chat-btn".

                        Keep responses short, fun, and use emojis!`
                    },
                    { role: "user", content: message }
                ],
                model: "llama-3.1-8b-instant",
                temperature: 0.7,
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Groq API Error:", errText);
            throw new Error(`Groq API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const fullContent = data.choices[0]?.message?.content || "Ho Ho Ho! The North Pole signals are weak!";

        let text = fullContent;
        let highlight = undefined;

        // Extract highlight JSON
        const match = fullContent.match(/\{"highlight":\s*"([^"]+)"\}/);
        if (match) {
            highlight = match[1];
            text = fullContent.replace(match[0], '').trim();
        }

        res.json({ text, highlight });

    } catch (e) {
        console.error("AI Error:", e);
        res.status(500).json({ error: "My reindeer ate the internet cable!" });
    }
});

// --- New Pairing Logic (Dept + Batch + Section) ---
app.get('/api/admin/pairing_analysis', verifyAdmin, async (req, res) => {
    try {
        const { data: users, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        const buckets = {};
        users.forEach(u => {
            if (!u.roll_number) return;
            const roll = u.roll_number.toString();
            if (roll.length < 6) return;
            const deptBatch = roll.substring(0, 6);
            const lastDigit = parseInt(roll.slice(-1));
            const section = (lastDigit % 2 === 0) ? 'B' : 'A';
            const key = `${deptBatch}-${section}`;
            if (!buckets[key]) buckets[key] = [];
            buckets[key].push(u.id);
        });

        const analysis = {
            totalStudents: users.length,
            buckets: {}
        };
        for (const [k, v] of Object.entries(buckets)) {
            analysis.buckets[k] = { count: v.length };
        }
        res.json(analysis);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/create_pairings_nit', verifyAdmin, async (req, res) => {
    try {
        // 1. Fetch ALL profiles
        const { data: users, error } = await supabase.from('profiles').select('*');
        if (error) throw error;

        if (!users || users.length < 2) {
            return res.status(400).json({ error: "Not enough users to pair!" });
        }

        // 2. Group Users by Class (Dept + Batch + Section)
        const buckets = {};

        users.forEach(u => {
            if (!u.roll_number) return;
            const roll = u.roll_number.toString();
            if (roll.length < 6) return;

            // Logic: First 6 digits = Dept + Batch (e.g. 107124)
            const deptBatch = roll.substring(0, 6);

            // Section: Last digits. Odd = A, Even = B
            // "107124039" -> Ends in 9 (Odd) -> A
            // "107124040" -> Ends in 0 (Even) -> B
            const lastDigit = parseInt(roll.slice(-1));
            const section = (lastDigit % 2 === 0) ? 'B' : 'A';

            const key = `${deptBatch}-${section}`;

            if (!buckets[key]) buckets[key] = [];
            buckets[key].push(u.id);
        });

        // 3. Generate Pairings
        const pairings = [];
        const logs = [];

        for (const [key, ids] of Object.entries(buckets)) {
            if (ids.length < 2) {
                logs.push(`⚠️ Class ${key} has only ${ids.length} student. Cannot pair.`);
                continue;
            }

            // Shuffle
            const shuffled = ids.sort(() => Math.random() - 0.5);

            // Chain: 0->1, 1->2 ... N->0
            for (let i = 0; i < shuffled.length; i++) {
                const santa = shuffled[i];
                const giftee = shuffled[(i + 1) % shuffled.length];
                pairings.push({ user_id: giftee, secret_santa_id: santa });
            }
            logs.push(`✅ Class ${key}: Paired ${ids.length} students.`);
        }

        // 4. Save to DB (Transaction-like)
        // Clear old pairings first
        await supabase.from('pairings').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        if (pairings.length > 0) {
            const { error: insertError } = await supabase.from('pairings').insert(pairings);
            if (insertError) throw insertError;
        }

        await logAdminAction(req.admin?.username, 'GENERATE_PAIRINGS', `Generated ${pairings.length} pairings.`);
        res.json({ success: true, logs, total_pairings: pairings.length });

    } catch (e) {
        console.error("Pairing Error:", e);
        res.status(500).json({ error: e.message });
    }
});


// DAuth Proxy Routes (Important for Login)
app.post('/api/dauth/oauth/token', async (req, res) => {
    const { code, redirect_uri, client_id, grant_type } = req.body;
    const clientSecret = process.env.VITE_DAUTH_CLIENT_SECRET || process.env.DAUTH_CLIENT_SECRET;

    if (!clientSecret) {
        return res.status(500).json({ error: 'Server misconfigured: missing secret' });
    }

    try {
        const tokenResponse = await fetch('https://auth.delta.nitt.edu/api/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id,
                client_secret: clientSecret,
                grant_type: grant_type || 'authorization_code',
                code,
                redirect_uri
            })
        });

        const data = await tokenResponse.json();
        res.status(tokenResponse.status).json(data);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/dauth/resources/user', async (req, res) => {
    const authHeader = req.headers['authorization'];
    try {
        const userResponse = await fetch('https://auth.delta.nitt.edu/api/resources/user', {
            method: 'POST',
            headers: { 'Authorization': authHeader || '' }
        });
        const data = await userResponse.json();
        res.status(userResponse.status).json(data);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});


// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    // Return detailed error for debugging (remove in high-security prod)
    res.status(500).json({ error: err.message, stack: err.stack });
});

// --- Game: Jumbled Words (India/TN/Santa) ---
const JUMBLED_WORDS = [
    { id: '1', word: 'INDIA', hint: 'Country' },
    { id: '2', word: 'TAMILNADU', hint: 'State' },
    { id: '3', word: 'SANTA', hint: 'Person' },
    { id: '4', word: 'CHRISTMAS', hint: 'Festival' },
    { id: '5', word: 'SNOW', hint: 'Weather' },
    { id: '6', word: 'GIFT', hint: 'Item' },
    { id: '7', word: 'REINDEER', hint: 'Animal' },
    { id: '8', word: 'CHENNAI', hint: 'City' },
    { id: '9', word: 'KOLAM', hint: 'Tradition' },
    { id: '10', word: 'AUTO', hint: 'Vehicle' }
];

app.get('/api/game/jumbled_words', verifyToken, async (req, res) => {
    try {
        const { data: progress } = await supabase.from('jumbled_words_progress').select('completed_words').eq('user_id', req.userId).single();
        const completedIds = progress?.completed_words || [];

        const words = JUMBLED_WORDS.map(w => ({
            id: w.id,
            jumbled: w.word.split('').sort(() => Math.random() - 0.5).join(''),
            hint: w.hint,
            length: w.word.length,
            isCompleted: completedIds.includes(w.id)
        }));
        res.json(words);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/game/jumbled_words/solve', verifyToken, async (req, res) => {
    try {
        const { wordId, answer } = req.body;
        const target = JUMBLED_WORDS.find(w => w.id === wordId);
        if (!target) return res.status(404).json({ error: 'Word not found' });

        if (target.word.toUpperCase() !== answer.toUpperCase()) {
            return res.status(400).json({ error: 'Incorrect answer', correct: false });
        }

        // Correct!
        const { data: existing } = await supabase.from('jumbled_words_progress').select('completed_words').eq('user_id', req.userId).single();
        let completed = existing?.completed_words || [];
        if (!completed.includes(wordId)) {
            completed.push(wordId);
            await supabase.from('jumbled_words_progress').upsert({ user_id: req.userId, completed_words: completed }, { onConflict: 'user_id' });

            // Award Points (Example: 5 pts)
            await supabase.rpc('increment_points', { p_user_id: req.userId, p_points: 5 });
        }

        res.json({ success: true, points: 5 });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Polls ---
app.get('/api/polls', verifyToken, async (req, res) => {
    try {
        // 1. Fetch Active Polls
        const { data: polls, error: pollError } = await supabase
            .from('polls')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (pollError) throw pollError;
        if (!polls || polls.length === 0) return res.json([]);

        // 2. Fetch Options for these Polls
        const pollIds = polls.map(p => p.id);
        const { data: options, error: optError } = await supabase
            .from('poll_options')
            .select('*')
            .in('poll_id', pollIds);

        if (optError) throw optError;

        // 3. User Votes
        const { data: votes } = await supabase
            .from('poll_votes')
            .select('poll_id, option_index')
            .eq('user_id', req.userId);

        const votedPolls = votes?.reduce((acc, v) => ({ ...acc, [v.poll_id]: v.option_index }), {}) || {};

        // 4. Merge
        const result = polls.map(p => ({
            ...p,
            poll_options: options?.filter(o => o.poll_id === p.id) || [],
            user_voted_index: votedPolls[p.id]
        }));

        res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/polls/:id/vote', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { option_index } = req.body;
        const { data: existing } = await supabase.from('poll_votes').select('*').eq('poll_id', id).eq('user_id', req.userId).single();
        if (existing) return res.status(400).json({ error: 'Already voted' });

        await supabase.from('poll_votes').insert({ poll_id: id, user_id: req.userId, option_index });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Bad Description Game ---
const BAD_DESCRIPTION_QUESTIONS = [
    {
        id: '1',
        question: "Group of short guys return jewelry.",
        answer: "Lord of the Rings",
        options: ["The Hobbit", "Lord of the Rings", "Dungeons & Dragons", "Willow"],
        scores: 1,
        hint: "My Precious..."
    },
    {
        id: '2',
        question: "Billionaire spends fortune beating up mentally ill man.",
        answer: "Batman",
        options: ["Iron Man", "Batman", "The Green Hornet", "Daredevil"],
        scores: 1,
        hint: "He is rich and has bat ears."
    },
    {
        id: '3',
        question: "Fish touches boat.",
        answer: "Finding Nemo",
        options: ["Shark Tale", "Finding Nemo", "The Little Mermaid", "Free Willy"],
        scores: 2,
        hint: "P. Sherman, 42 Wallaby Way."
    },
    {
        id: '4',
        question: "Noseless guy has unhealthy obsession with teenage boy.",
        answer: "Harry Potter",
        options: ["Voldemort: Origins", "Harry Potter", "Percy Jackson", "Stranger Things"],
        scores: 1,
        hint: "The Boy Who Lived."
    },
    {
        id: '5',
        question: "Girl wakes up with 7 guys looking at her.",
        answer: "Snow White",
        options: ["Cinderella", "Sleeping Beauty", "Snow White", "Beauty and the Beast"],
        scores: 2,
        hint: "Apples can be dangerous."
    },
    {
        id: '6',
        question: "Doctor brings 3 people to island to watch them die.",
        answer: "Jurassic Park",
        options: ["Lost", "Jurassic Park", "King Kong", "Journey 2"],
        scores: 2,
        hint: "Dinosaurs!"
    },
    {
        id: '7',
        question: "Paraplegic marine betrays own race for smurfs.",
        answer: "Avatar",
        options: ["Starship Troopers", "Avatar", "Ender's Game", "Guardians of the Galaxy"],
        scores: 3,
        hint: "Blue people."
    },
    {
        id: '8',
        question: "Older sister ruins younger sister's chance to be on TV.",
        answer: "Hunger Games",
        options: ["Divergent", "Hunger Games", "Maze Runner", "Battle Royale"],
        scores: 2,
        hint: "I volunteer as tribute!"
    },
    {
        id: '9',
        question: "Dad has to pick up his daughter from work.",
        answer: "Taken",
        options: ["Die Hard", "Taken", "John Wick", "Commando"],
        scores: 3,
        hint: "I will find you..."
    },
    {
        id: '10',
        question: "Talking frog convinces son to kill dad.",
        answer: "Star Wars",
        options: ["The Muppets", "Star Wars", "Shrek", "Labyrinth"],
        scores: 1,
        hint: "Use the Force."
    }
];

app.get('/api/game/bad_description', verifyToken, async (req, res) => {
    const userId = req.userId;
    // Get user progress
    const { data: progress } = await supabase.from('bad_description_progress').select('*').eq('user_id', userId).single();
    const completedIds = progress?.completed_ids || [];

    // Return questions with 'solved' status
    const result = BAD_DESCRIPTION_QUESTIONS.map(q => ({
        ...q,
        answer: undefined, // Hide answer
        solved: completedIds.includes(q.id)
    }));

    return res.json(result);
});

app.post('/api/game/bad_description/solve', verifyToken, async (req, res) => {
    try {
        const { questionId, answer } = req.body;
        const target = BAD_DESCRIPTION_QUESTIONS.find(q => q.id === questionId);
        if (!target) return res.status(404).json({ error: 'Question not found' });

        if (target.answer.toUpperCase() !== answer.toUpperCase()) {
            return res.status(400).json({ error: 'Wrong guess!', correct: false });
        }

        const { data: existing } = await supabase.from('bad_description_progress').select('completed_ids').eq('user_id', req.userId).single();
        let completed = existing?.completed_ids || [];
        if (!completed.includes(questionId)) {
            completed.push(questionId);
            await supabase.from('bad_description_progress').upsert({ user_id: req.userId, completed_ids: completed }, { onConflict: 'user_id' });
            await supabase.rpc('increment_points', { p_user_id: req.userId, p_points: 10 });
        }
        res.json({ success: true, points: 10 });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Game: Crossword (Simple Mock for now) ---
// Since full crossword logic is complex, returning a simple placeholder or static structure
const CROSSWORD_DATA = {
    grid: [
        ['S', 'A', 'N', 'T', 'A'],
        ['H', '#', '#', '#', 'R'],
        ['O', '#', 'G', 'I', 'F', 'T'],
        ['E', '#', '#', '#', '#'],
    ],
    clues: [
        { id: '1', num: 1, dir: 'across', hint: 'Ho Ho Ho Man', answer: 'SANTA', row: 0, col: 0 },
        { id: '2', num: 1, dir: 'down', hint: 'Footwear', answer: 'SHOE', row: 0, col: 0 },
        { id: '3', num: 2, dir: 'across', hint: 'Present', answer: 'GIFT', row: 2, col: 2 },
    ]
};

app.get('/api/game/crossword', verifyToken, async (req, res) => {
    try {
        const { data: progress } = await supabase.from('crossword_progress').select('completed_words').eq('user_id', req.userId).single();
        const solved = progress?.completed_words || [];

        res.json({ ...CROSSWORD_DATA, solved });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/game/crossword/solve', verifyToken, async (req, res) => {
    try {
        const { clueId, answer } = req.body;
        const target = CROSSWORD_DATA.clues.find(c => c.id === clueId);
        if (!target) return res.status(404).json({ error: 'Clue not found' });

        if (target.answer.toUpperCase() !== answer.toUpperCase()) {
            return res.status(400).json({ error: 'Wrong!', correct: false });
        }

        const { data: existing } = await supabase.from('crossword_progress').select('completed_words').eq('user_id', req.userId).single();
        let solved = existing?.completed_words || [];

        if (!solved.includes(clueId)) {
            solved.push(clueId);
            await supabase.from('crossword_progress').upsert({ user_id: req.userId, completed_words: solved }, { onConflict: 'user_id' });
            await supabase.rpc('increment_points', { p_user_id: req.userId, p_points: 5 });
        }
        res.json({ success: true, points: 5 });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Admin Resets ---
app.post('/api/admin/reset_jumbled_words', verifyAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from('jumbled_words_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/admin/reset_bad_description', verifyAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from('bad_description_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/admin/reset_crossword', verifyAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from('crossword_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});


// --- Static Files (Frontend) ---
// Serve the 'dist' directory built by Vite
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'dist')));

// SPA Fallback: For any route not handled by API, serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => console.log(`🔒 Secure Server running on port ${port}`));
