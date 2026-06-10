import { createClient } from '@supabase/supabase-js'

// Browser-seitiger Supabase-Client (für Client Components + Auth)
// Singleton-Pattern damit nur eine Instanz pro Browser-Session existiert
let client: ReturnType<typeof createClient> | null = null

export function getSupabaseBrowser() {
  if (client) return client
  client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Session in localStorage persistieren
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  )
  return client
}
