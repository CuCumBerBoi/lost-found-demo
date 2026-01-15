"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";

export default function FoundPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Form States
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [categoryId, setCategoryId] = useState("");
  
  // ✨ เปลี่ยนเป็น Array สำหรับหลายรูป
  const [files, setFiles] = useState<File[]>([]); 
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from("categories").select("*");
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  // ฟังก์ชันจัดการรูปภาพ (เพิ่มได้หลายรูป)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      // จำกัดไม่เกิน 5 รูป
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

  // ฟังก์ชันลบรูปที่เลือกไว้
  const removeImage = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 || !categoryId) {
      toast.error("ข้อมูลไม่ครบ", { description: "กรุณาอัปโหลดรูปอย่างน้อย 1 รูป และเลือกหมวดหมู่" });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please login first");

      // 1. Upload Loop (อัปโหลดทีละรูป)
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `found_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("items")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("items")
          .getPublicUrl(filePath);
          
        return publicUrl;
      });

      // รอจนกว่าจะอัปโหลดเสร็จทุกรูป
      const uploadedUrls = await Promise.all(uploadPromises);

      // 2. Insert DB (ตาราง found_items)
      const { error: insertError } = await supabase.from("found_items").insert({
        title,
        location_text: location,
        category_id: categoryId,
        image_url: uploadedUrls[0], // รูปแรกเป็นรูปปก
        images: uploadedUrls,       // เก็บรูปทั้งหมดเป็น JSON Array
        date_found: new Date().toISOString(),
        user_id: user.id,
        status: "AVAILABLE",
      });

      if (insertError) throw insertError;

      toast.success("ขอบคุณที่เป็นพลเมืองดี!", { description: "ประกาศของคุณถูกสร้างเรียบร้อยแล้ว" });
      router.push("/"); 
      
    } catch (error: any) {
      console.error(error);
      toast.error("Error", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="border-green-200 shadow-green-50">
        <CardHeader className="bg-green-50 rounded-t-xl">
          <CardTitle className="text-green-800 flex items-center gap-2">
            <span className="bg-white p-1 rounded-full text-lg">🎁</span>
            I Found Something (แจ้งเจอของ)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Multi-Image Upload Section */}
            <div className="space-y-2">
              <Label>Upload Photo (รูปของที่เจอ) - สูงสุด 5 รูป</Label>
              
              <div className="grid grid-cols-3 gap-4 mb-2">
                {/* แสดงรูป Preview */}
                {previews.map((src, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-green-200">
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
                      <span className="absolute bottom-0 left-0 right-0 bg-green-600/80 text-white text-[10px] text-center py-1">
                        Cover
                      </span>
                    )}
                  </div>
                ))}

                {/* ปุ่มกดเพิ่มรูป (จะซ่อนเมื่อครบ 5 รูป) */}
                {files.length < 5 && (
                  <label className="border-2 border-dashed border-green-300 bg-green-50/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-green-50 aspect-square text-green-600 hover:text-green-700 transition">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      multiple // อนุญาตให้เลือกหลายไฟล์
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    <ImagePlus size={24} className="mb-1" />
                    <span className="text-xs font-medium">Add Photo</span>
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-500">
                *รูปภาพสำคัญมาก เพื่อให้เจ้าของยืนยันได้ว่าเป็นของเขาจริงๆ
              </p>
            </div>

            <div className="space-y-2">
              <Label>I Found... (เจออะไร?)</Label>
              <Input 
                required placeholder="e.g. กุญแจรถ Honda" 
                value={title} onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <select 
                title="Category"
                className="w-full h-10 px-3 border rounded-md text-sm"
                value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="">-- เลือกหมวดหมู่ --</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Location Found (เจอที่ไหน?)</Label>
              <Input 
                required placeholder="e.g. ม้านั่งหน้าตึก 3" 
                value={location} onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
              {loading ? "Saving..." : "Submit Found Item"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}