"use client";

import React, { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  KeySquare,
  Search,
  ArrowLeft,
  CheckCircle2,
  Package,
  User,
  UploadCloud,
  X,
  Loader2,
  Camera,
  Image as ImageIcon,
  AlertCircle
} from "lucide-react";

// ==========================================
// 📦 Interfaces
// ==========================================
interface ClaimPickupData {
  id: string;
  claim_id: string;
  status: string;
  pin_code: string; // ✅ ชื่อคอลัมน์จริงใน DB
  found_id: string; // ✅ สำหรับ update found_items
  claimer_id: string; // ✅ สำหรับส่ง notification
  claimer: {
    full_name: string;
    email: string;
    phone: string;
  };
  found_item: {
    title: string;
    image_url: string;
    location_text: string;
  };
}

export default function AdminPickupPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [pinCode, setPinCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [matchedClaim, setMatchedClaim] = useState<ClaimPickupData | null>(null);
  const [searchError, setSearchError] = useState("");

  // States สำหรับอัปโหลดรูปหลักฐานตอนส่งมอบ
  const [handoverImage, setHandoverImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // 🔒 ตรวจสอบสิทธิ์ Admin
  // ==========================================
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase.from("users").select("role").eq("user_id", user.id).single();
      if (data?.role?.toLowerCase() !== "admin") {
        router.push("/");
      }
    };
    checkAdmin();
  }, [router, supabase]);

  // ==========================================
  // 🔍 ค้นหาคำขอด้วย PIN
  // ==========================================
  const handleSearchPIN = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinCode.length !== 6) {
      setSearchError("กรุณากรอกรหัส PIN ให้ครบ 6 หลัก");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    setMatchedClaim(null);
    setHandoverImage(null);
    setImagePreview(null);

    try {
      // ✅ ใช้ API Route (service role) เพื่อ bypass RLS
      const res = await fetch(`/api/admin/claims/pin?pin=${encodeURIComponent(pinCode)}`);
      const json = await res.json();

      if (!res.ok || json.error || !json.data) {
        setSearchError("ไม่พบรหัส PIN นี้ หรือคำขอนี้ไม่ได้อยู่ในสถานะที่รอรับของ");
      } else {
        const d = json.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userObj = (d.users as any) || {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const foundObj = (d.found_items as any) || {};
        const claimData: ClaimPickupData = {
          id: d.claim_id,
          claim_id: `CLM-${d.claim_id.split('-')[0].toUpperCase()}`,
          status: d.status,
          pin_code: d.pin_code,
          found_id: d.found_id,
          claimer_id: d.claimer_id,
          claimer: {
            full_name: userObj.full_name || "ไม่ระบุชื่อ",
            email: userObj.email || "-",
            phone: userObj.phone_number || "-",
          },
          found_item: {
            title: foundObj.title || "ไม่ระบุชื่อ",
            image_url: foundObj.image_url || "",
            location_text: foundObj.location_text || "",
          },
        };
        setMatchedClaim(claimData);
      }
    } catch (error) {
      console.error("PIN Search Error:", error);
      setSearchError("เกิดข้อผิดพลาดในการค้นหาข้อมูล");
    } finally {
      setIsSearching(false);
    }
  };

  // ==========================================
  // 📸 จัดการอัปโหลดรูป
  // ==========================================
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHandoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // ==========================================
  // ✅ ยืนยันการส่งมอบ
  // ==========================================
  const handleConfirmHandover = async () => {
    if (!matchedClaim) return;
    setIsSubmitting(true);
    try {
      let proofUrl: string | null = null;

      // 1. อัปโหลดรูปลง Storage (ถ้ามี) — ไม่บังคับ
      if (handoverImage) {
        const fileExt = handoverImage.name.split('.').pop();
        const fileName = `handover_${matchedClaim.id}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('items')
          .upload(fileName, handoverImage);

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('items').getPublicUrl(fileName);
          proofUrl = publicUrlData.publicUrl;
        }
      }

      // 2. อัปเดตสถานะ Claim เป็น COMPLETED ผ่าน API Route (bypass RLS)
      const payload: Record<string, string> = {
        claim_id: matchedClaim.id,
        status: 'COMPLETED',
        admin_note: proofUrl ? `ส่งมอบสำเร็จ หลักฐาน: ${proofUrl}` : 'ส่งมอบสำเร็จ',
        found_id: matchedClaim.found_id,
        claimer_id: matchedClaim.claimer_id,
        item_title: matchedClaim.found_item.title,
      };
      const res = await fetch('/api/admin/claims', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Update failed');

      toast.success("บันทึกการส่งมอบสิ่งของสำเร็จ! ✅");
      setMatchedClaim(null);
      setPinCode("");
      setHandoverImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Handover Error:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='min-h-screen bg-slate-900 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white'>
      {/* 🌟 Header & Navbar แบบย่อสำหรับ Admin */}
      <nav className='bg-slate-900 text-white border-b border-slate-800 py-4 px-4 sm:px-6 sticky top-0 z-50'>
        <div className='max-w-4xl mx-auto flex items-center justify-between'>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 hover:bg-slate-800 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <span className='text-lg font-bold tracking-tight'>ระบบยืนยันการส่งมอบ</span>
          </div>
          <div className="text-xs font-bold bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-full border border-indigo-500/30">
            Admin Portal
          </div>
        </div>
      </nav>

      <main className='max-w-3xl mx-auto pt-10 pb-20 px-4 sm:px-6'>
        
        {/* 1. ส่วนค้นหาด้วย PIN */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-2xl mb-8 border border-slate-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
              <KeySquare size={32} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">กรอกรหัสรับของคืน (PIN)</h1>
            <p className="text-slate-500 mt-2 font-medium">สอบถามรหัส 6 หลักจากผู้ใช้งานเพื่อดึงข้อมูลการนัดรับ</p>
          </div>

          <form onSubmit={handleSearchPIN} className="max-w-sm mx-auto">
            <div className="relative flex items-center justify-center mb-4">
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))} // รับเฉพาะตัวเลข
                className="w-full text-center text-5xl tracking-[0.25em] font-mono font-black text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-2xl py-6 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
              />
            </div>
            
            {searchError && (
              <div className="flex items-center justify-center gap-2 text-rose-500 text-sm font-bold mb-4 bg-rose-50 py-2 rounded-lg">
                <AlertCircle size={16} /> {searchError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSearching || pinCode.length !== 6}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 text-lg active:scale-95"
            >
              {isSearching ? <Loader2 className="animate-spin" size={24} /> : <Search size={24} />}
              ค้นหา
            </button>
          </form>
        </div>

        {/* 2. ส่วนแสดงผลลัพธ์การค้นหา & ฟอร์มยืนยัน */}
        {matchedClaim && (
          <div className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-xl border-2 border-emerald-500 relative overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10"></div>
            
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-emerald-500 text-white p-2 rounded-full">
                <CheckCircle2 size={24} strokeWidth={3} />
              </div>
              <h2 className="text-xl font-black text-emerald-950">พบข้อมูลตรงกัน!</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-8">
              {/* ข้อมูลสิ่งของ */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-indigo-600 font-bold mb-4 border-b border-slate-200 pb-2">
                  <Package size={18} /> ข้อมูลสิ่งของ
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-slate-200 rounded-xl overflow-hidden shrink-0 border border-slate-300">
                    {matchedClaim.found_item.image_url ? (
                       // eslint-disable-next-line @next/next/no-img-element
                      <img src={matchedClaim.found_item.image_url} alt="item" className="w-full h-full object-cover" />
                    ) : <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon /></div>}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 line-clamp-2">{matchedClaim.found_item.title}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">📍 {matchedClaim.found_item.location_text}</p>
                  </div>
                </div>
              </div>

              {/* ข้อมูลผู้รับ */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-indigo-600 font-bold mb-4 border-b border-slate-200 pb-2">
                  <User size={18} /> ผู้มีสิทธิ์รับของ
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">ชื่อ-นามสกุล</p>
                    <p className="font-bold text-slate-900 text-sm">{matchedClaim.claimer.full_name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">รหัสนักศึกษา/เบอร์โทร</p>
                      <p className="font-semibold text-slate-700 text-sm">{matchedClaim.claimer.phone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">อีเมล</p>
                      <p className="font-semibold text-slate-700 text-sm truncate">{matchedClaim.claimer.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. ส่วนอัปโหลดรูปภาพหลักฐานการส่งมอบ */}
            <div className="border-t border-slate-100 pt-8 mb-8">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Camera size={18} className="text-slate-400" /> อัปโหลดภาพหลักฐานการส่งมอบ
              </h3>
              
              {!imagePreview ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 transition-colors flex flex-col items-center justify-center cursor-pointer group"
                >
                  <UploadCloud size={32} className="text-slate-400 group-hover:text-indigo-500 mb-2 transition-colors" />
                  <p className="text-sm font-bold text-slate-600 group-hover:text-indigo-700">คลิกเพื่อถ่ายรูป / อัปโหลดรูปภาพ</p>
                  <p className="text-xs text-slate-400 mt-1">ต้องมีผู้รับของและสิ่งของอยู่ในภาพ</p>
                </div>
              ) : (
                <div className="relative w-full sm:w-64 h-48 rounded-2xl border-2 border-slate-200 overflow-hidden group">
                   // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => { setHandoverImage(null); setImagePreview(null); }}
                      className="bg-rose-500 text-white p-2 rounded-full hover:bg-rose-600 shadow-lg"
                      aria-label="ลบรูปภาพ"
                      title="ลบรูปภาพ"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment" // แนะนำให้เปิดกล้องมือถือถ้าใช้งานบนมือถือ
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageChange}
                aria-label="อัปโหลดภาพหลักฐานการส่งมอบ"
                title="อัปโหลดภาพหลักฐานการส่งมอบ"
              />
            </div>

            {/* ปุ่มยืนยันปิดจ๊อบ */}
            <button
              onClick={handleConfirmHandover}
              disabled={isSubmitting}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 active:scale-95"
            >
              {isSubmitting ? (
                <><Loader2 className="animate-spin" size={24} /> กำลังบันทึก...</>
              ) : (
                <><CheckCircle2 size={24} /> ยืนยันการส่งมอบเสร็จสิ้น</>
              )}
            </button>
          </div>
        )}

      </main>
    </div>
  );
}