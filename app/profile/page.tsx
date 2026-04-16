"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  UserCircle2,
  Clock,
  CheckCircle2,
  XCircle,
  PackageSearch,
  MapPin,
  Trash2,
  Image as ImageIcon,
  Edit3,
  SearchX,
  ChevronRight,
  ShieldCheck,
  Package,
  Loader2
} from "lucide-react";

// ==========================================
// 📦 Interfaces
// ==========================================
interface Claim {
  id: string;
  status: string;
  created_at: string;
  found_item: {
    id: string;
    title: string;
    building: string;
    room: string;
    location_text: string;
    image_url: string | null;
  };
}

interface UserPost {
  id: string;
  title: string;
  type: 'lost' | 'found';
  status: string;
  created_at: string;
  location: string;
  image_url: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"claims" | "my_posts">("claims");
  const [myClaims, setMyClaims] = useState<Claim[]>([]);
  const [myPosts, setMyPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{ email: string; name: string } | null>(null);

  useEffect(() => {
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push("/login");
        return;
      }

      // ดึงข้อมูลโปรไฟล์ผู้ใช้
      const { data: userData } = await supabase
        .from("users")
        .select("full_name, email")
        .eq("user_id", user.id)
        .single();

      setUserProfile({
        email: user.email || "",
        name: userData?.full_name || "ผู้ใช้งานระบบ"
      });

      // ดึงข้อมูลประวัติการขอรับคืน (Claims)
      const { data: claimsData } = await supabase
        .from("claims")
        .select(`
          id:claim_id, 
          status, 
          created_at, 
          found_item:found_items(id:found_id, title, building, room, location_text, image_url)
        `)
        .eq("claimer_id", user.id)
        .order("created_at", { ascending: false });

      if (claimsData) {
        setMyClaims(claimsData as unknown as Claim[]);
      }

      // ดึงข้อมูลประกาศของฉัน (Lost & Found Posts)
      const [{ data: lostData }, { data: foundData }] = await Promise.all([
        supabase.from("lost_items").select("*").eq("user_id", user.id),
        supabase.from("found_items").select("*").eq("user_id", user.id)
      ]);

      const formattedPosts: UserPost[] = [];

      // จัดรูปแบบข้อมูลของที่หาย (Lost)
      if (lostData) {
        formattedPosts.push(...lostData.map((item: any) => ({
          id: item.id || item.lost_id,
          title: item.title,
          type: 'lost' as const,
          status: item.status || 'SEARCHING',
          created_at: item.created_at,
          location: item.location_text || item.building || "ไม่ระบุสถานที่",
          image_url: null // ของหายมักจะไม่มีรูป
        })));
      }

      // จัดรูปแบบข้อมูลของที่เจอ (Found)
      if (foundData) {
        formattedPosts.push(...foundData.map((item: any) => ({
          id: item.id || item.found_id,
          title: item.title,
          type: 'found' as const,
          status: item.status || 'AVAILABLE',
          created_at: item.created_at,
          location: item.location_text || item.building || "ไม่ระบุสถานที่",
          image_url: item.image_url
        })));
      }

      // เรียงลำดับจากโพสต์ล่าสุดไปเก่าสุด
      setMyPosts(formattedPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

    } catch (error) {
      console.error("Error fetching profile data:", error);
      toast.error("ดึงข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (id: string, type: 'lost' | 'found', title: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบประกาศ "${title}" ออกจากระบบ?`)) return;

    try {
      const table = type === 'lost' ? 'lost_items' : 'found_items';
      const pkColumn = type === 'lost' ? 'lost_id' : 'found_id';

      // ลองลบด้วย Primary Key เฉพาะตาราง
      const { error } = await supabase.from(table).delete().eq(pkColumn, id);

      // Fallback เผื่อใช้ id ธรรมดา
      if (error) {
        await supabase.from(table).delete().eq('id', id);
      }

      toast.success("ลบประกาศสำเร็จเรียบร้อย");
      setMyPosts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("เกิดข้อผิดพลาดในการลบประกาศ");
    }
  };

  // ==========================================
  // 🎨 Helper: ฟังก์ชันกำหนดสไตล์สถานะ Claim
  // ==========================================
  const getStatusUI = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'PENDING' || s === 'NEED_MORE_INFO')
      return { text: "รอตรวจสอบ", bg: "bg-amber-50", textCol: "text-amber-600", border: "border-amber-200", icon: Clock };
    if (s === 'APPROVED')
      return { text: "อนุมัติแล้ว", bg: "bg-indigo-50", textCol: "text-indigo-600", border: "border-indigo-200", icon: ShieldCheck };
    if (s === 'READY_FOR_PICKUP')
      return { text: "เตรียมนัดรับ", bg: "bg-blue-50", textCol: "text-blue-600", border: "border-blue-200", icon: Package };
    if (s === 'COMPLETED')
      return { text: "รับของแล้ว", bg: "bg-emerald-50", textCol: "text-emerald-600", border: "border-emerald-200", icon: CheckCircle2 };
    if (s === 'REJECTED')
      return { text: "ปฏิเสธคำขอ", bg: "bg-rose-50", textCol: "text-rose-600", border: "border-rose-200", icon: XCircle };

    return { text: status, bg: "bg-slate-50", textCol: "text-slate-600", border: "border-slate-200", icon: Clock };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#FAFAFA] pb-24'>
      {/* 🌟 Header Profile Section */}
      <div className='bg-white border-b border-slate-200 pt-28 pb-12 px-4 shadow-sm'>
        <div className='max-w-4xl mx-auto flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left'>

          <div className='w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-md'>
            <UserCircle2 className='w-12 h-12 text-indigo-500' strokeWidth={1.5} />
          </div>

          <div className='flex-1'>
            <h1 className='text-2xl sm:text-3xl font-black text-slate-900 tracking-tight'>
              {userProfile?.name}
            </h1>
            <p className='text-slate-500 font-medium mt-1'>{userProfile?.email}</p>

            <div className='flex flex-wrap justify-center sm:justify-start gap-6 mt-4'>
              <div className='px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold text-slate-700 shadow-sm'>
                คำขอรับของคืน<span className="text-indigo-600 ml-1">{myClaims.length}</span> รายการ
              </div>
              <div className='px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold text-slate-700 shadow-sm'>
                ประกาศของฉัน<span className="text-indigo-600 ml-1">{myPosts.length}</span> รายการ
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className='max-w-4xl mx-auto px-4 sm:px-6 mt-8'>

        {/* 📑 Tabs Navigation */}
        <div className='flex bg-slate-200/50 p-1.5 rounded-2xl mb-8 w-full max-w-md mx-auto sm:mx-0'>
          <button
            onClick={() => setActiveTab("claims")}
            className={`flex-1 py-2.5 font-bold rounded-xl transition-all text-sm ${activeTab === "claims" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
          >
            สถานะขอรับของคืน
          </button>
          <button
            onClick={() => setActiveTab("my_posts")}
            className={`flex-1 py-2.5 font-bold rounded-xl transition-all text-sm ${activeTab === "my_posts" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
          >
            ประกาศของฉัน
          </button>
        </div>

        {/* ==========================================
            📦 Tab: Claims (สถานะขอรับของคืน)
            ========================================== */}
        {activeTab === "claims" && (
          <div className='space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500'>
            {myClaims.length === 0 ? (
              <div className='text-center py-16 bg-white rounded-[2rem] border border-slate-100 shadow-sm'>
                <PackageSearch className='mx-auto mb-4 text-slate-300' size={48} />
                <h3 className='text-lg font-bold text-slate-900'>คุณยังไม่มีรายการขอรับของคืน</h3>
                <p className='text-slate-500 text-sm mt-1'>หากคุณทำของหาย ลองค้นหาและส่งคำขอดูนะ</p>
                <Link href="/" className="inline-block mt-6 px-6 py-2.5 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors">
                  ค้นหาสิ่งของ
                </Link>
              </div>
            ) : (
              myClaims.map((claim) => {
                const StatusConfig = getStatusUI(claim.status);
                const Icon = StatusConfig.icon;

                return (
                  // ✅ ลิงก์ที่ถูกแก้ไข ไม่พังแน่นอน
                  <Link href={`/claim/${claim.id}`} key={claim.id} className='block group'>
                    <div className='bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col sm:flex-row gap-5 items-start sm:items-center'>

                      {/* รูปภาพสิ่งของ */}
                      <div className='w-full sm:w-28 h-40 sm:h-28 bg-slate-50 rounded-xl overflow-hidden shrink-0 relative'>
                        {claim.found_item?.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={claim.found_item.image_url} alt="item" className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500' />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="text-slate-300" />
                          </div>
                        )}
                      </div>

                      {/* ข้อมูล */}
                      <div className='flex-1 w-full'>
                        <div className='flex justify-between items-start mb-2'>
                          <h4 className='font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors line-clamp-1 pr-2'>
                            {claim.found_item?.title || "ไม่ระบุชื่อ"}
                          </h4>
                          <span className={`shrink-0 flex items-center text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full border ${StatusConfig.bg} ${StatusConfig.textCol} ${StatusConfig.border}`}>
                            <Icon size={12} className="mr-1" /> {StatusConfig.text}
                          </span>
                        </div>
                        <p className='text-sm text-slate-500 font-medium flex items-center mb-1.5'>
                          <MapPin size={14} className='mr-1.5 text-slate-400 shrink-0' />
                          <span className="truncate">{claim.found_item?.location_text || "ไม่ระบุสถานที่"}</span>
                        </p>
                        <p className='text-xs text-slate-400 font-medium'>
                          อัปเดตเมื่อ: {new Date(claim.created_at).toLocaleDateString('th-TH')}
                        </p>
                      </div>

                      {/* ไอคอนลูกศร */}
                      <div className='hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0'>
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}

        {/* ==========================================
            📢 Tab: My Posts (ประกาศของฉัน)
            ========================================== */}
        {activeTab === "my_posts" && (
          <div className='space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500'>
            {myPosts.length === 0 ? (
              <div className='text-center py-16 bg-white rounded-[2rem] border border-slate-100 shadow-sm'>
                <SearchX className='mx-auto mb-4 text-slate-300' size={48} />
                <h3 className='text-lg font-bold text-slate-900'>คุณยังไม่มีประกาศใดๆ</h3>
                <div className='flex justify-center gap-4 mt-6'>
                  <Link href="/found" className='px-4 py-2 bg-emerald-50 text-emerald-600 font-bold rounded-xl text-sm'>+ แจ้งพบสิ่งของ</Link>
                  <Link href="/lost" className='px-4 py-2 bg-rose-50 text-rose-600 font-bold rounded-xl text-sm'>+ แจ้งของหาย</Link>
                </div>
              </div>
            ) : (
              myPosts.map((post) => (
                <div key={post.id} className='bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-5 items-start sm:items-center relative'>

                  {/* ป้ายกำกับ หาย/เจอ (สไตล์ริบบิ้น) */}
                  <div className={`absolute -top-3 -left-2 sm:left-[-10px] px-3 py-1 text-[11px] sm:text-xs font-black text-white rounded-lg shadow-md z-10 transform -rotate-2 ${post.type === 'lost' ? "bg-rose-500" : "bg-emerald-500"
                    }`}>
                    {post.type === 'lost' ? "ของฉันหาย" : "ฉันพบของ"}
                  </div>

                  {/* รูปภาพ */}
                  <Link href={`/item/${post.id}`} className='w-full sm:w-28 h-40 sm:h-28 bg-slate-50 rounded-xl overflow-hidden shrink-0 mt-2 sm:mt-0 relative group border border-slate-100'>
                    {post.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.image_url} alt="post" className='w-full h-full object-cover group-hover:scale-105 transition-transform' />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="text-slate-300" />
                      </div>
                    )}
                  </Link>

                  {/* ข้อมูล */}
                  <div className='flex-1 w-full'>
                    <h4 className='font-bold text-slate-900 text-lg mb-2 line-clamp-1'>
                      <Link href={`/item/${post.id}`} className="hover:text-indigo-600 transition-colors">{post.title}</Link>
                    </h4>
                    <p className='text-sm text-slate-500 font-medium flex items-center mb-1.5'>
                      <MapPin size={14} className='mr-1.5 text-slate-400 shrink-0' />
                      <span className="truncate">{post.location}</span>
                    </p>
                    <p className='text-xs text-slate-400 font-medium'>
                      โพสต์เมื่อ: {new Date(post.created_at).toLocaleDateString('th-TH')}
                    </p>
                  </div>

                  {/* Actions (แก้ไข / ลบ) */}
                  <div className="flex flex-row sm:flex-col gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-4 justify-end w-full sm:w-auto mt-2 sm:mt-0">
                    <button
                      onClick={() => router.push(`/item/${post.id}`)}
                      className="flex-1 sm:flex-none flex items-center justify-center p-2.5 bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 rounded-xl transition-all border border-slate-100"
                      title="ดูรายละเอียด / แก้ไข"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id, post.type, post.title)}
                      className="flex-1 sm:flex-none flex items-center justify-center p-2.5 bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 rounded-xl transition-all border border-slate-100"
                      title="ลบประกาศ"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}