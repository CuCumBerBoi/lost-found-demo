"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Sparkles,
  X,
  UploadCloud,
  Plus,
  ShieldAlert,
  Loader2,
  Building2,
  Layers,
  DoorOpen,
} from "lucide-react";
import { analyzeImage as _analyzeImage } from "@/app/actions/gemini";
import Link from "next/link";

interface UploadedImage {
  id: number;
  url: string;
  file?: File;
}

interface AIMetadata {
  color: string;
  brand: string;
  type: string;
}

interface FormData {
  title: string;
  category_id: string;
  building: string;
  room: string;
  location_text: string;
  date_lost: string;
  description: string;
}

export default function ReportLostPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [aiMetadata, setAiMetadata] = useState<AIMetadata | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    category_id: "",
    building: "",
    room: "",
    location_text: "",
    date_lost: "", // จะถูกเซ็ตค่าใน useEffect ด้านล่าง
    description: "",
  });

  // 1. ตั้งค่าเวลาเริ่มต้นให้เป็นเวลาปัจจุบัน และดึงหมวดหมู่
  useEffect(() => {
    // เซ็ตเวลาปัจจุบัน (ปรับ Timezone ให้ตรงกับเครื่องผู้ใช้)
    const setInitialTime = () => {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setFormData((prev) => ({
        ...prev,
        date_lost: now.toISOString().slice(0, 16)
      }));
    };
    setInitialTime();

    // ดึงหมวดหมู่จาก Supabase
    const fetchCategories = async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      if (data) setCategories(data);
    };
    fetchCategories();
  }, [supabase]);

  // จัดการอัปโหลดรูปอ้างอิงและส่งให้ AI (ไม่บังคับอัปโหลด)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (uploadedImages.length >= 5) {
      toast.error("อัปโหลดรูปภาพอ้างอิงได้สูงสุด 5 รูป");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64String = reader.result as string;

      setUploadedImages((prev) => [
        ...prev,
        { id: Date.now(), url: base64String, file },
      ]);

      // วิเคราะห์รูปแรกที่อัปโหลด
      if (!aiMetadata && !analyzing) {
        setAnalyzing(true);
        const toastId = toast.loading("Gemini AI กำลังวิเคราะห์รูปอ้างอิง...");

        try {
          const aiResult = await _analyzeImage(base64String);

          if (aiResult) {
            const matchedCategory = categories.find((c) => c.name === aiResult.category_name);
            const catId = matchedCategory?.category_id || matchedCategory?.id || "";

            setAiMetadata(aiResult.ai_metadata);
            setFormData((prev) => ({
              ...prev,
              title: aiResult.title || prev.title,
              description: aiResult.description || prev.description,
              category_id: catId,
            }));
            toast.success("ดึงข้อมูลจากรูปภาพสำเร็จ!", { id: toastId });
          } else {
            toast.error("วิเคราะห์ข้อมูลไม่ได้ กรุณากรอกด้วยตัวเอง", { id: toastId });
          }
        } catch (error) {
          console.error(error);
          toast.error("การเชื่อมต่อ AI ขัดข้อง", { id: toastId });
        } finally {
          setAnalyzing(false);
        }
      }
    };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, index) => index !== indexToRemove));
    if (uploadedImages.length <= 1) {
      setAiMetadata(null);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.category_id || !formData.building || !formData.room) {
      toast.error("กรุณากรอก ชื่อสิ่งของ หมวดหมู่ อาคาร และชั้น ให้ครบถ้วน");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("กรุณาเข้าสู่ระบบก่อนแจ้งของหาย");
        router.push("/login");
        return;
      }

      let uploadedUrls: string[] = [];

      // อัปโหลดรูปภาพขึ้น Supabase Storage (ถ้ามีการอัปโหลด)
      if (uploadedImages.length > 0) {
        const uploadPromises = uploadedImages.map(async (img) => {
          if (!img.file) return img.url;
          const fileExt = img.file.name.split(".").pop();
          const fileName = `lost_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage.from("items").upload(filePath, img.file);
          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage.from("items").getPublicUrl(filePath);
          return publicUrl;
        });
        uploadedUrls = await Promise.all(uploadPromises);
      }

      // บันทึกข้อมูลลงตาราง lost_items
      const { error } = await supabase.from("lost_items").insert({
        title: formData.title,
        description: formData.description,
        building: formData.building,
        room: formData.room,
        location_text: formData.location_text,
        category_id: formData.category_id,
        date_lost: formData.date_lost || new Date().toISOString(),
        user_id: user.id,
        image_url: uploadedUrls.length > 0 ? uploadedUrls[0] : null,
        images: uploadedUrls,
        ai_metadata: aiMetadata,
        status: "SEARCHING", 
      });

      if (error) throw error;

      toast.success("ประกาศตามหาสำเร็จ! ระบบกำลังค้นหาคู่ที่ตรงกัน (Match)");
      router.push("/matches");
    } catch (error: any) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-rose-100 selection:text-rose-900'>
      <main className='max-w-4xl mx-auto pt-24 sm:pt-32 pb-24 sm:pb-20 px-4 sm:px-6 lg:px-8 animate-in slide-in-from-bottom-8 duration-700'>
        
        {/* 🌟 Header Section */}
        <div className='text-center mb-8 sm:mb-12'>
          {/* <div className='inline-flex items-center space-x-1.5 sm:space-x-2 bg-rose-50 text-rose-600 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold mb-4 border border-rose-100'>
            <Search size={14} className='sm:w-4 sm:h-4' />
            <span>ประกาศตามหาสิ่งของ</span>
          </div> */}
          <h1 className='text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-3'>
            แจ้งข้อมูลสิ่งของที่สูญหาย
          </h1>
          <p className='text-slate-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed px-2 font-medium'>
            ระบุรายละเอียด หรืออัปโหลดภาพอ้างอิงสิ่งของที่หาย (ถ้ามี) 
            เพื่อให้ระบบช่วยวิเคราะห์ข้อมูลและนำไปจับคู่กับสิ่งของที่มีคนพบเจอได้อย่างแม่นยำ
          </p>
        </div>

        {/* 📸 Image Upload Section (Optional) */}
        <div className='mb-8 sm:mb-10'>
          <input
            type='file'
            accept='image/*'
            className='hidden'
            ref={fileInputRef}
            onChange={handleImageUpload}
            title="อัปโหลดรูปภาพ"
          />

          {uploadedImages.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className='relative overflow-hidden rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 text-center transition-all duration-300 cursor-pointer active:scale-[0.98] flex flex-col items-center justify-center min-h-[200px] sm:min-h-[240px] border-2 border-dashed border-slate-300 bg-white hover:bg-rose-50/50 hover:border-rose-300 group shadow-sm'
            >
              <div className='w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 shadow-sm rounded-full flex items-center justify-center mb-4 sm:mb-5 border border-slate-100 group-hover:scale-110 transition-transform duration-300'>
                <UploadCloud className='text-rose-400' size={32} strokeWidth={1.5} />
              </div>
              <h3 className='text-lg sm:text-xl font-bold text-slate-800 mb-1.5'>
                อัปโหลดรูปภาพ<span className="text-slate-400 font-medium text-sm ml-1">(ไม่บังคับ)</span>
              </h3>
              <p className='text-slate-500 mb-4 text-xs sm:text-sm font-medium'>
                สูงสุด 5 รูป (ขนาดไม่เกิน 10MB)
              </p>
            </div>
          ) : analyzing ? (
            <div className='relative overflow-hidden rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 text-center border-2 border-indigo-400 bg-indigo-50/50 shadow-[0_0_40px_rgba(99,102,241,0.2)] flex flex-col items-center justify-center min-h-[200px] sm:min-h-[240px]'>
              <div className='absolute inset-0 bg-gradient-to-tr from-indigo-100/50 to-rose-100/50 animate-pulse'></div>
              <div className='relative z-10 flex flex-col items-center'>
                <Sparkles className='text-indigo-600 animate-spin relative mb-4 sm:mb-6' size={40} strokeWidth={1.5} />
                <h3 className='text-lg sm:text-2xl font-bold text-slate-900 mb-2'>Gemini AI วิเคราะห์ภาพ...</h3>
                <p className='text-indigo-600 font-medium text-xs sm:text-sm'>กำลังสกัดข้อมูลลักษณะสิ่งของ โปรดรอสักครู่</p>
              </div>
            </div>
          ) : (
            <div className='bg-rose-50/50 border-2 border-rose-200 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 lg:p-8 relative overflow-hidden'>
              <div className='absolute top-0 right-0 bg-rose-500 text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-bl-xl sm:rounded-bl-2xl font-bold text-xs sm:text-sm flex items-center shadow-sm'>
                <Sparkles size={12} className='mr-1' /> วิเคราะห์สำเร็จ
              </div>

              <div className='flex gap-3 sm:gap-4 overflow-x-auto pb-2 px-2 mt-6 sm:mt-8 -mx-2 pt-2'>
                {uploadedImages.map((img, i) => (
                  /* ✅ นำ overflow-hidden ออกจากกรอบครอบภาพ เพื่อให้ปุ่ม X ไม่โดนตัด */
                  <div key={i} className='w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center border border-slate-200 relative shrink-0 shadow-sm group'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt='Uploaded reference' className='w-full h-full object-cover rounded-xl sm:rounded-2xl' />
                    
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveImage(i); }}
                      className='absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1.5 shadow-md hover:bg-rose-600 transition-all hover:scale-110 z-10 active:scale-95'
                      title="ลบรูปภาพ"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                ))}

                {uploadedImages.length < 5 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className='w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-white border-2 border-dashed border-slate-300 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:bg-rose-50 hover:border-rose-400 hover:text-rose-600 transition-colors shrink-0 active:scale-95'
                  >
                    <Plus size={20} className='mb-1' />
                    <span className='text-[10px] sm:text-xs font-bold'>เพิ่มรูป</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 📝 Form Section */}
        <div className='bg-white rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-5 sm:p-8 lg:p-10 transition-all duration-700 relative overflow-hidden'>
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-pink-500"></div>

          <div className='space-y-5 sm:space-y-8'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8'>
              <div>
                <label className='block text-sm font-bold text-slate-700 mb-2'>
                  หมวดหมู่ <span className='text-rose-500'>*</span>
                </label>
                {/* ✅ ใช้ placeholder:font-normal เพื่อให้ข้อความตัวอย่างดูบางลง */}
                <select
                  name='category_id'
                  title="หมวดหมู่"
                  value={formData.category_id}
                  onChange={handleChange}
                  className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all outline-none text-sm font-medium ${!formData.category_id ? "text-slate-400 font-normal" : "text-slate-800"}`}
                >
                  <option value='' disabled>เลือกหมวดหมู่...</option>
                  {categories.map((cat, idx) => {
                    const catId = cat.category_id || cat.id || `fallback-cat-${idx}`;
                    return <option key={catId} value={catId}>{cat.name}</option>;
                  })}
                </select>
              </div>

              <div>
                <label className='block text-sm font-bold text-slate-700 mb-2'>
                  ลักษณะ <span className="text-slate-400 font-normal text-xs ml-1">(ระบบช่วยวิเคราะห์)</span>
                </label>
                <div className='w-full min-h-[48px] sm:min-h-[52px] px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center flex-wrap gap-2'>
                  {aiMetadata ? (
                    <>
                      {aiMetadata.color && <span className='px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded text-[10px] sm:text-xs font-bold'>{aiMetadata.color}</span>}
                      {aiMetadata.brand && aiMetadata.brand !== "ไม่ระบุ" && <span className='px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded text-[10px] sm:text-xs font-bold'>{aiMetadata.brand}</span>}
                      {aiMetadata.type && <span className='px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded text-[10px] sm:text-xs font-bold'>{aiMetadata.type}</span>}
                    </>
                  ) : (
                    <span className='text-sm text-slate-400 font-normal'>
                      -
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className='block text-sm font-bold text-slate-700 mb-2'>
                ชื่อสิ่งของ <span className='text-rose-500'>*</span>
              </label>
              {/* ✅ เพิ่ม placeholder:font-normal placeholder:text-slate-400 */}
              <input
                type='text'
                name='title'
                value={formData.title}
                onChange={handleChange}
                placeholder='เช่น หูฟังไร้สาย, กระเป๋าสตางค์สีดำ'
                className='w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all outline-none font-medium text-sm text-slate-900 placeholder:font-normal placeholder:text-slate-400'
              />
            </div>

            <div>
              <label className='block text-sm font-bold text-slate-700 mb-2'>
                รายละเอียดเพิ่มเติม
              </label>
              {/* ✅ เพิ่ม placeholder:font-normal placeholder:text-slate-400 */}
              <textarea
                name='description'
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder='อธิบายลักษณะเด่น เช่น มีรอยขีดข่วนตรงมุม, ใส่เคสสีเหลือง...'
                className='w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all outline-none text-slate-800 text-sm font-medium resize-none placeholder:font-normal placeholder:text-slate-400'
              />
            </div>

            <div className="pt-2">
              <label className='block text-sm sm:text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100'>
                📍 สถานที่คาดว่าสูญหาย
              </label>
              {/* ✅ ปรับเป็น 3 คอลัมน์ติดกัน (grid-cols-1 sm:grid-cols-3) */}
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5'>
                <div>
                  <label className='block text-xs font-bold text-slate-600 mb-2'>
                    อาคาร <span className='text-rose-500'>*</span>
                  </label>
                  <div className='relative'>
                    <Building2 size={16} className='absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                    <select
                      name='building'
                      title="อาคาร"
                      value={formData.building}
                      onChange={handleChange}
                      className={`w-full pl-9 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium appearance-none ${!formData.building ? "text-slate-400 font-normal" : "text-slate-800"}`}
                    >
                      <option value=''>เลือกอาคาร...</option>
                      <option value='มหาวชิรุณหิศ'>มหาวชิรุณหิศ</option>
                      <option value='อื่นๆ'>สถานที่อื่นๆ</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className='block text-xs font-bold text-slate-600 mb-2'>
                    ชั้น <span className='text-rose-500'>*</span>
                  </label>
                  <div className='relative'>
                    <Layers size={16} className='absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                    <select
                      name='room'
                      title="ชั้น"
                      value={formData.room}
                      onChange={handleChange}
                      className={`w-full pl-9 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium appearance-none ${!formData.room ? "text-slate-400 font-normal" : "text-slate-800"}`}
                    >
                      <option value=''>เลือกชั้น...</option>
                      <option value='ไม่ระบุ'>ไม่ทราบแน่ชัด</option>
                      {Array.from({ length: 22 }, (_, i) => i + 1).map((floor) => (
                        <option key={floor} value={`ชั้น ${floor}`}>ชั้น {floor}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className='block text-xs font-bold text-slate-600 mb-2'>ห้อง / บริเวณ</label>
                  <div className='relative'>
                    <DoorOpen size={16} className='absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400' />
                    <input
                      type='text'
                      name='location_text'
                      value={formData.location_text}
                      onChange={handleChange}
                      placeholder='เช่น หน้าลิฟต์, ห้อง 302'
                      className='w-full pl-9 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-slate-900 text-sm font-medium placeholder:font-normal placeholder:text-slate-400'
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor='date_lost' className='block text-sm font-bold text-slate-700 mb-2'>
                วันที่และเวลาที่คาดว่าหาย <span className='text-rose-500'>*</span>
              </label>
              <input
                id='date_lost'
                type='datetime-local'
                name='date_lost'
                title='วันที่และเวลาที่คาดว่าหาย'
                value={formData.date_lost}
                onChange={handleChange}
                className='w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-slate-800 text-sm font-medium'
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-8 mt-8 border-t border-slate-100'>
            <Link
              href='/'
              className='px-6 py-3.5 text-slate-500 font-bold text-sm sm:text-base hover:bg-slate-100 rounded-xl transition-colors text-center w-full sm:w-auto active:scale-95'
            >
              ยกเลิก
            </Link>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-8 py-3.5 bg-rose-600 text-white font-bold text-sm sm:text-base rounded-xl shadow-[0_4px_12px_rgba(225,29,72,0.2)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.3)] transition-all w-full sm:w-auto flex items-center justify-center
                ${isSubmitting ? "opacity-80" : "hover:bg-rose-700 hover:-translate-y-0.5 active:scale-95"}`}
            >
              {isSubmitting ? (
                <Loader2 className='w-5 h-5 animate-spin mr-2' />
              ) : (
                <ShieldAlert size={18} className='mr-2' />
              )}
              <span className='truncate'>
                {isSubmitting ? "กำลังส่งข้อมูล..." : "ประกาศตามหา"}
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}