import { createClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, CheckCircle, Users, Search } from "lucide-react";

export const revalidate = 0;

export default async function AdminDashboard() {
  const supabase = await createClient();

  // ดึงข้อมูลสถิติ (Count)
  // 1. จำนวนของหายทั้งหมด
  const { count: lostCount } = await supabase
    .from("lost_items")
    .select("*", { count: 'exact', head: true });

  // 2. จำนวนของที่เจอทั้งหมด
  const { count: foundCount } = await supabase
    .from("found_items")
    .select("*", { count: 'exact', head: true });

  // 3. จำนวนเคสที่คืนสำเร็จ (Approved Claims)
  const { count: successCount } = await supabase
    .from("claims")
    .select("*", { count: 'exact', head: true })
    .eq("status", "APPROVED");

  // 4. จำนวน Users ทั้งหมด
  const { count: userCount } = await supabase
    .from("users")
    .select("*", { count: 'exact', head: true });

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: ของหาย */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lost Items</CardTitle>
            <Search className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lostCount || 0}</div>
            <p className="text-xs text-muted-foreground">items reported lost</p>
          </CardContent>
        </Card>

        {/* Card 2: ของที่เจอ */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Found Items</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{foundCount || 0}</div>
            <p className="text-xs text-muted-foreground">items found & posted</p>
          </CardContent>
        </Card>

        {/* Card 3: คืนสำเร็จ */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successfully Returned</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successCount || 0}</div>
            <p className="text-xs text-muted-foreground">claims approved</p>
          </CardContent>
        </Card>

        {/* Card 4: ผู้ใช้งาน */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount || 0}</div>
            <p className="text-xs text-muted-foreground">registered accounts</p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}