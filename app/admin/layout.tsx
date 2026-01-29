import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  LogOut, 
  ShieldCheck 
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 1. เช็คว่า Login หรือยัง?
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. เช็คว่าเป็น Admin หรือไม่? (Query ไปที่ตาราง users)
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (userData?.role !== 'ADMIN') {
    // ถ้าไม่ใช่ Admin ให้ดีดกลับหน้าแรก
    console.log("🚫 Access Denied: Redirecting to home");
    redirect("/");
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      
      {/* --- Admin Sidebar --- */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-2 font-bold text-xl">
          <ShieldCheck className="text-green-400" />
          Admin Panel
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition text-slate-300 hover:text-white">
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link href="/admin/items" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition text-slate-300 hover:text-white">
            <Package size={20} />
            Manage Items
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition text-slate-300 hover:text-white">
            <Users size={20} />
            Manage Users
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-900/50 text-red-400 transition">
            <LogOut size={20} />
            Exit to App
          </Link>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}