"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";
import {
  Search,
  Sparkles,
  SearchX,
  PackageSearch,
  ImageIcon,
  MapPin,
  Clock,
  Filter,
  ArrowRight,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card"; // ถ้าคุณมี components นี้ ถ้าไม่มีสามารถลบครอบ <Card> ออกแล้วใช้ div แทนได้

// ==========================================
// 📦 Interface
// ==========================================
interface ItemCardProps {
  id: string;
  title: string;
  location_text: string;
  date_found: string;
  category_name: string;
  image_url: string | null;
  ai_metadata?: {
    color?: string;
    brand?: string;
  };
}

interface CategoryData {
  id: string;
  name: string;
}

// ==========================================
// 📦 Item Card Component 
// ==========================================
const ItemCard = ({
  id,
  title,
  location_text,
  date_found,
  category_name,
  image_url,
  ai_metadata,
}: ItemCardProps) => {
  return (
    <Link href={`/item/${id}`} className='block h-full group'>
      <div className='h-full bg-white rounded-2xl sm:rounded-[2rem] border border-slate-100 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1.5 hover:border-indigo-200 transition-all duration-500 flex flex-col cursor-pointer active:scale-[0.98]'>

        {/* Image Area */}
        <div className='h-40 sm:h-52 w-full relative overflow-hidden bg-slate-50 flex items-center justify-center'>
          {image_url ? (
            <Image
              src={image_url}
              alt={title}
              fill
              className='object-cover group-hover:scale-110 transition-transform duration-700'
            />
          ) : (
            <>
              <div className='absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-50 mix-blend-multiply opacity-50 group-hover:scale-105 transition-transform duration-500'></div>
              <div className='text-slate-400 flex flex-col items-center z-10 group-hover:text-indigo-500 transition-colors'>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-2">
                  <ImageIcon size={24} className='opacity-50' />
                </div>
                <span className='text-[10px] font-bold uppercase tracking-wider text-center px-3 opacity-60'>
                  No Image Preview
                </span>
              </div>
            </>
          )}

          {/* Status Badge */}
          {/* <div className='absolute top-3 left-3 sm:top-4 sm:left-4 z-20'>
            <span className='px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-extrabold text-white shadow-md flex items-center backdrop-blur-md bg-emerald-500/90'>
              <Sparkles size={12} className="mr-1" /> พลเมืองดีพบเจอ
            </span>
          </div> */}

          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>

        {/* Content */}
        <div className='p-4 sm:p-5 flex flex-col grow bg-white relative'>
          <div className="flex justify-between items-start mb-2.5">
            <span className="text-[9px] sm:text-[10px] font-black tracking-widest uppercase text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/50">
              {category_name}
            </span>
          </div>

          <h3 className='font-bold text-slate-900 text-sm sm:text-lg leading-tight line-clamp-2 mb-3 group-hover:text-indigo-600 transition-colors h-10 sm:h-14'>
            {title}
          </h3>

          {/* AI Metadata Tags */}
          {ai_metadata && (
            <div className='flex flex-wrap gap-1.5 mb-4'>
              {ai_metadata.color && (
                <span className='text-[9px] sm:text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold border border-slate-200 uppercase tracking-tighter'>
                  {ai_metadata.color}
                </span>
              )}
              {ai_metadata.brand && ai_metadata.brand !== "ไม่ระบุ" && (
                <span className='text-[9px] sm:text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md font-bold border border-indigo-100 uppercase tracking-tighter'>
                  {ai_metadata.brand}
                </span>
              )}
            </div>
          )}

          <div className='mt-auto space-y-1.5 sm:space-y-2 pt-3 sm:pt-4 border-t border-slate-100/60'>
            <div className='text-xs sm:text-sm text-slate-500 flex items-center'>
              <MapPin size={13} className='mr-1.5 sm:mr-2 text-slate-400 shrink-0' />
              <span className='truncate font-medium'>{location_text}</span>
            </div>
            <div className='text-xs sm:text-sm text-slate-400 flex items-center'>
              <Clock size={13} className='mr-1.5 sm:mr-2 text-slate-300 shrink-0' />
              <span className='font-medium'>{date_found}</span>
            </div>
          </div>
        </div>

        {/* Hover Action Overlay */}
        <div className="px-5 pb-5 hidden sm:block">
          <div className="bg-slate-900 text-white text-[11px] font-bold py-2.5 rounded-2xl text-center shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            ดูรายละเอียดเพื่อขอรับคืน →
          </div>
        </div>
      </div>
    </Link>
  );
};

// ==========================================
// 🚀 Main Home Page Component
// ==========================================
export default function HomePage() {
  const [foundItems, setFoundItems] = useState<ItemCardProps[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  // Popup State สำหรับ Filter
  const [showFilterPopup, setShowFilterPopup] = useState(false);

  // Input states
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Active filter states (นำไปใช้เมื่อกด "ค้นหา")
  const [activeQuery, setActiveQuery] = useState("");
  const [activeLocation, setActiveLocation] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  // Pagination states
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const handleSearch = () => {
    setActiveQuery(searchQuery);
    setActiveLocation(locationQuery);
    setActiveCategory(selectedCategory);
    setPage(0);
    setShowFilterPopup(false); // ปิด Popup ค้นหาเมื่อกด Apply
  };

  // Fetch categories from Supabase
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true });

        if (error) throw error;
        setCategories(data as CategoryData[]);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch found items from Supabase
  useEffect(() => {
    const fetchFoundItems = async () => {
      try {
        if (page === 0) setLoading(true);
        const supabase = createClient();

        let query = supabase
          .from("found_items")
          .select("*, categories(name)")
          .eq("status", "AVAILABLE")
          .order("created_at", { ascending: false });

        // Filter by search query
        if (activeQuery) {
          query = query.or(`title.ilike.%${activeQuery}%,location_text.ilike.%${activeQuery}%`);
        }

        // Filter by category
        if (activeCategory) {
          query = query.eq("category_id", activeCategory);
        }

        // Filter by location
        if (activeLocation) {
          query = query.ilike("location_text", `%${activeLocation}%`);
        }

        // Pagination fetching (12 items per page)
        query = query.range(page * 12, (page + 1) * 12 - 1);

        const { data, error } = await query;

        if (error) throw error;

        if (!data || data.length === 0) {
          if (page === 0) setFoundItems([]);
          setHasMore(false);
          return;
        }

        setHasMore(data.length === 12);

        const formattedItems: ItemCardProps[] = data.map((item: any) => ({
          id: item.id || item.found_id || "",
          title: item.title || "",
          location_text: item.location_text || "",
          date_found: item.date_found ? new Date(item.date_found).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "ไม่ระบุวันที่",
          image_url: item.image_url || null,
          category_name: item.categories?.name || item.category_name || "ไม่ระบุ",
          ai_metadata: item.ai_metadata || {},
        })
        );

        if (page === 0) {
          setFoundItems(formattedItems);
        } else {
          setFoundItems((prev) => [...prev, ...formattedItems]);
        }
      } catch (error: any) {
        console.error("Error fetching found items:", error?.message);
        if (page === 0) setFoundItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFoundItems();
  }, [activeQuery, activeLocation, activeCategory, page]);

  return (
    <div className='min-h-screen text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 bg-[#FAFAFA] relative'>

      {/* 🧩 Filter Popup Modal */}
      {showFilterPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Filter size={20} className="text-indigo-600" />
                ตัวกรองขั้นสูง
              </h3>
              <button
                key={selectedCategory}
                onClick={() => setShowFilterPopup(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                title="ปิด"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">หมวดหมู่สิ่งของ</label>
                <select
                  title="หมวดหมู่สิ่งของ"
                  key={selectedCategory}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className='w-full px-4 py-3 bg-slate-50 text-slate-700 text-sm font-medium border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer appearance-none'
                >
                  <option value=''>ทุกหมวดหมู่ (All Categories)</option>
                  {categories.map((cat, index) => (
                    <option key={index} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => { setSelectedCategory(""); setActiveCategory(""); setShowFilterPopup(false); setPage(0); }}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-colors"
              >
                ล้างค่า
              </button>
              <button
                onClick={handleSearch}
                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-colors"
              >
                ดูผลลัพธ์
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ ปรับ pt-24 (mobile) และ pt-32 (desktop) เพื่อแก้ปัญหา Navbar บัง Content */}
      <main className='space-y-12 sm:space-y-16 animate-in fade-in duration-700 pb-24 sm:pb-24 lg:pb-12 pt-28 sm:pt-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto'>

        {/* 🌟 Hero Section */}
        <div className='relative max-w-5xl mx-auto text-center mt-2 mb-12 sm:mb-20'>
          <div className='absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] sm:w-[600px] sm:h-[300px] bg-indigo-400/20 blur-[80px] sm:blur-[100px] rounded-full -z-10 pointer-events-none'></div>

          <h1 className='text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-4 sm:mb-6 leading-tight'>
            ระบบจัดการสิ่งของสูญหาย <br className='block' />
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500'>
              และสิ่งของที่ถูกพบเจอ
            </span>
          </h1>

          <p className='max-w-2xl mx-auto text-sm sm:text-base lg:text-lg text-slate-500 mb-8 sm:mb-10 leading-relaxed px-2 font-medium'>
            " ไม่ว่าคุณจะ ทำของหาย หรือ เก็บของได้ ระบบนี้ทำหน้าที่เป็นตัวกลาง วิเคราะห์ลักษณะสิ่งของและเปรียบเทียบข้อมูลทั้งหมดในระบบ เพื่อจับคู่สิ่งของที่ตรงกันให้อัตโนมัติ ช่วยประหยัดเวลาและเพิ่มโอกาสได้ของคืน "
          </p>
        </div>

        {/* 🔍 Floating Filter Bar (ปรับให้แสดงทุกช่องบน Mobile และเปลี่ยน Filter เป็นปุ่ม Popup) */}
        <div className='max-w-4xl mx-auto relative z-20'>
          <div className='bg-white/90 backdrop-blur-xl p-3 sm:p-4 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white flex flex-col md:flex-row gap-3 items-center'>

            {/* Search Input */}
            <div className='flex-1 w-full relative'>
              <Search size={18} className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400' />
              <input
                type='text'
                placeholder='ค้นหาชื่อสิ่งของ, ยี่ห้อ...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className='w-full pl-12 pr-4 py-3 sm:py-3.5 bg-slate-50 hover:bg-slate-100/50 text-sm sm:text-base font-medium border border-transparent rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none'
              />
            </div>

            {/* Location Input (แสดงเสมอ ไม่ซ่อนในมือถือ) */}
            <div className='flex-1 w-full relative'>
              <MapPin size={18} className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400' />
              <input
                type='text'
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder='สถานที่พบ...'
                className='w-full pl-12 pr-4 py-3 sm:py-3.5 bg-slate-50 hover:bg-slate-100/50 text-sm sm:text-base font-medium border border-transparent rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none'
              />
            </div>

            {/* Actions (Filter Popup & Search) */}
            <div className="flex w-full md:w-auto gap-2 sm:gap-3">
              {/* ปุ่ม Filter (เปิด Popup) */}
              <button
                onClick={() => setShowFilterPopup(true)}
                className={`p-3 sm:p-3.5 rounded-2xl border transition-colors flex items-center justify-center shrink-0 ${activeCategory ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-slate-50 border-transparent hover:bg-slate-100 text-slate-500"}`}
                title="ตัวกรองขั้นสูง"
              >
                <Filter size={20} />
                {/* จุดแจ้งเตือนถ้ามีการเลือกหมวดหมู่ไว้ */}
                {activeCategory && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>}
              </button>

              {/* ปุ่มค้นหา */}
              <button
                onClick={handleSearch}
                className='flex-1 md:w-auto bg-indigo-600 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl font-bold text-sm sm:text-base hover:bg-indigo-700 transition-all shadow-[0_4px_12px_rgb(99,102,241,0.2)] hover:shadow-[0_6px_16px_rgb(99,102,241,0.3)] active:scale-95'
              >
                ค้นหา
              </button>
            </div>

          </div>
        </div>

        {/* 📋 Feed Section */}
        <div className='pt-6 sm:pt-10'>
          <div className='flex justify-between items-end mb-6 sm:mb-8'>
            <div>
              <h2 className='text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2'>
                สิ่งของที่พบเจอ
                {activeQuery || activeLocation || activeCategory ? (
                  <span className="text-sm font-medium bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full ml-2">ผลการค้นหา</span>
                ) : null}
              </h2>
            </div>
          </div>

          {loading ? (
            <div className='text-center py-20'>
              <div className='animate-spin w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full mx-auto'></div>
              <p className='text-slate-500 mt-4 text-sm font-medium'>กำลังดึงข้อมูล...</p>
            </div>
          ) : foundItems.length > 0 ? (
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
              {foundItems.map((item, idx) => (
                <ItemCard key={item.id || `item-${idx}`} {...item} />
              ))}
            </div>
          ) : (
            <div className='text-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm'>
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchX size={32} className='text-slate-400' />
              </div>
              <h3 className='text-lg sm:text-xl font-bold text-slate-900 mb-2'>
                ไม่พบข้อมูลสิ่งของ
              </h3>
              <p className='text-slate-500 text-sm font-medium'>
                ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองหมวดหมู่ดูนะ
              </p>
              {(activeQuery || activeLocation || activeCategory) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setLocationQuery("");
                    setSelectedCategory("");
                    setActiveQuery("");
                    setActiveLocation("");
                    setActiveCategory("");
                    setPage(0);
                  }}
                  className="mt-6 text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-4 py-2 rounded-xl transition-colors"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              )}
            </div>
          )}

          {foundItems.length > 0 && hasMore && (
            <div className='mt-12 text-center'>
              <button
                onClick={() => setPage((prev) => prev + 1)}
                className='inline-flex items-center text-indigo-600 font-bold hover:text-indigo-800 transition-colors group px-6 py-3.5 rounded-2xl hover:bg-indigo-50 active:scale-95 text-sm sm:text-base border border-indigo-100'
              >
                โหลดข้อมูลเพิ่มเติม
                <ArrowRight size={18} className='ml-2 group-hover:translate-x-1 transition-transform flex-shrink-0' />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}