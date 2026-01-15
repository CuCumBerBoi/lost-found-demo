import Image from "next/image";
import { supabase } from "@/lib/supabase-client";
import { ItemCard, CommonItem } from "@/components/ItemCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { Search, PlusCircle, Filter} from "lucide-react";

export const revalidate = 0;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const query = params?.q || "";
  const categoryId = params?.category || "";

  // ลองดึงข้อมูลจากตาราง categories
  // const { data: items, error } = await supabase
  //   .from('lost_items')
  //   .select('*, categories(name)')
  //   .order('created_at', { ascending: false });

  // 1. ดึงข้อมูลหมวดหมู่ (Categories) มาทำปุ่มตัวเลือก
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  // 2. Query รายการของ (Found Items)
  let supabaseQuery = supabase
    .from("found_items")
    .select(`*, categories (name)`)
    .eq("status", "AVAILABLE") // โชว์เฉพาะของที่ยังอยู่
    .order("created_at", { ascending: false });

  // ถ้ามีคำค้นหา ให้เพิ่ม Filter (Title หรือ Location)
  if (query) {
    supabaseQuery = supabaseQuery.or(
      `title.ilike.%${query}%,location_text.ilike.%${query}%`
    );
  }

  // กรองด้วยหมวดหมู่ (ถ้ามี)
  if (categoryId) {
    supabaseQuery = supabaseQuery.eq("category_id", categoryId);
  }

  const { data: rawItems, error } = await supabaseQuery;

  // 2. แปลงข้อมูล (Map) ให้เข้ากับ Interface กลาง
  const items: CommonItem[] = rawItems?.map((item: any) => ({
    id: item.found_id,         // ใช้ found_id
    title: item.title,
    image_url: item.image_url,
    location_text: item.location_text,
    date: item.date_found,     // ใช้ date_found
    status: item.status,
    type: 'FOUND',             // ระบุว่าเป็น FOUND
    categories: item.categories
  })) || [];

  // 2. ถ้า Error ให้โชว์ Error
  if (error) {
    return <div className="p-10 text-red-500">Error loading feed: {error.message}</div>;
  }
  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      
      {/* --- 1. HERO SECTION (ส่วนหัวแบบใหม่) --- */}
      <section className="bg-gradient-to-br from-green-600 to-emerald-800 text-white py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            ทำของหาย... หรือเก็บได้?
          </h1>
          <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto">
            ศูนย์กลางการติดตามสิ่งของภายในมหาวิทยาลัย ช่วยกันเป็นหูเป็นตา เพื่อสังคมที่น่าอยู่
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link href="/found">
              <Button size="lg" className="bg-white text-green-700 hover:bg-green-50 shadow-lg border-0 h-14 px-8 text-lg">
                <Search className="mr-2 h-5 w-5" />
                ฉันเจอของ (I Found)
              </Button>
            </Link>
            <Link href="/report-lost">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 hover:text-white h-14 px-8 text-lg bg-transparent">
                <PlusCircle className="mr-2 h-5 w-5" />
                ฉันทำของหาย (I Lost)
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* --- 2. FILTER & SEARCH SECTION --- */}
      <div className="container mx-auto max-w-6xl -mt-8 px-4 relative z-10">
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 whitespace-nowrap">
              <Filter className="h-5 w-5 text-green-600" />
              ค้นหาของที่เจอ
            </h2>
            <div className="w-full md:max-w-md">
              <SearchBar />
            </div>
          </div>

          {/* Category Pills (ปุ่มหมวดหมู่) */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {/* ปุ่ม All */}
            <Link href="/">
              <Button 
                variant={!categoryId ? "default" : "outline"} 
                size="sm"
                className={`rounded-full ${!categoryId ? "bg-green-600 hover:bg-green-700" : ""}`}
              >
                ทั้งหมด
              </Button>
            </Link>
            
            {/* วนลูปสร้างปุ่มตามหมวดหมู่ที่มีใน DB */}
            {categories?.map((cat: any) => (
              <Link key={cat.category_id} href={`/?category=${cat.category_id}`}>
                <Button 
                  variant={categoryId === cat.category_id ? "default" : "outline"}
                  size="sm"
                  className={`rounded-full whitespace-nowrap ${categoryId === cat.category_id ? "bg-green-600 hover:bg-green-700" : ""}`}
                >
                  {cat.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* --- 3. ITEMS GRID --- */}
      <div className="container mx-auto max-w-6xl px-4 mt-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            {categoryId 
              ? `หมวดหมู่: ${categories?.find((c:any) => c.category_id === categoryId)?.name}` 
              : "ประกาศล่าสุด (Latest Items)"}
          </h3>
          <span className="text-sm text-gray-500">{items.length} รายการ</span>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-lg border border-dashed">
            <p className="text-xl text-gray-400 mb-4">
              {query || categoryId ? "ไม่พบข้อมูลตามเงื่อนไข" : "ยังไม่มีใครแจ้งเจอของช่วงนี้"}
            </p>
            {(query || categoryId) && (
               <Link href="/">
                 <Button variant="link" className="text-green-600">ล้างคำค้นหา</Button>
               </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
