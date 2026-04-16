"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  LayoutDashboard, 
  SearchCheck, 
  SearchX, 
  Sparkles, 
  UserCircle2,
  PackageSearch
} from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function MobileNav({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // ปรับเหลือแค่ข้อมูลพื้นฐาน ถอดสีเฉพาะเจาะจงออกเพื่อความมินิมอล
  const menuItems = [
    { label: "หน้าแรก", icon: LayoutDashboard, href: "/" },
    { label: "แจ้งพบสิ่งของ", icon: SearchCheck, href: "/found" },
    { label: "แจ้งของหาย", icon: SearchX, href: "/lost" },
    { label: "ระบบช่วยจับคู่", icon: Sparkles, href: "/matches" },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden hover:bg-slate-100/50 backdrop-blur-sm rounded-2xl transition-all"
          aria-label="เปิดเมนู"
        >
          <Menu className="h-[22px] w-[22px] text-slate-700" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[300px] sm:w-[340px] bg-white border-r border-slate-200 p-0 flex flex-col h-full"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>เมนูนำทาง</SheetTitle>
        </SheetHeader>

        {/* 👤 Header Section: User Profile (สไตล์ตามภาพอ้างอิง) */}
        <div className="px-6 py-10 border-b border-slate-100 shrink-0">
          {user ? (
            <Link 
              href="/profile" 
              onClick={() => setOpen(false)}
              className="flex flex-col gap-4 group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                <UserCircle2 className="w-8 h-8 text-slate-400" />
                {/* หากมีรูปโปรไฟล์สามารถใส่แท็ก <img src={user.image} ... /> ตรงนี้ได้ */}
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-slate-900 group-hover:text-black transition-colors">
                  โปรไฟล์ของฉัน
                </span>
                <span className="text-sm text-slate-500 font-medium">
                  {user.email?.split('@')[0]}
                </span>
              </div>
            </Link>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                <UserCircle2 className="w-8 h-8 text-slate-300" />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-base font-bold text-slate-900">
                  ผู้เยี่ยมชม
                </span>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 w-fit"
                >
                  เข้าสู่ระบบ / ลงทะเบียน
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 📋 Menu Items */}
        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? "bg-slate-100 text-slate-900"
                    : "bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={isActive ? "text-slate-900" : "text-slate-500"}
                />
                <span className={`text-[15px] ${isActive ? "font-bold" : "font-medium"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* 🌟 Footer Section: Logo (ย้ายโลโก้มาไว้ด้านล่าง) */}
        <div className="p-6 shrink-0 mt-auto opacity-40 pointer-events-none">
          <div className="flex items-center gap-2.5">
            <PackageSearch size={20} strokeWidth={2.5} className="text-slate-800" />
            <span className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 tracking-tighter">
              FoundIt.
            </span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}