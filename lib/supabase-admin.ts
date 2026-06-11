import { createClient } from '@supabase/supabase-js'

// Service-Role-Client für serverseitige Admin-Operationen (User-Anlage etc.)
// NUR in API-Routes verwenden – nie im Browser!
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY nicht gesetzt')
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
