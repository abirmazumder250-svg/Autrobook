import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://gemyqaniztqrsilayblx.supabase.co'
const supabaseKey = 'sb_publishable_FuH8FWiYVK5CnylcjLDIKQ_exLB_Du_'

export const supabase = createClient(supabaseUrl, supabaseKey)
