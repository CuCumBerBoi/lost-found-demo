"use client";

import React, { useState, useEffect, use, useRef } from "react";
// ตรวจสอบ Relative Path ของ Supabase Client ให้ตรงกับโปรเจกต์ของคุณ
import { createClient } from "../../../lib/supabase-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, MapPin, Clock, Sparkles, ShieldCheck, Image as ImageIcon,
  Info, Check, X, UploadCloud, Loader2, AlertCircle, Phone, Edit
} from "lucide-react";
import Link from "next/link";

// ==========================================
// 🛡️ Claim Modal Component
// ==========================================
const ClaimModal = ({ isOpen, onClose, itemId, itemTitle, onSuccess }: any) => {
  const [proofDesc, setProofDesc] = useState("");
  const [uploadedProofs, setUploadedProofs] = useState<{ url: string; file: File }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (uploadedProofs.length >= 3) {
      toast.error("อัปโหลดหลักฐานได้สูงสุด 3 รูป");
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => setUploadedProofs(prev => [...prev, { url: reader.result as string, file }]);
  };

  const handleClaimSubmit = async () => {
    if (!proofDesc.trim() && uploadedProofs.length === 0) {
      toast.error("กรุณากรอกรายละเอียด หรืออัปโหลดรูปภาพหลักฐาน");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("กรุณาเข้าสู่ระบบ");

      const uploadPromises = uploadedProofs.map(async (proof) => {
        const fileExt = proof.file.name.split(".").pop();
        const fileName = `claims/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from("items").upload(filePath, proof.file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from("items").getPublicUrl(filePath);
        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      const { error } = await supabase.from("claims").insert({
        found_id: itemId, claimer_id: user.id, proof_desc: proofDesc, proof_images: uploadedUrls, status: "PENDING",
      });

      if (error && error.code === "23505") throw new Error("คุณได้ส่งคำขอไปแล้ว");
      if (error) throw error;

      toast.success("ส่งคำขอเรียบร้อย Admin จะตรวจสอบหลักฐานของคุณ");
      onSuccess(); onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4'>
      <div className='bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200'>
        <div className='bg-indigo-600 p-5 sm:p-6 flex justify-between items-center text-white'>
          <div>
            <h3 className='text-lg font-bold flex items-center'><ShieldCheck className='mr-2' /> ขอยืนยันสิทธิ์รับของคืน</h3>
            <p className='text-indigo-100 text-xs mt-1'>{itemTitle}</p>
          </div>
          <button onClick={onClose} className='p-2 hover:bg-white/20 rounded-full transition-colors' title='ปิด'><X size={20} /></button>
        </div>
        <div className='p-5 sm:p-6 space-y-5'>
          <div>
            <label className='block text-sm font-bold text-slate-700 mb-2'>คำอธิบายหลักฐาน <span className='text-rose-500'>*</span></label>
            <textarea value={proofDesc} onChange={e => setProofDesc(e.target.value)} rows={3} className='w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none transition-all' placeholder='เช่น รหัสผ่านหน้าจอ, ตำหนิเฉพาะจุด...'></textarea>
          </div>
          <div>
            <label className='block text-sm font-bold text-slate-700 mb-2'>รูปภาพหลักฐาน</label>
            <div className='flex gap-3 overflow-x-auto pb-2'>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} title="อัปโหลดรูปภาพหลักฐาน" />
              {uploadedProofs.map((img, i) => (
                <div key={i} className='w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center relative group overflow-hidden border border-slate-200'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} className="w-full h-full object-cover" alt="proof" />
                  <button type="button" className='absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity' onClick={() => setUploadedProofs(uploadedProofs.filter((_, idx) => idx !== i))} title='ลบรูป'><X size={12} /></button>
                </div>
              ))}
              {uploadedProofs.length < 3 && (
                <button onClick={() => fileInputRef.current?.click()} className='w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all'>
                  <UploadCloud size={20} /><span className='text-[10px] font-bold'>แนบรูป</span>
                </button>
              )}
            </div>
          </div>
        </div>
        <div className='p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3'>
          <button onClick={onClose} className='px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl text-sm transition-colors'>ยกเลิก</button>
          <button onClick={handleClaimSubmit} disabled={isSubmitting} className='px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 text-sm flex items-center transition-all active:scale-95 disabled:opacity-50'>
            {isSubmitting ? <Loader2 className='w-4 h-4 animate-spin mr-2' /> : null} ส่งคำขอ
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 🚀 Main Universal Detail Page
// ==========================================
export default function UniversalItemDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams?.id;

  const router = useRouter();
  const supabase = createClient();

  const [item, setItem] = useState<any>(null);
  const [itemType, setItemType] = useState<'FOUND' | 'LOST' | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [isOwner, setIsOwner] = useState(false); // สถานะเช็คว่าเป็นประกาศของตัวเองหรือไม่

  useEffect(() => {
    const fetchItemDetail = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        // 🔍 1. ตรวจหาในตาราง found_items
        let { data: foundData } = await supabase
          .from("found_items")
          .select("*, categories(name)")
          .eq("found_id", id)
          .maybeSingle();

        if (!foundData) {
          const { data: f2 } = await supabase.from("found_items").select("*, categories(name)").eq("id", id).maybeSingle();
          foundData = f2;
        }

        if (foundData) {
          setItem(foundData);
          setItemType('FOUND');
          // ✅ ตรวจสอบความเป็นเจ้าของ: ถ้า user.id ปัจจุบัน ตรงกับ user_id ของโพสต์
          if (user && foundData.user_id === user.id) setIsOwner(true);

          if (user) {
            const currentId = foundData.id || foundData.found_id;
            const { data: claimData } = await supabase.from("claims").select("id").eq("found_id", currentId).eq("claimer_id", user.id).maybeSingle();
            if (claimData) setHasClaimed(true);
          }
          return;
        }

        // 🔍 2. ถ้าไม่เจอ ให้หาใน lost_items
        let { data: lostData } = await supabase
          .from("lost_items")
          .select("*, categories(name)")
          .eq("lost_id", id)
          .maybeSingle();

        if (!lostData) {
          const { data: l2 } = await supabase.from("lost_items").select("*, categories(name)").eq("id", id).maybeSingle();
          lostData = l2;
        }

        if (lostData) {
          setItem(lostData);
          setItemType('LOST');
          // ✅ ตรวจสอบความเป็นเจ้าของ
          if (user && lostData.user_id === user.id) setIsOwner(true);
          return;
        }

        throw new Error("Item not found");

      } catch (error: any) {
        toast.error("ขออภัย ไม่พบข้อมูลประกาศนี้");
        setTimeout(() => router.push("/"), 2500);
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetail();
  }, [id, supabase, router]);

  const handleOpenClaim = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อนทำรายการ");
      router.push("/login");
      return;
    }
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center gap-4'>
        <Loader2 className='w-12 h-12 text-indigo-600 animate-spin' />
        <p className="text-slate-400 font-medium animate-pulse text-sm uppercase tracking-widest">กำลังโหลดข้อมูลสิ่งของ...</p>
      </div>
    );
  }

  if (!item || !itemType) return null;

  // 🎨 ตัวแปรสำหรับการแสดงผล
  const isFound = itemType === 'FOUND';
  const themeColor = isFound ? 'emerald' : 'rose';
  const buttonColor = isFound ? 'indigo' : 'rose';
  const statusActive = isFound ? (item.status === 'AVAILABLE') : (item.status === 'SEARCHING' || item.status === 'searching');
  const imageUrl = item.image_url || (item.images && item.images.length > 0 ? item.images[0] : null);

  // 🛡️ ฟังก์ชันช่วยกรองคำว่า Unknown หรือ ไม่ระบุ ทิ้ง
  const isValidData = (val: any) => {
    if (!val || typeof val !== 'string') return false;
    const lower = val.trim().toLowerCase();
    return lower !== '' && lower !== 'unknown' && lower !== 'ไม่ระบุ' && lower !== '-';
  };

  // ดึงสถานที่ (Location)
  const locText = isValidData(item.location_text) ? item.location_text : null;
  const bldText = isValidData(item.building) ? item.building : null;
  const roomText = isValidData(item.room) ? item.room : null;

  const mainLocation = locText || bldText || "ไม่ระบุสถานที่แน่ชัด";
  const subLocationParts = [];
  if (bldText && bldText !== mainLocation) subLocationParts.push(bldText);
  if (roomText) subLocationParts.push(roomText);
  const subLocation = subLocationParts.join(" • ");

  // ดึงรายละเอียด (Description)
  const descriptionText = isValidData(item.description) ? item.description : null;

  // ดึงข้อมูล AI Metadata (ประมวลผลกรณี Database ส่งมาเป็น String)
  let parsedAI = null;
  try {
    parsedAI = typeof item.ai_metadata === 'string' ? JSON.parse(item.ai_metadata) : item.ai_metadata;
  } catch (e) { }

  const aiColor = parsedAI?.color && isValidData(parsedAI.color) ? parsedAI.color : null;
  const aiBrand = parsedAI?.brand && isValidData(parsedAI.brand) ? parsedAI.brand : null;

  return (
    <div className={`min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-${themeColor}-100 selection:text-${themeColor}-900`}>

      {isFound && (
        <ClaimModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} itemId={item.id || item.found_id} itemTitle={item.title} onSuccess={() => setHasClaimed(true)} />
      )}

      <main className='max-w-5xl mx-auto pt-24 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500'>

        <button onClick={() => router.back()} className="flex items-center text-slate-500 hover:text-slate-900 font-bold mb-6 transition-colors w-fit px-5 py-2.5 bg-white rounded-full border border-slate-200 shadow-sm active:scale-95">
          <ArrowLeft size={16} className="mr-2" /> ย้อนกลับ
        </button>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row relative">

          <div className={`absolute top-0 left-0 w-full h-1.5 ${isFound ? 'bg-emerald-500' : 'bg-rose-500'} z-20`}></div>

          {/* 📸 Image Section */}
          <div className="w-full md:w-1/2 bg-slate-50/50 relative min-h-[350px] md:min-h-[500px] flex items-center justify-center p-6 sm:p-10 border-b md:border-b-0 md:border-r border-slate-100">
            <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
              {/* <span className={`bg-${themeColor}-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center`}>
                  {isFound ? <Sparkles size={14} className="mr-1.5" /> : <AlertCircle size={14} className="mr-1.5" />} 
                  {isFound ? 'พลเมืองดีพบเจอ' : 'ประกาศตามหาของ'}
                </span> */}
              {!statusActive && (
                <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center w-fit">
                  <Check size={14} className={`mr-1.5 text-${themeColor}-400`} /> {isFound ? 'ส่งคืนเรียบร้อยแล้ว' : 'หาของเจอแล้ว'}
                </span>
              )}
            </div>

            {imageUrl ? (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={item.title}
                  className="max-w-full max-h-full object-contain rounded-2xl drop-shadow-sm"
                />
              </div>
            ) : (
              <div className="text-slate-300 flex flex-col items-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                  <ImageIcon size={28} className="opacity-50" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest opacity-60">ไม่มีรูปภาพประกอบ</span>
              </div>
            )}
          </div>

          {/* 📝 Details Section */}
          <div className="w-full md:w-1/2 p-6 sm:p-10 lg:p-12 flex flex-col">

            <div className="mb-3">
              <span className={`text-[10px] font-bold text-${themeColor}-600 bg-${themeColor}-50 px-3 py-1 rounded-full border border-${themeColor}-100`}>
                {item.categories?.name || "ไม่ระบุหมวดหมู่"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-5">
              {item.title}
            </h1>

            {/* AI Tags */}
            {(aiColor || aiBrand) && (
              <div className="flex flex-wrap gap-2 mb-8">
                {aiColor && <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">🎨 สี{aiColor}</span>}
                {aiBrand && <span className={`px-3 py-1 bg-${themeColor}-50 text-${themeColor}-700 rounded-lg text-xs font-bold border border-${themeColor}-100`}>🏷️ {aiBrand}</span>}
              </div>
            )}

            <div className="space-y-4 mb-8">
              {/* Location Card */}
              <div className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                <div className={`bg-${themeColor}-50 p-2.5 rounded-full shrink-0`}>
                  <MapPin className={`text-${themeColor}-500`} size={20} />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{isFound ? 'สถานที่พบเจอ' : 'สถานที่คาดว่าทำหาย'}</h4>
                  <p className="text-slate-900 font-bold text-sm sm:text-base">{mainLocation}</p>

                  {subLocation && (
                    <p className="text-xs text-slate-500 mt-1 font-medium">{subLocation}</p>
                  )}
                </div>
              </div>

              {/* Time Card */}
              <div className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                <div className={`bg-${themeColor}-50 p-2.5 rounded-full shrink-0`}>
                  <Clock className={`text-${themeColor}-500`} size={20} />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{isFound ? 'วันและเวลาที่พบ' : 'เวลาที่คาดว่าหาย'}</h4>
                  <p className="text-slate-900 font-bold text-sm sm:text-base">{new Date(item.date_found || item.date_lost).toLocaleDateString("th-TH", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">เวลา {new Date(item.date_found || item.date_lost).toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' })} น.</p>
                </div>
              </div>
            </div>

            {/* Description (แสดงตลอดแม้ไม่มีข้อมูล เพื่อให้ Layout ครบถ้วน) */}
            <div className="mb-10">
              <h4 className={`text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5`}>
                <Info size={14} className="text-slate-400" /> ข้อมูลเพิ่มเติม
              </h4>
              <div className={`text-sm leading-relaxed p-4 rounded-xl border ${descriptionText ? 'bg-slate-50 text-slate-600 border-slate-100' : 'bg-slate-50/50 text-slate-400 border-slate-100 border-dashed italic'}`}>
                {descriptionText ? descriptionText : 'ไม่ได้ระบุรายละเอียดเพิ่มเติมไว้ในประกาศนี้'}
              </div>
            </div>

            {/* 🎯 Action Buttons */}
            <div className="mt-auto pt-6">
              {!statusActive ? (
                <div className="w-full py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl flex items-center justify-center gap-2 text-sm">
                  <Check size={18} /> {isFound ? 'สิ่งของชิ้นนี้ถูกส่งคืนเจ้าของแล้ว' : 'ปิดประกาศสำเร็จแล้ว'}
                </div>
              ) : isOwner ? ( // ถ้าเป็นประกาศของคุณเอง
                <Link href="/profile" className={`w-full py-4 bg-slate-50 text-slate-700 font-bold rounded-2xl border border-slate-200 hover:bg-slate-100 flex items-center justify-center gap-2 text-sm active:scale-95 transition-all`}>
                  <Edit size={18} className="text-slate-500" /> จัดการประกาศของคุณ
                </Link>
              ) : isFound ? ( // ถ้าเป็นของที่คนอื่นเจอ (Found) -> ให้กดขอยืนยันสิทธิ์
                hasClaimed ? (
                  <div className={`w-full py-4 bg-${buttonColor}-50 text-${buttonColor}-600 font-bold rounded-2xl border border-${buttonColor}-200 flex items-center justify-center gap-2 text-sm`}>
                    <ShieldCheck size={18} /> ส่งคำขอยืนยันสิทธิ์แล้ว
                  </div>
                ) : (
                  <button onClick={handleOpenClaim} className={`w-full py-4 bg-${buttonColor}-600 text-white font-bold rounded-2xl shadow-md hover:bg-${buttonColor}-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-base`}>
                    <ShieldCheck size={20} /> ขอยืนยันสิทธิ์รับของคืน
                  </button>
                )
              ) : ( // ถ้าเป็นของที่คนอื่นทำหาย (Lost) -> ให้กดแจ้งเบาะแส
                <Link href="/found" className={`w-full py-4 bg-${buttonColor}-600 text-white font-bold rounded-2xl shadow-md hover:bg-${buttonColor}-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-base`}>
                  <Phone size={20} /> ฉันพบของชิ้นนี้แล้ว
                </Link>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}