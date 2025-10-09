import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../config/supabase';

// Create Supabase client for Macroo Diet Tracker
const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

export default supabase;