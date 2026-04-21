"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, X, Home, PackageSearch, Megaphone, CheckSquare } from "lucide-react";

export default function MobileFloatingMenu() {
  const [isOpen, setIsOpen] = useState(false);

  // รายการเมนูของคุณ (ปรับเปลี่ยน href และชื่อได้ตามต้องการ)
  const menuItems = [
    { label: "หน้าแรก", icon: <Home size={20} />, href: "/", color: "text-slate-600" },
    { label: "แจ้งของหาย", icon: <Megaphone size={20} />, href: "/lost", color: "text-rose-500" },
    { label: "แจ้งของที่พบ", icon: <PackageSearch size={20} />, href: "/found", color: "text-emerald-500" },
    { label: "รายการจับคู่", icon: <CheckSquare size={20} />, href: "/matches", color: "text-indigo-500" }
  ];

  return (
    <div className="fixed bottom-6 right-6 lg:bottom-12 lg:right-12 z-50 flex flex-col items-end">
      
      {/* 🌟 ส่วนเมนูย่อย (จะแสดงเมื่อ isOpen = true) */}
      <div 
        className={`flex flex-col items-end space-y-3 mb-4 transition-all duration-300 origin-bottom ${
          isOpen ? "scale-100 opacity-100" : "scale-50 opacity-0 pointer-events-none"
        }`}
      >
        {menuItems.map((item, index) => (
          <Link 
            key={index} 
            href={item.href}
            onClick={() => setIsOpen(false)} // ปิดเมนูเมื่อกดเลือกลิงก์
            className="flex items-center space-x-3 flex-row-reverse"
          >
            {/* ปุ่มกลมเล็ก */}
            <div className="w-12 h-12 ml-3 bg-[#2D2F31] rounded-full shadow-lg flex items-center justify-center text-white border border-slate-700 hover:bg-slate-700 transition-colors">
              {item.icon}
            </div>
            {/* ป้ายชื่อเมนู */}
            <span className="bg-[#2D2F31] text-slate-200 text-sm font-medium px-3 py-1.5 rounded-lg shadow-md border border-slate-700">
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      {/* ➕ ปุ่มหลัก (Main Action Button) อิงสีเข้มจากรูปของคุณ */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 text-white ${
          isOpen ? "bg-slate-700 rotate-90" : "bg-[#2D2F31] border border-slate-700 hover:bg-slate-700"
        }`}
      >
        {/* สลับไอคอนระหว่างกากบาท (ปิด) กับบวก (เปิด) */}
        {isOpen ? <X size={28} /> : <Plus size={28} className="text-white" />}
      </button>
      
      {/* พื้นหลังดำโปร่งแสงเวลาเปิดเมนู (ช่วยให้เมนูเด่นขึ้น) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm -z-10"
          onClick={() => setIsOpen(false)} // กดพื้นที่ว่างเพื่อปิด
        ></div>
      )}
    </div>
  );
}