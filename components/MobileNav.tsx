"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Home, Search, PlusCircle, User, LogIn, ChevronRight, LayoutDashboard, SearchCheck, SearchX, Workflow, Info, Sparkles, PackageSearch } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export function MobileNav({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { label: "หน้าแรก", icon: LayoutDashboard, href: "/", color: "text-purple-600" },
    { label: "แจ้งพบสิ่งของ", icon: SearchCheck, href: "/found", color: "text-green-600" },
    { label: "แจ้งของหาย", icon: SearchX, href: "/lost", color: "text-red-600" },
    { label: "ระบบช่วยจับคู่", icon: Sparkles, href: "/matches", color: "text-blue-600" },
    // { label: "ช่วยเหลือ", icon: Info, href: "/help", color: "text-gray-600" },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden hover:bg-white/50 backdrop-blur-sm rounded-xl transition-all"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[320px] bg-white backdrop-blur-xl border-r border-gray-100 p-0"
      >
        {/* Header */}
        <SheetHeader className="bg-gradient-to-r from-purple-50/80 to-white/80 border-b border-gray-100 px-6 py-6">
          <SheetTitle className="text-left">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 text-white p-2.5 rounded-2xl mr-3 shadow-lg shadow-indigo-200 group-hover:rotate-6 transition-transform duration-300">
                <PackageSearch size={22} strokeWidth={2.5} />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-600 tracking-tighter">
                  FoundIt.
                </span>
                <p className="text-xs text-gray-500 font-light mt-0.5">ระบบ......................</p>
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Menu Items */}
        <div className="flex flex-col gap-2 p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${isActive
                  ? "bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200 shadow-md"
                  : "bg-white/50 border-2 border-transparent hover:bg-gray-50 hover:border-gray-200 hover:shadow-sm"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-all ${isActive
                    ? "bg-white shadow-sm"
                    : "bg-gray-50 group-hover:bg-white group-hover:shadow-sm"
                    }`}>
                    <item.icon
                      className={`w-5 h-5 ${isActive ? item.color : "text-gray-400 group-hover:" + item.color
                        }`}
                    />
                  </div>
                  <span className={`font-medium ${isActive ? "text-gray-900" : "text-gray-600 group-hover:text-gray-900"
                    }`}>
                    {item.label}
                  </span>
                </div>
                <ChevronRight
                  size={18}
                  className={`transition-all duration-300 ${isActive
                    ? "text-purple-600 opacity-100 translate-x-0"
                    : "text-gray-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                    }`}
                />
              </Link>
            );
          })}

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400 font-medium">บัญชี</span>
            </div>
          </div>

          {/* User Section */}
          {user ? (
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group bg-gradient-to-r from-blue-50/50 to-white/50 border-2 border-transparent hover:from-blue-50 hover:to-blue-100/50 hover:border-blue-200 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 shadow-sm">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <span className="font-medium text-gray-900 block">โปรไฟล์ของฉัน</span>
                  <span className="text-xs text-gray-500 font-light">{user.email?.split('@')[0]}</span>
                </div>
              </div>
              <ChevronRight
                size={18}
                className="text-gray-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
              />
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group bg-gradient-to-r from-green-50/50 to-white/50 border-2 border-transparent hover:from-green-50 hover:to-green-100/50 hover:border-green-200 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-100 to-green-200 shadow-sm">
                  <LogIn className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-medium text-gray-900">เข้าสู่ระบบ</span>
              </div>
              <ChevronRight
                size={18}
                className="text-gray-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
              />
            </Link>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-50/80 to-transparent border-t border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 font-light">© 2024 CU Lost & Found</p>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-gray-400 font-light">Online</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}