"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
  Image as ImageIcon,
  ShieldAlert,
  Info,
  Building,
  Check,
  Activity
} from "lucide-react";

// Types
interface ClaimDetail {
  id: string;
  status: string;
  created_at: string;
  proof_desc: string;
  proof_images: string[];
  admin_note: string;
  pin_code: string | null;
  pickup_datetime: string | null;
  found_item: {
    title: string;
    building: string;
    floor: string;
    room: string;
    location_text: string;
    date_found: string;
    image_url: string | null;
  };
}

export default function ClaimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [claim, setClaim] = useState<ClaimDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchClaimDetail = async () => {
      try {
        if (!params.id || params.id === "undefined") {
          setLoading(false);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("claims")
          .select(`
            *,
            found_items (found_id, title, building, floor, room, location_text, date_found, image_url)
          `)
          .eq("claim_id", params.id)
          .single();

        if (error) {
          // 🚨 2. แปลง Error ให้เป็นข้อความ จะได้รู้สาเหตุที่แท้จริง
          console.error("❌ Supabase Error:", JSON.stringify(error, null, 2));
          throw error;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const foundData = data.found_items || {};

        // จัดการสถานที่
        const locParts = [];
        if (foundData.building) locParts.push(`อาคาร${foundData.building}`);
        if (foundData.floor) locParts.push(`ชั้น ${String(foundData.floor).replace(/^ชั้น\s*/, '')}`);
        if (foundData.room) locParts.push(`ห้อง ${String(foundData.room).replace(/^(ห้อง|ชั้น)\s*/, '')}`);
        const finalLoc = locParts.length > 0 ? locParts.join(" ") : (foundData.location_text || "ห้องธุรการส่วนกลาง (Admin Office)");

        setClaim({
          id: data.claim_id,
          status: data.status,
          created_at: new Date(data.created_at).toLocaleDateString("th-TH", {
            year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
          }),
          proof_desc: data.proof_desc || "ไม่มีคำอธิบายเพิ่มเติม",
          proof_images: data.proof_images || [],
          admin_note: data.admin_note || "",
          pin_code: data.pin_code || null,
          pickup_datetime: data.pickup_datetime || null,
          found_item: {
            title: foundData.title || "ไม่ระบุชื่อสิ่งของ",
            building: foundData.building || "",
            floor: foundData.floor || "",
            room: foundData.room || "",
            location_text: finalLoc,
            // เพิ่มการเช็คค่าว่างของวันที่
            date_found: foundData.date_found ? new Date(foundData.date_found).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }) : "ไม่ระบุวันที่",
            image_url: foundData.image_url || null,
          }
        });

      } catch (error) {
        console.error("Error fetching claim details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClaimDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, router]);

  if (loading) {
    return (
      <div className='min-h-screen bg-[#FAFAFA] flex items-center justify-center'>
        <div className='w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin'></div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className='min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4'>
        <ShieldAlert size={64} className="text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">ไม่พบข้อมูลคำขอ</h2>
        <p className="text-slate-500 mb-6">คำขอนี้อาจถูกลบไปแล้ว หรือคุณไม่มีสิทธิ์เข้าถึง</p>
        <button onClick={() => router.push('/profile')} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
          กลับไปหน้าโปรไฟล์
        </button>
      </div>
    );
  }

  const isPending = claim.status.toLowerCase() === "pending";
  const isApproved = claim.status.toLowerCase() === "approved";
  const isRejected = claim.status.toLowerCase() === "rejected";
  const isReadyForPickup = claim.status.toLowerCase() === "ready_for_pickup";
  const isCompleted = claim.status.toLowerCase() === "completed";
  const isSuccessState = isApproved || isReadyForPickup || isCompleted;

  return (
    <div className='min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-24'>

      {/* 🌟 Header */}
      <div className="bg-white border-b border-slate-200 pt-24 pb-6 sticky top-0 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/profile" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-4">
            <ArrowLeft size={16} className="mr-2" /> กลับไปหน้าโปรไฟล์
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">รายละเอียดคำขอ</h1>
            <div className={`px-4 py-2 rounded-full font-bold text-sm inline-flex items-center w-fit shadow-sm border ${isPending ? "bg-amber-50 text-amber-600 border-amber-200" :
                isApproved ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                  isRejected ? "bg-rose-50 text-rose-600 border-rose-200" :
                    isReadyForPickup ? "bg-indigo-50 text-indigo-600 border-indigo-200" :
                      "bg-teal-50 text-teal-600 border-teal-200"
              }`}>
              {isPending && <><Clock size={16} className="mr-2" /> กำลังรอตรวจสอบ</>}
              {isApproved && <><CheckCircle2 size={16} className="mr-2" /> อนุมัติแล้ว — รอรับของ</>}
              {isRejected && <><XCircle size={16} className="mr-2" /> ถูกปฏิเสธ</>}
              {isReadyForPickup && <><CheckCircle2 size={16} className="mr-2" /> พร้อมรับของคืน</>}
              {isCompleted && <><CheckCircle2 size={16} className="mr-2" /> เสร็จสมบูรณ์</>}
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-2 font-medium">รหัสอ้างอิง: <span className="font-bold text-slate-700">CLM-{claim.id.split('-')[0].toUpperCase()}</span></p>
        </div>
      </div>

      <main className='max-w-3xl mx-auto mt-8 px-4 sm:px-6 lg:px-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500'>

        {/* Status Alert */}
        <div className={`p-4 sm:p-5 rounded-2xl border mb-8 flex items-start gap-4 shadow-sm ${isPending ? "bg-amber-50/50 border-amber-200" :
            isSuccessState ? "bg-emerald-50/50 border-emerald-200" :
              isRejected ? "bg-rose-50/50 border-rose-200" :
                "bg-indigo-50/50 border-indigo-200"
          }`}>
          <div className={`mt-0.5 p-2 rounded-full shrink-0 ${isPending ? "bg-amber-100 text-amber-600" :
              isSuccessState ? "bg-emerald-100 text-emerald-600" :
                isRejected ? "bg-rose-100 text-rose-600" :
                  "bg-indigo-100 text-indigo-600"
            }`}>
            {isPending && <Info size={20} />}
            {isSuccessState && <Check size={20} />}
            {isRejected && <XCircle size={20} />}
          </div>
          <div>
            <h3 className={`font-bold text-base mb-1 ${isPending ? "text-amber-800" :
                isSuccessState ? "text-emerald-800" :
                  isRejected ? "text-rose-800" :
                    "text-indigo-800"
              }`}>
              {isPending && "เจ้าหน้าที่กำลังตรวจสอบข้อมูลของคุณ"}
              {isSuccessState && "ยินดีด้วย! หลักฐานของคุณผ่านการอนุมัติแล้ว"}
              {isRejected && "ขออภัย หลักฐานที่ส่งมาไม่ผ่านการอนุมัติ"}
            </h3>
            <p className={`text-sm leading-relaxed ${isPending ? "text-amber-700/80" :
                isSuccessState ? "text-emerald-700/80" :
                  isRejected ? "text-rose-700/80" :
                    "text-indigo-700/80"
              }`}>
              {isPending && "เราจะทำการตรวจสอบหลักฐานรูปภาพและคำอธิบายที่คุณส่งมาเทียบกับของจริง โปรดรอการแจ้งเตือนอัปเดตสถานะในเร็วๆ นี้"}
              {isSuccessState && "เจ้าหน้าที่ได้ยืนยันการเป็นเจ้าของแล้ว นำ PIN Code ด้านล่างนี้ไปแสดงต่อเจ้าหน้าที่ เพื่อยืนยันตัวตน"}
              {isRejected && "เจ้าหน้าที่ได้ตรวจสอบหลักฐานแล้วพบว่าอาจไม่ตรงกับสิ่งของจริง หรือรายละเอียดไม่เพียงพอ คุณสามารถยื่นคำขอใหม่ได้หากมีข้อมูลเพิ่มเติม"}
            </p>
            {claim.admin_note && (
              <div className="mt-4 p-3 bg-white/60 rounded-xl border border-rose-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">หมายเหตุจากเจ้าหน้าที่</p>
                <p className="text-sm font-medium text-slate-800">{claim.admin_note}</p>
              </div>
            )}
          </div>
        </div>

        {/* 📦 1. Item Info Card */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col sm:flex-row">
          <div className="w-full sm:w-48 h-48 sm:h-auto bg-slate-100 shrink-0 relative">
            {claim.found_item.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={claim.found_item.image_url} alt={claim.found_item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <ImageIcon size={48} />
              </div>
            )}
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">สิ่งของที่คุณยืนยันสิทธิ์</p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-4 leading-tight">{claim.found_item.title}</h2>
            <div className="space-y-2">
              <p className="text-sm text-slate-600 flex items-center font-medium">
                <Calendar size={16} className="mr-2 text-slate-400" /> พบเมื่อ: {claim.found_item.date_found}
              </p>
              <p className="text-sm text-slate-600 flex items-start font-medium">
                <MapPin size={16} className="mr-2 mt-0.5 text-slate-400 shrink-0" />
                สถานที่พบ: {claim.found_item.location_text}
              </p>
            </div>
          </div>
        </div>

        {/* 🚥 2. Timeline Status */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 sm:p-8">
          <h3 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center">
            <Activity size={20} className="mr-2 text-indigo-600" /> สถานะการดำเนินการ
          </h3>

          <div className="relative border-l-2 border-slate-100 ml-3 sm:ml-4 space-y-8 pb-4">

            {/* Step 1: ยื่นคำขอ */}
            <div className="relative pl-6 sm:pl-8">
              <div className="absolute -left-[11px] top-0.5 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white shadow-sm flex items-center justify-center">
                <Check size={10} className="text-white" strokeWidth={4} />
              </div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">ส่งคำขอรับของคืนสำเร็จ</h4>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">{claim.created_at}</p>
            </div>

            {/* Step 2: แอดมินตรวจสอบ */}
            <div className="relative pl-6 sm:pl-8">
              <div className={`absolute -left-[11px] top-0.5 w-5 h-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${isPending ? "bg-amber-400 animate-pulse" : (isSuccessState ? "bg-emerald-500" : "bg-rose-500")
                }`}>
                {!isPending && <Check size={10} className="text-white" strokeWidth={4} />}
              </div>
              <h4 className={`font-bold text-sm sm:text-base ${isPending ? "text-amber-600" : "text-slate-900"}`}>
                {isPending ? "เจ้าหน้าที่กำลังตรวจสอบหลักฐาน" : "เจ้าหน้าที่ตรวจสอบเรียบร้อยแล้ว"}
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium leading-relaxed">
                {isPending
                  ? "ระบบกำลังรอการตรวจสอบความถูกต้องของข้อมูล (ใช้เวลา 1-2 วันทำการ)"
                  : (isSuccessState ? "หลักฐานของคุณถูกต้องและได้รับการอนุมัติ" : "หลักฐานไม่ผ่านการอนุมัติ")}
              </p>
            </div>

            {/* Step 3: รับของคืน (โชว์เฉพาะถ้าอนุมัติหรือกำลังรอ) */}
            {!isRejected && (
              <div className="relative pl-6 sm:pl-8 opacity-100">
                <div className={`absolute -left-[11px] top-0.5 w-5 h-5 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${isSuccessState ? "bg-indigo-500 animate-bounce" : "bg-slate-200"
                  }`}></div>
                <h4 className={`font-bold text-sm sm:text-base ${isSuccessState ? "text-indigo-600" : "text-slate-400"}`}>
                  รับสิ่งของคืน
                </h4>
                <p className={`text-xs sm:text-sm mt-1 font-medium ${isSuccessState ? "text-slate-600" : "text-slate-400"}`}>
                  {isSuccessState ? (isCompleted ? "ส่งมอบสิ่งของเสร็จสมบูรณ์" : "คุณสามารถเดินทางมารับสิ่งของคืนได้เลย") : "รอการอนุมัติเพื่อดูสถานที่รับของ"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 🚨 3. Next Steps (Action Box - PIN CODE CARD when approved) */}
        {isSuccessState && claim.pin_code && !isCompleted && (
          <div className="bg-indigo-600 rounded-[2rem] p-6 sm:p-8 text-center relative overflow-hidden shadow-xl">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <p className="font-bold text-indigo-200 text-sm mb-1 uppercase tracking-widest">รหัส PIN สำหรับรับของคืน</p>
              <p className="text-indigo-100 text-xs mb-6">แคปหน้าจอเก็บไว้ แล้วนำไปแสดงต่อเจ้าหน้าที่ที่จุดรับของ</p>
              <div className="bg-white rounded-2xl py-6 px-8 mx-auto max-w-xs shadow-inner mb-6">
                <p className="text-5xl sm:text-5xl font-black tracking-[0.3em] font-mono text-indigo-700">
                  {claim.pin_code}
                </p>
              </div>
              <p className="text-xs text-indigo-200 font-medium">📍 สถานที่รับของ: {claim.found_item.location_text}</p>
            </div>
          </div>
        )}

        {/* กรณี approved แต่ยังไม่มี PIN - แสดง location */}
        {isSuccessState && !claim.pin_code && !isCompleted && (
          <div className={`rounded-[2rem] border shadow-sm p-6 sm:p-8 bg-emerald-50/50 border-emerald-200`}>
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <CheckCircle2 size={32} className="text-emerald-500 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-emerald-900 mb-2 text-lg">ยินดีด้วย! คำขออนุมัติแล้ว</h3>
                  <p className="text-sm text-emerald-800 font-medium leading-relaxed mb-4">
                    กรุณาเดินทางมารับสิ่งของคืนตามสถานที่ด้านล่างนี้ โดยนำ <b>"บัตรประจำตัวประชาชน"</b> หรือ <b>"บัตรนิสิต"</b> ตัวจริงมาเพื่อยืนยันตัวตนกับเจ้าหน้าที่ด้วยครับ
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                  <Building size={24} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">สถานที่ติดต่อรับของ</p>
                  <p className="font-extrabold text-slate-900 text-lg">{claim.found_item.location_text}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* กรณี Completed - ส่งมอบเสร็จสมบูรณ์ */}
        {isCompleted && (
          <div className="bg-emerald-600 rounded-[2rem] p-6 sm:p-8 text-center relative overflow-hidden shadow-xl">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10 flex flex-col items-center">
              <CheckCircle2 size={48} className="text-emerald-200 mb-4" />
              <h3 className="font-black text-white text-2xl mb-2">ส่งมอบสิ่งของสำเร็จ!</h3>
              <p className="text-emerald-100 text-sm mb-6">คุณได้รับสิ่งของนี้คืนเรียบร้อยแล้ว ขอบคุณที่ใช้บริการ FoundIt.</p>
            </div>
          </div>
        )}

        {isPending && (
          <div className={`rounded-[2rem] border shadow-sm p-6 sm:p-8 bg-amber-50/50 border-amber-200`}>
            <div className="flex gap-4">
              <Info size={28} className="text-amber-500 shrink-0" />
              <div>
                <h3 className="font-extrabold text-amber-900 mb-2 text-lg">สิ่งที่ต้องทำต่อไป</h3>
                <p className="text-sm text-amber-700/80 font-medium leading-relaxed">
                  โปรดรอให้เจ้าหน้าที่ตรวจสอบความถูกต้องของข้อมูลที่คุณส่งมา หากได้รับการอนุมัติ ระบบจะอัปเดตสถานะและแสดง <b>PIN Code</b> สำหรับรับของให้คุณทราบ
                </p>
              </div>
            </div>
          </div>
        )}

        {isRejected && (
          <div className={`rounded-[2rem] border shadow-sm p-6 sm:p-8 bg-rose-50/50 border-rose-200`}>
            <div className="flex gap-4">
              <XCircle size={28} className="text-rose-500 shrink-0" />
              <div>
                <h3 className="font-extrabold text-rose-900 mb-2 text-lg">คำขอถูกปฏิเสธ</h3>
                <p className="text-sm text-rose-700/80 font-medium leading-relaxed mb-4">
                  ระบบไม่สามารถอนุมัติการส่งคืนได้ เนื่องจากหลักฐานไม่เพียงพอ หรือข้อมูลไม่ตรงกับลักษณะของสิ่งของชิ้นนี้
                </p>
                <button 
                  onClick={() => window.location.href = `mailto:support@foundit.com?subject=สอบถามสถานะคำขอถูกปฏิเสธ (Claim ID: CLM-${claim.id.split('-')[0].toUpperCase()})&body=สวัสดีครับ/ค่ะ,%0D%0A%0D%0Aต้องการสอบถามรายละเอียดเพิ่มเติมเกี่ยวกับการปฏิเสธคำขอรับคืนสิ่งของ ID: CLM-${claim.id.split('-')[0].toUpperCase()}%0D%0A%0D%0Aรบกวนตรวจสอบอีกครั้งครับ/ค่ะ`}
                  className="px-5 py-2.5 bg-white border border-rose-200 text-rose-600 font-bold text-sm rounded-xl hover:bg-rose-50 transition-colors shadow-sm"
                >
                  ติดต่อเจ้าหน้าที่เพื่อชี้แจงเพิ่มเติม
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 📝 4. My Proof Section (หลักฐานที่ฉันส่งไป) */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 sm:p-8">
          <h3 className="text-lg font-extrabold text-slate-900 mb-6">หลักฐานที่คุณแนบไว้</h3>

          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">คำอธิบายเพิ่มเติม</p>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700 leading-relaxed">
                {claim.proof_desc}
              </div>
            </div>

            {claim.proof_images.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">รูปภาพหลักฐาน</p>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {claim.proof_images.map((img, idx) => (
                    <a key={idx} href={img} target="_blank" rel="noreferrer" className="shrink-0 relative group block w-32 h-32 sm:w-40 sm:h-40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover rounded-xl border border-slate-200 shadow-sm group-hover:border-indigo-400 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}