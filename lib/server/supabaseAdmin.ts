import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !(serviceRole || anon)) {
  throw new Error("Missing Supabase environment variables for server client")
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRole || anon!, {
  auth: { persistSession: false },
})
