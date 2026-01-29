import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { ItemCard, CommonItem } from "@/components/ItemCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  ArrowRight, 
  CalendarDays, 
  AlertCircle, 
  SearchX,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

export const revalidate = 0; // ดึงข้อมูลสดใหม่เสมอ

export default async function MatchesPage() {
  const supabase = await createClient();

  // 1. เช็ค Login
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. ดึง "ของที่ฉันทำหาย" (My Lost Items) ที่ยังสถานะ SEARCHING
  const { data: myLostItems } = await supabase
    .from("lost_items")
    .select(`*, categories(name)`)
    .eq("user_id", user.id)
    .eq("status", "SEARCHING")
    .order("created_at", { ascending: false });

  // 3. Logic การจับคู่ (The Matching Algorithm)
  const matchGroups = [];

  if (myLostItems && myLostItems.length > 0) {
    for (const lostItem of myLostItems) {
      
      // กฎการค้นหา:
      // 1. หมวดหมู่เดียวกัน (Category Match)
      // 2. สถานะต้องยังอยู่ (AVAILABLE)
      // 3. วันที่เจอ ต้อง >= วันที่หาย (Time Logic)
      const { data: candidates } = await supabase
        .from("found_items")
        .select(`*, categories(name)`)
        .eq("status", "AVAILABLE")
        .eq("category_id", lostItem.category_id)
        // .gte("date_found", lostItem.date_lost) 
        .neq("user_id", user.id)
        .limit(3); // เอามาแค่ 3 อันดับแรกที่น่าสงสัย

      // แปลงข้อมูลให้เป็น Format กลาง (CommonItem)
      const sourceItem: CommonItem = {
        id: lostItem.lost_id,
        title: lostItem.title,
        image_url: lostItem.image_url,
        location_text: lostItem.location_text,
        date: lostItem.date_lost,
        status: lostItem.status,
        type: 'LOST',
        categories: lostItem.categories
      };

      const matchedCandidates: CommonItem[] = candidates?.map((c: any) => ({
        id: c.found_id,
        title: c.title,
        image_url: c.image_url,
        location_text: c.location_text,
        date: c.date_found,
        status: c.status,
        type: 'FOUND',
        categories: c.categories
      })) || [];

      matchGroups.push({
        source: sourceItem,
        candidates: matchedCandidates
      });
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl min-h-screen bg-gray-50/50">
      
      {/* --- Header Section --- */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-extrabold flex items-center justify-center md:justify-start gap-3 text-gray-900">
          <div className="bg-orange-100 p-3 rounded-2xl">
            <Sparkles className="text-orange-600 w-8 h-8 fill-orange-600" />
          </div>
          Smart Match
        </h1>
        <p className="text-gray-500 mt-3 text-lg max-w-2xl">
          ระบบกำลังช่วยคุณสแกนหา "ของที่เจอ" ที่มีลักษณะตรงกับ "ของที่คุณแจ้งหาย" 
          โดยวิเคราะห์จากหมวดหมู่และช่วงเวลาที่เกิดเหตุ
        </p>
      </div>

      {/* --- Content Section --- */}
      <div className="space-y-16">
        {matchGroups.length > 0 ? (
          matchGroups.map((group, index) => (
            <div key={group.source.id} className="relative">
              
              {/* เส้นเชื่อม (Timeline Connector) - ตกแต่ง */}
              {index !== matchGroups.length - 1 && (
                <div className="absolute left-8 top-full h-16 w-1 bg-gray-200 hidden md:block" />
              )}

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                
                {/* Header ของแต่ละกลุ่ม (Group Header) */}
                <div className="bg-gradient-to-r from-gray-50 to-white border-b px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-white border-gray-300 text-gray-700 px-3 py-1 text-sm">
                      Case #{index + 1}
                    </Badge>
                    <h3 className="font-bold text-gray-800 text-lg line-clamp-1">
                      กำลังตามหา: {group.source.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CalendarDays className="w-4 h-4" />
                    หายเมื่อ: {new Date(group.source.date).toLocaleDateString('th-TH')}
                  </div>
                </div>

                {/* Body: Comparison Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
                  
                  {/* 👈 ฝั่งซ้าย: ของของคุณ (The Source) */}
                  <div className="lg:col-span-4 p-6 bg-red-50/10">
                    <div className="flex items-center gap-2 mb-4 text-red-600 font-semibold text-sm uppercase tracking-wider">
                      <AlertCircle className="w-4 h-4" />
                      ข้อมูลของคุณ (Your Lost Item)
                    </div>
                    {/* การ์ดของหาย (ปรับขนาดให้เด่น) */}
                    <div className="transform scale-100 origin-top-left">
                       <ItemCard item={group.source} />
                    </div>
                    <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100 text-sm text-red-800">
                      <p className="font-semibold mb-1">สถานะ: กำลังค้นหา 🔍</p>
                      <p className="opacity-90">ระบบกำลังเฝ้าระวัง หมวดหมู่ "{group.source.categories?.name}" ให้คุณอย่างต่อเนื่อง</p>
                    </div>
                  </div>

                  {/* 👉 ฝั่งขวา: รายการที่ Match (The Candidates) */}
                  <div className="lg:col-span-8 p-6 bg-green-50/10 relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-green-700 font-semibold text-sm uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4" />
                        พบ {group.candidates.length} รายการที่น่าสงสัย
                      </div>
                      {group.candidates.length > 0 && (
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                          Match by Category & Time
                        </span>
                      )}
                    </div>

                    {group.candidates.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {group.candidates.map((matchItem) => (
                          <div key={matchItem.id} className="group relative">
                            {/* ป้าย % ความเข้ากันได้ (Fake Score เพื่อ UX) */}
                            <div className="absolute -top-2 -right-2 z-20 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md border-2 border-white">
                              NEW MATCH
                            </div>
                            
                            <ItemCard item={matchItem} />
                            
                            {/* ปุ่ม Action */}
                            <Link href={`/found/${matchItem.id}`} className="block mt-3">
                              <Button className="w-full bg-white border-2 border-green-600 text-green-700 hover:bg-green-600 hover:text-white font-semibold transition-all shadow-sm">
                                ใช่ของฉันไหม? (Check)
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // กรณีไม่เจอคู่ Match
                      <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                        <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                           <SearchX className="w-8 h-8 text-gray-400" />
                        </div>
                        <h4 className="text-gray-900 font-medium mb-1">ยังไม่พบรายการที่ตรงกัน</h4>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto">
                          ยังไม่มีใครแจ้งเจอของในหมวดหมู่นี้ ในช่วงเวลาหลังจากที่คุณทำหาย
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          ))
        ) : (
          // กรณีไม่มีรายการแจ้งของหายเลย
          <div className="text-center py-24 bg-white rounded-3xl border shadow-sm max-w-2xl mx-auto">
            <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">คุณไม่มีรายการที่กำลังตามหา</h2>
            <p className="text-gray-500 mt-2 mb-8 max-w-md mx-auto">
              ระบบ Smart Match จะทำงานเมื่อคุณมีรายการแจ้งของหายที่มีสถานะ "กำลังค้นหา"
            </p>
            <Link href="/report">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 h-12 shadow-blue-200 shadow-lg">
                + แจ้งของหาย (Report Lost Item)
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}