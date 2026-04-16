"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  MessageSquare,
} from "lucide-react";

interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'match' | 'success' | 'system' | 'alert';
  link?: string;
  is_read: boolean;
  created_at: string;
}

const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHrs = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMins < 1) return "เมื่อสักครู่";
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  if (diffHrs < 24) return `${diffHrs} ชั่วโมงที่แล้ว`;
  if (diffDays === 1) return "เมื่อวานนี้";
  if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
  return past.toLocaleDateString("th-TH", { day: 'numeric', month: 'short', year: 'numeric' });
};

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  
  const pathname = usePathname();
  const router = useRouter(); 
  const supabase = createClient();

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); 
  const notificationRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUser(user);

        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (userData?.role === "admin") {
          router.replace("/admin");
        }
      } else {
        setUser(null);
      }
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setNotifications(data as NotificationItem[]);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    };

    fetchNotifications();

    const subscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${user.id}` 
      }, (payload) => {
        const newNotif = payload.new as NotificationItem;
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const markAllAsRead = async () => {
    if (!user) return;

    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      setNotifications(notifications.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
    }
    
    if (notif.link) {
      setIsNotificationOpen(false);
      router.push(notif.link);
    }
  };

  const menuItems = [
    { label: "หน้าแรก", href: "/" },
    { label: "แจ้งพบ", href: "/found" },
    { label: "แจ้งหาย", href: "/lost" },
    { label: "รายการจับคู่", href: "/matches" },
  ];

  const hideNavbarPages = ["/login", "/register", "/signup", "/admin"];
  if (hideNavbarPages.includes(pathname) || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled || pathname !== "/"
          ? "bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm py-4"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        
        {/* 🌟 ฝั่งซ้าย: Logo & Branding */}
        <div className="flex items-center gap-2">
          <div className="md:hidden mr-1">
            <MobileNav user={user} />
          </div>
          
          <Link href="/" className="flex items-center cursor-pointer group gap-2.5">
            <div className="bg-slate-900 text-white p-2 rounded-xl group-hover:bg-indigo-600 transition-colors duration-300">
              <PackageSearch size={20} strokeWidth={2.5} />
            </div>
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              FoundIt.
            </span>
          </Link>
        </div>

        {/* 🖥️ ตรงกลาง: Desktop Navigation (สไตล์คลีนแบบในภาพ) */}
        <div className="hidden md:flex items-center gap-8 lg:gap-10">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[15px] font-semibold transition-colors duration-200 ${
                  isActive
                    ? "text-indigo-600"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* 🔔 ฝั่งขวา: Actions & Profile */}
        <div className="flex items-center gap-4 lg:gap-6">
          
          {/* ระบบแจ้งเตือน (Notifications) */}
          <div className="relative flex items-center" ref={notificationRef}>
            <button 
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className={`p-1.5 transition-colors relative ${
                isNotificationOpen ? 'text-indigo-600' : 'text-slate-700 hover:text-indigo-600'
              }`}
              aria-label="แจ้งเตือน"
            >
              <Bell size={22} className={unreadCount > 0 ? "animate-pulse" : ""} strokeWidth={2} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
              )}
            </button>

            {/* Dropdown Box (ยังคงรูปแบบเดิมไว้) */}
            {isNotificationOpen && (
              <div className="absolute right-[-60px] sm:right-0 top-full mt-4 w-80 sm:w-96 bg-white rounded-3xl shadow-[0_10px_40px_rgb(0,0,0,0.08)] border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
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

                <div className="max-h-[350px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        onClick={() => handleNotificationClick(notif)}
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
                            {formatTimeAgo(notif.created_at)}
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

                <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
                  <button className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
                    ดูการแจ้งเตือนทั้งหมด
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* เมนูจัดการผู้ใช้ (User Dropdown) */}
          <UserNav user={user} />
        </div>
      </div>
    </nav>
  );
}