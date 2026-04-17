import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Route Handler นี้ทำงาน server-side จึงใช้ Service Role Key ได้
// ทำให้ bypass RLS และอ่าน claims ทั้งหมดได้
export async function GET() {
  try {
    // ใช้ Service Role Key ถ้ามี ถ้าไม่มีใช้ anon key (จะถูก RLS กรองแล้วกัน)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data, error } = await supabase
      .from('claims')
      .select(`
        claim_id,
        found_id,
        claimer_id,
        proof_desc,
        proof_images,
        status,
        created_at,
        resolved_at,
        pin_code,
        pickup_datetime,
        admin_note,
        users:claimer_id(full_name, email, phone_number),
        found_items(title, location_text, building, floor, room, date_found)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API /admin/claims] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err) {
    console.error('[API /admin/claims] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const body = await request.json();
    const { claim_id, status, admin_note, pin_code, found_id } = body;

    if (!claim_id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // อัปเดต claim
    const updatePayload: Record<string, unknown> = { status, admin_note };
    if (pin_code) updatePayload.pin_code = pin_code;

    const { error: claimErr } = await supabase
      .from('claims')
      .update(updatePayload)
      .eq('claim_id', claim_id);

    if (claimErr) {
      return NextResponse.json({ error: claimErr.message }, { status: 500 });
    }

    // อัปเดต found_item status ตาม claim status
    if (found_id) {
      const foundItemStatus =
        status === 'APPROVED' ? 'CLAIMED' :
        status === 'COMPLETED' ? 'RETURNED' :
        status === 'REJECTED' ? 'AVAILABLE' : null;

      if (foundItemStatus) {
        await supabase
          .from('found_items')
          .update({ status: foundItemStatus })
          .eq('found_id', found_id);
      }
    }

    // แจ้งเตือนผู้ใช้ (ถ้ามีการส่ง claimer_id และ item_title มา)
    if (body.claimer_id && body.item_title) {
      let type: 'success' | 'alert' | 'system' = 'system';
      let title = '';
      let message = '';

      if (status === 'APPROVED') {
        type = 'success';
        title = 'คำขอได้รับการอนุมัติ 🎉';
        message = `คำขอรับ "${body.item_title}" ได้รับการอนุมัติ รหัส PIN ของคุณคือ ${pin_code || '---'}`;
      } else if (status === 'REJECTED') {
        type = 'alert';
        title = 'คำขอถูกปฏิเสธ ❌';
        message = `คำขอรับ "${body.item_title}" ไม่ผ่านการพิจารณา`;
      } else if (status === 'COMPLETED') {
        type = 'success';
        title = 'ส่งมอบสิ่งของสำเร็จ 📦';
        message = `คุณได้รับ "${body.item_title}" คืนเรียบร้อยแล้ว ขอบคุณที่ใช้บริการ!`;
      }

      if (title) {
        if (admin_note) message += ` (หมายเหตุ: ${admin_note})`;

        await supabase.from('notifications').insert({
          user_id: body.claimer_id,
          title,
          message,
          type,
          link: `/claim/${claim_id}`,
          is_read: false
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API /admin/claims] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
