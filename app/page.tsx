"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";
import {
  Search,
  SearchX,
  ImageIcon,
  MapPin,
  Clock,
  Filter,
  ArrowRight,
  X,
  PackageSearch
} from "lucide-react";

// ==========================================
// 📦 Interface (กำหนดโครงสร้างข้อมูล)
// ==========================================
interface ItemCardProps {
  id: string;
  title: string;
  location_text: string;
  date_found: string;
  time_found: string;
  image_url: string | null;
  ai_metadata?: Record<string, string | string[]>;
}

interface CategoryData {
  category_id: string;
  name: string;
}

// ==========================================
// 📦 Item Card Component (การ์ดแสดงสิ่งของ)
// ==========================================
const ItemCard = ({
  id,
  title,
  location_text,
  date_found,
  time_found,
  image_url,
  ai_metadata,
}: ItemCardProps) => {

  const renderableTags: string[] = [];

  if (ai_metadata) {
    Object.values(ai_metadata).forEach(tagValue => {
      if (typeof tagValue === 'string') {
        if (tagValue.trim() !== '' && tagValue !== 'ไม่ระบุ') {
          renderableTags.push(tagValue);
        }
      } else if (Array.isArray(tagValue)) {
        tagValue.forEach(item => {
          if (typeof item === 'string' && item.trim() !== '' && item !== 'ไม่ระบุ') {
            renderableTags.push(item);
          }
        });
      }
    });
  }

  const finalTags = renderableTags.slice(0, 3);

  return (
    <Link href={`/item/${id}`} className='block h-full group'>
      <div className='h-full bg-white rounded-[1.5rem] border border-slate-100/80 overflow-hidden hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:-translate-y-2 transition-all duration-500 flex flex-col cursor-pointer'>

        <div className='h-48 sm:h-56 w-full relative overflow-hidden bg-slate-50 flex items-center justify-center p-3'>
          <div className="absolute inset-0 bg-slate-100/50 rounded-t-[1.5rem]"></div>
          {image_url ? (
            <Image
              src={image_url}
              alt={title}
              fill
              className='object-cover group-hover:scale-105 transition-transform duration-700 rounded-t-[1.5rem]'
            />
          ) : (
            <div className='text-slate-400 flex flex-col items-center z-10'>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-2">
                <ImageIcon size={24} className='opacity-50' />
              </div>
              <span className='text-[10px] font-bold uppercase tracking-wider text-center px-3 opacity-60'>
                No Image
              </span>
            </div>
          )}
        </div>

        <div className='p-5 sm:p-6 flex flex-col grow bg-white relative'>
          <h3 className='font-bold text-slate-900 text-base sm:text-lg leading-tight line-clamp-2 mb-3 mt-1 group-hover:text-indigo-600 transition-colors'>
            {title}
          </h3>

          {/* {finalTags.length > 0 && (
            <div className='flex flex-wrap gap-1.5 mb-4'>
              {finalTags.map((tag, index) => (
                <span
                  key={index}
                  className='text-[11px] px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg font-semibold border border-slate-200/50'
                >
                  {tag}
                </span>
              ))}
            </div>
          )} */}

          {finalTags.length > 0 && (
            <div className='flex flex-wrap gap-2 mb-4'>
              {finalTags.map((tag, index) => (
                <span
                  key={index}
                  className='inline-flex items-center bg-slate-50 border border-slate-200/60 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-medium'
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className='mt-auto space-y-2.5 pt-2 border-t border-slate-100/80'>
            <div className='text-sm text-slate-500 flex items-start'>
              <MapPin size={14} className='mr-2 mt-[2px] text-slate-400 shrink-0' />
              <span className='line-clamp-2 font-medium leading-relaxed'>{location_text}</span>
            </div>
            <div className='text-sm text-slate-500 flex items-center'>
              <Clock size={14} className='mr-2 text-slate-400 shrink-0' />
              <span className='font-medium'>
                {date_found} {time_found && <span className="ml-1.5 opacity-70">{time_found}</span>}
              </span>
            </div>
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

  const [showFilterPopup, setShowFilterPopup] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  const [activeQuery, setActiveQuery] = useState("");
  const [activeLocation, setActiveLocation] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [activeTimeframe, setActiveTimeframe] = useState("");
  const [activeColor, setActiveColor] = useState("");

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const hasActiveFilters = activeCategory || activeTimeframe || activeColor;

  const handleSearch = () => {
    setActiveQuery(searchQuery);
    setActiveLocation(locationQuery);
    setActiveCategory(selectedCategory);
    setActiveTimeframe(selectedTimeframe);
    setActiveColor(selectedColor);
    setPage(0);
    setShowFilterPopup(false);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setLocationQuery("");
    setSelectedCategory("");
    setSelectedTimeframe("");
    setSelectedColor("");
    setActiveQuery("");
    setActiveLocation("");
    setActiveCategory("");
    setActiveTimeframe("");
    setActiveColor("");
    setPage(0);
    setShowFilterPopup(false);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("categories")
          .select("category_id, name")
          .order("name", { ascending: true });

        if (error) throw error;
        setCategories(data as CategoryData[]);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchFoundItems = async () => {
      try {
        if (page === 0) setLoading(true);
        const supabase = createClient();

        let query = supabase
          .from("found_items")
          .select("*")
          .eq("status", "AVAILABLE")
          .order("created_at", { ascending: false });

        if (activeQuery) {
          query = query.or(`title.ilike.%${activeQuery}%,location_text.ilike.%${activeQuery}%,building.ilike.%${activeQuery}%,ai_metadata->>brand.ilike.%${activeQuery}%,ai_metadata->>color.ilike.%${activeQuery}%`);
        }
        if (activeCategory) {
          query = query.eq("category_id", activeCategory);
        }
        if (activeLocation) {
          query = query.or(`location_text.ilike.%${activeLocation}%,building.ilike.%${activeLocation}%,room.ilike.%${activeLocation}%`);
        }
        if (activeColor) {
          query = query.filter("ai_metadata->>color", "ilike", `%${activeColor}%`);
        }
        if (activeTimeframe) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          let fromDate = new Date(today);

          if (activeTimeframe === "today") fromDate = today;
          else if (activeTimeframe === "yesterday") fromDate.setDate(today.getDate() - 1);
          else if (activeTimeframe === "last_3_days") fromDate.setDate(today.getDate() - 3);
          else if (activeTimeframe === "last_7_days") fromDate.setDate(today.getDate() - 7);
          else if (activeTimeframe === "last_30_days") fromDate.setDate(today.getDate() - 30);

          query = query.gte("date_found", fromDate.toISOString());
        }

        query = query.range(page * 12, (page + 1) * 12 - 1);

        const { data, error } = await query;

        if (error) throw error;

        if (!data || data.length === 0) {
          if (page === 0) setFoundItems([]);
          setHasMore(false);
          return;
        }

        setHasMore(data.length === 12);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedItems: ItemCardProps[] = data.map((item: any) => {
          let formattedDate = "ไม่ระบุวันที่";
          let formattedTime = "";

          if (item.date_found) {
            const d = new Date(item.date_found);
            formattedDate = d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
            formattedTime = d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " น.";
          }

          const locParts = [];
          if (item.building) locParts.push(`${String(item.building).trim().replace(/^อาคาร\s*/, '')}`);
          if (item.floor) locParts.push(`ชั้น ${String(item.floor).trim().replace(/^ชั้น\s*/, '')}`);
          if (item.room) locParts.push(`ห้อง ${String(item.room)}`);

          let finalLocation = locParts.join(" ");
          if (!finalLocation) {
            finalLocation = item.location_text ? `📍 ${item.location_text.trim()}` : "ไม่ระบุสถานที่";
          }

          return {
            id: item.found_id || "",
            title: item.title || "",
            location_text: finalLocation,
            date_found: formattedDate,
            time_found: formattedTime,
            image_url: item.image_url || null,
            ai_metadata: item.ai_metadata || {},
          };
        });

        if (page === 0) setFoundItems(formattedItems);
        else setFoundItems((prev) => [...prev, ...formattedItems]);

      } catch (err) {
        console.error("Error fetching found items:", (err as Error)?.message);
        if (page === 0) setFoundItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFoundItems();
  }, [activeQuery, activeLocation, activeCategory, activeTimeframe, activeColor, page]);

  return (
    <div className='min-h-screen text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 bg-[#FAFAFA] relative overflow-hidden'>

      {/* 🧩 Filter Popup Modal (ยังคงเหมือนเดิม) */}
      {showFilterPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Filter size={20} className="text-indigo-600" />
                ค้นหาแบบละเอียด
              </h3>
              <button 
                onClick={() => setShowFilterPopup(false)} 
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                aria-label="ปิดหน้าต่าง"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="category-select" className="block text-sm font-semibold text-slate-700 mb-2">หมวดหมู่ระบบ</label>
                <select
                  id="category-select"
                  title="หมวดหมู่ระบบ"
                  aria-label="หมวดหมู่ระบบ"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className='w-full px-4 py-3 bg-slate-50 text-slate-700 text-sm font-medium border border-slate-200 rounded-2xl outline-none'
                >
                  <option value=''>ทุกหมวดหมู่</option>
                  {categories.map((cat, index) => <option key={index} value={cat.category_id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="timeframe-select" className="block text-sm font-semibold text-slate-700 mb-2 mt-2">ช่วงเวลาที่พบ</label>
                <select
                  id="timeframe-select"
                  title="ช่วงเวลาที่พบ"
                  aria-label="ช่วงเวลาที่พบ"
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className='w-full px-4 py-3 bg-slate-50 text-slate-700 text-sm font-medium border border-slate-200 rounded-2xl outline-none'
                >
                  <option value=''>ทุกช่วงเวลา</option>
                  <option value='today'>วันนี้</option>
                  <option value='yesterday'>ตั้งแต่เมื่อวานนี้</option>
                  <option value='last_3_days'>ภายใน 3 วันที่ผ่านมา</option>
                  <option value='last_7_days'>ภายใน 1 สัปดาห์ที่ผ่านมา</option>
                  <option value='last_30_days'>ภายใน 1 เดือนที่ผ่านมา</option>
                </select>
              </div>
              <div>
                <label htmlFor="color-select" className="block text-sm font-semibold text-slate-700 mb-2 mt-2">สีสิ่งของ</label>
                <select
                  id="color-select"
                  title="สีสิ่งของ"
                  aria-label="สีสิ่งของ"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className='w-full px-4 py-3 bg-slate-50 text-slate-700 text-sm font-medium border border-slate-200 rounded-2xl outline-none'
                >
                  <option value=''>ทุกสี</option>
                  <option value='ดำ'>⚫ ดำ</option>
                  <option value='ขาว'>⚪ ขาว</option>
                  <option value='เทา'>🔘 เทา / เงิน</option>
                  <option value='แดง'>🔴 แดง</option>
                  <option value='น้ำเงิน'>🔵 น้ำเงิน / ฟ้า</option>
                  <option value='เขียว'>🟢 เขียว</option>
                  <option value='เหลือง'>🟡 เหลือง / ทอง</option>
                  <option value='น้ำตาล'>🟤 น้ำตาล </option>
                  <option value='ชมพู'>🩷 ชมพู</option>
                  <option value='ม่วง'>🟣 ม่วง</option>
                  <option value='ส้ม'>🟠 ส้ม</option>
                  <option value='หลากสี'>🎨 หลากสี</option>
                </select>
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={clearAllFilters} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-colors">ล้างค่า</button>
              <button onClick={handleSearch} className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-colors">ดูผลลัพธ์</button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 Hero Section แบบแบ่งซ้าย-ขวา */}
      <section className="pt-32 pb-12 sm:pt-40 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto gap-8">

          {/* ข้อความ (จัดกลางทั้งหมด) */}
          <div className="text-center max-w-2xl mx-auto">
            <h1 className='text-[2.75rem] sm:text-5xl lg:text-[4rem] font-black text-slate-900 tracking-tight leading-[1.2] mb-6'>
              ระบบแจ้งสิ่งของที่หาย <br/>
              <span className='text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500 ml-3'>
                และสิ่งของที่ถูกพบ
              </span>
            </h1>
            <p className='text-[15px] sm:text-base md:text-lg text-slate-500 font-medium leading-relaxed w-full max-w-[90%] sm:max-w-lg md:max-w-2xl mx-auto mb-8 px-2 sm:px-0'>
              "ไม่ว่าคุณจะทำของหายหรือเก็บของได้ ระบบนี้ทำหน้าที่เป็นตัวกลาง ที่ช่วยวิเคราะห์ลักษณะสิ่งของและเปรียบเทียบข้อมูลทั้งหมดในระบบ เพื่อจับคู่สิ่งของให้อัตโนมัติ ช่วยประหยัดเวลาและเพิ่มโอกาสในได้คืนสิ่งของชิ้นนั้น"
            </p>
          </div>
          
          {/* ปุ่มต่างๆ หรือช่องค้นหา (ถ้ามี) จะอยู่ตรงนี้ และจะถูกจัดกลางอัตโนมัติ */}


          {/* ขวา: ภาพประกอบจำลอง (เน้น Layout สะอาดตา) */}
          {/* <div className="hidden lg:flex relative h-[450px] w-full items-center justify-center">
            <div className="absolute inset-0 bg-indigo-100/50 rounded-[3rem] transform rotate-3 scale-95"></div>
            <div className="relative w-full h-full bg-white rounded-[3rem] shadow-xl border border-slate-100/50 flex flex-col items-center justify-center overflow-hidden z-10">
              <div className="absolute w-96 h-96 bg-indigo-400/20 blur-[80px] rounded-full -top-10 -right-10"></div>
              <div className="absolute w-96 h-96 bg-violet-400/10 blur-[80px] rounded-full bottom-0 left-0"></div> */}

              {/* Mockup Element เพื่อความสวยงาม */}
              {/* <div className="relative z-10 bg-slate-50/80 backdrop-blur-sm p-6 rounded-3xl border border-white shadow-lg flex items-center gap-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                  <PackageSearch size={32} />
                </div>
                <div>
                  <div className="h-3 w-24 bg-slate-200 rounded-full mb-3"></div>
                  <div className="h-2 w-32 bg-slate-100 rounded-full"></div>
                </div>
              </div>
            </div>
          </div> */}
          
        </div>
      </section>

      {/* 🔍 Search Bar ก้อนใหญ่ด้านล่าง Hero */}
      <div className='max-w-5xl mx-auto relative z-20 px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 mb-16'>
        <div className='bg-slate-100/80 p-2 sm:p-3 rounded-2xl sm:rounded-[2rem] flex flex-col sm:flex-row gap-2 sm:gap-3 border border-slate-200/60 shadow-sm'>

          <div className='flex-1 relative'>
            <Search size={18} className='absolute left-5 top-1/2 -translate-y-1/2 text-slate-400' />
            <input
              type='text'
              placeholder='ค้นหาชื่อสิ่งของ, ยี่ห้อ, สี...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className='w-full pl-12 pr-4 py-4 bg-white text-slate-900 font-medium border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm'
            />
          </div>

          <div className='flex-1 relative'>
            <MapPin size={18} className='absolute left-5 top-1/2 -translate-y-1/2 text-slate-400' />
            <input
              type='text'
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder='สถานที่พบ (อาคาร/ห้อง)...'
              className='w-full pl-12 pr-4 py-4 bg-white text-slate-900 font-medium border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm'
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowFilterPopup(true)}
              aria-label="เปิดตัวกรอง"
              className={`px-5 py-4 rounded-2xl transition-colors flex items-center justify-center shadow-sm relative ${hasActiveFilters ? "bg-indigo-100 text-indigo-700" : "bg-white text-slate-500 hover:text-slate-900"
                }`}
            >
              <Filter size={20} />
              {hasActiveFilters && <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-indigo-500 border-2 border-white rounded-full"></span>}
            </button>

            <button
              onClick={handleSearch}
              className='flex-1 md:w-36 bg-slate-900 text-white px-6 py-4 rounded-2xl font-bold text-base hover:bg-slate-800 transition-all shadow-md active:scale-95'
            >
              ค้นหา
            </button>
          </div>
        </div>
      </div>


      

      {/* 📋 Feed Section */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24'>

        <div className='mb-8 sm:mb-10'>
          <h2 className='text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center'>
            รายการสิ่งของที่ถูกพบ
            {(activeQuery || activeLocation || hasActiveFilters) && (
              <span className="text-sm font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full ml-4">
                ผลการค้นหา
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className='text-center py-20'>
            <div className='animate-spin w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full mx-auto'></div>
            <p className='text-slate-500 mt-4 text-sm font-medium'>กำลังดึงข้อมูล...</p>
          </div>
        ) : foundItems.length > 0 ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
            {foundItems.map((item, idx) => (
              <ItemCard key={item.id || `item-${idx}`} {...item} />
            ))}
          </div>
        ) : (
          <div className='text-center py-24 bg-white rounded-[2rem] border border-slate-100 shadow-sm'>
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <SearchX size={32} className='text-slate-400' />
            </div>
            <h3 className='text-xl font-bold text-slate-900 mb-2'>ไม่พบข้อมูลสิ่งของ</h3>
            <p className='text-slate-500 text-sm font-medium'>ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองดูนะ</p>
            {(activeQuery || activeLocation || hasActiveFilters) && (
              <button
                onClick={clearAllFilters}
                className="mt-6 text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-5 py-2.5 rounded-xl transition-colors"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>
        )}

        {foundItems.length > 0 && hasMore && (
          <div className='mt-16 text-center'>
            <button
              onClick={() => setPage((prev) => prev + 1)}
              className='inline-flex items-center text-slate-700 font-bold hover:text-slate-900 transition-colors group px-8 py-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm active:scale-95'
            >
              โหลดข้อมูลเพิ่มเติม
              <ArrowRight size={18} className='ml-2 group-hover:translate-x-1 transition-transform' />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}