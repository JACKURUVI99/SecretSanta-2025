import { createClient } from '@supabase/supabase-js';

// Fallback to avoid crash if env vars are missing (e.g. during migration)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export type Profile = {
  id: string;
  name: string;
  roll_number: string;
  bio: string;
  avatar_url: string | null;
  favorite_emoji: string;
  points: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  is_banned?: boolean;
  ban_reason?: string;
  last_seen?: string;
  instagram_id?: string;
  bypass_maintenance?: boolean;
};
export type Pairing = {
  id: string;
  user_id: string;
  secret_santa_id: string;
  created_at: string;
};
export type Task = {
  id: string;
  title: string;
  description: string;
  points: number;
  task_date: string;
  created_at: string;
  is_bonus?: boolean;
};
export type UserTask = {
  id: string;
  user_id: string;
  task_id: string;
  completed: boolean;
  completed_at: string | null;
};
// AppSettings was replaced below
export interface AppSettings {
  id: number;
  // Core Settings (Restored)
  gifting_day: string;
  registration_open: boolean;
  show_bonus_tasks: boolean;
  show_leaderboard: boolean;
  show_news: boolean;
  show_secret_santa: boolean;
  show_gifting_day: boolean;
  maintenance_mode: boolean;
  secret_santa_reveal: boolean;

  // Games
  show_games: boolean;
  show_tictactoe: boolean;
  show_memory_game: boolean;
  show_santa_run: boolean;
  show_flappy_santa: boolean;
  show_kollywood: boolean;
  show_mollywood?: boolean;
  show_tollywood?: boolean;
  show_bollywood?: boolean;
  show_hollywood?: boolean;
  show_jumbled_words: boolean;
  show_crossword: boolean;
  show_bad_description: boolean;
  show_bingo: boolean;

  // Rules
  game_rules_active: boolean;
}
export type BonusTask = {
  id: string;
  title: string;
  description: string;
  task_date: string;
  total_points: number;
  is_active: boolean;
  created_at: string;
};
export type TaskQuestion = {
  id: string;
  task_id: string;
  question_type: 'mcq' | 'fill_blank' | 'checkbox' | 'image_upload';
  question_text: string;
  question_image_url?: string;
  options?: unknown;
  correct_answer: unknown;
  points: number;
  question_order: number;
  is_case_sensitive?: boolean;
};
export type UserTaskSubmission = {
  id: string;
  user_id: string;
  task_id: string;
  score: number;
  max_score: number;
  submitted_at: string;
};
