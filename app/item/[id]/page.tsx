"use client";

import React, { useState, useEffect, use, useRef } from "react";
// ตรวจสอบ Relative Path ของ Supabase Client ให้ตรงกับโปรเจกต์ของคุณ
import { createClient } from "../../../lib/supabase-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, MapPin, Clock, Sparkles, ShieldCheck, Image as ImageIcon,
  Info, Check, X, UploadCloud, Loader2, AlertCircle, Phone, Edit, PlusCircle
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
            <h3 className='text-lg font-bold flex items-center'><ShieldCheck className='mr-2' /> ยืนยันสิทธิ์รับของคืน</h3>
            <p className='text-indigo-100 text-xs mt-1'> สิ่งของที่ต้องการรับคืน : {itemTitle}</p>
          </div>
          <button onClick={onClose} className='p-2 hover:bg-white/20 rounded-full transition-colors' title='ปิด'><X size={20} /></button>
        </div>
        <div className='p-5 sm:p-6 space-y-5'>
          <div>
            <label className='block text-sm font-bold text-slate-700 mb-2'>คำอธิบายเฉพาะเจาะจง<span className='text-rose-500'>*</span></label>
            <p className='text-xs text-slate-500 mb-2'>(แสดงความเป็นเจ้าของ)</p>
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
                <button onClick={() => fileInputRef.current?.click()} className='w-30 h-30 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all'>
                  <UploadCloud size={20} /><span className='text-[10px] font-bold'>อัปโหลดรูปภาพรูป</span>
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
// 📝 Update Post Modal Component
// ==========================================
const UpdatePostModal = ({ isOpen, onClose, item, itemType, onSuccess }: any) => {
  const [description, setDescription] = useState(item?.description || "");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (item?.description) setDescription(item.description);
  }, [item]);

  if (!isOpen) return null;

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      const supabase = createClient();
      const table = itemType === "FOUND" ? "found_items" : "lost_items";
      const idCol = itemType === "FOUND" ? "found_id" : "lost_id";

      const { error } = await supabase
        .from(table)
        .update({ description })
        .eq(idCol, item[idCol]);

      if (error) throw error;
      
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className='fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4'>
      <div className='bg-white rounded-[2rem] shadow-2xl w-full max-w-xl p-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200'>
        <div className='flex justify-between items-center mb-6'>
          <h3 className='text-xl font-bold'>เพิ่ม/แก้ไขรายละเอียดเพิ่มเติม</h3>
          <button onClick={onClose} className='p-2 hover:bg-slate-100 rounded-full transition-colors' title="ปิด"><X size={20} /></button>
        </div>
        <div className='mb-8'>
          <label className='block text-sm font-bold text-slate-700 mb-2'>รายละเอียดเพิ่มเติม</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className='w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm'
            placeholder='เขียนรายละเอียดเพิ่มเติมที่นี่...'
          />
        </div>
        <div className='flex justify-end gap-3'>
          <button onClick={onClose} disabled={isUpdating} className='px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl'>ยกเลิก</button>
          <button onClick={handleUpdate} disabled={isUpdating} className='px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl flex items-center disabled:opacity-50'>
            {isUpdating && <Loader2 size={16} className="animate-spin mr-2" />}
            บันทึก
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
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const fetchItemDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      // 🔍 1. ตรวจหาในตาราง found_items
      let { data: foundData, error: foundError } = await supabase
        .from("found_items")
        .select("*, categories(name)")
        .eq("found_id", id)
        .maybeSingle();

      if (foundError || !foundData) {
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
          const { data: claimData } = await supabase.from("claims").select("id:claim_id").eq("found_id", currentId).eq("claimer_id", user.id).maybeSingle();
          if (claimData) setHasClaimed(true);
        }
        return;
      }

      // 🔍 2. ถ้าไม่เจอ ให้หาใน lost_items
      let { data: lostData, error: lostError } = await supabase
        .from("lost_items")
        .select("*, categories(name)")
        .eq("lost_id", id)
        .maybeSingle();

      if (lostError || !lostData) {
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

  useEffect(() => {
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

  // --- จัดการข้อมูลสถานที่ (เรียงจาก อาคาร -> ชั้น -> ห้อง พร้อมดักคำซ้ำ) ---
  let bld = item.building && isValidData(item.building) ? String(item.building).trim().replace(/^อาคาร\s*/, '') : "";
  let flr = item.floor && isValidData(item.floor) ? String(item.floor).trim().replace(/^ชั้น\s*/, '') : "";
  let rm = item.room && isValidData(item.room) ? String(item.room).trim().replace(/^(ห้อง|ชั้น)\s*/, '') : "";
  let locText = item.location_text && isValidData(item.location_text) ? String(item.location_text).trim() : "";

  // ดักกรณีห้องซ้ำกับชั้น
  if (rm === flr) rm = "";

  // 1. สร้างบรรทัดหลัก (Main Location - ตัวหนา) เน้นอาคารเป็นหลัก
  let mainLocation = "";
  if (bld) {
    mainLocation = `อาคาร ${bld}`;
  } else if (locText) {
    mainLocation = locText;
  } else {
    mainLocation = "ไม่ระบุสถานที่แน่ชัด";
  }

  // 2. สร้างบรรทัดรอง (Sub Location - ตัวบาง) ใส่ข้อมูลชั้นและห้อง
  const subLocationParts = [];

  if (flr) subLocationParts.push(`ชั้น ${flr}`);
  if (rm) subLocationParts.push(`ห้อง ${rm}`);

  // ถ้าระบุอาคารไว้ที่บรรทัดหลักแล้ว แต่มี location_text (เช่น เลขห้อง) ด้วย ให้นำมาใส่บรรทัดรอง
  if (bld && locText) {
    // เช็คไม่ให้มันเป็นคำเดียวกันกับห้องหรือชั้น จะได้ไม่เบิ้ล
    if (locText !== rm && locText !== flr && !locText.includes(bld)) {
      subLocationParts.push(`ห้อง ${locText}`);
    }
  }

  // นำบรรทัดรองมาต่อกันด้วยจุดไข่ปลา
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
  const aiCharacteristic = (
    (parsedAI?.characteristic && isValidData(parsedAI.characteristic) ? parsedAI.characteristic : null) ||
    (parsedAI?.description && isValidData(parsedAI.description) ? parsedAI.description : null) ||
    (parsedAI?.type && isValidData(parsedAI.type) ? parsedAI.type : null)
  );

  return (
    <div className={`min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-${themeColor}-100 selection:text-${themeColor}-900`}>

      {isImageZoomed && imageUrl && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-12 animate-in fade-in zoom-in-95 duration-200 cursor-zoom-out"
          onClick={() => setIsImageZoomed(false)}
        >
          <button
            title="ปิดรูปภาพ"
            aria-label="ปิดรูปภาพ"
            className="absolute top-6 right-6 text-white/50 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors z-[210]"
          >
            <X size={32} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={item.title}
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {isFound && (
        <ClaimModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} itemId={item.id || item.found_id} itemTitle={item.title} onSuccess={() => setHasClaimed(true)} />
      )}

      {isOwner && (
        <UpdatePostModal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} item={item} itemType={itemType} onSuccess={fetchItemDetail} />
      )}

      <main className='max-w-5xl mx-auto pt-24 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500'>

        <button onClick={() => router.back()} className="flex items-center text-slate-500 hover:text-slate-900 font-bold mb-6 transition-colors w-fit px-5 py-2.5 bg-white rounded-full border border-slate-200 shadow-sm active:scale-95">
          <ArrowLeft size={16} className="mr-2" /> ย้อนกลับ
        </button>

        <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden flex flex-col md:flex-row relative">

          {/* 📸 Image Section */}
          <div className="w-full md:w-1/2 bg-slate-50/50 relative min-h-[350px] md:min-h-[500px] flex items-center justify-center p-6 sm:p-10 border-b md:border-b-0 md:border-r border-slate-100">
            <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
              {!statusActive && (
                <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center w-fit">
                  <Check size={14} className={`mr-1.5 text-${themeColor}-400`} /> {isFound ? 'ส่งคืนเรียบร้อยแล้ว' : 'หาของเจอแล้ว'}
                </span>
              )}
            </div>

            {imageUrl ? (
              <div
                className="relative w-full h-full flex items-center justify-center cursor-zoom-in group"
                onClick={() => setIsImageZoomed(true)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={item.title}
                  className="max-w-full max-h-full object-contain rounded-2xl drop-shadow-sm group-hover:scale-[1.02] transition-transform duration-500"
                />
                <div className="absolute inset-0 transition-colors rounded-2xl flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 bg-white/95 text-slate-900 px-4 py-2 rounded-full font-bold text-xs shadow-lg backdrop-blur-sm transition-all duration-300 flex items-center gap-2 translate-y-2 group-hover:translate-y-0">
                    คลิกซูมภาพ
                  </div>
                </div>
              </div>
            ) :
              (
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

            <div className="mb-4">
              <div className="flex flex-wrap gap-2.5 mb-3">
                {aiBrand && <span className="px-3 py-1 bg-white text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100 shadow-sm">🏷️ {aiBrand}</span>}
                {aiColor && <span className="px-3 py-1 bg-white text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100 shadow-sm">🎨 สี{aiColor}</span>}
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-8">
              {item.title}
            </h1>

            <div className="flex flex-col gap-4 mb-8">
              {/* Location Card */}
              <div className="flex items-start gap-4 p-5 bg-slate-50/70 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className={`bg-white p-2.5 rounded-xl shrink-0 shadow-sm border border-slate-100`}>
                  <MapPin className={`text-${themeColor}-500`} size={20} />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    {isFound ? 'สถานที่พบเจอ' : 'สถานที่คาดว่าทำหาย'}
                  </h4>

                  {/* บรรทัดหลัก (ตัวหนา) - โชว์อาคาร */}
                  <p className="text-slate-900 font-bold text-sm leading-snug">
                    {mainLocation}
                  </p>

                  {/* บรรทัดรอง (ตัวเทาบาง) - โชว์ชั้นและห้อง */}
                  {subLocation && (
                    <p className="text-xs text-slate-500 mt-1.5 font-medium">
                      {subLocation}
                    </p>
                  )}
                </div>
              </div>

              {/* Time Card */}
              <div className="flex items-start gap-4 p-5 bg-slate-50/70 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className={`bg-white p-2.5 rounded-xl shrink-0 shadow-sm border border-slate-100`}>
                  <Clock className={`text-${themeColor}-500`} size={20} />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{isFound ? 'วันและเวลาที่พบ' : 'เวลาที่คาดว่าหาย'}</h4>
                  <p className="text-slate-900 font-bold text-sm leading-snug">
                    {item.date_found || item.date_lost 
                      ? new Date(item.date_found || item.date_lost).toLocaleDateString("th-TH", { year: 'numeric', month: 'short', day: 'numeric' })
                      : "ไม่ระบุ"
                    }
                  </p>
                  <p className="text-slate-500 font-medium text-xs mt-1">
                    เวลา {item.date_found || item.date_lost
                      ? new Date(item.date_found || item.date_lost).toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit' })
                      : "ไม่ระบุ"
                    } น.
                  </p>
                </div>
              </div>
            </div>


            {/* Description */}
            <div className="mb-10">
              <h4 className={`text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5 pl-1`}>
                <Info size={14} className="text-slate-400" /> รายละเอียด
              </h4>
              <div className={`text-sm leading-relaxed p-5 rounded-2xl border ${descriptionText ? 'bg-slate-50 text-slate-700 border-slate-200 shadow-sm' : 'bg-slate-50/50 text-slate-400 border-slate-200 border-dashed italic'}`}>
                {descriptionText ? descriptionText : 'ไม่ได้ระบุรายละเอียดเพิ่มเติม'}
              </div>
            </div>

            {/* 🎯 Action Buttons */}
            <div className="mt-auto pt-6">
              {!statusActive ? (
                <div className="w-full py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl flex items-center justify-center gap-2 text-sm">
                  <Check size={18} /> {isFound ? 'สิ่งของชิ้นนี้ถูกส่งคืนเจ้าของแล้ว' : 'ปิดประกาศสำเร็จแล้ว'}
                </div>
              ) : isOwner ? ( // ถ้าเป็นประกาศของคุณเอง
                <button onClick={() => setIsUpdateModalOpen(true)} className={`w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-md hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-base`}>
                  <PlusCircle size={20} /> เพิ่มรายละเอียดเพิ่มเติม
                </button>
              ) : isFound ? ( // ถ้าเป็นของที่คนอื่นเจอ (Found) -> ให้กดขอยืนยันสิทธิ์
                hasClaimed ? (
                  <div className={`w-full py-4 bg-${buttonColor}-50 text-${buttonColor}-600 font-bold rounded-2xl border border-${buttonColor}-200 flex items-center justify-center gap-2 text-sm`}>
                    <ShieldCheck size={18} /> ส่งคำขอยืนยันสิทธิ์แล้ว
                  </div>
                ) : (
                  <button onClick={handleOpenClaim} className={`w-full py-4 bg-${buttonColor}-600 text-white font-bold rounded-2xl shadow-md hover:bg-${buttonColor}-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-base`}>
                    <ShieldCheck size={20} /> ยืนยันสิทธิ์ขอรับของคืน
                  </button>
                )
              ) : ( // ถ้าเป็นของที่คนอื่นทำหาย (Lost) -> ให้กดแจ้งเบาะแส
                <Link href={`/found?ref=${id}`} className={`w-full py-4 bg-${buttonColor}-600 text-white font-bold rounded-2xl shadow-md hover:bg-${buttonColor}-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-base`}>
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