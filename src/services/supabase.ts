import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jifobnucmaybtjuibwda.supabase.co';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZm9ibnVjbWF5YnRqdWlid2RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzNTYxOTgsImV4cCI6MjEwNDkzMjE5OH0.mQK7RUhuVE4XrctF-1eS9ObCJT5UG26MjDKrCyGG_gM';

// Limpieza de comillas o espacios accidentales
const supabaseUrl = rawUrl.trim().replace(/^["']|["']$/g, '');
const supabaseAnonKey = rawKey.trim().replace(/^["']|["']$/g, '');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
