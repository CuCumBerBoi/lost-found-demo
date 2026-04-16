import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/admin/stats
// ดึงสถิติทั้งหมดสำหรับ Dashboard โดยใช้ Service Role (bypass RLS)
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Fetch everything in parallel
    const [
      { count: totalLost },
      { count: totalFound },
      { data: foundItems = [] },
      { data: lostItems = [] },
      { data: categories = [] },
      { data: claims = [] },
    ] = await Promise.all([
      supabase.from('lost_items').select('*', { count: 'exact', head: true }),
      supabase.from('found_items').select('*', { count: 'exact', head: true }),
      supabase.from('found_items').select('found_id, title, category_id, ai_metadata'),
      supabase.from('lost_items').select('lost_id, title, category_id, ai_metadata'),
      supabase.from('categories').select('category_id, name'),
      supabase.from('claims').select('claim_id, status, created_at'),
    ]);

    return NextResponse.json({
      totalLost: totalLost || 0,
      totalFound: totalFound || 0,
      foundItems: foundItems || [],
      lostItems: lostItems || [],
      categories: categories || [],
      claims: claims || [],
    });
  } catch (err) {
    console.error('[API /admin/stats] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
