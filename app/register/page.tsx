"use client";

import React, { useState } from "react";
// อย่าลืม import สิ่งที่ไม่ได้ใช้ในหน้านี้ออกเพื่อความสะอาด
import Image from "next/image";
import { Mail, Lock, User, Phone, ArrowRight, PackageSearch, Sparkles, CheckCircle2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase-client";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  // แก้ไข 1: ใช้ useMemo ป้องกันการสร้าง Client ใหม่ทุกรอบที่พิมพ์
  const supabase = React.useMemo(() => createClient(), []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirm_password) {
      toast.error("รหัสผ่านไม่ตรงกัน", { description: "กรุณายืนยันรหัสผ่านใหม่อีกครั้ง" });
      return;
    }

    if (formData.password.length < 6) {
      toast.error("รหัสผ่านสั้นเกินไป", { description: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            phone_number: formData.phone_number,
            role: 'user',
          }
        }
      });

      if (error) {
        toast.error("สมัครสมาชิกไม่สำเร็จ", { description: error.message });
        return;
      }

      // แก้ไข 3: เช็คกรณีอีเมลนี้มีอยู่ในระบบแล้ว
      if (data.user?.identities?.length === 0) {
        toast.error("อีเมลนี้ถูกใช้งานแล้ว", { description: "กรุณาใช้อีเมลอื่น หรือเข้าสู่ระบบแทน" });
        return;
      }

      // แก้ไข 2: เช็คว่าได้ Session เลยไหม (ขึ้นอยู่กับการตั้งค่า Confirm Email ใน Supabase)
      if (!data.session) {
        // กรณีเปิดบังคับยืนยันอีเมล
        toast.success("ลงทะเบียนสำเร็จ!", {
          description: "กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันตัวตนก่อนเข้าสู่ระบบ"
        });
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        // กรณีปิดการยืนยันอีเมล (Auto-login)
        toast.success("สร้างบัญชีสำเร็จ!", { description: "กำลังเข้าสู่ระบบ..." });
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1500);
      }

    } catch (err) {
      toast.error("เกิดข้อผิดพลาด", { description: "โปรดลองอีกครั้ง" });
    } finally {
      // แก้ไข 4: คืนค่าปุ่มให้กลับมากดได้เสมอ
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex font-sans">

      {/* 🌟 Left Section: Branding & Inspiration (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-5/12 relative items-center justify-center p-12 overflow-hidden">

        <Image src="/losting.png" alt="losting" fill className="absolute inset-0 object-cover opacity-100" />

        {/* Darker overlay เพื่อให้ตัวหนังสือสีขาวอ่านง่ายขึ้น */}
        <div className="absolute inset-0 bg-slate-900/50"></div>

        {/* Decorative Background Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/20 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-emerald-500/10 blur-[80px] rounded-full"></div>

        <div className="relative z-10 max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
            เริ่มต้นใช้งาน <br />
            <span className="text-indigo-400">Foundit.</span>
          </h1>
          <p className="text-lg text-slate-300 mb-12">
            ช่วยให้ของรักกลับคืนสู่เจ้าของได้ง่ายขึ้น ด้วยระบบจัดการสิ่งของหายที่ทันสมัยที่สุด
          </p>


        </div>
      </div>

      {/* 🔐 Right Section: Register Form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-700">

          {/* Logo Mobile */}
          <div className="flex items-center justify-center lg:justify-start mb-10">
            <div className='bg-indigo-600 text-white p-2.5 rounded-xl mr-3 shadow-lg shadow-indigo-200'>
              <PackageSearch size={28} strokeWidth={2.5} />
            </div>
            <span className='text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight'>
              FoundIt.
            </span>
          </div>

          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">สร้างบัญชีผู้ใช้ใหม่</h2>
            <p className="text-slate-500">กรอกข้อมูลด้านล่างเพื่อเริ่มต้นใช้งานระบบ</p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Full Name */}
            <div className="md:col-span-1">
              <label className="block text-sm font-bold text-slate-700 mb-2">ชื่อ-นามสกุล</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="first_name"
                  required
                  onChange={handleChange}
                  placeholder="สมชาย"
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Last Name */}
            <div className="md:col-span-1">
              <label className="block text-sm font-bold text-slate-700 mb-2">นามสกุล</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="last_name"
                  required
                  onChange={handleChange}
                  placeholder="ใจดี"
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>


            {/* Phone Number */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">เบอร์โทรศัพท์</label>
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  name="phone_number"
                  required
                  onChange={handleChange}
                  placeholder="0812345678"
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>


            {/* Email */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">อีเมล</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  required
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>


            {/* Password */}
            <div className="md:col-span-1">
              <label className="block text-sm font-bold text-slate-700 mb-2">รหัสผ่าน</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-10 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>


            {/* Confirm Password */}
            <div className="md:col-span-1">
              <label className="block text-sm font-bold text-slate-700 mb-2">ยืนยันรหัสผ่าน</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirm_password"
                  required
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-10 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 hover:-translate-y-0.5 transition-all flex items-center justify-center disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    สร้างบัญชีผู้ใช้
                    <ArrowRight size={20} className="ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-slate-600 font-medium">
            มีบัญชีผู้ใช้อยู่แล้ว?
            <Link href="/login" className="ml-2 text-indigo-600 font-bold hover:underline">
              เข้าสู่ระบบที่นี่
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}