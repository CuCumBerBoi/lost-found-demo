"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Home, Search, PlusCircle, User, LogIn } from "lucide-react"; // ไอคอน
import Link from "next/link";
import { useState } from "react";

export function MobileNav({ user }: { user: any }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-left bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold text-xl mb-4">
            CU Lost & Found
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col gap-4 mt-6">
          <Link 
            href="/" 
            onClick={() => setOpen(false)}
            className="flex items-center gap-4 px-2 py-2 text-lg font-medium hover:bg-gray-100 rounded-md"
          >
            <Home className="w-5 h-5 text-gray-500" />
            หน้าแรก (Home)
          </Link>

          <Link 
            href="/found" 
            onClick={() => setOpen(false)}
            className="flex items-center gap-4 px-2 py-2 text-lg font-medium hover:bg-gray-100 rounded-md"
          >
            <Search className="w-5 h-5 text-green-600" />
            แจ้งเจอของ (I Found)
          </Link>

          <Link 
            href="/report" 
            onClick={() => setOpen(false)}
            className="flex items-center gap-4 px-2 py-2 text-lg font-medium hover:bg-gray-100 rounded-md"
          >
            <PlusCircle className="w-5 h-5 text-red-600" />
            แจ้งของหาย (I Lost)
          </Link>

          {user ? (
            <Link 
              href="/profile" 
              onClick={() => setOpen(false)}
              className="flex items-center gap-4 px-2 py-2 text-lg font-medium hover:bg-gray-100 rounded-md"
            >
              <User className="w-5 h-5 text-blue-600" />
              โปรไฟล์ของฉัน
            </Link>
          ) : (
            <Link 
              href="/login" 
              onClick={() => setOpen(false)}
              className="flex items-center gap-4 px-2 py-2 text-lg font-medium hover:bg-gray-100 rounded-md text-blue-600"
            >
              <LogIn className="w-5 h-5" />
              เข้าสู่ระบบ
            </Link>
          )}
        </div>

        {/* Footer เล็กๆ ในเมนู */}
        <div className="absolute bottom-6 left-6 text-sm text-gray-400">
          © 2024 CU Lost & Found
        </div>
      </SheetContent>
    </Sheet>
  );
}