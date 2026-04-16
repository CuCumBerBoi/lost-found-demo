"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";

// รับ Props ข้อมูล User เข้ามา (ถ้าเป็น null แปลว่ายังไม่ Login)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function UserNav({ user }: { user: any }) {
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
        router.refresh(); // รีเฟรชหน้าเว็บเพื่อให้ Navbar เปลี่ยนสถานะ
    };

    // 1. กรณี: ยังไม่ได้ Login
    if (!user) {
        return (
            <div className="flex gap-2">
                <Link href="/login">
                    <Button variant="ghost">เข้าสู่ระบบ</Button>
                </Link>
                <Link href="/register">
                    <Button>สมัครสมาชิก</Button>
                </Link>
            </div>
        );
    }

    // 2. กรณี: Login แล้ว (โชว์รูป + ปุ่มออกจากระบบ)
    // ดึงชื่อย่อ 2 ตัวแรกมาทำ Avatar (เช่น Kong Sirichai -> KS)
    const initials = user.user_metadata.full_name
        ?.split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2) || "U";

    return (
        <div className="flex items-center gap-2">
            {/* Avatar กดแล้วไปหน้าโปรไฟล์โดยตรง */}
            <Link href="/profile" title="ดูโปรไฟล์">
                <div className="relative h-10 w-10 rounded-full cursor-pointer ring-2 ring-transparent hover:ring-indigo-400 transition-all duration-200">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user.user_metadata.avatar_url} alt={user.email} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                </div>
            </Link>

            {/* ปุ่มออกจากระบบอยู่ข้าง Avatar */}
            <button
                onClick={handleLogout}
                title="ออกจากระบบ"
                aria-label="ออกจากระบบ"
                className="flex items-center gap-1.5 text-slate-500 hover:text-rose-500 font-bold text-xs px-2.5 py-2 rounded-xl hover:bg-rose-50 transition-all duration-200"
            >
                <LogOut size={16} />
                <span className="hidden sm:inline"></span>
            </button>
        </div>
    );
}
