import Link from "next/link";
import { createClient } from "@/lib/supabase-server"; 
import { UserNav } from "./UserNav";
import { MobileNav } from "./MobileNav";
// import { Sparkle } from "lucide-react";
import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu";

export async function Navbar() {
    // 1. สร้าง client สำหรับ server
  const supabase = await createClient();

  // 2. ดึง user (ตอนนี้ server จะเห็น cookie แล้ว)
  const { data: { user } } = await supabase.auth.getUser();

    return (
        // ✅ เพิ่ม sticky, backdrop-blur, z-index
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto max-w-7xl flex h-16 items-center px-4 justify-between">
        
        {/* 1. Mobile Menu Trigger (แสดงเฉพาะจอมือถือ) */}
        <div className="md:hidden mr-2">
          <MobileNav user={user} />
        </div>

        {/* 2. Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            {/* โลโก้แบบไอคอน (ถ้ามี) หรือตัวหนังสือสวยๆ */}
            <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
              LF
            </div>
            <span className="hidden md:inline-block text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Lost & Found
            </span>
            <span className="md:hidden text-lg font-bold text-gray-800">
              Lost & Found
            </span>
          </Link>
        </div>

        {/* 3. Desktop Menu (ซ่อนในมือถือ) */}
        <div className="hidden md:flex items-center space-x-10 mx-6 text-sm font-medium text-gray-600">
          <Link href="/" className="hover:text-green-600 transition-colors">
            หน้าแรก
          </Link>
          <Link href="/found" className="hover:text-green-600 transition-colors">
            แจ้งพบสิ่งของ
          </Link>
          <Link href="/report-lost" className="hover:text-red-600 transition-colors">
            แจ้งสิ่งของหาย
          </Link>
          <Link href="/matches" className="hover:text-red-600 transition-colors">
            ระบบช่วยจับคู่
          </Link>
        </div>

        {/* 4. User Profile (ขวาสุด) */}
        <div className="flex items-center space-x-4">
          <UserNav user={user} />
        </div>
      </div>
    </nav>
  );
}