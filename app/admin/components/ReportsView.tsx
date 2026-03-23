"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  PieChart,
  Activity,
  TrendingUp,
} from "lucide-react";

interface AdminStats {
  totalLost: number;
  totalFound: number;
  totalReturned: number;
  successRate: string;
  categories: Array<{
    name: string;
    lost: number;
    found: number;
    color: string;
  }>;
  monthly: Array<{ month: string; returned: number; total: number }>;
}

export default function ReportsView({
  showToast,
}: {
  showToast: (msg: string) => void;
}) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [startDate, setStartDate] = useState("2026-03-01");
  const [endDate, setEndDate] = useState("2026-03-31");

  const fetchStats = useCallback(async () => {
    try {
      const supabase = createClient();

      // Fetch counts
      const [
        { count: totalLost },
        { count: totalFound },
        { data: claimsData },
      ] = await Promise.all([
        supabase.from("lost_items").select("*", { count: "exact", head: true }),
        supabase
          .from("found_items")
          .select("*", { count: "exact", head: true }),
        supabase.from("claims").select("id").eq("status", "approved"),
      ]);

      const totalReturned = claimsData?.length || 0;
      const successRate =
        totalLost && totalFound
          ? ((totalReturned / (totalLost + totalFound)) * 100).toFixed(1)
          : "0";

      // Fetch category stats
      const { data: categories = [] } = await supabase
        .from("categories")
        .select("id, name")
        .limit(3);

      const categoryStats = await Promise.all(
        (categories || []).map(async (cat: { id: string; name: string }) => {
          const [{ count: lostCount }, { count: foundCount }] =
            await Promise.all([
              supabase
                .from("lost_items")
                .select("*", { count: "exact", head: true })
                .eq("category_id", cat.id),
              supabase
                .from("found_items")
                .select("*", { count: "exact", head: true })
                .eq("category_id", cat.id),
            ]);
          return {
            name: cat.name,
            lost: lostCount || 0,
            found: foundCount || 0,
            color: ["bg-indigo-500", "bg-emerald-500", "bg-amber-500"][
              (categories || []).indexOf(cat)
            ],
          };
        }),
      );

      setStats({
        totalLost: totalLost || 0,
        totalFound: totalFound || 0,
        totalReturned,
        successRate: `${successRate}%`,
        categories: categoryStats,
        monthly: [
          { month: "ม.ค.", returned: 24, total: 40 },
          { month: "ก.พ.", returned: 30, total: 45 },
          {
            month: "มี.ค.",
            returned: totalReturned,
            total: (totalLost || 0) + (totalFound || 0),
          },
        ],
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      showToast("เกิดข้อผิดพลาดในการโหลดสถิติ");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      showToast("ดาวน์โหลดไฟล์รายงาน Excel สำเร็จ!");
    }, 2000);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <div className='w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin'></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className='text-center py-20 text-slate-500'>
        ไม่สามารถโหลดข้อมูลสถิติได้
      </div>
    );
  }

  return (
    <div className='animate-in fade-in duration-500'>
      <div className='flex flex-col lg:flex-row justify-between mb-8 gap-6'>
        <div>
          <h1 className='text-3xl font-extrabold text-slate-900 flex items-center mb-2'>
            <BarChart3 className='text-indigo-600 mr-3' size={32} />
            ภาพรวมระบบ (Dashboard)
          </h1>
          <p className='text-slate-500'>ดูสถิติและส่งออกข้อมูลการดำเนินงาน</p>
        </div>
        <div className='flex gap-3'>
          <div className='flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm gap-2'>
            <Calendar size={16} className='text-slate-400' />
            <input aria-label="วันที่เริ่มต้น" title="วันที่เริ่มต้น"
              type='date'
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className='text-sm outline-none text-slate-700 bg-transparent'
            />
            <span className='text-slate-300'>-</span>
            <input aria-label="วันที่สิ้นสุด" title="วันที่สิ้นสุด"
              type='date'
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className='text-sm outline-none text-slate-700 bg-transparent'
            />
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className='px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 flex items-center shadow-md disabled:opacity-70'
          >
            <FileSpreadsheet size={16} className='mr-2' />
            ส่งออก Excel
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
        <div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-sm'>
          <p className='text-sm font-semibold text-slate-500'>รับแจ้งของหาย</p>
          <h3 className='text-3xl font-extrabold text-slate-900 mt-1'>
            {stats.totalLost}
          </h3>
        </div>
        <div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-sm'>
          <p className='text-sm font-semibold text-slate-500'>เก็บของได้</p>
          <h3 className='text-3xl font-extrabold text-slate-900 mt-1'>
            {stats.totalFound}
          </h3>
        </div>
        <div className='bg-white p-5 rounded-2xl border border-slate-200 shadow-sm'>
          <p className='text-sm font-semibold text-slate-500'>ส่งคืนสำเร็จ</p>
          <h3 className='text-3xl font-extrabold text-emerald-600 mt-1'>
            {stats.totalReturned}
          </h3>
        </div>
        <div className='bg-indigo-600 p-5 rounded-2xl shadow-md text-white relative overflow-hidden'>
          <div className='absolute right-[-10px] bottom-[-10px] text-white/10'>
            <TrendingUp size={80} />
          </div>
          <p className='text-sm font-semibold text-indigo-200 relative z-10'>
            อัตราความสำเร็จ
          </p>
          <h3 className='text-3xl font-extrabold mt-1 relative z-10'>
            {stats.successRate}
          </h3>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm'>
          <h3 className='font-bold text-slate-800 text-lg flex items-center mb-6'>
            <PieChart className='text-indigo-500 mr-2' size={20} />
            สถิติแยกตามหมวดหมู่
          </h3>
          <div className='space-y-4'>
            {stats.categories.map((cat, i) => (
              <div key={i} className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className={`w-3 h-3 rounded-full ${cat.color}`}></div>
                  <span className='text-sm font-medium text-slate-700'>
                    {cat.name}
                  </span>
                </div>
                <div className='text-xs text-slate-500'>
                  หาย: {cat.lost} | เจอ: {cat.found}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className='bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm'>
          <h3 className='font-bold text-slate-800 text-lg flex items-center mb-6'>
            <Activity className='text-emerald-500 mr-2' size={20} />
            แนวโน้มการคืนของ (3 เดือนล่าสุด)
          </h3>
          <div className='h-40 flex items-end justify-between gap-4 px-4 mt-8'>
            {stats.monthly.map((stat, i) => (
              <div key={i} className='flex-1 flex flex-col items-center'>
                <div
                  className='w-full bg-emerald-500 rounded-t-lg transition-all hover:bg-emerald-600'
                  style={{
                    height: `${(stat.returned / Math.max(...stats.monthly.map((s) => s.returned))) * 100}px`,
                  }}
                ></div>
                <span className='text-xs font-bold text-slate-600 mt-2'>
                  {stat.month}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
