import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://skjogvrkmcnddjksuktj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oHK1WfBIiT28yl8oKWH7-g_Fi40lcn0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
