// src/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// Export instance แบบ Singleton ไว้ใช้ทั่วไป (optional แต่สะดวก)
export const supabase = createClient()