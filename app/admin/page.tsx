"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  LogOut,
  BarChart3,
  ShieldCheck,
  PackageSearch,
  Users,
  Check,
  KeySquare
} from "lucide-react";
import ReportsView from "./components/Dashboard";
import ClaimsView from "./components/Claims";
import ItemsView from "./components/Item";
import UsersView from "./components/User";
import { createClient } from "@/lib/supabase-client";

// ==========================================
// 🍞 Component สำหรับแจ้งเตือน (Toast)
// ==========================================
const Toast = ({ message }: { message: string }) => {
  if (!message) return null;
  return (
    <div className='fixed bottom-8 right-8 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center z-[110] animate-in slide-in-from-right-8 fade-in duration-300'>
      <div className='bg-emerald-500 p-1.5 rounded-full mr-3 shrink-0'>
        <Check size={16} className='text-white' strokeWidth={3} />
      </div>
      <span className='font-bold text-sm'>{message}</span>
    </div>
  );
};

export default function AdminPortal() { // ✅ ลบ Custom Prop ออกไปแล้ว
  const router = useRouter();
  const [activeView, setActiveView] = useState("reports");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const supabase = createClient();

  // ==========================================
  // 🔒 ตรวจสอบสิทธิ์ Admin
  // ==========================================
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase.from("users").select("role").eq("user_id", user.id).single();
      if (data?.role?.toLowerCase() !== "admin") {
        router.push("/");
      }
    };
    checkAdmin();
  }, [router]);

  // ==========================================
  // 🌟 FIX: ใช้ useCallback เพื่อป้องกัน Infinite Loop ใน Component ลูก
  // ==========================================
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  }, []); // ✅ คืนค่าเป็น [] ธรรมดาตามหลักของ React Hooks

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // ==========================================
  // 📋 รายการเมนูแท็บต่างๆ
  // ==========================================
  const navItems = [
    { id: "reports", label: "ภาพรวมระบบ", icon: BarChart3 },
    { id: "claims", label: "จัดการคำขอ", icon: ShieldCheck },
    { id: "items", label: "จัดการประกาศ", icon: PackageSearch },
    { id: "users", label: "จัดการผู้ใช้", icon: Users },
  ];

  return (
    <div className='min-h-screen bg-[#FAFAFA] font-sans selection:bg-indigo-100 selection:text-indigo-900'>

      {/* 🌟 Navbar for Admin */}
      <nav className='bg-slate-900 text-white fixed w-full z-50 shadow-md'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16 sm:h-20'>

          {/* Logo & Title */}
          <div className='flex items-center gap-2 sm:gap-3'>
            <div className='bg-indigo-500 text-white p-1.5 sm:p-2 rounded-xl'>
              <ShieldCheck size={20} strokeWidth={2.5} />
            </div>
            <span className='text-lg sm:text-xl font-black tracking-tight'>
              Admin <span className='text-indigo-400'>Portal</span>
            </span>
          </div>

          {/* Desktop Navigation Tabs */}
          <div className='hidden lg:flex items-center gap-1 bg-slate-800 p-1.5 rounded-2xl'>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2
                  ${activeView === item.id ? "bg-indigo-500 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </div>

          {/* Desktop Right Actions */}
          <div className='flex items-center gap-2 sm:gap-3'>

            {/* 🎯 ปุ่มไปหน้ายืนยัน PIN ส่งมอบของ */}
            <Link
              href="/admin/pickup"
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow-emerald-500/20 active:scale-95"
            >
              <KeySquare size={18} />
              รหัสยืนยันรับของ
            </Link>

            <button
              onClick={handleLogout}
              className='hidden sm:flex items-center gap-2 text-slate-400 hover:text-rose-400 font-bold text-sm px-3 py-2 rounded-xl transition-colors'
              title="ออกจากระบบ"
              aria-label="ออกจากระบบ"
            >
              <LogOut size={18} />
            </button>

            {/* ปุ่ม Mobile Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className='lg:hidden text-white p-2 hover:bg-slate-800 rounded-xl transition-colors'
              aria-label="เปิดเมนู"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* 📱 Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className='lg:hidden bg-slate-800 border-t border-slate-700 p-4 space-y-2 animate-in slide-in-from-top-2'>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3.5 rounded-xl transition-colors flex items-center gap-3 font-bold text-sm
                  ${activeView === item.id ? "bg-indigo-500 text-white" : "text-slate-300 hover:bg-slate-700"}`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}

            <div className="h-px bg-slate-700 my-4"></div>

            {/* Mobile: ลิงก์ไปหน้า Pickup */}
            <Link
              href="/admin/pickup"
              className="w-full text-left px-4 py-3.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 hover:border-emerald-500 rounded-xl transition-colors flex items-center gap-3 font-bold text-sm"
            >
              <KeySquare size={18} />
              รหัสยืนยันรับของ
            </Link>

            <button
              onClick={handleLogout}
              className='w-full text-left px-4 py-3.5 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-3 font-bold text-sm'
            >
              <LogOut size={18} />
              ออกจากระบบ
            </button>
          </div>
        )}
      </nav>

      {/* 🖥️ พื้นที่แสดงเนื้อหา (Content Area) */}
      <main className='max-w-7xl mx-auto pt-24 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8'>
        {activeView === "reports" && <ReportsView showToast={showToast} />}
        {activeView === "claims" && <ClaimsView showToast={showToast} />}
        {activeView === "items" && <ItemsView showToast={showToast} />}
        {activeView === "users" && <UsersView showToast={showToast} />}
      </main>

      <Toast message={toastMsg} />
    </div>
  );
}