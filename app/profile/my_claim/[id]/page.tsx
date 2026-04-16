"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Package, 
  CheckCheck,
  CalendarDays,
  ShieldCheck,
  Info,
  Loader2,
  ImageIcon
} from "lucide-react";

// ==========================================
// 📦 Interfaces
// ==========================================
type ClaimStatus = 'PENDING' | 'NEED_MORE_INFO' | 'APPROVED' | 'READY_FOR_PICKUP' | 'COMPLETED';

interface ClaimData {
  id: string;
  status: ClaimStatus;
  created_at: string;
  admin_note?: string;
  appointment_datetime?: string;
  pickup_pin?: string;
  found_items: {
    id: string;
    title: string;
    image_url: string;
    location_text: string;
  };
}

export default function ClaimTrackingDetail() {
  const params = useParams();
  const router = useRouter();
  const claimId = params.id as string;
  const supabase = createClient();

  const [claim, setClaim] = useState<ClaimData | null>(null);
  const [loading, setLoading] = useState(true);

  // States สำหรับฟอร์มนัดรับ
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  // States สำหรับฟอร์มส่งข้อมูลเพิ่ม
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isSubmittingInfo, setIsSubmittingInfo] = useState(false);

  useEffect(() => {
    fetchClaimDetail();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId]);

  const fetchClaimDetail = async () => {
    try {
      const { data, error } = await supabase
        .from("claims") // ⚠️ เปลี่ยนเป็นชื่อตารางจริงของคุณ
        .select(`
          id:claim_id, status, created_at, admin_note, appointment_datetime, pickup_pin,
          found_items ( id:found_id, title, image_url, location_text )
        `)
        .eq("claim_id", claimId)
        .single();

      if (error) throw error;
      if (data) setClaim(data as unknown as ClaimData);
    } catch (error) {
      console.error("Error fetching claim:", error);
      toast.error("ไม่พบข้อมูลรายการนี้");
      router.push("/my-claims");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 🗓️ Action: นัดหมายและสร้าง PIN 6 หลัก
  // ==========================================
  const handleSchedulePickup = async () => {
    if (!appointmentDate || !appointmentTime) {
      toast.error("กรุณาเลือกวันที่และเวลาให้ครบถ้วน");
      return;
    }

    setIsScheduling(true);
    try {
      // สุ่มรหัส PIN 6 หลัก (000000 - 999999)
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      const datetime = `${appointmentDate}T${appointmentTime}:00`;

      const { error } = await supabase
        .from("claims")
        .update({
          status: "READY_FOR_PICKUP",
          appointment_datetime: datetime,
          pickup_pin: pin
        })
        .eq("claim_id", claimId);

      if (error) throw error;

      toast.success("นัดหมายสำเร็จ! กรุณาแคปหน้าจอเก็บรหัส PIN ไว้");
      fetchClaimDetail(); // รีเฟรชข้อมูล

    } catch (error) {
      console.error("Schedule error:", error);
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setIsScheduling(false);
    }
  };

  // ==========================================
  // 📝 Action: ส่งข้อมูลเพิ่มให้แอดมิน
  // ==========================================
  const handleSubmitMoreInfo = async () => {
    if (!additionalInfo.trim()) return;
    setIsSubmittingInfo(true);
    try {
      const { error } = await supabase
        .from("claims")
        .update({
          status: "PENDING", // กลับไปรอตรวจใหม่
          admin_note: `ผู้ใช้ตอบกลับ: ${additionalInfo}`, 
        })
        .eq("claim_id", claimId);

      if (error) throw error;
      toast.success("ส่งข้อมูลเพิ่มเติมเรียบร้อยแล้ว");
      setAdditionalInfo("");
      fetchClaimDetail();
    } catch (error) {
      console.error("Submit info error:", error);
      toast.error("ส่งข้อมูลไม่สำเร็จ");
    } finally {
      setIsSubmittingInfo(false);
    }
  };

  // ==========================================
  // 🎨 Stepper UI Logic
  // ==========================================
  const getStepProgress = (status: ClaimStatus) => {
    if (status === 'PENDING' || status === 'NEED_MORE_INFO') return 1;
    if (status === 'APPROVED') return 2;
    if (status === 'READY_FOR_PICKUP') return 3;
    if (status === 'COMPLETED') return 4;
    return 1;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!claim) return null;

  const currentStep = getStepProgress(claim.status);

  return (
    <div className='min-h-screen bg-[#FAFAFA] text-slate-900 font-sans'>
      <main className='max-w-3xl mx-auto pt-24 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500'>
        
        {/* 🔙 ย้อนกลับ */}
        <Link href="/profile" className="inline-flex items-center text-slate-500 hover:text-slate-900 font-bold text-sm mb-6 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> กลับไปหน้าโปรไฟล์
        </Link>

        {/* 🌟 Header */}
        <div className="mb-8">
          <h1 className='text-2xl sm:text-3xl font-black text-slate-900 tracking-tight'>สถานะการขอคืนสิ่งของ</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">รหัสอ้างอิง: #{claim.id.substring(0, 8).toUpperCase()}</p>
        </div>

        {/* 📊 Stepper Progress */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row justify-between relative">
            {/* เส้นเชื่อม (ซ่อนในมือถือให้ดูเป็นแนวตั้ง หรือจัดให้สวยงาม) */}
            <div className="hidden sm:block absolute top-5 left-8 right-8 h-1 bg-slate-100 -z-0 rounded-full">
              <div 
                className="h-full bg-indigo-500 transition-all duration-700 rounded-full" 
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              ></div>
            </div>

            {/* Steps */}
            {[
              { step: 1, label: "รอตรวจสอบ", icon: Clock },
              { step: 2, label: "อนุมัติแล้ว", icon: CheckCircle2 },
              { step: 3, label: "รอรับของ", icon: Package },
              { step: 4, label: "เสร็จสิ้น", icon: CheckCheck }
            ].map((s) => {
              const isActive = currentStep >= s.step;
              const isCurrent = currentStep === s.step;
              const isError = s.step === 1 && claim.status === 'NEED_MORE_INFO';

              return (
                <div key={s.step} className="flex sm:flex-col items-center gap-4 sm:gap-2 relative z-10 mb-6 sm:mb-0">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold border-4 outline outline-4 outline-white transition-all duration-500 ${
                    isError ? 'bg-rose-100 text-rose-600 border-rose-200' :
                    isActive ? 'bg-indigo-600 text-white border-indigo-100' : 'bg-slate-100 text-slate-400 border-white'
                  }`}>
                    {isError ? <AlertCircle size={20} /> : <s.icon size={20} />}
                  </div>
                  <span className={`text-sm font-bold ${isCurrent ? 'text-indigo-600' : isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                    {isError ? "ขอข้อมูลเพิ่ม" : s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ⚡ Action Box (แปรผันตามสถานะ) */}
        <div className="mb-8">
          {/* สถานะ: 1. รอดำเนินการ */}
          {claim.status === 'PENDING' && (
            <div className="bg-amber-50 border border-amber-100 p-6 sm:p-8 rounded-3xl text-center animate-in zoom-in-95 duration-500">
              <Clock size={40} className="text-amber-500 mx-auto mb-4" strokeWidth={1.5} />
              <h3 className="text-xl font-bold text-amber-900 mb-2">กำลังตรวจสอบหลักฐาน</h3>
              <p className="text-amber-700/80 font-medium text-sm sm:text-base">
                เจ้าหน้าที่จะใช้เวลาตรวจสอบหลักฐานของคุณประมาณ 1-2 วันทำการ หากเรียบร้อยแล้วระบบจะแจ้งเตือนให้ทราบน้า
              </p>
            </div>
          )}

          {/* สถานะ: 2. ขอข้อมูลเพิ่ม */}
          {claim.status === 'NEED_MORE_INFO' && (
            <div className="bg-rose-50 border border-rose-200 p-6 sm:p-8 rounded-3xl animate-in zoom-in-95 duration-500">
              <div className="flex items-center gap-3 mb-4 text-rose-700">
                <AlertCircle size={24} />
                <h3 className="text-xl font-bold">ต้องการข้อมูลเพิ่มเติม</h3>
              </div>
              <p className="text-rose-600/80 font-medium text-sm mb-4 bg-white p-4 rounded-2xl border border-rose-100">
                <span className="font-bold text-rose-700 block mb-1">ข้อความจากเจ้าหน้าที่:</span>
                "{claim.admin_note || "กรุณาส่งข้อมูลยืนยันตัวตนเพิ่มเติม"}"
              </p>
              
              <div className="space-y-3 mt-6">
                <textarea 
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="พิมพ์ข้อความอธิบาย หรือใส่ลิงก์รูปภาพเพิ่มเติมที่นี่..."
                  className="w-full p-4 rounded-2xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-none"
                  rows={3}
                />
                <button 
                  onClick={handleSubmitMoreInfo}
                  disabled={!additionalInfo.trim() || isSubmittingInfo}
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
                >
                  {isSubmittingInfo ? "กำลังส่ง..." : "ส่งข้อมูลให้เจ้าหน้าที่"}
                </button>
              </div>
            </div>
          )}

          {/* สถานะ: 3. อนุมัติแล้ว (รอนัดรับ) */}
          {claim.status === 'APPROVED' && (
            <div className="bg-white border-2 border-indigo-500 p-6 sm:p-8 rounded-3xl shadow-[0_10px_40px_rgba(99,102,241,0.1)] animate-in zoom-in-95 duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10"></div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 flex items-center gap-2">
                <ShieldCheck className="text-emerald-500" /> อนุมัติหลักฐานแล้ว!
              </h3>
              <p className="text-slate-500 font-medium text-sm mb-6">
                ยินดีด้วย หลักฐานของคุณถูกต้อง รบกวนนัดหมายวันและเวลาเพื่อเข้ามารับสิ่งของที่จุดประชาสัมพันธ์
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">วันที่สะดวกรับของ</label>
                  <input
                    aria-label="วันที่สะดวกรับของ"
                    title="วันที่สะดวกรับของ"
                    type="date" 
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]} // เลือกวันย้อนหลังไม่ได้
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">ช่วงเวลา</label>
                  <input
                    aria-label="ช่วงเวลา"
                    title="ช่วงเวลา"
                    type="time" 
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <button 
                onClick={handleSchedulePickup}
                disabled={isScheduling}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center"
              >
                {isScheduling ? <Loader2 className="animate-spin w-5 h-5" /> : "ยืนยันการนัดหมาย"}
              </button>
            </div>
          )}

          {/* สถานะ: 4. รอรับของ (แสดงรหัส PIN 6 หลัก) */}
          {claim.status === 'READY_FOR_PICKUP' && (
            <div className="bg-indigo-600 text-white p-8 sm:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(99,102,241,0.3)] text-center relative overflow-hidden animate-in zoom-in-95 duration-500">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              
              <Package size={48} className="mx-auto mb-4 text-indigo-200" strokeWidth={1.5} />
              <h3 className="text-xl sm:text-2xl font-black mb-2">เตรียมรับสิ่งของ</h3>
              <p className="text-indigo-200 text-sm font-medium mb-8">
                กรุณานำรหัส 6 หลักนี้ พร้อมบัตรประจำตัวประชาชน/บัตรนักศึกษา มาแสดงให้เจ้าหน้าที่ในวันนัดหมาย
              </p>

              {/* 🎯 กล่องรหัส PIN 6 หลัก */}
              <div className="bg-white text-indigo-900 rounded-3xl p-6 sm:p-8 mb-6 shadow-inner mx-auto max-w-sm">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Pickup PIN</span>
                <div className="text-5xl sm:text-6xl font-black tracking-[0.2em] font-mono leading-none flex justify-center">
                  {claim.pickup_pin || "------"}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-indigo-100 font-medium bg-white/10 w-fit mx-auto px-5 py-2.5 rounded-full backdrop-blur-sm">
                <CalendarDays size={18} />
                <span>
                  นัดรับวันที่: {new Date(claim.appointment_datetime || "").toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {' เวลา '}
                  {new Date(claim.appointment_datetime || "").toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                </span>
              </div>
            </div>
          )}

          {/* สถานะ: 5. ส่งมอบสำเร็จ */}
          {claim.status === 'COMPLETED' && (
            <div className="bg-emerald-50 border border-emerald-100 p-8 sm:p-10 rounded-[2.5rem] text-center animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200">
                <CheckCheck size={40} className="text-white" strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-black text-emerald-900 mb-2">ส่งมอบสำเร็จเรียบร้อย 🎉</h3>
              <p className="text-emerald-700/80 font-medium text-base max-w-md mx-auto">
                ดีใจด้วยที่คุณได้รับของคืน! หวังว่าระบบ FoundIt. จะช่วยให้ชีวิตของคุณง่ายขึ้นนะ
              </p>
            </div>
          )}
        </div>

        {/* 📦 สรุปข้อมูลสิ่งของที่เคลม (แสดงเสมอ) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-20 h-20 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
            {claim.found_items.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={claim.found_items.image_url} alt="Item" className="w-full h-full object-cover" />
            ) : <ImageIcon className="text-slate-300" />}
          </div>
          <div>
            <h4 className="font-bold text-slate-900 line-clamp-1">{claim.found_items.title}</h4>
            <div className="flex items-center text-sm text-slate-500 mt-1 font-medium">
              <Info size={14} className="mr-1.5 shrink-0" />
              <span className="truncate">สถานที่พบ: {claim.found_items.location_text}</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}