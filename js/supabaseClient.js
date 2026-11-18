import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gemyqaniztqrsilayblx.supabase.co'
const supabaseKey = 'sb_publishable_FuH8FWiYVK5CnylcjLDIKQ_exLB_Du_'

export const supabase = createClient(supabaseUrl, supabaseKey)
