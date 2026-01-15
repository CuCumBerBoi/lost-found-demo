"use client"; // ✅ ต้องเป็น Client Component เพื่อให้กดเปลี่ยนรูปได้

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { useParams } from "next/navigation"; // ใช้ useParams ดึง ID จาก URL
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function FoundDetailPage() {
  const params = useParams();
  const id = params?.id as string; // ดึง ID จาก URL
  const supabase = createClient();

  const [item, setItem] = useState<any>(null);
  const [activeImage, setActiveImage] = useState<string>(""); // เก็บ URL รูปที่กำลังโชว์อยู่
  const [loading, setLoading] = useState(true);
  const [isFinder, setIsFinder] = useState(false); // เช็คว่าเป็นคนเจอของชิ้นนี้ไหม

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      // 1. ดึงข้อมูล Found Item
      const { data, error } = await supabase
        .from("found_items")
        .select(`*, categories (name), users (full_name)`)
        .eq("found_id", id)
        .single();

      if (data) {
        setItem(data);
        setActiveImage(data.image_url); // เริ่มต้นให้โชว์รูปปก
        
        // 2. เช็ค User ปัจจุบัน
        const { data: { user } } = await supabase.auth.getUser();
        setIsFinder(user?.id === data.user_id);
      }
      setLoading(false);
    };

    fetchData();
  }, [id]);

  if (loading) return <div className="p-20 text-center text-gray-500">Loading item details...</div>;
  if (!item) return <div className="p-20 text-center text-red-500">Item not found</div>;

  // ✨ Logic จัดการ Gallery: ถ้ารูปเก่า (ไม่มี images array) ให้ใช้ image_url ตัวเดียว
  const gallery = item.images && Array.isArray(item.images) && item.images.length > 0 
    ? item.images 
    : [item.image_url]; 

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Link href="/" className="inline-flex items-center text-gray-500 hover:text-green-700 mb-6 transition">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Found Feed
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* --- 🖼️ ส่วนแสดงรูปภาพ (Gallery) --- */}
        <div className="space-y-4">
          {/* รูปใหญ่ (Main Image) */}
          <div className="rounded-xl overflow-hidden bg-gray-100 border border-gray-200 h-[400px] flex items-center justify-center relative shadow-sm">
             <img 
               src={activeImage} 
               alt={item.title} 
               className="max-w-full max-h-full object-contain transition-opacity duration-300" 
             />
          </div>
          
          {/* รูปเล็ก (Thumbnails) - จะโชว์เมื่อมีมากกว่า 1 รูป */}
          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
              {gallery.map((img: string, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 rounded-md overflow-hidden border-2 flex-shrink-0 transition-all ${
                    activeImage === img ? 'border-green-600 ring-2 ring-green-100' : 'border-transparent hover:border-gray-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover" alt={`thumb-${idx}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* --- 📝 ส่วนข้อมูล (Info) --- */}
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-start">
              <Badge variant="secondary" className="mb-2 text-sm">{item.categories?.name}</Badge>
              <Badge className="bg-green-600 hover:bg-green-700">{item.status}</Badge>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">{item.title}</h1>
            <p className="text-gray-500 mt-2 flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              Found on {new Date(item.date_found).toLocaleDateString('th-TH', { dateStyle: 'long' })}
            </p>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-green-600" /> Found Location
              </h3>
              <p className="text-gray-700">{item.location_text}</p>
            </div>
            
            <div className="bg-green-50 p-5 rounded-xl border border-green-100">
              <h3 className="font-semibold text-green-900 mb-2">Finder Information</h3>
              <p className="text-green-800 text-sm">Found by: <span className="font-medium">{item.users?.full_name}</span></p>
              <p className="text-xs text-green-600 mt-3 bg-white/50 p-2 rounded">
                💡 หากนี่คือของที่คุณทำหาย กดปุ่ม <strong>"Claim This Item"</strong> ด้านล่างเพื่อส่งหลักฐานขอรับคืน
              </p>
            </div>
          </div>

          <div className="pt-6 border-t">
             {/* ปุ่ม Claim (โชว์เฉพาะคนที่ไม่ใช่คนเจอ) */}
             {!isFinder ? (
               <Link href={`/found/${id}/claim`} className="block w-full">
                 <Button className="w-full bg-blue-600 hover:bg-blue-700 text-lg h-12 shadow-blue-100 shadow-lg">
                   <CheckCircle className="mr-2 h-5 w-5" />
                   Claim This Item (นี่คือของฉัน)
                 </Button>
               </Link>
             ) : (
               <Button variant="outline" disabled className="w-full h-12 border-dashed">
                 คุณเป็นคนเจอของชิ้นนี้ (You found this)
               </Button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}