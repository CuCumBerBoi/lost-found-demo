import Link from "next/link";
import { MapPin, Clock, Image as ImageIcon } from "lucide-react"; 

// ==========================================
// 📦 Interface
// ==========================================
export interface CommonItem {
  id: string;
  title: string;
  image_url: string | null;
  location_text: string;
  date: string;
  status: string;
  type: 'LOST' | 'FOUND'; 
  categories: {
    name: string;
  } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ai_metadata?: any; // เพิ่มรับค่า ai_metadata เพื่อเอามาทำ Tag
}

interface ItemProps {
  item: CommonItem;
}

export function ItemCard({ item }: ItemProps) {
  const linkHref = item.type === 'FOUND' ? `/item/${item.id}` : `/item/${item.id}`;

  // 🏷️ ฟังก์ชันสร้างรายการ Tags จากข้อมูลที่มี
  const getTags = () => {
    const tags: string[] = [];
    
    // 1. ใส่หมวดหมู่
    if (item.categories?.name) tags.push(item.categories.name);
    
    // 2. ใส่แบรนด์ และ สี จาก AI
    if (item.ai_metadata) {
      if (item.ai_metadata.brand && item.ai_metadata.brand !== "ไม่ระบุ") {
        tags.push(item.ai_metadata.brand);
      }
      if (item.ai_metadata.color && item.ai_metadata.color !== "ไม่ระบุ") {
        // ถ้าสีมีหลายสีคั่นด้วยลูกน้ำ ให้แยกออกมา (เช่น "แดง, ดำ" -> ["แดง", "ดำ"])
        const colors = item.ai_metadata.color.split(',').map((c: string) => c.trim());
        tags.push(...colors);
      }
    }
    
    // คืนค่าเฉพาะ 3-4 แท็กแรกเพื่อไม่ให้การ์ดรกเกินไป
    return tags.slice(0, 4);
  };

  const displayTags = getTags();

  return (
    <Link href={linkHref} className="h-full block">
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-lg hover:border-slate-200 transition-all duration-300 flex flex-col h-full group overflow-hidden cursor-pointer">
        
        {/* 📸 Image Section */}
        <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image_url}
              alt={item.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-300">
              <ImageIcon size={32} className="mb-2 opacity-50" />
              <p className="text-xs font-bold">ไม่มีรูปภาพ</p>
            </div>
          )}
          
          {/* ป้ายกำกับ หาย/เจอ (มุมขวาบน) */}
          <div className="absolute top-3 right-3">
            <span className={`px-2.5 py-1 text-[10px] font-black text-white rounded-lg shadow-sm ${
              item.type === 'FOUND' ? 'bg-emerald-500' : 'bg-rose-500'
            }`}>
              {item.type === 'FOUND' ? 'พบสิ่งของ' : 'ของหาย'}
            </span>
          </div>
        </div>

        {/* 📝 Content Section */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-bold text-slate-900 text-base line-clamp-2 mb-3 group-hover:text-indigo-600 transition-colors">
            {item.title}
          </h3>
          
          {/* 🏷️ Tags สไตล์ Minimal */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {displayTags.map((tag, idx) => (
              <span 
                key={idx} 
                className="bg-slate-50 border border-slate-200/60 text-slate-600 px-2.5 py-1 rounded-xl text-[10px] font-bold"
              >
                {tag}
              </span>
            ))}
          </div>
          
          {/* 📍 Details (ดันลงล่างสุดเสมอ) */}
          <div className="text-[11px] sm:text-xs text-slate-500 space-y-1.5 mt-auto font-medium">
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-slate-400 shrink-0" />
              <span className="truncate">{item.location_text}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-slate-400 shrink-0" />
              <span>
                {item.type === 'FOUND' ? 'พบเมื่อ ' : 'หายเมื่อ '}
                {new Date(item.date).toLocaleDateString("th-TH", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}