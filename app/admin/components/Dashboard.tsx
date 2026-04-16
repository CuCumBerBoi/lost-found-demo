"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import {
  BarChart3,
  PieChart,
  Activity,
  TrendingUp,
  Package,
  Search,
  ArrowLeftRight,
  CheckCircle2,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface TagStat {
  name: string;
  lost: number;
  found: number;
  total: number;
  color: string;
  bgColor: string;
  textColor: string;
}

interface AdminStats {
  totalLost: number;
  totalFound: number;
  totalReturned: number;
  totalPending: number;
  successRate: string;
  tags: TagStat[];
  foundMonthly: Array<{ label: string; count: number }>;
  foundWeekly: Array<{ label: string; count: number }>;
}

// ── Color palette ────────────────────────────────────────────────────────────

const PALETTES = [
  { color: "bg-indigo-500",  bgColor: "bg-indigo-50",  textColor: "text-indigo-700" },
  { color: "bg-rose-500",    bgColor: "bg-rose-50",    textColor: "text-rose-700" },
  { color: "bg-emerald-500", bgColor: "bg-emerald-50", textColor: "text-emerald-700" },
  { color: "bg-amber-500",   bgColor: "bg-amber-50",   textColor: "text-amber-700" },
  { color: "bg-cyan-500",    bgColor: "bg-cyan-50",    textColor: "text-cyan-700" },
  { color: "bg-violet-500",  bgColor: "bg-violet-50",  textColor: "text-violet-700" },
  { color: "bg-orange-500",  bgColor: "bg-orange-50",  textColor: "text-orange-700" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** สกัดคำสำคัญจาก title เพื่อสร้าง keyword tags */
function extractKeywords(title: string): string[] {
  const keywords: string[] = [];

  // สี
  const colorPatterns = [
    "สีดำ","สีขาว","สีน้ำตาล","สีแดง","สีน้ำเงิน","สีเขียว","สีเหลือง",
    "สีเทา","สีทอง","สีเงิน","สีส้ม","สีชมพู","สีม่วง","สีฟ้า","สีครีม",
  ];
  colorPatterns.forEach(c => { if (title.includes(c)) keywords.push(c); });

  // แบรนด์ที่รู้จัก
  const brands = [
    "Apple","iPhone","Samsung","Huawei","Xiaomi","Oppo","Vivo",
    "Chanel","Gucci","Louis Vuitton","Coach","Zara","Uniqlo",
    "Gustl","Moonlight","AquaFlask","Nike","Adidas","New Balance",
  ];
  brands.forEach(b => {
    if (title.toLowerCase().includes(b.toLowerCase())) keywords.push(b);
  });

  return keywords;
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ReportsView({ showToast }: { showToast: (msg: string) => void }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendView, setTrendView] = useState<"month" | "week">("month");
  const [tagView, setTagView] = useState<"category" | "keyword">("category");

  const fetchStats = useCallback(async () => {
    try {
      // ✅ ดึงข้อมูลทั้งหมดจาก API Route เดียว (bypass RLS ด้วย service role key)
      const [statsRes, claimsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/claims'),
      ]);
      const statsJson = await statsRes.json();
      const claimsJson = await claimsRes.json();

      if (statsJson.error) throw new Error(statsJson.error);

      const { totalLost, totalFound, foundItems = [], lostItems = [], categories = [] } = statsJson;
      const allClaims: Array<{ status: string; created_at: string }> = claimsJson.data || [];

      // ── Counts ──────────────────────────────────────────────────────────
      const totalReturned = allClaims.filter(
        c => c.status?.toUpperCase() === 'APPROVED' || c.status?.toUpperCase() === 'COMPLETED'
      ).length;
      const totalPending = allClaims.filter(c => c.status?.toUpperCase() === 'PENDING').length;
      const successRate = (totalLost + totalFound) > 0
        ? ((totalReturned / (totalLost + totalFound)) * 100).toFixed(1)
        : '0';

      // ── Build category lookup map ────────────────────────────────────────
      const catLookup: Record<string, string> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (categories || []).forEach((c: any) => { catLookup[c.category_id] = c.name; });

      // ── Category tag stats ───────────────────────────────────────────────
      const tagCatMap: Record<string, { lost: number; found: number }> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (foundItems || []).forEach((item: any) => {
        const name = catLookup[item.category_id] || 'ไม่ระบุหมวดหมู่';
        if (!tagCatMap[name]) tagCatMap[name] = { lost: 0, found: 0 };
        tagCatMap[name].found++;
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (lostItems || []).forEach((item: any) => {
        const name = catLookup[item.category_id] || 'ไม่ระบุหมวดหมู่';
        if (!tagCatMap[name]) tagCatMap[name] = { lost: 0, found: 0 };
        tagCatMap[name].lost++;
      });

      const catTags: TagStat[] = Object.entries(tagCatMap)
        .filter(([name]) => name !== 'ไม่ระบุหมวดหมู่')
        .concat(tagCatMap['ไม่ระบุหมวดหมู่'] ? [['ไม่ระบุหมวดหมู่', tagCatMap['ไม่ระบุหมวดหมู่']]] : [])
        .map(([name, counts]) => ({
          name,
          lost: counts.lost,
          found: counts.found,
          total: counts.lost + counts.found,
          ...PALETTES[0],
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8)
        .map((t, i) => ({ ...t, ...PALETTES[i % PALETTES.length] }));

      // ── Keyword tag stats ────────────────────────────────────────────────
      const kwMap: Record<string, { lost: number; found: number }> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addKw = (item: any, type: 'lost' | 'found') => {
        const kws = [
          ...(item.ai_metadata?.brand ? [item.ai_metadata.brand] : []),
          ...(item.ai_metadata?.color
            ? item.ai_metadata.color.split(',').map((c: string) => c.trim())
            : []),
          ...extractKeywords(item.title || ''),
        ].filter(k => k && k !== 'ไม่ระบุ');
        kws.forEach(kw => {
          if (!kwMap[kw]) kwMap[kw] = { lost: 0, found: 0 };
          kwMap[kw][type]++;
        });
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (foundItems || []).forEach((item: any) => addKw(item, 'found'));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (lostItems || []).forEach((item: any) => addKw(item, 'lost'));

      const kwTags: TagStat[] = Object.entries(kwMap)
        .map(([name, counts]) => ({
          name,
          lost: counts.lost,
          found: counts.found,
          total: counts.lost + counts.found,
          ...PALETTES[0],
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8)
        .map((t, i) => ({ ...t, ...PALETTES[i % PALETTES.length] }));

      // ── Trend data ───────────────────────────────────────────────────────
      const now = new Date();
      const foundMonthly = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const label = d.toLocaleDateString('th-TH', { month: 'short' });
        const count = allClaims.filter(c => {
          const cd = new Date(c.created_at);
          return cd.getFullYear() === d.getFullYear() && cd.getMonth() === d.getMonth();
        }).length;
        return { label, count };
      });

      const foundWeekly = Array.from({ length: 4 }, (_, i) => {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (3 - i) * 7 - 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        const count = allClaims.filter(c => {
          const cd = new Date(c.created_at);
          return cd >= weekStart && cd < weekEnd;
        }).length;
        return { label: `สัปดาห์ที่ ${i + 1}`, count };
      });

      setStats({
        totalLost,
        totalFound,
        totalReturned,
        totalPending,
        successRate: `${successRate}%`,
        tags: tagView === 'category' ? catTags : kwTags,
        foundMonthly,
        foundWeekly,
      });
    } catch (error) {
      console.error('Dashboard fetchStats error:', error);
      showToast('เกิดข้อผิดพลาดในการโหลดสถิติ');
    } finally {
      setLoading(false);
    }
  }, [showToast, tagView]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-20 text-slate-500">ไม่สามารถโหลดข้อมูลสถิติได้</div>;
  }

  const maxTagTotal = Math.max(...stats.tags.map(t => t.total), 1);

  // Trend chart
  const trendData = trendView === "month" ? stats.foundMonthly : stats.foundWeekly;
  const maxTrend = Math.max(...trendData.map(s => s.count), 1);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center mb-1">
          <BarChart3 className="text-indigo-600 mr-3" size={32} />
          ภาพรวมระบบ
        </h1>
        <p className="text-slate-500 text-sm">ดูสถิติและข้อมูลการดำเนินงานแบบ Real-time</p>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Search size={20} className="text-rose-500" />}
          label="สิ่งของที่แจ้งหาย"
          value={stats.totalLost}
          bg="bg-rose-50"
          valueColor="text-rose-600"
        />
        <StatCard
          icon={<Package size={20} className="text-indigo-500" />}
          label="สิ่งของที่แจ้งพบ"
          value={stats.totalFound}
          bg="bg-indigo-50"
          valueColor="text-indigo-600"
        />
        <StatCard
          icon={<ArrowLeftRight size={20} className="text-amber-500" />}
          label="รอตรวจสอบ"
          value={stats.totalPending}
          bg="bg-amber-50"
          valueColor="text-amber-600"
        />
        <StatCard
          icon={<CheckCircle2 size={20} className="text-emerald-500" />}
          label="ส่งคืนสำเร็จ"
          value={stats.totalReturned}
          bg="bg-emerald-50"
          valueColor="text-emerald-600"
          badge={`${stats.successRate}`}
        />
      </div>

      {/* ── Tag Analysis ─────────────────────────────────────────── */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        {/* Header + toggle */}
        <div className="p-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
              <PieChart className="text-indigo-500 shrink-0" size={20} strokeWidth={2.5} />
              หมวดหมู่ที่พบ
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5 ml-7">
              {tagView === "category"
                ? "จัดกลุ่มตามหมวดหมู่สิ่งของ"
                : "จัดกลุ่มตามสี ยี่ห้อ และคำสำคัญใน title"}
            </p>
          </div>
          {/* Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto shrink-0">
            <button
              onClick={() => setTagView("category")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                tagView === "category" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
              }`}
            >
              หมวดหมู่
            </button>
            <button
              onClick={() => setTagView("keyword")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                tagView === "keyword" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
              }`}
            >
              คำสำคัญ
            </button>
          </div>
        </div>

        {/* Tag list */}
        <div className="p-6 pt-4">
          {stats.tags.length > 0 ? (
            <div className="space-y-4">
              {/* Column headers */}
              <div className="flex items-center text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                <span className="flex-1">ชื่อแท็ก</span>
                <span className="w-20 text-right text-rose-400">หาย</span>
                <span className="w-20 text-right text-emerald-500">พบ</span>
                <span className="w-20 text-right text-slate-500">รวม</span>
              </div>

              {stats.tags.map((tag, i) => {
                const barW = Math.round((tag.total / maxTagTotal) * 100);
                const lostPct = tag.total > 0 ? Math.round((tag.lost / tag.total) * 100) : 0;
                const foundPct = 100 - lostPct;
                return (
                  <div key={i} className="group">
                    <div className="flex items-center gap-3 mb-1.5">
                      {/* Rank badge */}
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${tag.bgColor} ${tag.textColor}`}
                      >
                        {i + 1}
                      </div>

                      {/* Name */}
                      <span className="flex-1 text-sm font-bold text-slate-800 truncate">
                        {tag.name}
                      </span>

                      {/* Counts */}
                      <div className="flex items-center gap-0 shrink-0 text-sm font-bold">
                        <span className="w-20 text-right text-rose-500">{tag.lost}</span>
                        <span className="w-20 text-right text-emerald-600">{tag.found}</span>
                        <span className="w-20 text-right text-slate-700">{tag.total}</span>
                      </div>
                    </div>

                    {/* Progress bar: dual color (lost vs found) */}
                    <div className="ml-9 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full flex transition-all duration-700"
                        style={{ width: `${barW}%` }}
                      >
                        <div
                          className="bg-rose-400 h-full transition-all duration-700"
                          style={{ width: `${lostPct}%` }}
                        />
                        <div
                          className="bg-emerald-400 h-full transition-all duration-700"
                          style={{ width: `${foundPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                  สัดส่วนสิ่งของที่หาย
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                  สัดส่วนสิ่งของที่พบ
                </span>
                <span className="flex items-center gap-1.5 ml-auto">
                  <TrendingUp size={12} className="text-indigo-400" />
                  เรียงจากมาก → น้อย
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 py-10">
              <PieChart size={40} className="opacity-20 mb-3" />
              <p className="text-sm font-semibold">ยังไม่มีข้อมูลแท็ก</p>
              <p className="text-xs mt-1">เพิ่มข้อมูลสิ่งของเพื่อดูสถิติ</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Trend Chart ──────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h3 className="font-bold text-slate-800 text-lg flex items-center">
            <Activity className="text-indigo-500 mr-2" size={20} />
            จำนวนคำขอรับของคืน
          </h3>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTrendView("week")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                trendView === "week" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
              }`}
            >
              รายสัปดาห์
            </button>
            <button
              onClick={() => setTrendView("month")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                trendView === "month" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
              }`}
            >
              รายเดือน
            </button>
          </div>
        </div>

        <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-1 sm:px-4">
          {trendData.map((stat, i) => {
            const barH = Math.round((stat.count / maxTrend) * 100);
            return (
              <div key={i} className="flex-1 flex flex-col items-center group h-full justify-end">
                <span className="text-[10px] sm:text-xs font-bold text-indigo-600 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {stat.count}
                </span>
                <div
                  className="w-full max-w-[2.5rem] bg-indigo-100 rounded-t-xl transition-all duration-500 group-hover:bg-indigo-500"
                  style={{ height: `${barH}%`, minHeight: "4px" }}
                />
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 mt-3 text-center">
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── StatCard sub-component ────────────────────────────────────────────────────

function StatCard({
  icon, label, value, bg, valueColor, badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
  valueColor: string;
  badge?: string;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
      <h3 className={`text-3xl font-extrabold ${valueColor}`}>{value}</h3>
      {badge && (
        <span className="absolute top-4 right-4 text-[11px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </div>
  );
}
