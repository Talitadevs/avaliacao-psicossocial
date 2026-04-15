import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://notptumqwnhadaxxgvrc.supabase.co'
const supabaseKey = 'sb_publishable_s4sz4WYOpY4nkLTJGHK88Q_G_9_l6yS'

export const supabase = createClient(supabaseUrl, supabaseKey)