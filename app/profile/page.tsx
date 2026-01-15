import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { ItemCard, CommonItem } from "@/components/ItemCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // *ถ้ายังไม่มี Tabs ให้ดูวิธีลงด้านล่าง หรือใช้ div ธรรมดาแทนได้ครับ

export const revalidate = 0; // ห้าม Cache หน้านี้ (เพื่อให้เห็นข้อมูลล่าสุดเสมอ)

export default async function ProfilePage() {
  // 1. สร้าง Supabase Client ฝั่ง Server
  const supabase = await createClient();

  // 2. ตรวจสอบสถานะ Login
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 3. ดึงข้อมูล User Profile (ชื่อ, รูป)
  const { data: userProfile } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // 4. ดึงรายการ "ของที่ฉันทำหาย" (My Lost Items)
  const { data: rawLostItems } = await supabase
    .from("lost_items")
    .select(`*, categories(name)`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // 5. ดึงรายการ "ของที่ฉันเจอ" (My Found Items)
  const { data: rawFoundItems } = await supabase
    .from("found_items")
    .select(`*, categories(name)`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // 6. แปลงข้อมูล (Map) ให้เข้ากับ ItemCard (CommonItem)
  const lostItems: CommonItem[] = rawLostItems?.map((item: any) => ({
    id: item.lost_id,
    title: item.title,
    image_url: item.image_url,
    location_text: item.location_text,
    date: item.date_lost,
    status: item.status,
    type: 'LOST',
    categories: item.categories
  })) || [];

  const foundItems: CommonItem[] = rawFoundItems?.map((item: any) => ({
    id: item.found_id,
    title: item.title,
    image_url: item.image_url,
    location_text: item.location_text,
    date: item.date_found,
    status: item.status,
    type: 'FOUND',
    categories: item.categories
  })) || [];

  // สร้างตัวย่อชื่อ (Initials) เช่น Kong Sirichai -> KS
  const initials = userProfile?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2) || "ME";

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* --- Profile Header --- */}
      <div className="flex flex-col md:flex-row items-center gap-6 mb-10 bg-white p-8 rounded-xl border shadow-sm">
        <Avatar className="h-24 w-24 border-4 border-white shadow-md">
          <AvatarImage src={userProfile?.profile_url} />
          <AvatarFallback className="text-2xl bg-blue-100 text-blue-700">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="text-center md:text-left">
          <h1 className="text-2xl font-bold text-gray-900">{userProfile?.full_name}</h1>
          <p className="text-gray-500">{user.email}</p>
          <div className="mt-3 flex gap-2 justify-center md:justify-start">
            <span className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-medium border">
              {userProfile?.role || "Member"}
            </span>
            <span className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium border border-blue-100">
              User ID: {user.id.substring(0, 8)}...
            </span>
          </div>
        </div>
      </div>

      {/* --- Content Sections --- */}
      <div className="space-y-12">
        
        {/* Section 1: ของที่ฉันทำหาย (Lost Items) */}
        <section>
          <div className="flex items-center gap-2 mb-6 border-b pb-2">
            <h2 className="text-xl font-bold text-gray-900">
              รายการแจ้งของหาย (My Lost Items)
            </h2>
            <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold">
              {lostItems.length}
            </span>
          </div>
          
          {lostItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {lostItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
              <p className="text-gray-500">คุณยังไม่เคยแจ้งของหาย</p>
            </div>
          )}
        </section>

        {/* Section 2: ของที่ฉันเจอ (Found Items) */}
        <section>
          <div className="flex items-center gap-2 mb-6 border-b pb-2">
            <h2 className="text-xl font-bold text-gray-900">
              รายการแจ้งเจอของ (My Found Reports)
            </h2>
            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">
              {foundItems.length}
            </span>
          </div>

          {foundItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {foundItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
              <p className="text-gray-500">คุณยังไม่เคยแจ้งเจอของ</p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}