BEGIN;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "profiles_select_public"
ON public.profiles FOR SELECT
USING (true);
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_admin_all"
ON public.profiles FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
ALTER TABLE public.pairings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage pairings" ON public.pairings;
DROP POLICY IF EXISTS "Users view their target" ON public.pairings;
CREATE POLICY "pairings_select_own_target"
ON public.pairings FOR SELECT
USING (auth.uid() = user_id);
CREATE POLICY "pairings_admin_all"
ON public.pairings FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
ALTER TABLE public.bonus_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins full access bonus tasks" ON public.bonus_tasks;
DROP POLICY IF EXISTS "Users view active tasks" ON public.bonus_tasks;
CREATE POLICY "bonus_tasks_select_active"
ON public.bonus_tasks FOR SELECT
USING (is_active = TRUE AND task_date <= CURRENT_DATE);
CREATE POLICY "bonus_tasks_admin_all"
ON public.bonus_tasks FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
ALTER TABLE public.task_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins full access questions" ON public.task_questions;
DROP POLICY IF EXISTS "Users view questions of active tasks" ON public.task_questions;
CREATE POLICY "task_questions_select_active"
ON public.task_questions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.bonus_tasks 
        WHERE id = task_questions.task_id 
        AND is_active = TRUE 
        AND task_date <= CURRENT_DATE
    )
);
CREATE POLICY "task_questions_admin_all"
ON public.task_questions FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
ALTER TABLE public.user_task_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users insert own submissions" ON public.user_task_submissions;
DROP POLICY IF EXISTS "Users view own submissions" ON public.user_task_submissions;
DROP POLICY IF EXISTS "Admins view all submissions" ON public.user_task_submissions;
CREATE POLICY "submissions_insert_own"
ON public.user_task_submissions FOR INSERT
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "submissions_select_own"
ON public.user_task_submissions FOR SELECT
USING (auth.uid() = user_id);
CREATE POLICY "submissions_admin_select"
ON public.user_task_submissions FOR SELECT
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
ALTER TABLE public.global_chat ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read chat" ON public.global_chat;
DROP POLICY IF EXISTS "Users can send messages" ON public.global_chat;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.global_chat;
CREATE POLICY "chat_select_all"
ON public.global_chat FOR SELECT
USING (true);
CREATE POLICY "chat_insert_own"
ON public.global_chat FOR INSERT
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_delete_own"
ON public.global_chat FOR DELETE
USING (auth.uid() = user_id);
CREATE POLICY "chat_admin_delete"
ON public.global_chat FOR DELETE
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
ALTER TABLE public.tic_tac_toe_games ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Players view game" ON public.tic_tac_toe_games;
DROP POLICY IF EXISTS "Players make move" ON public.tic_tac_toe_games;
DROP POLICY IF EXISTS "tictactoe_select_participant" ON public.tic_tac_toe_games;
DROP POLICY IF EXISTS "tictactoe_insert_own" ON public.tic_tac_toe_games;
DROP POLICY IF EXISTS "tictactoe_update_participant" ON public.tic_tac_toe_games;
CREATE POLICY "tictactoe_select_participant"
ON public.tic_tac_toe_games FOR SELECT
USING (
    auth.uid() = kid_id OR 
    auth.uid() = santa_id
);
CREATE POLICY "tictactoe_update_participant"
ON public.tic_tac_toe_games FOR UPDATE
USING (auth.uid() = kid_id OR auth.uid() = santa_id)
WITH CHECK (auth.uid() = kid_id OR auth.uid() = santa_id);
ALTER TABLE public.tictactoe_games ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own games" ON public.tictactoe_games;
DROP POLICY IF EXISTS "Users can start games" ON public.tictactoe_games;
DROP POLICY IF EXISTS "Users can update their own games" ON public.tictactoe_games;
CREATE POLICY "tictactoe_select_own"
ON public.tictactoe_games FOR SELECT
USING (
    auth.uid() = player_x OR 
    auth.uid() = player_o
);
CREATE POLICY "tictactoe_insert_own"
ON public.tictactoe_games FOR INSERT
WITH CHECK (auth.uid() = player_x);
CREATE POLICY "tictactoe_update_own"
ON public.tictactoe_games FOR UPDATE
USING (auth.uid() = player_x OR auth.uid() = player_o)
WITH CHECK (auth.uid() = player_x OR auth.uid() = player_o);
ALTER TABLE public.memory_game_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view all scores" ON public.memory_game_scores;
DROP POLICY IF EXISTS "Users insert own scores" ON public.memory_game_scores;
CREATE POLICY "memory_scores_select_all"
ON public.memory_game_scores FOR SELECT
USING (true);
CREATE POLICY "memory_scores_insert_own"
ON public.memory_game_scores FOR INSERT
WITH CHECK (auth.uid() = user_id);
ALTER TABLE public.news_feed ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can read news" ON public.news_feed;
DROP POLICY IF EXISTS "Admins manage news" ON public.news_feed;
CREATE POLICY "news_select_all"
ON public.news_feed FOR SELECT
USING (true);
CREATE POLICY "news_admin_all"
ON public.news_feed FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own checkins" ON public.daily_checkins;
DROP POLICY IF EXISTS "Users insert own checkins" ON public.daily_checkins;
CREATE POLICY "checkins_select_own"
ON public.daily_checkins FOR SELECT
USING (auth.uid() = user_id);
CREATE POLICY "checkins_insert_own"
ON public.daily_checkins FOR INSERT
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "checkins_admin_select"
ON public.daily_checkins FOR SELECT
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
ALTER TABLE public.word_bank ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view words" ON public.word_bank;
DROP POLICY IF EXISTS "Admins manage words" ON public.word_bank;
CREATE POLICY "words_select_all"
ON public.word_bank FOR SELECT
USING (true);
CREATE POLICY "words_admin_all"
ON public.word_bank FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
ALTER TABLE public.user_word_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own progress" ON public.user_word_progress;
DROP POLICY IF EXISTS "Users manage own progress" ON public.user_word_progress;
CREATE POLICY "word_progress_select_own"
ON public.user_word_progress FOR SELECT
USING (auth.uid() = user_id);
CREATE POLICY "word_progress_insert_own"
ON public.user_word_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "word_progress_update_own"
ON public.user_word_progress FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "word_progress_admin_select"
ON public.user_word_progress FOR SELECT
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view settings" ON public.app_settings;
DROP POLICY IF EXISTS "Admins manage settings" ON public.app_settings;
CREATE POLICY "settings_select_all"
ON public.app_settings FOR SELECT
USING (true);
CREATE POLICY "settings_admin_all"
ON public.app_settings FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
ALTER TABLE public.coop_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View Coop" ON public.coop_actions;
DROP POLICY IF EXISTS "Everyone can view actions" ON public.coop_actions;
DROP POLICY IF EXISTS "Users can create actions" ON public.coop_actions;
DROP POLICY IF EXISTS "coop_select_all" ON public.coop_actions;
DROP POLICY IF EXISTS "coop_insert_own" ON public.coop_actions;
CREATE POLICY "coop_select_participant"
ON public.coop_actions FOR SELECT
USING (auth.uid() = kid_id OR auth.uid() = santa_id);
ALTER TABLE public.game_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view reactions" ON public.game_reactions;
DROP POLICY IF EXISTS "Users can create reactions" ON public.game_reactions;
CREATE POLICY "reactions_select_all"
ON public.game_reactions FOR SELECT
USING (true);
CREATE POLICY "reactions_insert_own"
ON public.game_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);
COMMIT;
NOTIFY pgrst, 'reload schema';
