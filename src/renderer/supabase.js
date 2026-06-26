import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://glscqjpcmtovqiieohsk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsc2NxanBjbXRvdnFpaWVvaHNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjQ5MjUyNSwiZXhwIjoyMDk4MDY4NTI1fQ._7ty8vS2OOLL8rOV1oTll5kek3ZuXkuQqK6ExJADCHw'
console.log("URL:", SUPABASE_URL)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)