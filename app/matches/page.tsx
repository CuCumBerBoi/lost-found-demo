"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";
import {
  Sparkles,
  Clock,
  SearchX,
  PackageSearch,
  MapPin,
  Check,
  Search,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  ArrowRight
} from "lucide-react";

interface LostItem {
  id?: string; 
  lost_id?: string;
  title: string;
  building?: string;
  floor?: string;
  room?: string;
  location_text: string;
  date_lost: string;
  description: string;
  category_id: string;
  user_id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ai_metadata?: any;
}

interface FoundItem {
  id?: string; 
  found_id?: string;
  title: string;
  building?: string;
  floor?: string;
  room?: string;
  location_text: string;
  date_found: string;
  image_url: string | null;
  category_id: string;
  user_id: string;
  ai_metadata?: Record<string, unknown>;
}

interface Match {
  id: string;
  title: string;
  location: string;
  time: string;
  imageUrl: string | null;
  matchScore: number;
  matchReason: string[];
}

// ==========================================
// 🚀 Main Page Component
// ==========================================
export default function MatchingPage() {
  const supabase = createClient();

  const [myLostItems, setMyLostItems] = useState<LostItem[]>([]);
  const [matches, setMatches] = useState<Record<string, Match[]>>({});
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // 🧠 ระบบ AI Matching Algorithm (เวอร์ชันสกัดจับขั้นเด็ดขาด)
  const calculateMatchScore = (lost: LostItem, found: FoundItem) => {
    let score = 0; 
    const reasons: string[] = [];

    // --- 1. ตรวจสอบวันที่ ---
    const lostDate = new Date(lost.date_lost);
    const foundDate = new Date(found.date_found);
    const diffDays = Math.ceil((foundDate.getTime() - lostDate.getTime()) / (1000 * 60 * 60 * 24));

    // 🛑 ปัดตก 1: ถ้าเจอของ "ก่อน" ที่จะทำหายเกิน 3 วัน (เป็นไปไม่ได้) ปัดตกทันที
    if (diffDays < -3) return { score: 0, reason: [] };

    // ฟังก์ชันแปลงค่า AI Metadata ให้เป็น Array เพื่อให้เช็คได้แม่นยำขึ้น
    const getValidArray = (val: unknown): string[] => {
      if (!val) return [];
      if (typeof val === "string") {
        return val === "ไม่ระบุ" || val.trim() === "" ? [] : val.toLowerCase().split(/[\s,]+/);
      }
      if (Array.isArray(val)) {
        return val.map(v => String(v).toLowerCase()).filter(v => v !== "ไม่ระบุ" && v.trim() !== "");
      }
      return [];
    };

    const lostAI = (lost.ai_metadata || {}) as Record<string, unknown>;
    const foundAI = (found.ai_metadata || {}) as Record<string, unknown>;

    const lostBrands = getValidArray(lostAI.brand);
    const foundBrands = getValidArray(foundAI.brand);
    const lostColors = getValidArray(lostAI.color);
    const foundColors = getValidArray(foundAI.color);

    // 🛑 ปัดตก 2: เช็คยี่ห้อ (ถ้ามีทั้งคู่ แต่คนละยี่ห้อ ปัดตกทันที)
    if (lostBrands.length > 0 && foundBrands.length > 0) {
      const hasBrandMatch = lostBrands.some(lb => foundBrands.some(fb => fb.includes(lb) || lb.includes(fb)));
      if (!hasBrandMatch) return { score: 0, reason: [] };
    }

    // 🛑 ปัดตก 3: เช็คสี (ถ้ามีสีทั้งคู่ แต่สีไม่เกี่ยวข้องกันเลย ปัดตกทันที)
    if (lostColors.length > 0 && foundColors.length > 0) {
      const hasColorMatch = lostColors.some(lc => foundColors.some(fc => fc.includes(lc) || lc.includes(fc)));
      if (!hasColorMatch) return { score: 0, reason: [] };
    }

    // --- 🎯 เริ่มการให้คะแนน (Scoring) ---
    let hasSpecificMatch = false; 

    // 🕒 เวลา
    if (diffDays >= -3 && diffDays <= 7) {
      score += 15;
      reasons.push("ช่วงเวลาใกล้เคียง");
    }

    // 🏷️ ยี่ห้อ
    if (lostBrands.length > 0 && foundBrands.length > 0) {
      score += 35;
      hasSpecificMatch = true;
      reasons.push("ยี่ห้อตรงกัน");
    }

    // 🎨 สี
    if (lostColors.length > 0 && foundColors.length > 0) {
      score += 20;
      hasSpecificMatch = true;
      reasons.push("สีตรงกัน");
    }

    // 📝 ชื่อสิ่งของ
    const lostTitle = lost.title.toLowerCase();
    const foundTitle = found.title.toLowerCase();
    
    if (foundTitle === lostTitle || foundTitle.includes(lostTitle) || lostTitle.includes(foundTitle)) {
      score += 30;
      hasSpecificMatch = true; 
      reasons.push("ลักษณะสิ่งของตรงกัน");
    } else {
      const lostWords = lostTitle.split(/\s+/).filter(w => w.length > 2);
      let matchCount = 0;
      for (const lw of lostWords) {
        if (foundTitle.includes(lw)) matchCount++;
      }
      if (matchCount > 0) {
        score += Math.min(matchCount * 10, 20); 
        if (matchCount >= 2) hasSpecificMatch = true; 
        reasons.push("ชื่อมีส่วนประกอบคล้ายกัน");
      }
    }

    // 📍 สถานที่
    if (lost.building && found.building && lost.building !== "อื่นๆ" && lost.building === found.building) {
      score += 20;
      reasons.push("อาคารเดียวกัน");
      if (lost.floor && found.floor && lost.floor !== "ไม่ระบุ" && lost.floor === found.floor) {
        score += 10;
        reasons.push("ชั้นเดียวกัน");
      }
    }

    // 🛑 ปัดตก 4: ถ้าไม่มีจุดไหนที่เจาะจงตรงกันเลย หรือคะแนนไม่ถึง 50 ปัดตก
    if (!hasSpecificMatch || score < 50) return { score: 0, reason: [] };

    return {
      score: Math.min(score, 99), 
      reason: reasons
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
            const currentLostId = lostItem.id || (lostItem as { lost_id?: string }).lost_id || "";

            let query = supabase
              .from("found_items")
              .select("*")
              .in("status", ["AVAILABLE", "available"])
              .neq("user_id", user.id)
              .limit(100);

            if (lostItem.category_id && lostItem.category_id.trim() !== "") {
              query = query.eq("category_id", lostItem.category_id);
            }

            const { data: foundItems, error: foundError } = await query;

            if (foundError) {
              console.error("Supabase Query Error (Found Items):", foundError);
              throw foundError;
            }

            const evaluatedMatches = (foundItems || []).map((item: FoundItem) => {
              const { score, reason } = calculateMatchScore(lostItem as LostItem, item);
              
              const locParts = [];
              if (item.building) locParts.push(`${item.building}`);
              if (item.floor) locParts.push(`ชั้น ${String(item.floor).replace(/^ชั้น\s*/, '')}`);
              if (item.room) locParts.push(`ห้อง ${String(item.room).replace(/^(ห้อง|ชั้น)\s*/, '')}`);
              const finalLoc = locParts.length > 0 ? locParts.join(" ") : (item.location_text || "ไม่ระบุ");

              return {
                id: item.id || (item as { found_id?: string }).found_id || "",
                title: item.title,
                location: finalLoc,
                time: new Date(item.date_found).toLocaleDateString("th-TH"),
                imageUrl: item.image_url,
                matchScore: score,
                matchReason: reason,
              };
            }).sort((a, b) => b.matchScore - a.matchScore); 

            // กรองเอาเฉพาะที่คะแนน > 0
            const validMatches = evaluatedMatches.filter(m => m.matchScore > 0).slice(0, 5);
            
            if (currentLostId) {
              matchesData[currentLostId] = validMatches;
              // กางออกเฉพาะอันที่มีรายการจับคู่
              initialExpanded[currentLostId] = validMatches.length > 0;
            }
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

  // if (loading) {
  //   return (
  //     <div className='min-h-screen bg-[#FAFAFA] flex items-center justify-center pt-20'>
  //       <div className='text-center'>
  //         <div className='w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4'></div>
  //         <p className='text-slate-500 font-medium'>AI กำลังประมวลผลการจับคู่...</p>
  //       </div>
  //     </div>
  //   );
  // }

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

      <main className='max-w-4xl mx-auto pt-28 sm:pt-32 pb-24 sm:pb-20 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-700'>
        
        {/* 🌟 Header Section */}
        <div className='mb-8 sm:mb-12 text-center sm:text-left'>
          <h1 className='text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex flex-col sm:flex-row items-center justify-center sm:justify-start'>
            <Sparkles className='text-indigo-600 mb-2 sm:mb-0 sm:mr-3' size={32} />
            รายการสิ่งของที่ลักษณะใกล้เคียง
          </h1>
          <p className='text-slate-500 text-sm sm:text-base mt-3 sm:mt-4 max-w-2xl font-medium leading-relaxed'>
            ระบบได้ช่วยเปรียบเทียบข้อมูลให้อัตโนมัติ และพบสิ่งของที่คล้ายกับสิ่งของที่คุณตามหา ! 
            <br/>คุณลองตรวจสอบดูว่าในรายการเหล่านี้ มีชิ้นไหนที่คล้ายกับของคุณหรือไม่
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
              const currentLostId = lostItem.id || (lostItem as { lost_id?: string }).lost_id || `lost-${index}`;
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
                              ระบบกำลังตรวจสอบ...
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
                          <p className='text-sm text-slate-500 max-w-sm font-medium mb-6'>
                            ระบบกำลังทำงานและจะแจ้งเตือนคุณทันทีที่มีคนพบของที่มีลักษณะตรงกับของคุณ
                          </p>
                        </div>
                      ) : (
                        <div className='space-y-5 sm:space-y-6'>
                          <div className='flex items-center text-slate-700 font-bold mb-2 ml-1'>
                            {/* <Sparkles size={18} className='text-amber-500 mr-2' /> */}
                            สิ่งของที่ตรวจพบว่าน่าจะตรงกับของคุณ
                          </div>

                          {itemMatches.map((match) => {
                            return (
                              <div key={match.id} className='relative bg-white border border-slate-200 rounded-[2rem] p-4 sm:p-5 lg:p-6 overflow-hidden hover:border-indigo-300 transition-colors shadow-sm group'>
                                
                                <div className='flex flex-col sm:flex-row gap-5 sm:gap-6 mt-2'>
                                  {/* Image */}
                                  <div className='w-full sm:w-40 lg:w-48 aspect-[4/3] sm:aspect-square bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100 shrink-0 relative overflow-hidden'>
                                    {match.imageUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={match.imageUrl} alt={match.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                      <>
                                        <ImageIcon size={32} className='text-slate-300 mb-2' />
                                        <span className='text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center px-4'>ผู้พบเจอไม่ได้แนบรูป<br/>โปรดดูจากสถานที่</span>
                                      </>
                                    )}
                                  </div>

                                  {/* Details */}
                                  <div className='flex-1 flex flex-col'>
                                    <h4 className='font-bold text-lg sm:text-xl text-slate-900 mb-3 leading-tight'>{match.title}</h4>
                                    
                                    <div className="space-y-1.5 mb-4">
                                      <p className='text-sm text-slate-600 flex items-start font-medium'>
                                        <MapPin size={14} className='mr-2 mt-[2px] text-slate-400 shrink-0' />
                                        <span className='line-clamp-2 leading-relaxed'>{match.location}</span>
                                      </p>
                                      <p className='text-sm text-slate-600 flex items-center font-medium'>
                                        <Clock size={14} className='mr-2 text-slate-400 shrink-0' />
                                        พบเมื่อ {match.time}
                                      </p>
                                    </div>

                                    {/* ✅ AI Analysis Reason - ปรับเป็น Tags */}
                                    {/* <div className='bg-indigo-50/40 rounded-2xl p-4 mb-5 border border-indigo-100/50 relative'>
                                      <div className='text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2 flex items-center'>
                                        <Sparkles size={12} className='mr-1.5' /> การวิเคราะห์จากระบบ
                                      </div>
                                      <div className='flex flex-wrap gap-1.5'>
                                        {match.matchReason.map((reason, idx) => (
                                          <span key={idx} className="bg-white border border-indigo-100 text-indigo-600 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold shadow-sm">
                                            ✓ {reason}
                                          </span>
                                        ))}
                                      </div>
                                    </div> */}

                                    {/* ✅ AI Analysis Reason - ปรับเป็น Tags สไตล์ Minimal */}
                                    <div className='mt- pt-4 border-t border-slate-100'>
                                      <div className='text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center'>
                                        <Sparkles size={14} className='text-indigo-500 mr-1.5' /> 
                                        การวิเคราะห์จากระบบ
                                      </div>
                                      <div className='flex flex-wrap gap-2'>
                                        {match.matchReason.map((reason, idx) => (
                                          <span 
                                            key={idx} 
                                            className="inline-flex items-center bg-slate-50 border border-slate-200/60 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-medium"
                                          >
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2 shrink-0"></span>
                                            {reason}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Actions - ✅ เปลี่ยนเป็นปุ่ม Link ไปดูรายละเอียดแทนการกด Claim ตรงนี้ */}
                                    <div className='mt-auto flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-50'>
                                      <Link
                                        href={`/item/${match.id}`}
                                        className='flex-1 px-4 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center text-sm shadow-sm bg-slate-900 text-white hover:bg-slate-800 hover:shadow-[0_6px_16px_rgba(0,0,0,0.15)] active:scale-95'
                                      >
                                        ดูรายละเอียด <ArrowRight size={18} className='ml-2' />
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
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