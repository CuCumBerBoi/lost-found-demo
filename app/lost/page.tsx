"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Camera,
  Search,
  Sparkles,
  X,
  UploadCloud,
  Plus,
  ShieldAlert, // เปลี่ยนไอคอนเป็นแบบ Alert สำหรับของหาย
  Loader2,
  Building2,
  Layers,
  DoorOpen,
  MapPin,
  Clock,
  ImageIcon,
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
  characteristic?: string;
}

interface FormData {
  title: string;
  building: string;
  floor: string; // ✅ เพิ่ม floor ให้ถูกต้อง
  room: string;
  location_text: string;
  date_lost: string; // ✅ เปลี่ยนเป็น date_lost
  description: string;
  category_id?: string;
}

export default function ReportLostPage() {
  const router = useRouter();
  const supabase = createClient();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [aiMetadata, setAiMetadata] = useState<AIMetadata | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [categories, setCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    building: "",
    floor: "", // ค่าเริ่มต้นชั้น
    room: "",
    location_text: "",
    date_lost: "", 
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

  // จัดการอัปโหลดและส่งให้ Gemini AI วิเคราะห์
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (uploadedImages.length >= 5) {
      toast.error("อัปโหลดได้สูงสุด 5 รูปภาพเท่านั้น");
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

      // ส่งให้ AI วิเคราะห์เฉพาะรูปแรก
      if (!aiMetadata && !analyzing) {
        setAnalyzing(true);
        const toastId = toast.loading("ระบบกำลังวิเคราะห์ข้อมูล...");

        try {
          const categoryNames = categories.map(c => c.name);
          const aiResult = await _analyzeImage(base64String, categoryNames);

          if (aiResult?.success && aiResult.data) {
            const data = aiResult.data;
            const cleanName = data.category_name?.replace(/['"]/g, "").trim() || "";
            let matchedCategory = categories.find((c) => c.name.trim().toLowerCase() === cleanName.toLowerCase());
            
            if (!matchedCategory) {
              matchedCategory = categories.find((c) => c.name.toLowerCase().includes(cleanName.toLowerCase()) || cleanName.toLowerCase().includes(c.name.toLowerCase()));
            }
            if (!matchedCategory) {
              matchedCategory = categories.find((c) => c.name === "อื่นๆ" || c.name === "Other");
            }
            if (!matchedCategory && categories.length > 0) {
              matchedCategory = categories[0];
            }

            let catId = matchedCategory?.category_id || matchedCategory?.id || "";

            setAiMetadata(data.ai_metadata);
            setFormData((prev) => ({
              ...prev,
              title: data.title || prev.title,
              description: data.description || prev.description,
              category_id: catId, // เก็บ category_id ไว้ใช้บันทึก
            }));
            toast.success("AI สกัดข้อมูลสำเร็จ!", { id: toastId });
          } else {
            toast.error("วิเคราะห์ภาพไม่สำเร็จ", { id: toastId, description: aiResult?.error || "ไม่สามารถสกัดข้อมูลจากภาพนี้ได้" });
          }
        } catch (error) {
          console.error(error);
          toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ AI", { id: toastId });
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
      setFormData((prev) => ({
        ...prev,
        title: "",
        description: "",
      }));
    }
  };

  const handleSubmit = async () => {
    // ❌ ถอดเงื่อนไขการบังคับอัปโหลดรูปออกสำหรับของหาย
    if (!formData.title || !formData.building || !formData.floor) {
      toast.error("กรุณากรอก ชื่อสิ่งของ อาคาร และชั้น ให้ครบถ้วน");
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

      // 1. อัปโหลดรูปภาพขึ้น Supabase Storage (ถ้ามี)
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

      // 2. บันทึกข้อมูลลงตาราง lost_items
      const { error } = await supabase.from("lost_items").insert({
        title: formData.title,
        description: formData.description, 
        building: formData.building,
        floor: formData.floor, // ✅ เก็บข้อมูลชั้นให้ถูกต้อง
        room: formData.room,
        location_text: formData.location_text, // ✅ เก็บข้อมูลบริเวณให้ถูกต้อง
        date_lost: formData.date_lost || new Date().toISOString(), // ✅ เปลี่ยนเป็น date_lost
        category_id: formData.category_id || null, // ส่ง category_id (ถ้า AI หาเจอ)
        user_id: user.id,
        image_url: uploadedUrls.length > 0 ? uploadedUrls[0] : null,
        images: uploadedUrls,
        ai_metadata: aiMetadata,
        status: "SEARCHING", // ✅ สถานะกำลังตามหา
      });

      if (error) {
        if (error.message?.includes("Could not find the 'description' column")) {
          throw new Error("ฐานข้อมูลไม่มีคอลัมน์ 'description' กรุณาไปเพิ่มคอลัมน์ชื่อนี้ (ชนิด text) ในตาราง lost_items ที่ Supabase");
        }
        if (error.message?.includes("Could not find the 'floor' column")) {
            throw new Error("ฐานข้อมูลไม่มีคอลัมน์ 'floor' กรุณาไปเพิ่มคอลัมน์ชื่อนี้ในตาราง lost_items ที่ Supabase");
        }
        throw error;
      }

      toast.success("ประกาศตามหาของสำเร็จ!");
      router.push("/"); // กลับไปหน้ากระดาน
    } catch (error: any) {
      console.error("Supabase Insert Error:", JSON.stringify(error, null, 2));
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล", { 
        description: error.message || JSON.stringify(error),
        duration: 8000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-rose-100 selection:text-rose-900'>
      <main className='max-w-4xl mx-auto pt-24 sm:pt-32 pb-24 sm:pb-20 px-4 sm:px-6 lg:px-8 animate-in slide-in-from-bottom-8 duration-700'>
        
        {/* 🌟 Header Section */}
        <div className='text-center mb-8 sm:mb-12'>
          <h1 className='text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-3'>
            แจ้งข้อมูลสิ่งของที่สูญหาย
          </h1>
          <p className='text-slate-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed px-2 font-medium'>
            ระบุรายละเอียด หรืออัปโหลดภาพอ้างอิงสิ่งของที่หาย (ถ้ามี)
            เพื่อให้ระบบช่วยวิเคราะห์ข้อมูลและนำไปจับคู่กับสิ่งของที่มีคนพบเจอได้อย่างแม่นยำ
          </p>
        </div>

        {/* 📸 Image Upload Section */}
        <div className='mb-8 sm:mb-10'>
          {/* 1. Input สำหรับถ่ายรูป (บังคับเปิดกล้องหลัง) */}
          <input
            id='camera-input-lost'
            type='file'
            accept='image/*'
            capture='environment'
            className='hidden'
            ref={cameraInputRef}
            onChange={handleImageUpload}
            aria-label='ถ่ายรูปสิ่งของอ้างอิง'
            title='ถ่ายรูปสิ่งของอ้างอิง'
          />
          {/* 2. Input สำหรับเลือกจากคลังภาพ */}
          <input
            id='gallery-input-lost'
            type='file'
            accept='image/*'
            className='hidden'
            ref={galleryInputRef}
            onChange={handleImageUpload}
            aria-label='เลือกรูปสิ่งของจากคลังภาพ'
            title='เลือกรูปสิ่งของจากคลังภาพ'
          />

          {uploadedImages.length === 0 ? (
            <div className='bg-white border-2 border-dashed border-slate-300 rounded-[2rem] p-6 sm:p-8 flex flex-col items-center justify-center min-h-[240px] shadow-sm'>
              <div className='w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-5 border border-rose-100'>
                <UploadCloud className='text-rose-500' size={32} strokeWidth={1.5} />
              </div>
              <h3 className='text-lg font-bold text-slate-800 mb-2'>เพิ่มรูปภาพอ้างอิง <span className="text-slate-400 font-medium text-sm ml-1">(ไม่บังคับ)</span></h3>
              <p className='text-slate-500 text-sm font-medium mb-6 text-center'>
                เลือกถ่ายรูปใหม่ หรืออัปโหลดจากคลังภาพ <br className="sm:hidden" />(สูงสุด 5 รูป)
              </p>
              
              <div className='flex flex-col sm:flex-row gap-3 w-full max-w-sm'>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className='flex-1 flex items-center justify-center gap-2 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-sm active:scale-95'
                >
                  <Camera size={18} />
                  ถ่ายรูป
                </button>
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className='flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all active:scale-95'
                >
                  <ImageIcon size={18} />
                  คลังภาพ
                </button>
              </div>
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
                  <div key={i} className='w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center border border-slate-200 relative shrink-0 shadow-sm group'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt='Uploaded item' className='w-full h-full object-cover rounded-xl sm:rounded-2xl' />
                    
                    <button
                      aria-label='ลบรูปภาพ'
                      title='ลบรูปภาพ'
                      onClick={(e) => { e.stopPropagation(); handleRemoveImage(i); }}
                      className='absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1.5 shadow-md hover:bg-rose-600 transition-all hover:scale-110 z-10 active:scale-95'
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                    {/* Badge แสดงลำดับรูป */}
                    <span className='absolute bottom-1 right-1 bg-black/60 text-white px-1.5 py-0.5 rounded text-[9px] font-bold'>
                      {i + 1}
                    </span>
                  </div>
                ))}

                {/* ปุ่มเพิ่มรูปภาพ (แยกเป็น 2 ปุ่มบน-ล่างให้กดง่ายขึ้น) */}
                {uploadedImages.length < 5 && (
                  <div className='flex flex-col gap-2 shrink-0'>
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className='w-20 h-[36px] sm:w-24 sm:h-[44px] bg-white border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:border-rose-400 hover:text-rose-600 transition-colors active:scale-95'
                      title="ถ่ายรูปเพิ่ม"
                    >
                      <Camera size={16} />
                    </button>
                    <button
                      onClick={() => galleryInputRef.current?.click()}
                      className='w-20 h-[36px] sm:w-24 sm:h-[44px] bg-white border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:border-rose-400 hover:text-rose-600 transition-colors active:scale-95'
                      title="เลือกจากคลังเพิ่ม"
                    >
                      <ImageIcon size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 📝 Form Section */}
        <div className='bg-white rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-5 sm:p-8 lg:p-10 transition-all duration-700 relative overflow-hidden'>
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-pink-500"></div>

          {/* Form Fields Section */}
          <div className='p-6 sm:p-10 lg:p-12 space-y-6 sm:space-y-8'>
            <div className="pt-2">
              <label className='block text-sm sm:text-base font-bold text-slate-900 mb-5 pb-3 border-b border-slate-100 flex items-center justify-between'>
                <span className="flex items-center gap-2">📋 ข้อมูลสิ่งของ</span>
                {aiMetadata && <span className="text-[10px] sm:text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100 flex items-center gap-1.5"><Sparkles size={12}/> ระบบช่วยวิเคราะห์แล้ว</span>}
              </label>

              <div className='grid grid-cols-1 md:grid-cols-1 gap-5 sm:gap-6 mb-6'>
                <div>
                  <label className='block text-sm font-bold text-slate-700 mb-2'>
                    ชื่อสิ่งของ <span className='text-rose-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='title'
                    value={formData.title}
                    onChange={handleChange}
                    placeholder='เช่น หูฟังไร้สาย, กระเป๋าสตางค์สีดำ'
                    className='w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all outline-none font-medium text-sm sm:text-base text-slate-900 placeholder:font-normal placeholder:text-slate-400'
                  />
                </div>

              </div>

              <div>
                <label className='block text-sm font-bold text-slate-700 mb-2'>
                  หมวดหมู่
                </label>
                <div className='w-full min-h-[48px] sm:min-h-[52px] px-4 sm:px-5 py-2.5 sm:py-3 bg-indigo-50/30 border border-indigo-50 rounded-xl flex items-center flex-wrap gap-2.5'>
                  {aiMetadata ? (
                    <>
                      {aiMetadata.brand && aiMetadata.brand !== "ไม่ระบุ" && <span className='px-3 py-1.5 bg-white border border-indigo-100 text-indigo-700 rounded-lg text-xs font-bold shadow-sm'>🏷️ {aiMetadata.brand}</span>}
                      {aiMetadata.color && <span className='px-3 py-1.5 bg-white border border-indigo-100 text-indigo-700 rounded-lg text-xs font-bold shadow-sm'>🎨 {aiMetadata.color}</span>}
                      {aiMetadata.type && <span className='px-3 py-1.5 bg-white border border-indigo-100 text-indigo-700 rounded-lg text-xs font-bold shadow-sm'>📦 {aiMetadata.type}</span>}
                    </>
                  ) : (
                    <span className='text-sm text-slate-400 font-normal flex items-center gap-2'>
                      <Sparkles size={14} className="text-slate-300" /> อัปโหลดรูปภาพเพื่อช่วยวิเคราะห์ข้อมูลอัตโนมัติ
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className='block text-sm font-bold text-slate-700 mb-2'>
                รายละเอียดเพิ่มเติม
              </label>
              <textarea
                name='description'
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder='อธิบายลักษณะเด่น เช่น มีรอยขีดข่วนตรงมุม, ใส่เคสสีเหลือง...'
                className='w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all outline-none text-slate-800 text-sm font-medium resize-none placeholder:font-normal placeholder:text-slate-400'
              />
            </div>

            <div className="pt-4 mt-8">
              <label className='block text-sm sm:text-base font-bold text-slate-900 mb-5 pb-3 border-b border-slate-100 flex items-center gap-2'>
                <MapPin size={18} className="text-rose-500" /> สถานที่ที่หาย
              </label>
              
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-8'>
                {/* อาคาร */}
                <div>
                  <label className='block text-xs font-bold text-slate-600 mb-2'>
                    อาคาร <span className='text-rose-500'>*</span>
                  </label>
                  <div className='relative'>
                    <Building2 size={16} className='absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                    <select
                      aria-label='อาคาร'
                      title='อาคาร'
                      name='building'
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

                {/* ชั้น */}
                <div>
                  <label className='block text-xs font-bold text-slate-600 mb-2'>
                    ชั้น <span className='text-rose-500'>*</span>
                  </label>
                  <div className='relative'>
                    <Layers size={16} className='absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                    <select
                      aria-label='ชั้น'
                      title='ชั้น'
                      name='floor' // ✅ ผูก State floor
                      value={formData.floor}
                      onChange={handleChange}
                      className={`w-full pl-9 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium appearance-none ${!formData.floor ? "text-slate-400 font-normal" : "text-slate-800"}`}
                    >

                      {Array.from({ length: 22 }, (_, i) => i + 1).map((floor) => (
                        <option key={floor} value={`ชั้น ${floor}`}>{floor}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ห้อง / บริเวณ */}
                <div>
                  <label className='block text-xs font-bold text-slate-600 mb-2'>ห้อง / บริเวณ </label>
                  <div className='relative'>
                    <DoorOpen size={16} className='absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400' />
                    <input
                      aria-label='บริเวณ'
                      title='บริเวณ'
                      type='text'
                      name='location_text' // ✅ ผูก State location_text
                      value={formData.location_text}
                      onChange={handleChange}
                      placeholder='เช่น หน้าลิฟต์, วางลืมไว้บนโต๊ะหินอ่อน'
                      className='w-full pl-9 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-slate-900 text-sm font-medium placeholder:font-normal placeholder:text-slate-400'
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className='block text-sm font-bold text-slate-700 mb-2'>
                  วันที่และเวลาที่หาย <span className='text-rose-500'>*</span>
                </label>
                <div className='relative'>
                   <Clock size={16} className='absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none' />
                   <input
                     aria-label='วันที่และเวลาที่คาดว่าหาย'
                     title='วันที่และเวลาที่คาดว่าหาย'
                     type='datetime-local'
                     name='date_lost'
                     value={formData.date_lost}
                     onChange={handleChange}
                     className='w-full pl-9 sm:pl-11 pr-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-slate-800 text-sm font-medium'
                   />
                </div>
              </div>
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
                {isSubmitting ? "กำลังส่งข้อมูล..." : "ยืนยัน"}
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}