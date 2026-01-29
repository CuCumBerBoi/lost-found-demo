"use client";

import { useState, useEffect } from "react";
import { supabase, createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ImagePlus, X, Sparkles, Loader2} from "lucide-react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { analyzeImage } from "@/app/actions/gemini";


export default function ReportPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [analyzing, setAnalyzing] = useState(false);


  // Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [color, setColor] = useState(""); 

  // 1. ดึงข้อมูล Categories ตอนเข้าหน้าเว็บ
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from("categories").select("*");
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  // ✨ ฟังก์ชันจัดการรูปภาพและสร้าง Preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);

      // รวมไฟล์เก่า + ใหม่ (จำกัดไม่เกิน 5 รูป)
      if (files.length + newFiles.length > 5) {
        toast.error("อัปโหลดได้สูงสุด 5 รูปเท่านั้น");
        return;
      }

      setFiles((prev) => [...prev, ...newFiles]);

      // สร้าง Preview URLs
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ✨ ฟังก์ชันเรียก Gemini AI
  const handleAutoFill = async () => {
    if (files.length === 0) return;
    
    setAnalyzing(true);
    toast.info("Gemini กำลังวิเคราะห์รูปภาพ...", { description: "กรุณารอสักครู่" });

    try {
      // 1. แปลงไฟล์แรกเป็น Base64
      const file = files[0];
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        // 2. ส่งไปให้ Server Action
        const result = await analyzeImage(base64String);

        if (result) {
          // 3. กรอกข้อมูลลง Form
          setTitle(result.title || "");
          setDescription(result.description || "");
          if (result.color) setColor(result.color);

          // พยายาม Map Category (ถ้าชื่อตรงกัน)
          // เช่น AI ตอบ "Electronics" เราก็ไปหาใน categories state
          if (result.category_guess) {
             const matchedCat = categories.find(c => 
               c.name.toLowerCase().includes(result.category_guess.toLowerCase())
             );
             if (matchedCat) setCategoryId(matchedCat.category_id);
          }

          toast.success("วิเคราะห์เสร็จสิ้น!", { description: "ตรวจสอบและแก้ไขข้อมูลได้เลย" });
        } else {
          toast.error("วิเคราะห์ไม่สำเร็จ", { description: "ลองใหม่อีกครั้ง หรือกรอกเอง" });
        }
        setAnalyzing(false);
      };

      reader.readAsDataURL(file); // เริ่มอ่านไฟล์

    } catch (error) {
      console.error(error);
      toast.error("Error", { description: "Something went wrong with AI" });
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    
    // if (files.length === 0 || !categoryId) {
    //   toast.error("ข้อมูลไม่ครบ", { description: "กรุณาอัปโหลดรูปอย่างน้อย 1 รูป" });
    //   return;
    // }

    setLoading(true);

    try {
      // 1. เช็คว่าใคร Login อยู่
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please login first");

      // Upload Loop (อัปโหลดทีละรูป)
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("items")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. ขอ URL ของรูปภาพ
      const { data: { publicUrl } } = supabase.storage
        .from("items")
        .getPublicUrl(filePath);
        return publicUrl;
      });

      // รอให้รูปอัปโหลดเสร็จทั้งหมด
      const uploadedUrls = await Promise.all(uploadPromises);

      // 4. บันทึกข้อมูลลง Table 'lost_items' (ยังไม่มี Vector)
      const { error: insertError } = await supabase.from("lost_items").insert({
        title,
        description,
        location_text: location,
        category_id: categoryId,
        image_url: uploadedUrls[0], // รูปแรกเป็นรูปปก (Thumbnail)
        images: uploadedUrls,       // เก็บรูปทั้งหมดเป็น Array JSON
        date_lost: new Date().toISOString(),
        user_id: user.id,
        // status: "SEARCHING",
        // visibility: "PUBLIC",
        
        //มาแก้ด้วย
        building: "Unknown", // ใส่ค่าหลอกไปก่อน
        floor: "1",          // ใส่ค่าหลอกไปก่อน
      });

      if (insertError) throw insertError;

      toast.success("บันทึกสำเร็จ", { description: "โพสต์ของคุณถูกสร้างเรียบร้อยแล้ว" });
      router.push("/profile");

    } catch (error: any) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาด", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
             📢 Report Lost Item (แจ้งของหาย)
          </CardTitle>
        </CardHeader>
        <CardContent>           
            {/* Multi-Image Upload */}
            <div className="space-y-2">
              <Label>Upload Images (รูปภาพสิ่งของ) - สูงสุด 5 รูป</Label>
              
              <div className="grid grid-cols-3 gap-4 mb-2">
                {previews.map((src, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                    <img src={src} className="w-full h-full object-cover" alt="preview" />
                    <button
                      title="Remove Image"
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full transition"
                    >
                      <X size={14} />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-1">
                        รูปปก (Cover)
                      </span>
                    )}
                  </div>
                ))}

                {/* ปุ่มเพิ่มรูป (แสดงเมื่อยังไม่ครบ 5 รูป) */}
                {files.length < 5 && (
                  <label className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 aspect-square text-gray-400 hover:text-gray-600 transition">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      multiple // ✨ อนุญาตให้เลือกหลายไฟล์
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    <ImagePlus size={24} className="mb-1" />
                    <span className="text-xs">Add Image</span>
                  </label>
                )}
              </div>
              {/* ✨ ปุ่ม AI Magic Button (แสดงเมื่อมีรูป) */}
              {files.length > 0 && (
                <Button 
                  type="button" 
                  onClick={handleAutoFill} 
                  disabled={analyzing}
                  className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:opacity-90 transition-all shadow-md"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Gemini is thinking...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 text-yellow-200" /> 
                      (ระบบช่วยวิเคราะห์ลักษณะสิ่งของ)
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* ... Inputs อื่นๆ เหมือนเดิม ... */}
          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>What was lost? (ชื่อสิ่งของ)</Label>
                <Input required placeholder="e.g. iPhone 13 Pro" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select title="Select Category" className="w-full h-10 px-3 border rounded-md text-sm" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                  <option value="">-- Select Category --</option>
                  {categories.map((c) => (<option key={c.category_id} value={c.category_id}>{c.name}</option>))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input required placeholder="e.g. โรงอาหารคณะวิศวะ" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea required placeholder="รายละเอียด..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
              {loading ? "Posting..." : "Submit Report"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}