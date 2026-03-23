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
} from "lucide-react";

interface Claim {
  id: string;
  claim_id: string;
  status: string;
  created_at: string;
  proof_desc: string;
  proof_images: string[];
  claimer: { full_name: string; email: string; phone: string };
  found_item: { title: string; location: string; date: string };
}

// ย้าย Modal ออกมาจาก Component หลักเพื่อไม่ให้ผิด Rules of Hooks
function ClaimReviewModal({
  selectedClaim,
  setSelectedClaim,
  handleAction,
}: {
  selectedClaim: Claim | null;
  setSelectedClaim: (claim: Claim | null) => void;
  handleAction: (action: "approve" | "reject", adminNotes: string) => void;
}) {
  const [adminNotes, setAdminNotes] = useState("");

  if (!selectedClaim) return null;

  return (
    <div className='fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4'>
      <div className='bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95'>
        <div className='bg-slate-50 border-b border-slate-200 p-5 flex justify-between items-center'>
          <h2 className='text-xl font-bold text-slate-900 flex items-center'>
            <ShieldCheck className='mr-2 text-indigo-600' />
            ตรวจสอบหลักฐาน
          </h2>
          <button aria-label="ปิด" title="ปิด"
            onClick={() => setSelectedClaim(null)}
            className='p-2 hover:bg-slate-200 rounded-full'
          >
            <X size={20} />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6'>
          {/* Claimer Info */}
          <div className='grid grid-cols-2 gap-6 bg-white p-5 rounded-2xl border border-slate-200'>
            <div>
              <p className='text-sm font-bold text-slate-500 uppercase'>
                ชื่อผู้แจ้ง
              </p>
              <p className='text-lg font-bold mt-1'>
                {selectedClaim.claimer.full_name}
              </p>
            </div>
            <div>
              <p className='text-sm font-bold text-slate-500 uppercase'>
                อีเมล
              </p>
              <p className='text-sm mt-1 text-slate-600'>
                {selectedClaim.claimer.email}
              </p>
            </div>
            <div>
              <p className='text-sm font-bold text-slate-500 uppercase'>
                เบอร์โทรศัพท์
              </p>
              <p className='text-sm mt-1 text-slate-600'>
                {selectedClaim.claimer.phone}
              </p>
            </div>
            <div>
              <p className='text-sm font-bold text-slate-500 uppercase'>
                วันที่แจ้ง
              </p>
              <p className='text-sm mt-1 text-slate-600'>
                {selectedClaim.created_at}
              </p>
            </div>
          </div>

          {/* Found Item Info */}
          <div className='bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100'>
            <p className='text-sm font-bold text-indigo-600 uppercase mb-3'>
              สิ่งของที่เจอ
            </p>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-slate-600'>ชื่อสิ่งของ</p>
                <p className='font-bold text-slate-900'>
                  {selectedClaim.found_item.title}
                </p>
              </div>
              <div>
                <p className='text-sm text-slate-600'>พื้นที่พบ</p>
                <p className='font-bold text-slate-900'>
                  {selectedClaim.found_item.location}
                </p>
              </div>
              <div>
                <p className='text-sm text-slate-600'>วันที่พบ</p>
                <p className='font-bold text-slate-900'>
                  {selectedClaim.found_item.date}
                </p>
              </div>
            </div>
          </div>

          {/* Proof Description */}
          <div className='bg-white p-5 rounded-2xl border border-slate-200'>
            <p className='text-sm font-bold text-slate-600 uppercase mb-3'>
              รายละเอียดหลักฐาน
            </p>
            <p className='text-slate-700 leading-relaxed'>
              {selectedClaim.proof_desc}
            </p>
          </div>

          {/* Admin Notes */}
          <div className='bg-white p-5 rounded-2xl border border-slate-200'>
            <p className='text-sm font-bold text-slate-600 uppercase mb-3'>
              หมายเหตุ Admin
            </p>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              className='w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-indigo-400'
              placeholder='เพิ่มหมายเหตุเพื่อจดบันทึก...'
            />
          </div>
        </div>

        <div className='p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3'>
          <button
            onClick={() => setSelectedClaim(null)}
            className='px-5 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-xl'
          >
            ยกเลิก
          </button>
          <button
            onClick={() => {
              handleAction("reject", adminNotes);
            }}
            className='px-5 py-2 bg-white border-2 border-rose-200 text-rose-600 font-bold rounded-xl flex items-center hover:bg-rose-50'
          >
            <XCircle size={16} className='mr-2' /> ปฏิเสธ
          </button>
          <button
            onClick={() => {
              handleAction("approve", adminNotes);
            }}
            className='px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-md flex items-center hover:bg-emerald-700'
          >
            <CheckCircle2 size={16} className='mr-2' /> อนุมัติคืนของ
          </button>
        </div>
      </div>
    </div>
  );
}

interface SupabaseClaimRow {
  id: string;
  status: string;
  created_at: string;
  proof_description?: string;
  proof_images?: string[];
  claimer?: { full_name?: string; email?: string; phone?: string };
  found_item?: { title?: string; location_text?: string; date_found?: string };
}

export default function ClaimsView({
  showToast,
}: {
  showToast: (msg: string) => void;
}) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchClaims = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("claims")
        .select(
          `
          *,
          claimer:users(full_name, email, phone),
          found_item:found_items(title, location_text, date_found)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedClaims = (data || []).map((claim: SupabaseClaimRow, idx: number) => ({
        id: claim.id,
        claim_id: `CLM-${String(idx + 1).padStart(3, "0")}`,
        status: claim.status || "pending",
        created_at: new Date(claim.created_at).toLocaleDateString("th-TH"),
        proof_desc: claim.proof_description || "",
        proof_images: claim.proof_images || [],
        claimer: {
          full_name: claim.claimer?.full_name || "Unknown",
          email: claim.claimer?.email || "N/A",
          phone: claim.claimer?.phone || "N/A",
        },
        found_item: {
          title: claim.found_item?.title || "Unknown Item",
          location: claim.found_item?.location_text || "Unknown Location",
          date: new Date(claim.found_item?.date_found || "").toLocaleDateString(
            "th-TH",
          ),
        },
      }));

      setClaims(formattedClaims);
    } catch (error) {
      console.error("Error fetching claims:", error);
      showToast("เกิดข้อผิดพลาดในการโหลดคำขอ");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const filteredClaims = claims.filter(
    (claim) =>
      claim.claim_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.claimer.full_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      claim.found_item.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAction = async (
    action: "approve" | "reject",
    adminNotes: string = "",
  ) => {
    if (!selectedClaim) return;

    try {
      const supabase = createClient();
      await supabase
        .from("claims")
        .update({
          status: action === "approve" ? "approved" : "rejected",
          admin_notes: adminNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedClaim.id);

      showToast(
        action === "approve"
          ? "✅ บันทึกการส่งคืนของสำเร็จ!"
          : "❌ ปฏิเสธคำขอเรียบร้อย",
      );
      setSelectedClaim(null);
      fetchClaims();
    } catch (error) {
      showToast("เกิดข้อผิดพลาด");
      console.error(error);
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
      <div className='flex justify-between items-end mb-6'>
        <div>
          <h1 className='text-2xl font-extrabold flex items-center'>
            <ShieldCheck className='text-indigo-600 mr-3' size={28} />
            จัดการคำขอ (Claims)
          </h1>
          <p className='text-slate-500 mt-1'>ตรวจสอบและอนุมัติการรับของ</p>
        </div>
      </div>
      <div className='bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden'>
        <div className='p-4 border-b border-slate-100 flex gap-2 bg-slate-50'>
          <Search size={18} className='text-slate-400 my-auto' />
          <input
            type='text'
            placeholder='ค้นหา Claim ID, ชื่อผู้แจ้ง...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='px-4 py-2 border-0 rounded-xl text-sm outline-none flex-1 focus:border-indigo-400'
          />
          <button aria-label="ตัวกรอง" title="ตัวกรอง" className='p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-100'>
            <Filter size={18} className='text-slate-500' />
          </button>
        </div>
        <div className='p-4 space-y-3'>
          {filteredClaims.length > 0 ? (
            filteredClaims.map((claim) => (
              <div
                key={claim.id}
                className='p-4 border border-slate-200 rounded-2xl flex items-center justify-between hover:border-indigo-300 transition-all bg-white cursor-pointer'
                onClick={() => setSelectedClaim(claim)}
              >
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-1'>
                    <h4 className='font-bold text-slate-900'>
                      {claim.claim_id} - {claim.claimer.full_name}
                    </h4>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        claim.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : claim.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {claim.status === "pending"
                        ? "รอสำรวจ"
                        : claim.status === "approved"
                          ? "อนุมัติแล้ว"
                          : "ปฏิเสธ"}
                    </span>
                  </div>
                  <p className='text-sm text-slate-600'>
                    สิ่งของ: {claim.found_item.title}
                  </p>
                </div>
                <div className='text-sm text-slate-500'>{claim.created_at}</div>
              </div>
            ))
          ) : (
            <div className='text-center py-10 text-slate-500'>
              <Search className='mx-auto mb-2 text-slate-300' size={32} />
              <p>ไม่พบคำขอที่ตรงกัน</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
