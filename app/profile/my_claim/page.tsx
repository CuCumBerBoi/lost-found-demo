"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import { 
  PackageSearch, 
  ChevronRight, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Package, 
  CheckCheck,
  SearchX,
  ImageIcon
} from "lucide-react";

// ==========================================
// 📦 Interface (โครงสร้างข้อมูล)
// ==========================================
type ClaimStatus = 'PENDING' | 'NEED_MORE_INFO' | 'APPROVED' | 'READY_FOR_PICKUP' | 'COMPLETED';

interface ClaimData {
  id: string;
  status: ClaimStatus;
  created_at: string;
  found_items: {
    title: string;
    image_url: string;
    location_text: string;
  };
}

// ==========================================
// 🎨 Helper: ฟังก์ชันกำหนดสีและไอคอนตามสถานะ
// ==========================================
const getStatusUI = (status: ClaimStatus) => {
  switch (status) {
    case 'PENDING':
      return {
        label: "รอเจ้าหน้าที่ตรวจสอบ",
        color: "text-amber-600",
        bg: "bg-amber-50 border-amber-100",
        icon: Clock,
      };
    case 'NEED_MORE_INFO':
      return {
        label: "ต้องการข้อมูลเพิ่มเติม",
        color: "text-rose-600",
        bg: "bg-rose-50 border-rose-100",
        icon: AlertCircle,
      };
    case 'APPROVED':
      return {
        label: "อนุมัติแล้ว (รอนัดรับ)",
        color: "text-indigo-600",
        bg: "bg-indigo-50 border-indigo-100",
        icon: CheckCircle2,
      };
    case 'READY_FOR_PICKUP':
      return {
        label: "เตรียมรับสิ่งของ",
        color: "text-emerald-600",
        bg: "bg-emerald-50 border-emerald-100",
        icon: Package,
      };
    case 'COMPLETED':
      return {
        label: "ส่งมอบสำเร็จ",
        color: "text-slate-500",
        bg: "bg-slate-100 border-slate-200",
        icon: CheckCheck,
      };
    default:
      return {
        label: "ไม่ทราบสถานะ",
        color: "text-slate-500",
        bg: "bg-slate-100 border-slate-200",
        icon: AlertCircle,
      };
  }
};

export default function MyClaimsPage() {
  const [claims, setClaims] = useState<ClaimData[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 🔍 ดึงข้อมูลการเคลมของ User คนนี้ (ปรับชื่อตารางให้ตรงกับของจริง)
        const { data, error } = await supabase
          .from("claims") // เปลี่ยนเป็นชื่อตารางจริง เช่น match_requests
          .select(`
            id,
            status,
            created_at,
            found_items (
              title,
              image_url,
              location_text
            )
          `)
          .eq("claimer_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        // ถ้าข้อมูลไม่ว่าง ให้เซ็ตค่า
        if (data) {
          setClaims(data as unknown as ClaimData[]);
        }
      } catch (error) {
        console.error("Error fetching claims:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClaims();
  }, [supabase]);

  // ฟังก์ชันแปลงวันที่ให้อ่านง่าย
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }) + " น.";
  };

  return (
    <div className='min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900'>
      <main className='max-w-4xl mx-auto pt-24 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-8 duration-500'>
        
        {/* 🌟 Header Section */}
        <div className='flex items-center gap-4 mb-8 sm:mb-10'>
          <div className='w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm text-indigo-600 shrink-0'>
            <PackageSearch size={28} strokeWidth={2} />
          </div>
          <div>
            <h1 className='text-2xl sm:text-3xl font-black text-slate-900 tracking-tight'>
              รายการขอคืนสิ่งของ
            </h1>
            <p className='text-slate-500 text-sm sm:text-base font-medium mt-1'>
              ติดตามสถานะการยืนยันตัวตนและการรับของคืน
            </p>
          </div>
        </div>

        {/* 📋 Claims List */}
        {loading ? (
          <div className='text-center py-20'>
            <div className='animate-spin w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full mx-auto'></div>
            <p className='text-slate-500 mt-4 text-sm font-medium'>กำลังโหลดข้อมูล...</p>
          </div>
        ) : claims.length > 0 ? (
          <div className='flex flex-col gap-4'>
            {claims.map((claim) => {
              const statusUI = getStatusUI(claim.status);
              const StatusIcon = statusUI.icon;
              
              return (
                <Link 
                  key={claim.id} 
                  href={`/my-claims/${claim.id}`}
                  className='bg-white p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col sm:flex-row gap-5 items-start sm:items-center group cursor-pointer'
                >
                  {/* รูปภาพสิ่งของ */}
                  <div className='w-full sm:w-28 h-40 sm:h-28 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100 relative flex items-center justify-center'>
                    {claim.found_items?.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={claim.found_items.image_url} 
                        alt={claim.found_items.title} 
                        className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
                      />
                    ) : (
                      <ImageIcon size={24} className="text-slate-300" />
                    )}
                  </div>

                  {/* ข้อมูล */}
                  <div className='flex-1 w-full'>
                    <div className='flex flex-wrap items-start justify-between gap-2 mb-2'>
                      <h3 className='text-base sm:text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors'>
                        {claim.found_items?.title || "ไม่ระบุชื่อสิ่งของ"}
                      </h3>
                      
                      {/* Badge สถานะ */}
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold border ${statusUI.bg} ${statusUI.color}`}>
                        <StatusIcon size={14} strokeWidth={2.5} className='mr-1.5' />
                        {statusUI.label}
                      </span>
                    </div>

                    <div className='space-y-1.5'>
                      <p className='text-sm text-slate-500 font-medium truncate'>
                        📍 {claim.found_items?.location_text || "ไม่ระบุสถานที่"}
                      </p>
                      <p className='text-[13px] text-slate-400 font-medium'>
                        🕒 ส่งคำขอเมื่อ: {formatDate(claim.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* ลูกศรขวา (แสดงเฉพาะจอใหญ่) */}
                  <div className='hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0'>
                    <ChevronRight size={20} />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className='text-center py-24 bg-white rounded-[2rem] border border-slate-100 shadow-sm'>
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-slate-100">
              <SearchX size={32} className='text-slate-400' />
            </div>
            <h3 className='text-xl font-bold text-slate-900 mb-2'>คุณยังไม่มีรายการขอคืนสิ่งของ</h3>
            <p className='text-slate-500 text-sm font-medium mb-6'>
              หากพบว่ามีคนเก็บของของคุณได้ สามารถกดขอเคลมได้ที่หน้าแจ้งพบสิ่งของ
            </p>
            <Link 
              href="/"
              className='inline-block px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-colors'
            >
              ดูของที่ถูกพบทั้งหมด
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}