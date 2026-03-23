"use client";

import React, { useState } from "react";
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

  const supabase = createClient();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. ตรวจสอบความถูกต้องของรหัสผ่าน
    if (formData.password !== formData.confirm_password) {
      toast.error("รหัสผ่านไม่ตรงกัน", { description: "กรุณายืนยันรหัสผ่านใหม่อีกครั้ง" });
      return;
    }

    if (formData.password.length < 6) {
      toast.error("รหัสผ่านสั้นเกินไป", { description: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" });
      return;
    }

    setIsLoading(true);

    // 2. ส่งข้อมูลไปสมัครสมาชิกที่ Supabase
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.full_name,
          phone_number: formData.phone_number,
          role: 'user', // กำหนด role เริ่มต้น
        }
      }
    });

    if (error) {
      toast.error("สมัครสมาชิกไม่สำเร็จ", { description: error.message });
      setIsLoading(false);
    } else {
      toast.success("สร้างบัญชีสำเร็จ!", { description: "กำลังพาคุณเข้าสู่ระบบ..." });
      
      // เมื่อสมัครเสร็จ พาไปหน้าหลัก
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1500);
    }
  };

  return (
    <div className='min-h-screen bg-[#FAFAFA] text-slate-900 flex font-sans selection:bg-indigo-100 selection:text-indigo-900'>
      
      {/* 🌟 Left Section: Branding & Graphic */}
      <div className='hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center p-12'>
        <div className='absolute top-0 left-0 w-full h-full pointer-events-none'>
          <div className='absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/30 blur-[120px] rounded-full mix-blend-screen'></div>
          <div className='absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-violet-600/20 blur-[120px] rounded-full mix-blend-screen'></div>
        </div>

        <div className='relative z-10 w-full max-w-lg'>
          <div className='inline-flex items-center space-x-2 bg-white/10 border border-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium text-white mb-8'>
            <Sparkles size={16} className='text-amber-400' />
            <span>Join Our Community</span>
          </div>
          <h1 className='text-5xl font-extrabold text-white tracking-tight leading-tight mb-6'>
            เริ่มต้นใช้งานระบบ <br />
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400'>
              FoundIt.
            </span>
          </h1>
          <p className='text-lg text-slate-300 leading-relaxed mb-12 font-medium'>
            ร่วมเป็นส่วนหนึ่งในการสร้างสังคมแห่งการแบ่งปัน ช่วยให้ของที่สูญหายได้กลับคืนสู่เจ้าของอย่างปลอดภัย
          </p>

          <div className='space-y-5'>
            <div className='flex items-center text-slate-300 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm'>
              <div className='bg-emerald-500/20 p-2.5 rounded-xl mr-4'>
                <CheckCircle2 className='text-emerald-400' size={24} />
              </div>
              <div>
                <h4 className='text-white font-bold mb-0.5'>Smart Matching</h4>
                <p className='text-sm'>ระบบช่วยจับคู่สิ่งของที่หายกับสิ่งของที่พบโดยอัตโนมัติ</p>
              </div>
            </div>
            <div className='flex items-center text-slate-300 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm'>
              <div className='bg-indigo-500/20 p-2.5 rounded-xl mr-4'>
                <ShieldCheck className='text-indigo-400' size={24} />
              </div>
              <div>
                <h4 className='text-white font-bold mb-0.5'>Secure Claiming</h4>
                <p className='text-sm'>ระบบยืนยันตัวตนที่ปลอดภัยและรัดกุม</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📝 Right Section: Register Form */}
      <div className='w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto'>
        <div className='absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-400/10 blur-[80px] rounded-full -z-10 lg:hidden'></div>

        <div className='w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 py-8'>
          
          <div className='flex items-center justify-center lg:hidden mb-10'>
            <div className='bg-indigo-600 text-white p-2.5 rounded-xl mr-3 shadow-lg shadow-indigo-200'>
              <PackageSearch size={28} strokeWidth={2.5} />
            </div>
            <span className='text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight'>
              FoundIt.
            </span>
          </div>

          <div className='mb-8 text-center lg:text-left'>
            <h2 className='text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3'>
              สร้างบัญชีใหม่ ✨
            </h2>
            <p className='text-slate-500 text-base sm:text-lg font-medium'>
              สมัครสมาชิกเพื่อเริ่มใช้งานระบบ Lost & Found อัจฉริยะ
            </p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-bold text-slate-700 mb-2'>
                ชื่อ-นามสกุล <span className='text-rose-500'>*</span>
              </label>
              <div className='relative'>
                <User size={20} className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400' />
                <input
                  type='text'
                  name='full_name'
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder='เช่น สมชาย ใจดี'
                  className='w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 shadow-sm transition-all font-medium'
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-bold text-slate-700 mb-2'>
                เบอร์โทรศัพท์ <span className='text-rose-500'>*</span>
              </label>
              <div className='relative'>
                <Phone size={20} className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400' />
                <input
                  type='tel'
                  name='phone_number'
                  required
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder='08X-XXX-XXXX'
                  className='w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 shadow-sm transition-all font-medium'
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-bold text-slate-700 mb-2'>
                อีเมล <span className='text-rose-500'>*</span>
              </label>
              <div className='relative'>
                <Mail size={20} className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400' />
                <input
                  type='email'
                  name='email'
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder='your.email@university.ac.th'
                  className='w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 shadow-sm transition-all font-medium'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-bold text-slate-700 mb-2'>
                  รหัสผ่าน <span className='text-rose-500'>*</span>
                </label>
                <div className='relative'>
                  <Lock size={20} className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400' />
                  <input
                    type={showPassword ? "text" : "password"}
                    name='password'
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder='••••••••'
                    className='w-full pl-11 pr-10 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 shadow-sm transition-all font-medium tracking-wide'
                  />
                </div>
              </div>

              <div>
                <label className='block text-sm font-bold text-slate-700 mb-2'>
                  ยืนยันรหัสผ่าน <span className='text-rose-500'>*</span>
                </label>
                <div className='relative'>
                  <Lock size={20} className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400' />
                  <input
                    type={showPassword ? "text" : "password"}
                    name='confirm_password'
                    required
                    value={formData.confirm_password}
                    onChange={handleChange}
                    placeholder='••••••••'
                    className='w-full pl-11 pr-10 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 shadow-sm transition-all font-medium tracking-wide'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1'
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type='submit'
              disabled={isLoading}
              className={`w-full py-4 mt-6 bg-slate-900 text-white font-bold rounded-xl shadow-[0_8px_20px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_25px_rgb(0,0,0,0.18)] hover:-translate-y-0.5 hover:bg-slate-800 transition-all flex items-center justify-center ${isLoading ? "opacity-80 pointer-events-none" : ""}`}
            >
              {isLoading ? (
                <div className='w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
              ) : (
                <>
                  สร้างบัญชีผู้ใช้
                  <ArrowRight size={20} className='ml-2' />
                </>
              )}
            </button>
          </form>

          <div className='my-8 flex items-center'>
            <div className='grow h-px bg-slate-200'></div>
            <span className='px-4 text-xs font-bold text-slate-400 uppercase tracking-wider'>หรือ</span>
            <div className='grow h-px bg-slate-200'></div>
          </div>

          <button className='w-full py-3.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center mb-8'>
            <svg className='w-5 h-5 mr-3' viewBox='0 0 24 24'>
              <path fill='#4285F4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'/>
              <path fill='#34A853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'/>
              <path fill='#FBBC05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'/>
              <path fill='#EA4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'/>
            </svg>
            สมัครด้วย Google
          </button>

          <div className='text-center text-slate-600 font-medium text-sm sm:text-base'>
            มีบัญชีผู้ใช้อยู่แล้ว?
            <Link href="/login" className='ml-2 text-indigo-600 font-bold hover:text-indigo-800 hover:underline transition-colors'>
              เข้าสู่ระบบเลย
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}