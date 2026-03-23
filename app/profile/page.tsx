"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { 
  Mail, 
  Settings, 
  LogOut, 
  Trash2, 
  Check, 
  MapPin, 
  Clock, 
  Search, 
  PackageSearch, 
  Sparkles, 
  User,
  Loader2,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle
} from "lucide-react";

// ==========================================
// 📦 Interfaces
// ==========================================
interface UserProfile {
  user_id: string;
  full_name: string | null;
  profile_url: string | null;
  role: string | null;
}

interface ProfileItem {
  id: string;
  title: string;
  image_url: string | null;
  location_text: string;
  date: string;
  status: string;
  type: 'LOST' | 'FOUND';
  category_name: string;
}

interface ClaimItem {
  id: string;
  item_id: string;
  title: string;
  image_url: string | null;
  location_text: string;
  status: string;
  created_at: string;
}

// ==========================================
// 🚀 Main Profile Page Component
// ==========================================
export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [lostItems, setLostItems] = useState<ProfileItem[]>([]);
  const [foundItems, setFoundItems] = useState<ProfileItem[]>([]);
  const [claimItems, setClaimItems] = useState<ClaimItem[]>([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);

      // 1. ดึงโปรไฟล์
      const profileRes = await supabase.from("users").select("*").eq("user_id", user.id).single();
      setUserProfile(profileRes.data);

      // 2. ดึงของที่หาย
      const lostRes = await supabase.from("lost_items").select("*, categories(name)").eq("user_id", user.id).order("created_at", { ascending: false });

      // 3. ดึงของที่เจอ
      const foundRes = await supabase.from("found_items").select("*, categories(name)").eq("user_id", user.id).order("created_at", { ascending: false });

      // 4. ดึงคำขอยืนยันสิทธิ์ (Claims)
      const claimsRes = await supabase.from("claims").select("*").eq("claimer_id", user.id).order("created_at", { ascending: false });
      
      const rawClaims = claimsRes.data || [];
      const mappedClaims: ClaimItem[] = [];
      
      // 🛠️ ปรับลดความซับซ้อนของโครงสร้าง Loop เพื่อป้องกัน Turbopack Panic
      for (const claim of rawClaims) {
        let foundItem = null;
        const targetId = claim.found_id || claim.item_id;

        if (targetId) {
          // สเต็ปที่ 1: หาใน found_items ด้วย found_id
          const f1 = await supabase.from("found_items").select("title, image_url, images, location_text").eq("found_id", targetId).maybeSingle();
          if (f1.data) foundItem = f1.data;

          // สเต็ปที่ 2: ถ้าไม่เจอ ลองหาใน found_items ด้วย id
          if (!foundItem) {
            const f2 = await supabase.from("found_items").select("title, image_url, images, location_text").eq("id", targetId).maybeSingle();
            if (f2.data) foundItem = f2.data;
          }

          // สเต็ปที่ 3: เผื่อเป็นของในตาราง lost_items หาด้วย lost_id
          if (!foundItem) {
            const l1 = await supabase.from("lost_items").select("title, image_url, images, location_text").eq("lost_id", targetId).maybeSingle();
            if (l1.data) foundItem = l1.data;
          }

          // สเต็ปที่ 4: หาในตาราง lost_items ด้วย id
          if (!foundItem) {
            const l2 = await supabase.from("lost_items").select("title, image_url, images, location_text").eq("id", targetId).maybeSingle();
            if (l2.data) foundItem = l2.data;
          }
        }

        mappedClaims.push({
          id: claim.id,
          status: claim.status,
          created_at: claim.created_at,
          item_id: targetId,
          title: foundItem?.title || "ประกาศนี้อาจถูกลบไปแล้ว",
          image_url: foundItem?.image_url || (foundItem?.images && foundItem.images.length > 0 ? foundItem.images[0] : null),
          location_text: foundItem?.location_text || "ไม่ระบุสถานที่",
        });
      }

      // Map ข้อมูล Lost
      setLostItems((lostRes.data || []).map((item: any) => ({
        id: item.id || item.lost_id,
        title: item.title,
        image_url: item.image_url || (item.images && item.images.length > 0 ? item.images[0] : null),
        location_text: item.location_text,
        date: item.date_lost,
        status: item.status,
        type: 'LOST',
        category_name: item.categories?.name || "ไม่ระบุหมวดหมู่"
      })));

      // Map ข้อมูล Found
      setFoundItems((foundRes.data || []).map((item: any) => ({
        id: item.id || item.found_id,
        title: item.title,
        image_url: item.image_url || (item.images && item.images.length > 0 ? item.images[0] : null),
        location_text: item.location_text,
        date: item.date_found,
        status: item.status,
        type: 'FOUND',
        category_name: item.categories?.name || "ไม่ระบุหมวดหมู่"
      })));

      setClaimItems(mappedClaims);

    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("ไม่สามารถโหลดข้อมูลโปรไฟล์ได้");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("ออกจากระบบสำเร็จ");
    router.push("/login");
  };

  const handleDelete = async (id: string, type: 'LOST' | 'FOUND') => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?")) return;
    try {
      const table = type === 'LOST' ? 'lost_items' : 'found_items';
      const { error } = await supabase.from(table).delete().eq('id', id); 
      if (error) {
        const fallbackColumn = type === 'LOST' ? 'lost_id' : 'found_id';
        const { error: err2 } = await supabase.from(table).delete().eq(fallbackColumn, id);
        if (err2) throw err2;
      }
      toast.success("ลบรายการสำเร็จ");
      if (type === 'LOST') setLostItems(prev => prev.filter(item => item.id !== id));
      else setFoundItems(prev => prev.filter(item => item.id !== id));
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาดในการลบ: " + error.message);
    }
  };

  const handleResolve = async (id: string, type: 'LOST' | 'FOUND') => {
    if (!window.confirm("ทำเครื่องหมายว่าจบงาน (หาของเจอแล้ว หรือ คืนของแล้ว)?")) return;
    try {
      const table = type === 'LOST' ? 'lost_items' : 'found_items';
      const newStatus = type === 'LOST' ? 'RESOLVED' : 'RETURNED';
      const { error } = await supabase.from(table).update({ status: newStatus }).eq('id', id);
      if (error) {
        const fallbackColumn = type === 'LOST' ? 'lost_id' : 'found_id';
        const { error: err2 } = await supabase.from(table).update({ status: newStatus }).eq(fallbackColumn, id);
        if (err2) throw err2;
      }
      toast.success("อัปเดตสถานะสำเร็จ");
      fetchUserData(); 
    } catch (error: any) {
      toast.error("เกิดข้อผิดพลาดในการอัปเดต: " + error.message);
    }
  };

  const handleCancelClaim = async (claimId: string) => {
    if (!window.confirm("คุณต้องการยกเลิกคำขอยืนยันสิทธิ์นี้ใช่หรือไม่?")) return;
    try {
      const { error } = await supabase.from("claims").delete().eq('id', claimId);
      if (error) throw error;
      toast.success("ยกเลิกคำขอสำเร็จ");
      setClaimItems(prev => prev.filter(claim => claim.id !== claimId));
    } catch (error: any) {
      toast.error("ยกเลิกคำขอไม่สำเร็จ: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center gap-4'>
        <Loader2 className='w-12 h-12 text-indigo-600 animate-spin' />
        <p className='text-slate-500 font-bold uppercase tracking-widest text-sm animate-pulse'>กำลังโหลดข้อมูลโปรไฟล์...</p>
      </div>
    );
  }

  const initials = userProfile?.full_name?.substring(0, 2).toUpperCase() || currentUser?.email?.substring(0, 2).toUpperCase() || "ME";

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      <main className="max-w-5xl mx-auto pt-28 sm:pt-32 pb-24 sm:pb-16 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
        
        {/* 🌟 Profile Header Card */}
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 sm:p-8 mb-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
          <div className="h-24 w-24 sm:h-28 sm:w-28 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black border-4 border-white shadow-lg shrink-0 rotate-3 hover:rotate-0 transition-transform">
            {userProfile?.profile_url ? (
               // eslint-disable-next-line @next/next/no-img-element
               <img src={userProfile.profile_url} alt="Profile" className="w-full h-full object-cover rounded-[1.25rem]" />
            ) : (
               initials
            )}
          </div>
          
          <div className="text-center sm:text-left flex-1 mt-2 sm:mt-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{userProfile?.full_name || "ไม่ได้ตั้งชื่อ"}</h1>
            <p className="text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 mt-1.5 text-sm sm:text-base font-medium">
              <Mail size={16} className="text-slate-400" /> {currentUser?.email}
            </p>
            <div className="flex gap-2 justify-center sm:justify-start flex-wrap mt-4">
                <span className="bg-indigo-50 text-indigo-600 px-3 py-1.5 text-xs font-bold rounded-xl border border-indigo-100 flex items-center gap-1">
                  <User size={14} /> {userProfile?.role || "ผู้ใช้งานทั่วไป"}
                </span>
            </div>
          </div>
          
          <div className="flex w-full sm:w-auto gap-3 mt-4 sm:mt-2">
             <button className="flex-1 sm:flex-none px-4 py-3 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 active:scale-95">
               <Settings size={16}/> <span className="sm:hidden lg:inline">ตั้งค่า</span>
             </button>
             <button onClick={handleLogout} className="flex-1 sm:flex-none px-4 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-sm font-bold hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 active:scale-95">
               <LogOut size={16}/> <span className="sm:hidden lg:inline">ออกระบบ</span>
             </button>
          </div>
        </div>

        <div className="space-y-14">
          
          {/* 📋 Section 0: ติดตามสถานะขอรับของคืน (Claims) */}
          <section>
            <div className="flex justify-between items-end mb-6 px-1">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 border border-indigo-100 shrink-0">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">ติดตามสถานะขอรับของคืน</h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">สิ่งของที่คุณยืนยันสิทธิ์ความเป็นเจ้าของ</p>
                  </div>
               </div>
               <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm mb-1 flex items-center">
                 {claimItems.length} รายการ
               </div>
            </div>

            {claimItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {claimItems.map((claim) => (
                  <ClaimCard key={claim.id} claim={claim} onCancel={handleCancelClaim} />
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center bg-white rounded-[2rem] border border-slate-100 shadow-sm border-dashed">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <FileText size={28} className="text-slate-300" />
                 </div>
                 <h3 className="text-base font-bold text-slate-900 mb-1">ยังไม่มีประวัติการขอยืนยันสิทธิ์</h3>
                 <p className="text-slate-500 text-sm max-w-sm font-medium px-4">เมื่อคุณพบของตัวเองและกดขอรับคืน สถานะจะแสดงที่นี่</p>
              </div>
            )}
          </section>

          {/* 🔍 Section 1: ของที่ฉันทำหาย (Lost Items) */}
          <section>
            <div className="flex justify-between items-end mb-6 px-1">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-100 shrink-0">
                    <Search size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">ประวัติแจ้งของหาย</h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">รายการที่คุณกำลังตามหา</p>
                  </div>
               </div>
               <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm mb-1">
                 {lostItems.length} รายการ
               </div>
            </div>

            {lostItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {lostItems.map((item) => (
                  <ProfileCard key={item.id} item={item} theme="rose" onDelete={handleDelete} onResolve={handleResolve} />
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center bg-white rounded-[2rem] border border-slate-100 shadow-sm border-dashed">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Search size={28} className="text-slate-300" />
                 </div>
                 <h3 className="text-base font-bold text-slate-900 mb-1">ยังไม่มีประวัติแจ้งของหาย</h3>
                 <Link href="/lost" className="mt-4 px-6 py-2.5 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-colors text-sm active:scale-95">
                   + สร้างประกาศของหาย
                 </Link>
              </div>
            )}
          </section>

          {/* 🎁 Section 2: ของที่ฉันเจอ (Found Items) */}
          <section>
            <div className="flex justify-between items-end mb-6 px-1">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-100 shrink-0">
                    <PackageSearch size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">ประวัติแจ้งเจอของ</h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">สิ่งของที่คุณเก็บได้และกำลังหาเจ้าของ</p>
                  </div>
               </div>
               <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm mb-1">
                 {foundItems.length} รายการ
               </div>
            </div>

            {foundItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {foundItems.map((item) => (
                  <ProfileCard key={item.id} item={item} theme="emerald" onDelete={handleDelete} onResolve={handleResolve} />
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center bg-white rounded-[2rem] border border-slate-100 shadow-sm border-dashed">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <PackageSearch size={28} className="text-slate-300" />
                 </div>
                 <h3 className="text-base font-bold text-slate-900 mb-1">คุณยังไม่เคยแจ้งเจอของ</h3>
                 <Link href="/found" className="mt-4 px-6 py-2.5 bg-emerald-50 text-emerald-600 font-bold rounded-xl hover:bg-emerald-100 transition-colors text-sm active:scale-95">
                   + ประกาศแจ้งเจอของ
                 </Link>
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}

// ==========================================
// 🧩 Claim Card Component (การ์ดแสดงสถานะคำขอ)
// ==========================================
function ClaimCard({ claim, onCancel }: { claim: ClaimItem, onCancel: (id: string) => void }) {
  
  let statusConfig = {
    bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200',
    icon: <Clock size={16} className="mr-1.5" />, label: 'รอแอดมินตรวจสอบ'
  };

  if (claim.status === 'APPROVED' || claim.status === 'approved') {
    statusConfig = {
      bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200',
      icon: <CheckCircle2 size={16} className="mr-1.5" />, label: 'อนุมัติแล้ว (ติดต่อรับของ)'
    };
  } else if (claim.status === 'REJECTED' || claim.status === 'rejected') {
    statusConfig = {
      bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200',
      icon: <XCircle size={16} className="mr-1.5" />, label: 'หลักฐานไม่ผ่าน (ถูกปฏิเสธ)'
    };
  }

  return (
    <div className="bg-white rounded-[1.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col relative group">
      <div className="relative h-36 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center border-b border-slate-100">
        {claim.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={claim.image_url} alt={claim.title} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="flex flex-col items-center opacity-40">
             <ImageIcon size={24} className="mb-2" />
          </div>
        )}
        
        {/* Status Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 backdrop-blur-[2px]">
          <div className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center shadow-lg border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
            {statusConfig.icon} {statusConfig.label}
          </div>
        </div>
      </div>
      
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <h3 className="font-extrabold text-base mb-2 line-clamp-1 text-slate-900 leading-tight">{claim.title}</h3>
        <div className="flex items-center text-slate-500 text-xs font-medium mb-3">
          <Clock size={12} className="mr-1.5 text-slate-400 shrink-0" />
          <span>ส่งคำขอเมื่อ {new Date(claim.created_at).toLocaleDateString('th-TH')}</span>
        </div>

        <div className="mt-auto pt-3 border-t border-slate-100 flex gap-2">
         <Link 
           href={`/item/${claim.item_id}`}
           className="flex-1 text-center py-2.5 bg-slate-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors active:scale-95"
         >
           ดูรายละเอียด
         </Link>
         {(claim.status === 'PENDING' || claim.status === 'pending') && (
           <button 
             onClick={() => onCancel(claim.id)}
             className="p-2.5 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors active:scale-95"
             title="ยกเลิกคำขอ"
           >
              <Trash2 size={16}/>
           </button>
         )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 🧩 Profile Card Component
// ==========================================
function ProfileCard({ item, theme, onDelete, onResolve }: any) {
  const isResolved = item.status === 'RESOLVED' || item.status === 'RETURNED' || (item.status !== 'SEARCHING' && item.status !== 'searching' && item.status !== 'AVAILABLE' && item.status !== 'available');
  const badgeBg = theme === 'rose' ? 'bg-rose-500' : 'bg-emerald-500';

  return (
    <div className={`bg-white rounded-[1.5rem] border ${isResolved ? 'border-slate-100 opacity-75' : 'border-slate-200'} overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col relative`}>
      <div className="relative h-44 overflow-hidden bg-slate-50 shrink-0 flex items-center justify-center">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center opacity-40"><ImageIcon size={32} className="mb-2" /></div>
        )}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm ${badgeBg}`}>
            {item.type === 'LOST' ? 'ของหาย' : 'เก็บของได้'}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm ${isResolved ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'}`}>
            {item.status}
          </span>
        </div>
      </div>
      
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <h3 className={`font-extrabold text-base mb-3 line-clamp-1 leading-tight ${isResolved ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{item.title}</h3>
        <div className="space-y-1.5 mb-4 flex-1">
          <div className="flex items-center text-slate-500 text-xs font-medium">
            <MapPin size={14} className="mr-1.5 text-slate-400 shrink-0" /><span className="truncate">{item.location_text}</span>
          </div>
          <div className="flex items-center text-slate-500 text-xs font-medium">
            <Clock size={14} className="mr-1.5 text-slate-400 shrink-0" />
            <span>{new Date(item.date).toLocaleDateString('th-TH')}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex gap-2 shrink-0">
         {!isResolved && (
           <button onClick={() => onResolve(item.id, item.type)} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-colors active:scale-95 ${theme === 'rose' ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
              <Check size={14}/> {item.type === 'LOST' ? 'เจอแล้ว (จบงาน)' : 'คืนแล้ว (จบงาน)'}
           </button>
         )}
         <Link href={`/item/${item.id}`} className="p-2.5 bg-slate-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors active:scale-95" title="ดูรายละเอียด">
            <AlertCircle size={16}/>
         </Link>
         <button onClick={() => onDelete(item.id, item.type)} className={`p-2.5 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors active:scale-95 ${isResolved ? 'flex-1 flex justify-center gap-2' : ''}`} title="ลบประกาศ">
            <Trash2 size={16}/> {isResolved ? <span className="text-xs font-bold">ลบประวัติทิ้ง</span> : ''}
         </button>
        </div>
      </div>
    </div>
  );
}