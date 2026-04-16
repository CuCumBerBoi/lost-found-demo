import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/admin/claims/pin?pin=123456
// ค้นหา claim ด้วย PIN code โดยใช้ Service Role (bypass RLS)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pin = searchParams.get('pin');

    if (!pin || pin.length !== 6) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // ค้นหาด้วย pin_code (ชื่อ column จริง) และ status ที่ยังรอการรับของ (APPROVED)
    const { data, error } = await supabase
      .from('claims')
      .select(`
        claim_id,
        found_id,
        claimer_id,
        status,
        pin_code,
        admin_note,
        users:claimer_id(full_name, email, phone_number),
        found_items(title, image_url, location_text, building, floor, room)
      `)
      .eq('pin_code', pin)
      .in('status', ['APPROVED', 'READY_FOR_PICKUP']) // รองรับทั้ง 2 status
      .maybeSingle();

    if (error) {
      console.error('[API /admin/claims/pin] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'PIN not found or already used', data: null }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[API /admin/claims/pin] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
