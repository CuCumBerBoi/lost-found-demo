"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, Trash2 } from "lucide-react";
import Link from "next/link";
import DeleteButton from "./DeleteButton"; // ปุ่มลบที่เราเคยทำไว้

export default function ItemDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const supabase = createClient();
  
  const [item, setItem] = useState<any>(null);
  const [activeImage, setActiveImage] = useState<string>("");
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from("lost_items")
        .select(`*, categories (name), users (full_name, email)`)
        .eq("lost_id", id)
        .single();

      if (data) {
        setItem(data);
        setActiveImage(data.image_url);
        
        const { data: { user } } = await supabase.auth.getUser();
        setIsOwner(user?.id === data.user_id);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="p-20 text-center text-gray-500">Loading...</div>;
  if (!item) return <div className="p-20 text-center text-red-500">Item not found</div>;

  const gallery = item.images && Array.isArray(item.images) && item.images.length > 0 
    ? item.images 
    : [item.image_url]; 

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Link href="/profile" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Profile
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* --- 🖼️ Image Gallery --- */}
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden bg-gray-100 border h-[400px] flex items-center justify-center relative">
             <img src={activeImage} alt={item.title} className="max-w-full max-h-full object-contain" />
          </div>
          
          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {gallery.map((img: string, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 rounded-md overflow-hidden border-2 flex-shrink-0 transition ${
                    activeImage === img ? 'border-red-600' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover" alt="thumb" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* --- 📝 Info --- */}
        <div className="space-y-6">
           <div>
            <div className="flex justify-between items-start">
              <Badge variant="secondary" className="mb-2">{item.categories?.name}</Badge>
              <Badge variant={item.status === 'SEARCHING' ? "destructive" : "outline"}>{item.status}</Badge>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{item.title}</h1>
            <p className="text-gray-500 mt-2 flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              Lost on {new Date(item.date_lost).toLocaleDateString('th-TH', { dateStyle: 'long' })}
            </p>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{item.description}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-red-600" /> Location Lost
              </h3>
              <p className="text-gray-600">{item.location_text}</p>
            </div>
          </div>

          <div className="pt-6 border-t flex gap-3">
             {/* ปุ่มลบ (สำหรับเจ้าของเท่านั้น) */}
             {isOwner && <DeleteButton itemId={item.lost_id} />}
          </div>
        </div>
      </div>
    </div>
  );
}