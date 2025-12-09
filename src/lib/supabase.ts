import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
};

export type UserTask = {
  id: string;
  user_id: string;
  task_id: string;
  completed: boolean;
  completed_at: string | null;
};

export type AppSettings = {
  id: string;
  gifting_day: string;
  registration_open: boolean;
  updated_at: string;
};
