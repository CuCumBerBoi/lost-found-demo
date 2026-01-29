"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, User, PlusCircle, Search } from "lucide-react";
import { Sparkle } from "lucide-react";
import { Inbox } from "lucide-react";

// รับ Props ข้อมูล User เข้ามา (ถ้าเป็น null แปลว่ายังไม่ Login)
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
                    <Button variant="ghost">Log in</Button>
                </Link>
                <Link href="/register">
                    <Button>Sign Up</Button>
                </Link>
            </div>
        );
    }

    // 2. กรณี: Login แล้ว (โชว์รูป + Dropdown)
    // ดึงชื่อย่อ 2 ตัวแรกมาทำ Avatar (เช่น Kong Sirichai -> KS)
    const initials = user.user_metadata.full_name
        ?.split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2) || "U";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                        {/* ถ้ามีรูปโปรไฟล์ก็โชว์ (ตอนนี้ใช้รูป default ไปก่อน) */}
                        <AvatarImage src={user.user_metadata.avatar_url} alt={user.email} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.user_metadata.full_name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </DropdownMenuItem>
                </Link>

                <Link href="/report">
                    <DropdownMenuItem className="cursor-pointer">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        <span>แจ้งของหาย</span>
                    </DropdownMenuItem>
                </Link>

                <Link href="/found">
                    <DropdownMenuItem className="cursor-pointer text-green-600 focus:text-green-700">
                        <Search className="mr-2 h-4 w-4" />
                        <span>แจ้งเจอของ (I Found)</span>
                    </DropdownMenuItem>
                </Link>

                <Link href="/inbox">
                    <DropdownMenuItem className="cursor-pointer">
                        <Inbox className="mr-2 h-4 w-4" />
                        <span>Inbox / คำขอคืน</span>
                    </DropdownMenuItem>
                </Link>

                {/* 👇 เพิ่มเมนู Match ตรงนี้ 👇 */}
                <Link href="/matches">
                    <DropdownMenuItem className="cursor-pointer bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-700 focus:bg-orange-100">
                        <Sparkle className="mr-2 h-4 w-4 text-orange-500" />
                        <span>Smart Match (จับคู่)</span>
                    </DropdownMenuItem>
                </Link>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}