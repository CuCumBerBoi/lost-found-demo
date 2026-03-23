"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { UserNav } from "./UserNav";
import { MobileNav } from "./MobileNav";
import { 
  PackageSearch, 
  Bell, 
  LayoutDashboard, 
  SearchCheck, 
  SearchX, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Check
} from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();
  const supabase = createClient();

  // 🔔 State สำหรับ Notifications
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2); // สมมติว่ามี 2 แจ้งเตือนใหม่
  const notificationRef = useRef<HTMLDivElement>(null);

  // ข้อมูลจำลองสำหรับการแจ้งเตือน (เปลี่ยนเป็นดึงจาก Supabase ได้ในอนาคต)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "พบสิ่งของที่อาจเป็นของคุณ!",
      message: "ระบบ AI พบกระเป๋าสตางค์สีดำที่คล้ายกับที่คุณแจ้งหายไว้ ลองตรวจสอบดูสิ",
      type: "match",
      time: "10 นาทีที่แล้ว",
      is_read: false,
    },
    {
      id: 2,
      title: "คำขอรับของคืนได้รับการอนุมัติ",
      message: "แอดมินตรวจสอบหลักฐานขวดน้ำ AquaFlask ของคุณเรียบร้อยแล้ว กรุณาติดต่อรับของ",
      type: "success",
      time: "2 ชั่วโมงที่แล้ว",
      is_read: false,
    },
    {
      id: 3,
      title: "ยินดีต้อนรับสู่ FoundIt.",
      message: "เริ่มต้นใช้งานระบบแจ้งของหายและตามหาของด้วย AI ได้เลย",
      type: "system",
      time: "1 วันที่แล้ว",
      is_read: true,
    }
  ]);

  // 1. จัดการเอฟเฟกต์การเปลี่ยนสีพื้นหลังเมื่อเลื่อนหน้าจอ
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 2. ตรวจสอบสถานะการเข้าสู่ระบบและอัปเดตแบบ Real-time
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // 3. ปิด Notification Dropdown เมื่อคลิกที่อื่นบนหน้าจอ
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ฟังก์ชันกดอ่านการแจ้งเตือนทั้งหมด
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  // รายการเมนูหลักสำหรับ Desktop
  const menuItems = [
    { label: "หน้าแรก", icon: LayoutDashboard, href: "/" },
    { label: "แจ้งพบสิ่งของ", icon: SearchCheck, href: "/found" },
    { label: "แจ้งของหาย", icon: SearchX, href: "/lost" },
    { label: "รายการจับคู่", icon: Sparkles, href: "/matches" },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        
        {/* 🌟 ฝั่งซ้าย: Logo & Branding */}
        <div className="flex items-center gap-2">
          <div className="lg:hidden mr-1">
            <MobileNav user={user} />
          </div>
          
          <Link href="/" className="flex items-center cursor-pointer group">
            <div className="bg-indigo-600 text-white p-2.5 rounded-2xl mr-3 shadow-lg shadow-indigo-200 group-hover:rotate-6 transition-transform duration-300">
              <PackageSearch size={22} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-600 tracking-tighter">
                FoundIt.
              </span>
            </div>
          </Link>
        </div>

        {/* 🖥️ ตรงกลาง: Desktop Navigation (ซ่อนในมือถือ) */}
        <div className="hidden lg:flex items-center bg-slate-100/50 p-1.5 rounded-full border border-slate-200/40 backdrop-blur-md">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-5 py-2 text-sm font-bold rounded-full transition-all duration-300 flex items-center gap-2 ${
                  isActive
                    ? "text-indigo-600 bg-white shadow-sm ring-1 ring-slate-200"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <item.icon size={16} className={isActive ? "text-indigo-600" : "text-slate-400"} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* 🔔 ฝั่งขวา: Actions & Profile */}
        <div className="flex items-center gap-3">
          
          {/* ระบบแจ้งเตือน (Notifications) */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className={`p-2.5 rounded-2xl transition-all relative group ${
                isNotificationOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
              aria-label="แจ้งเตือน"
            >
              <Bell size={20} className={unreadCount > 0 ? "animate-pulse" : ""} />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
              )}
            </button>

            {/* Dropdown Box */}
            {isNotificationOpen && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-[0_10px_40px_rgb(0,0,0,0.08)] border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-bold text-slate-800">การแจ้งเตือน</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md transition-colors"
                    >
                      อ่านทั้งหมด
                    </button>
                  )}
                </div>

                {/* Notification List */}
                <div className="max-h-[350px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`p-4 flex gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer ${notif.is_read ? 'opacity-70' : 'bg-indigo-50/30'}`}
                      >
                        <div className="shrink-0 mt-1">
                          {notif.type === 'match' && <Sparkles className="text-amber-500" size={20} />}
                          {notif.type === 'success' && <CheckCircle2 className="text-emerald-500" size={20} />}
                          {notif.type === 'system' && <MessageSquare className="text-indigo-500" size={20} />}
                        </div>
                        <div className="flex-1">
                          <h4 className={`text-sm mb-1 ${notif.is_read ? 'text-slate-700 font-semibold' : 'text-slate-900 font-extrabold'}`}>
                            {notif.title}
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-2 block font-medium">
                            {notif.time}
                          </span>
                        </div>
                        {!notif.is_read && (
                          <div className="shrink-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-500">
                      <Bell size={24} className="mx-auto mb-2 opacity-20" />
                      <p className="text-sm font-medium">ไม่มีการแจ้งเตือนใหม่</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
                  <button className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
                    ดูการแจ้งเตือนทั้งหมด
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

          {/* เมนูจัดการผู้ใช้ (User Dropdown) */}
          <UserNav user={user} />
        </div>
      </div>
    </nav>
  );
}