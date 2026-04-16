"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import {
  ShieldCheck,
  X,
  XCircle,
  Filter,
  Search,
  CheckCircle2,
  PackageSearch,
  Image as ImageIcon,
  AlertTriangle
} from "lucide-react";

interface Claim {
  id: string;
  claim_id: string;
  status: string;
  created_at: string;
  proof_desc: string;
  proof_images: string[];
  found_id: string;
  claimer_id: string; // ✅ สำหรับใช้ส่งแจ้งเตือน
  admin_notes?: string;
  claimer: { full_name: string; email: string; phone: string };
  found_item: { title: string; location: string; date: string };
}

function ClaimReviewModal({
  selectedClaim,
  setSelectedClaim,
  handleAction,
}: {
  selectedClaim: Claim | null;
  setSelectedClaim: (claim: Claim | null) => void;
  handleAction: (action: "approve" | "reject", adminNotes: string) => void;
}) {
  const [adminNotes, setAdminNotes] = useState(selectedClaim?.admin_notes || "");

  if (!selectedClaim) return null;

  return (
    <div className='fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4'>
      <div className='bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 shadow-2xl'>
        <div className='bg-slate-50 border-b border-slate-100 p-5 sm:p-6 flex justify-between items-center'>
          <h2 className='text-lg sm:text-xl font-extrabold text-slate-900 flex items-center tracking-tight'>
            <div className="bg-indigo-100 p-2 rounded-xl mr-3 text-indigo-600">
              <ShieldCheck size={24} />
            </div>
            ตรวจสอบคำขอ #{selectedClaim.claim_id}
          </h2>
          <button aria-label="ปิด" title="ปิด"
            onClick={() => setSelectedClaim(null)}
            className='p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-full transition-colors'
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto p-5 sm:p-8 bg-[#FAFAFA] space-y-6'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm'>
            <div>
              <p className='text-[11px] font-bold text-slate-400 uppercase tracking-wider'>ชื่อผู้แจ้งขอรับคืน</p>
              <p className='text-base font-bold text-slate-900 mt-1'>{selectedClaim.claimer.full_name}</p>
            </div>
            <div>
              <p className='text-[11px] font-bold text-slate-400 uppercase tracking-wider'>วันที่ส่งคำขอ</p>
              <p className='text-sm mt-1 text-slate-700 font-medium'>{selectedClaim.created_at}</p>
            </div>
            <div>
              <p className='text-[11px] font-bold text-slate-400 uppercase tracking-wider'>อีเมล</p>
              <p className='text-sm mt-1 text-slate-700 font-medium'>{selectedClaim.claimer.email}</p>
            </div>
            <div>
              <p className='text-[11px] font-bold text-slate-400 uppercase tracking-wider'>เบอร์โทรศัพท์</p>
              <p className='text-sm mt-1 text-slate-700 font-medium'>{selectedClaim.claimer.phone}</p>
            </div>
          </div>

          <div className='bg-indigo-50/50 p-5 sm:p-6 rounded-2xl border border-indigo-100 shadow-sm'>
            <p className='text-[11px] font-black text-indigo-600 uppercase tracking-wider mb-4 flex items-center'>
              <PackageSearch size={14} className="mr-1.5" /> ข้อมูลสิ่งของที่ระบบบันทึกไว้
            </p>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
              <div className="sm:col-span-1">
                <p className='text-xs text-slate-500 font-bold'>ชื่อสิ่งของ</p>
                <p className='font-bold text-slate-900 mt-1 line-clamp-2'>{selectedClaim.found_item.title}</p>
              </div>
              <div className="sm:col-span-1">
                <p className='text-xs text-slate-500 font-bold'>สถานที่พบ</p>
                <p className='text-sm font-bold text-slate-900 mt-1 line-clamp-2'>{selectedClaim.found_item.location}</p>
              </div>
              <div className="sm:col-span-1">
                <p className='text-xs text-slate-500 font-bold'>วันที่พบ</p>
                <p className='text-sm font-bold text-slate-900 mt-1'>{selectedClaim.found_item.date}</p>
              </div>
            </div>
          </div>

          <div className='bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm'>
            <p className='text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3'>คำอธิบายหลักฐานจากผู้ใช้</p>
            <p className='text-slate-700 leading-relaxed text-sm bg-slate-50 p-4 rounded-xl border border-slate-100'>
              {selectedClaim.proof_desc || "ไม่มีคำอธิบายเพิ่มเติม"}
            </p>

            <p className='text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-6 mb-3'>รูปภาพหลักฐานแนบ</p>
            {selectedClaim.proof_images && selectedClaim.proof_images.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {selectedClaim.proof_images.map((img, idx) => (
                  <a key={idx} href={img} target="_blank" rel="noreferrer" className="shrink-0 relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Proof ${idx + 1}`} className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-xl border border-slate-200 shadow-sm group-hover:border-indigo-400 transition-colors" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white text-xs font-bold backdrop-blur-[2px]">
                      คลิกดูรูปเต็ม
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-50 p-4 rounded-xl border border-slate-100 border-dashed">
                <ImageIcon size={18} /> ไม่มีรูปภาพแนบมา
              </div>
            )}
          </div>

          <div className='bg-white p-5 rounded-2xl border border-slate-200'>
            <p className='text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3'>หมายเหตุ Admin (บันทึกภายใน / ส่งให้ผู้ใช้ดูด้วย)</p>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              className='w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm resize-none'
              placeholder='เช่น ตรวจสอบรูปถ่ายตรงกับข้อมูลของจริง จึงทำการอนุมัติ...'
            />
          </div>
        </div>

        <div className='p-5 border-t border-slate-100 bg-white flex flex-col-reverse sm:flex-row justify-end gap-3'>
          <button
            onClick={() => setSelectedClaim(null)}
            className='px-6 py-3 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-sm'
          >
            ยกเลิก
          </button>

          {(selectedClaim.status === "PENDING" || selectedClaim.status === "pending") && (
            <>
              <button
                onClick={() => handleAction("reject", adminNotes)}
                className='px-6 py-3 bg-white border-2 border-rose-200 text-rose-600 font-bold rounded-xl flex items-center justify-center hover:bg-rose-50 hover:border-rose-300 transition-all text-sm active:scale-95'
              >
                <XCircle size={18} className='mr-2' /> ปฏิเสธ
              </button>
              <button
                onClick={() => handleAction("approve", adminNotes)}
                className='px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-[0_4px_12px_rgba(16,185,129,0.2)] flex items-center justify-center hover:bg-emerald-700 hover:shadow-[0_6px_16px_rgba(16,185,129,0.3)] transition-all text-sm active:scale-95'
              >
                <CheckCircle2 size={18} className='mr-2' /> อนุมัติ
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClaimsView({ showToast }: { showToast: (msg: string) => void; }) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [rlsBlocked, setRlsBlocked] = useState(false);

  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true);
      // ✅ ดึงข้อมูลผ่าน API Route (server-side) เพื่อ bypass RLS
      const res = await fetch('/api/admin/claims');
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to fetch claims');
      }

      const data = json.data || [];
      setRlsBlocked(false);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedClaims = data.map((claim: any) => {
        const foundItem = claim.found_items || {};
        const userObj = claim.users || {};

        const locParts = [];
        if (foundItem.building) locParts.push(`🏢 ${foundItem.building}`);
        if (foundItem.floor) locParts.push(`ชั้น ${String(foundItem.floor).replace(/^ชั้น\s*/, '')}`);
        if (foundItem.room) locParts.push(`ห้อง ${String(foundItem.room).replace(/^(ห้อง|ชั้น)\s*/, '')}`);
        const finalLoc = locParts.length > 0 ? locParts.join(" ") : (foundItem.location_text || "ไม่ระบุสถานที่");

        return {
          id: claim.claim_id,
          claim_id: `CLM-${claim.claim_id.split('-')[0].toUpperCase()}`,
          status: claim.status || "PENDING",
          created_at: new Date(claim.created_at).toLocaleDateString("th-TH", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          proof_desc: claim.proof_desc || "",
          proof_images: claim.proof_images || [],
          found_id: claim.found_id,
          claimer_id: claim.claimer_id,
          admin_notes: claim.admin_note || "",
          claimer: {
            full_name: userObj.full_name || "ผู้ใช้ไม่ระบุชื่อ",
            email: userObj.email || "ไม่มีอีเมล",
            phone: userObj.phone_number || "ไม่ได้ระบุเบอร์โทร",
          },
          found_item: {
            title: foundItem.title || "ไม่ระบุชื่อสิ่งของ",
            location: finalLoc,
            date: foundItem.date_found ? new Date(foundItem.date_found).toLocaleDateString("th-TH") : "ไม่ระบุวันที่",
          },
        };
      });

      setClaims(formattedClaims);
    } catch (error) {
      console.error("Error fetching claims:", error);
      showToast("เกิดข้อผิดพลาดในการโหลดคำขอ");
      setRlsBlocked(true);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const filteredClaims = claims.filter((claim) => {
    const matchesSearch = claim.claim_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.claimer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.found_item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "ALL" || claim.status?.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const handleAction = async (action: "approve" | "reject", adminNotes: string = "") => {
    if (!selectedClaim) return;
    try {
      // 1. สร้าง PIN 6 หลักเมื่อ Approve
      const pinCode = action === "approve"
        ? Math.floor(100000 + Math.random() * 900000).toString()
        : undefined;

      // 2. อัปเดตผ่าน API Route (สามารถ bypass RLS ได้เมื่อเพิ่ม Service Role Key)
      const res = await fetch('/api/admin/claims', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim_id: selectedClaim.id,
          status: action === 'approve' ? 'APPROVED' : 'REJECTED',
          admin_note: adminNotes,
          pin_code: pinCode,
          found_id: selectedClaim.found_id,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Update failed');

      showToast(
        action === 'approve'
          ? `✅ อนุมัติสำเร็จ! PIN: ${pinCode} บันทึกเรียบร้อยแล้ว`
          : "❌ ปฏิเสธคำขอเรียบร้อย"
      );
      setSelectedClaim(null);
      fetchClaims();
    } catch (error) {
      showToast("เกิดข้อผิดพลาดในการบันทึก");
      console.error("handleAction error:", error);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <div className='w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin'></div>
      </div>
    );
  }

  return (
    <div className='animate-in fade-in duration-500'>
      <ClaimReviewModal
        selectedClaim={selectedClaim}
        setSelectedClaim={setSelectedClaim}
        handleAction={handleAction}
      />
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4'>
        <div>
          <h1 className='text-3xl font-extrabold flex items-center text-slate-900 tracking-tight'>
            <ShieldCheck className='text-indigo-600 mr-3' size={32} />
            จัดการคำขอ
          </h1>
          <p className='text-slate-500 mt-2 font-medium'>ตรวจสอบหลักฐานและอนุมัติการขอรับของคืนจากผู้ใช้</p>
        </div>
        <button
          onClick={fetchClaims}
          className='px-4 py-2 bg-indigo-50 text-indigo-600 font-bold text-sm rounded-xl hover:bg-indigo-100 transition-colors'
        >
          รีเฟรช
        </button>
      </div>

      {rlsBlocked && (
        <div className='mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3'>
          <AlertTriangle size={20} className='text-amber-600 shrink-0 mt-0.5' />
          <div>
            <p className='font-bold text-amber-900 text-sm'>ไม่สามารถโหลดคำขอได้เนื่องจาก RLS Policy</p>
            <p className='text-amber-700/80 text-xs mt-1'>กรุณาเพิ่ม <code className='bg-amber-100 px-1 rounded text-[11px]'>SUPABASE_SERVICE_ROLE_KEY</code> ใน <code className='bg-amber-100 px-1 rounded text-[11px]'>.env.local</code> หรือเพิ่ม RLS Policy ให้ Admin อ่าน claims ได้ทั้งหมด</p>
          </div>
        </div>
      )}

      <div className='bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden'>
        <div className='p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 bg-slate-50/50'>
          <div className="relative flex-1">
            <Search size={18} className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400' />
            <input
              type='text'
              placeholder='ค้นหา Claim ID, ชื่อผู้แจ้ง, ชื่อสิ่งของ...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all font-medium'
            />
          </div>
          <div className="relative">
            <select
              title="ตัวกรองสถานะ"
              aria-label="ตัวกรองสถานะ"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className='appearance-none pl-4 py-3 pr-10 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center text-sm font-bold text-slate-600 shadow-sm outline-none focus:ring-2 focus:ring-indigo-100'
            >
              <option value="ALL">รายการทั้งหมด</option>
              <option value="PENDING">รอตรวจสอบ</option>
              <option value="APPROVED">อนุมัติแล้ว</option>
              <option value="REJECTED">ปฏิเสธ</option>
            </select>
            <Filter size={14} className='absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
          </div>
        </div>
        <div className='p-4 sm:p-6 space-y-3'>
          {filteredClaims.length > 0 ? (
            filteredClaims.map((claim) => (
              <div
                key={claim.id}
                className='p-4 sm:p-5 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between hover:border-indigo-300 hover:shadow-md transition-all bg-white cursor-pointer group gap-4'
                onClick={() => setSelectedClaim(claim)}
              >
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-2'>
                    <h4 className='font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors'>
                      {claim.claim_id} <span className="text-slate-400 mx-1 font-normal">•</span> {claim.claimer.full_name}
                    </h4>
                    <span
                      className={`text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full border ${claim.status === "PENDING" || claim.status === "pending"
                          ? "bg-amber-50 text-amber-600 border-amber-200"
                          : claim.status === "APPROVED" || claim.status === "approved"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : "bg-rose-50 text-rose-600 border-rose-200"
                        }`}
                    >
                      {claim.status === "PENDING" || claim.status === "pending" ? "รอตรวจสอบ" : claim.status === "APPROVED" || claim.status === "approved" ? "อนุมัติแล้ว" : "ปฏิเสธ"}
                    </span>
                  </div>
                  <div className='text-sm text-slate-600 font-medium flex items-center gap-2'>
                    <PackageSearch size={14} className="text-slate-400" />
                    <span className="truncate">{claim.found_item.title}</span>
                  </div>
                </div>
                <div className='text-xs sm:text-sm font-medium text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 whitespace-nowrap text-center'>
                  {claim.created_at}
                </div>
              </div>
            ))
          ) : (
            <div className='text-center py-16 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed'>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                <ShieldCheck className='text-slate-300' size={28} />
              </div>
              <h3 className="font-bold text-slate-700 text-lg mb-1">ไม่พบคำขอที่รอตรวจสอบ</h3>
              <p className="text-sm font-medium text-slate-500">คุณเคลียร์งานทั้งหมดเรียบร้อยแล้ว เยี่ยมมาก!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}