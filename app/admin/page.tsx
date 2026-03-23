"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  User,
  Menu,
  LogOut,
  BarChart3,
  ShieldCheck,
  PackageSearch,
  Users,
  CheckCircle2,
} from "lucide-react";
import ReportsView from "./components/ReportsView";
import ClaimsView from "./components/ClaimsView";
import ItemsView from "./components/ItemsView";
import UsersView from "./components/UsersView";
import { createClient } from "@/lib/supabase-client";

const Toast = ({ message }: { message: string }) => {
  if (!message) return null;
  return (
    <div className='fixed bottom-8 right-8 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center z-[100] animate-in slide-in-from-right-8 fade-in'>
      <div className='bg-emerald-500 p-1.5 rounded-full mr-3'>
        <CheckCircle2 size={16} strokeWidth={3} />
      </div>
      <span className='font-bold'>{message}</span>
    </div>
  );
};

interface AuthUser {
  id: string;
  email?: string;
}

export default function AdminPortal() {
  const [activeView, setActiveView] = useState("reports");
  const [toastMsg, setToastMsg] = useState("");
  const [_user, setUser] = useState<AuthUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const checkAuth = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    setUser(authUser as AuthUser | null);

    // Check if user is admin
    if (authUser) {
      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", authUser.id)
        .single();

      if (data?.role !== "admin") {
        window.location.href = "/";
      }
    } else {
      window.location.href = "/login";
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const navItemClass = (id: string) => `
    cursor-pointer py-5 text-sm font-bold border-b-2 transition-all 
    ${
      activeView === id
        ? "text-indigo-400 border-indigo-400"
        : "text-slate-400 border-transparent hover:text-white"
    }
  `;

  const navItems = [
    { id: "reports", label: "ภาพรวม", icon: BarChart3 },
    { id: "claims", label: "คำขอ", icon: ShieldCheck },
    { id: "items", label: "ประกาศ", icon: PackageSearch },
    { id: "users", label: "ผู้ใช้", icon: Users },
  ];

  return (
    <div className='min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900'>
      <Toast message={toastMsg} />

      {/* 🌑 Top Navbar (Dark Mode for Admin) */}
      <nav className='fixed top-0 w-full z-40 bg-slate-900 text-white shadow-md'>
        <div className='max-w-7xl mx-auto px-6 flex justify-between h-16 items-center'>
          <div className='flex items-center gap-3'>
            <div className='bg-indigo-600 p-2 rounded-lg'>
              <ShieldCheck size={24} />
            </div>
            <span className='text-lg font-bold'>Admin Portal</span>
          </div>

          <div className='hidden md:flex space-x-6'>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={navItemClass(item.id)}
              >
                <item.icon size={16} className='inline mr-2' />
                {item.label}
              </button>
            ))}
          </div>

          <div className='flex items-center gap-4'>
            <button aria-label="การแจ้งเตือน" title="การแจ้งเตือน" className='p-2 hover:bg-slate-800 rounded-full relative'>
              <Bell size={20} />
            </button>
            <div className='h-9 w-9 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-600 transition-colors'>
              <User size={16} />
            </div>
            <button
              onClick={handleLogout}
              className='p-2 hover:bg-slate-800 rounded-full'
              title='ออกจากระบบ'
            >
              <LogOut size={20} />
            </button>
            <button aria-label="เมนู" title="เมนู"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className='md:hidden text-white p-2'
            >
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className='md:hidden bg-slate-800 border-t border-slate-700 p-4 space-y-2'>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setMobileMenuOpen(false);
                }}
                className='w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2'
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* 🖥️ Main Content Area */}
      <main className='max-w-7xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8'>
        {activeView === "reports" && <ReportsView showToast={showToast} />}
        {activeView === "claims" && <ClaimsView showToast={showToast} />}
        {activeView === "items" && <ItemsView showToast={showToast} />}
        {activeView === "users" && <UsersView showToast={showToast} />}
      </main>
    </div>
  );
}
