"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-client";
import {
  Sparkles,
  Clock,
  SearchX,
  ShieldCheck,
  X,
  PackageSearch,
  MapPin,
  UploadCloud,
  Check,
  Search,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
} from "lucide-react";

interface LostItem {
  id?: string; 
  lost_id?: string;
  title: string;
  location_text: string;
  date_lost: string;
  description: string;
  category_id: string;
  user_id: string;
  ai_metadata?: any;
}

interface FoundItem {
  id?: string; 
  found_id?: string;
  title: string;
  location_text: string;
  date_found: string;
  image_url: string | null;
  category_id: string;
  user_id: string;
  ai_metadata?: any;
}

interface Match {
  id: string;
  title: string;
  location: string;
  time: string;
  imageUrl: string | null;
  matchScore: number;
  matchReason: string;
}

// ==========================================
// 🛡️ ClaimModal Component
// ==========================================
interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: Match | null;
  showToast: (msg: string) => void;
}

const ClaimModal = ({
  isOpen,
  onClose,
  matchData,
  showToast,
}: ClaimModalProps) => {
  const [proofDesc, setProofDesc] = useState("");
  const [uploadedProofs, setUploadedProofs] = useState<{ url: string; file: File }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !matchData) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (uploadedProofs.length >= 3) {
      showToast("อัปโหลดหลักฐานได้สูงสุด 3 รูป");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setUploadedProofs((prev) => [
        ...prev,
        { url: reader.result as string, file },
      ]);
    };
  };

  const handleClaimSubmit = async () => {
    if (!proofDesc.trim() && uploadedProofs.length === 0) {
      showToast("กรุณากรอกรายละเอียดสิ่งของ หรืออัปโหลดรูปภาพหลักฐาน");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("กรุณาเข้าสู่ระบบ");

      // 1. อัปโหลดรูปหลักฐานลง Storage 
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

      // 2. บันทึกข้อมูลลงตาราง claims
      const { error } = await supabase.from("claims").insert({
        found_id: matchData.id,
        claimer_id: user.id,
        proof_desc: proofDesc,
        proof_images: uploadedUrls,
        status: "PENDING",
      });

      if (error) {
        if (error.code === "23505") throw new Error("คุณได้ส่งคำขอรับของคืนสำหรับชิ้นนี้ไปแล้ว");
        throw error;
      }

      showToast("ส่งคำขอเรียบร้อย Admin จะตรวจสอบหลักฐานของคุณโดยเร็ว");
      setProofDesc("");
      setUploadedProofs([]);
      setTimeout(onClose, 1500);

    } catch (error: any) {
      showToast("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4'>
      <div className='bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200'>
        <div className='bg-indigo-600 p-5 sm:p-6 flex justify-between items-center text-white'>
          <div>
            <h3 className='text-lg sm:text-xl font-bold flex items-center'>
              <ShieldCheck className='mr-2' /> ขอยืนยันสิทธิ์รับของคืน
            </h3>
            <p className='text-indigo-100 text-xs sm:text-sm mt-1 font-medium'>
              ส่งหลักฐานให้ Admin ตรวจสอบเพื่อความปลอดภัย
            </p>
          </div>
          <button type="button" title="ปิด" onClick={onClose} className='p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors'>
            <X size={20} />
          </button>
        </div>

        <div className='p-5 sm:p-6'>
          <div className='bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6 flex items-center shadow-sm'>
            <div className='w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mr-4 shrink-0'>
              <PackageSearch size={24} />
            </div>
            <div className="overflow-hidden">
              <p className='text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5'>
                กำลังทำรายการสำหรับ
              </p>
              <h4 className='font-bold text-slate-900 text-base sm:text-lg truncate'>
                {matchData.title}
              </h4>
              <p className='text-xs text-slate-500 mt-0.5 truncate'>
                <MapPin size={12} className='inline mr-1 text-slate-400' />
                {matchData.location}
              </p>
            </div>
          </div>

          <div className='space-y-5'>
            <div>
              <label className='block text-sm font-semibold text-slate-700 mb-2'>
                คำอธิบายรายละเอียดสิ่งของ <span className='text-rose-500'>*</span>
              </label>
              <textarea
                value={proofDesc}
                onChange={(e) => setProofDesc(e.target.value)}
                rows={3}
                className='w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors outline-none text-slate-800 text-sm leading-relaxed resize-none'
                placeholder='เช่น รหัสผ่านหน้าจอคือ 1234, มีรอยขาดเล็กๆ ด้านในช่องใส่เหรียญ...'
              ></textarea>
            </div>

            <div>
              <label htmlFor="proof-image" className='block text-sm font-semibold text-slate-700 mb-2'>
                รูปภาพหลักฐานอ้างอิง
              </label>
              <div className='flex gap-3 overflow-x-auto pb-2'>
                <input id="proof-image" title="อัปโหลดรูปภาพหลักฐาน" type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                
                {uploadedProofs.map((img, i) => (
                  <div key={i} className='w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 relative shrink-0 group overflow-hidden'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} className="w-full h-full object-cover" alt="proof" />
                    <button
                      title="ลบรูป"
                      type="button"
                      className='absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10'
                      onClick={() => setUploadedProofs(uploadedProofs.filter((_, idx) => idx !== i))}
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  </div>
                ))}

                {uploadedProofs.length < 3 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className='w-20 h-20 sm:w-24 sm:h-24 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-colors shrink-0'
                  >
                    <UploadCloud size={20} className='mb-1' />
                    <span className='text-[10px] font-bold'>แนบรูป/ใบเสร็จ</span>
                  </button>
                )}
              </div>
              <p className='text-xs text-slate-500 mt-2 font-medium'>ภาพใบเสร็จ, กล่องสินค้า, หรือภาพถ่ายของคุณกับสิ่งของ (สูงสุด 3 รูป)</p>
            </div>
          </div>
        </div>

        <div className='p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row justify-end gap-3'>
          <button onClick={onClose} className='px-5 py-3 sm:py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors text-sm text-center w-full sm:w-auto'>
            ยกเลิก
          </button>
          <button
            onClick={handleClaimSubmit}
            disabled={isSubmitting}
            className={`px-6 py-3 sm:py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-[0_4px_12px_rgb(99,102,241,0.2)] hover:bg-indigo-700 transition-all text-sm flex items-center justify-center w-full sm:w-auto ${isSubmitting ? "opacity-80" : "hover:-translate-y-0.5 active:scale-95"}`}
          >
            {isSubmitting && <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2'></div>}
            {isSubmitting ? "กำลังส่งข้อมูล..." : "ส่งคำขอให้ Admin ตรวจสอบ"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 🚀 Main Page Component
// ==========================================
export default function MatchingPage() {
  const supabase = createClient();

  const [myLostItems, setMyLostItems] = useState<LostItem[]>([]);
  const [matches, setMatches] = useState<Record<string, Match[]>>({});
  const [loading, setLoading] = useState(true);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedMatchData, setSelectedMatchData] = useState<Match | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // 🧠 ระบบ AI Matching Algorithm
  const calculateMatchScore = (lost: LostItem, found: FoundItem) => {
    let score = 50; 
    const reasons: string[] = ["อยู่ในหมวดหมู่เดียวกันและใกล้เคียงกับช่วงเวลาที่คุณทำหาย"];

    const lostAI = lost.ai_metadata || {};
    const foundAI = found.ai_metadata || {};

    // สีตรงกัน
    if (lostAI.color && foundAI.color && lostAI.color !== "ไม่ระบุ") {
      if (lostAI.color.includes(foundAI.color) || foundAI.color.includes(lostAI.color)) {
        score += 20;
        reasons.push(`มีสีตรงกัน (${foundAI.color})`);
      }
    }

    // ยี่ห้อตรงกัน
    if (lostAI.brand && foundAI.brand && lostAI.brand !== "ไม่ระบุ") {
      if (lostAI.brand.toLowerCase() === foundAI.brand.toLowerCase()) {
        score += 25;
        reasons.push(`ยี่ห้อตรงกัน (${foundAI.brand})`);
      }
    }

    // สถานที่
    if (lost.location_text.includes(found.location_text) || found.location_text.includes(lost.location_text)) {
      score += 15;
      reasons.push("สถานที่พบอยู่บริเวณจุดที่คุณทำหาย");
    }

    return {
      score: Math.min(score, 99), 
      reason: reasons.join(", ")
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = "/login";
          return;
        }

        // 1. Fetch lost items
        const { data: lostItems, error: lostError } = await supabase
          .from("lost_items")
          .select("*")
          .eq("user_id", user.id)
          .in("status", ["ACTIVE", "SEARCHING", "searching"])
          .order("created_at", { ascending: false });

        if (lostError) throw lostError;
        setMyLostItems(lostItems || []);

        const initialExpanded: Record<string, boolean> = {};
        const matchesData: Record<string, Match[]> = {};

        // 2. Fetch matches 
        if (lostItems && lostItems.length > 0) {
          for (const lostItem of lostItems) {
            const currentLostId = lostItem.id || (lostItem as any).lost_id;
            initialExpanded[currentLostId] = true; 

            const { data: foundItems, error: foundError } = await supabase
              .from("found_items")
              .select("*")
              .in("status", ["AVAILABLE", "available"])
              .eq("category_id", lostItem.category_id)
              .neq("user_id", user.id)
              .limit(20); 

            if (foundError) throw foundError;

            // นำมาเข้าอัลกอริทึมคำนวณคะแนน
            const evaluatedMatches = (foundItems || []).map((item: FoundItem) => {
              const { score, reason } = calculateMatchScore(lostItem as LostItem, item);
              return {
                id: item.id || (item as any).found_id,
                title: item.title,
                location: item.location_text,
                time: new Date(item.date_found).toLocaleDateString("th-TH"),
                imageUrl: item.image_url,
                matchScore: score,
                matchReason: reason,
              };
            }).sort((a, b) => b.matchScore - a.matchScore); // 📌 การจัดเรียง (Sorting): นำคะแนนมากที่สุดขึ้นก่อนเสมอ

            // เก็บเฉพาะที่คะแนนผ่านเกณฑ์
            matchesData[currentLostId] = evaluatedMatches.filter(m => m.matchScore > 50).slice(0, 5);
          }
        }
        
        setExpandedItems(initialExpanded);
        setMatches(matchesData);

      } catch (error) {
        console.error("Error fetching matches data:", error);
        showToast("เกิดข้อผิดพลาด: ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const toggleExpand = (id: string) => setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(""), 4000); };
  const handleOpenClaimModal = (match: Match) => { setSelectedMatchData(match); setClaimModalOpen(true); };

  if (loading) {
    return (
      <div className='min-h-screen bg-[#FAFAFA] flex items-center justify-center pt-20'>
        <div className='text-center'>
          <div className='w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-slate-500 font-medium'>AI กำลังประมวลผลการจับคู่...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900'>
      {/* 🚀 Global Toast */}
      {toastMessage && (
        <div className='fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center z-[110] animate-in slide-in-from-bottom-8 fade-in duration-300 w-[90%] max-w-sm sm:max-w-md'>
          <div className='bg-emerald-500 p-1.5 rounded-full mr-3 shrink-0'>
            <Check size={16} className='text-white' strokeWidth={3} />
          </div>
          <span className='font-bold text-sm leading-tight'>{toastMessage}</span>
        </div>
      )}

      <ClaimModal isOpen={claimModalOpen} onClose={() => setClaimModalOpen(false)} matchData={selectedMatchData} showToast={showToast} />

      {/* ✅ แก้ไขจุดทับซ้อน Navbar: ปรับ pt-8 เป็น pt-28 sm:pt-32 */}
      <main className='max-w-4xl mx-auto pt-28 sm:pt-32 pb-24 sm:pb-20 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-700'>
        
        {/* 🌟 Header Section */}
        <div className='mb-8 sm:mb-12 text-center sm:text-left'>
          <h1 className='text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex flex-col sm:flex-row items-center justify-center sm:justify-start'>
            <Sparkles className='text-indigo-600 mb-2 sm:mb-0 sm:mr-3' size={32} />
            รายการสิ่งของที่ลักษณะใกล้เคียงกัน
          </h1>
          <p className='text-slate-500 text-sm sm:text-base mt-3 sm:mt-4 max-w-2xl font-medium leading-relaxed'>
            เราเจอสิ่งของที่คล้ายกับชิ้นที่คุณกำลังตามหา! ระบบได้ช่วยเปรียบเทียบข้อมูลให้อัตโนมัติ ลองตรวจสอบดูว่าในรายการเหล่านี้ มีชิ้นไหนที่ใช่ของคุณหรือไม่"
          </p>
        </div>

        {/* 🗂️ List of Lost Items */}
        {myLostItems.length === 0 ? (
          <div className='text-center py-20 bg-white rounded-[2rem] border border-slate-200 shadow-sm'>
            <SearchX size={48} className='mx-auto text-slate-300 mb-4' />
            <h3 className='text-xl font-bold text-slate-900 mb-2'>ยังไม่มีการแจ้งของหาย</h3>
            <p className='text-slate-500 text-sm font-medium'>เริ่มต้นด้วยการแจ้งของที่สูญหาย เพื่อให้ AI ช่วยค้นหา</p>
          </div>
        ) : (
          <div className='space-y-6 sm:space-y-8'>
            {myLostItems.map((lostItem, index) => {
              // 🔑 ใช้ ID หรือ lost_id กัน Error
              const currentLostId = lostItem.id || (lostItem as any).lost_id || `lost-${index}`;
              const itemMatches = matches[currentLostId] || [];
              const hasMatches = itemMatches.length > 0;
              const isExpanded = expandedItems[currentLostId];

              return (
                <div key={currentLostId} className='bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all duration-300'>
                  {/* Header Accordion */}
                  <div
                    className='p-5 sm:p-6 bg-white cursor-pointer hover:bg-slate-50/80 transition-colors flex items-center justify-between'
                    onClick={() => toggleExpand(currentLostId)}
                  >
                    <div className='flex items-start sm:items-center gap-4'>
                      <div className='w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0'>
                        <Search size={24} className='text-indigo-500' />
                      </div>
                      <div>
                        <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1.5'>
                          <h3 className='font-bold text-lg sm:text-xl text-slate-900'>{lostItem.title}</h3>
                          {hasMatches ? (
                            <span className='inline-flex items-center px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-100 text-emerald-700 w-fit'>
                              พบ {itemMatches.length} รายการที่ใกล้เคียง
                            </span>
                          ) : (
                            <span className='inline-flex items-center px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-slate-100 text-slate-500 w-fit'>
                              กำลังให้ AI สอดส่อง...
                            </span>
                          )}
                        </div>
                        <p className='text-xs sm:text-sm text-slate-500 flex items-center font-medium'>
                          <Clock size={14} className='mr-1.5 text-slate-400' /> แจ้งหายเมื่อ {new Date(lostItem.date_lost).toLocaleDateString("th-TH")}
                        </p>
                      </div>
                    </div>
                    <button className='p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full shrink-0 transition-transform'>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>

                  {/* Body: ผลการจับคู่ */}
                  {isExpanded && (
                    <div className='border-t border-slate-100 bg-slate-50/50 p-4 sm:p-6 lg:p-8'>
                      {!hasMatches ? (
                        <div className='flex flex-col items-center justify-center text-center py-12 px-4 bg-white border border-slate-200 border-dashed rounded-[2rem] shadow-sm'>
                          <div className='w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4'>
                            <PackageSearch size={32} className='text-slate-300' />
                          </div>
                          <h4 className='text-lg font-bold text-slate-700 mb-2'>ยังไม่พบสิ่งของที่ใกล้เคียง</h4>
                          <p className='text-sm text-slate-500 max-w-sm font-medium'>
                            ระบบกำลังทำงานและจะแจ้งเตือนคุณทันทีที่มีคนพบของที่มีลักษณะตรงกับของคุณ
                          </p>
                        </div>
                      ) : (
                        <div className='space-y-5 sm:space-y-6'>
                          <div className='flex items-center text-slate-700 font-bold mb-2 ml-1'>
                            <Sparkles size={18} className='text-amber-500 mr-2' />
                            สิ่งของที่คิดว่าน่าจะเป็นของคุณ
                          </div>

                          {/* รายการถูกเรียงคะแนนมาก->น้อยไว้แล้ว */}
                          {itemMatches.map((match) => (
                            <div key={match.id} className='relative bg-white border border-slate-200 rounded-[2rem] p-4 sm:p-5 lg:p-6 overflow-hidden hover:border-indigo-300 transition-colors shadow-sm group'>
                              
                              {/* ❌ นำเอา Badge บอกเปอร์เซ็นต์ออกตามคำขอ */}

                              <div className='flex flex-col sm:flex-row gap-5 sm:gap-6 mt-2'>
                                {/* Image */}
                                <div className='w-full sm:w-40 lg:w-48 aspect-[4/3] sm:aspect-square bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100 shrink-0 relative overflow-hidden'>
                                  {match.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={match.imageUrl} alt={match.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                  ) : (
                                    <>
                                      <ImageIcon size={32} className='text-slate-300 mb-2' />
                                      <span className='text-[10px] text-slate-400 font-bold uppercase tracking-wider'>ไม่มีรูปภาพ</span>
                                    </>
                                  )}
                                </div>

                                {/* Details */}
                                <div className='flex-1 flex flex-col'>
                                  <h4 className='font-bold text-lg sm:text-xl text-slate-900 mb-3 leading-tight'>{match.title}</h4>
                                  
                                  <div className="space-y-1.5 mb-4">
                                    <p className='text-sm text-slate-600 flex items-center font-medium'>
                                      <MapPin size={14} className='mr-2 text-slate-400 shrink-0' />
                                      <span className='truncate'>{match.location}</span>
                                    </p>
                                    <p className='text-sm text-slate-600 flex items-center font-medium'>
                                      <Clock size={14} className='mr-2 text-slate-400 shrink-0' />
                                      เจอเมื่อ {match.time}
                                    </p>
                                  </div>

                                  {/* AI Analysis Reason */}
                                  <div className='bg-indigo-50/60 rounded-2xl p-4 mb-5 border border-indigo-100/60 relative'>
                                    <div className='text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1.5 flex items-center'>
                                      <Sparkles size={12} className='mr-1.5' /> การวิเคราะห์จากระบบ
                                    </div>
                                    <p className='text-xs sm:text-sm text-slate-700 leading-relaxed font-medium'>
                                      {match.matchReason}
                                    </p>
                                  </div>

                                  {/* Actions */}
                                  <div className='mt-auto flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-50'>
                                    <button
                                      onClick={() => handleOpenClaimModal(match)}
                                      className='flex-1 bg-slate-900 text-white px-4 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.15)] active:scale-95 flex items-center justify-center text-sm'
                                    >
                                      <ShieldCheck size={18} className='mr-2 text-indigo-400' />
                                      ขอยืนยันสิทธิ์รับของคืน
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}