"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import { PackageSearch, Search, AlertTriangle, Trash2, MapPin, CalendarDays, User } from "lucide-react";

interface Item {
  id: string;
  title: string;
  reporter: string;
  location: string;
  date: string;
  status: string;
  type: "found" | "lost";
}

export default function ItemsView({ showToast }: { showToast: (msg: string) => void; }) {
  const [items, setItems] = useState<{ found: Item[]; lost: Item[] }>({ found: [], lost: [] });
  const [tab, setTab] = useState<"found" | "lost">("found");
  const [searchTerm, setSearchTerm] = useState("");
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    try {
      const supabase = createClient();
      const [{ data: foundItems }, { data: lostItems }] = await Promise.all([
        supabase.from("found_items").select("*, users(full_name)").order("created_at", { ascending: false }),
        supabase.from("lost_items").select("*, users(full_name)").order("created_at", { ascending: false }),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formatItems = (items: any[] = [], type: "found" | "lost") =>
        items.map((item) => {
          const locParts = [];
          if (item.building) locParts.push(`${item.building}`);
          if (item.floor) locParts.push(`ชั้น ${String(item.floor).replace(/^ชั้น\s*/, '')}`);
          if (item.room) locParts.push(`ห้อง ${String(item.room).replace(/^(ห้อง|ชั้น)\s*/, '')}`);
          const finalLoc = locParts.length > 0 ? locParts.join(" ") : (item.location_text || "ไม่ระบุ");

          return {
            id: item.id || item.found_id || item.lost_id as string,
            title: item.title as string,
            reporter: (item.users?.full_name as string) || "ไม่ระบุชื่อผู้ใช้",
            location: finalLoc,
            date: new Date(type === "found" ? item.date_found : item.date_lost).toLocaleDateString("th-TH"),
            status: (item.status as string) || "AVAILABLE",
            type,
          }
        });

      setItems({
        found: formatItems(foundItems || [], "found"),
        lost: formatItems(lostItems || [], "lost"),
      });
    } catch (error) {
      console.error("Error fetching items:", error);
      showToast("เกิดข้อผิดพลาดในการโหลดประกาศ");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      const supabase = createClient();
      const table = itemToDelete.type === "found" ? "found_items" : "lost_items";
      const pkCol = itemToDelete.type === "found" ? "found_id" : "lost_id";

      // ✅ ลองลบด้วย primary key หลัก (found_id / lost_id) ก่อน
      let { error } = await supabase.from(table).delete().eq(pkCol, itemToDelete.id);

      // ✅ fallback: ถ้า pkCol ล้มเหลว ลองด้วยคอลัมน์ "id" แทน
      if (error) {
        const fallback = await supabase.from(table).delete().eq("id", itemToDelete.id);
        error = fallback.error;
      }

      // ✅ ตรวจสอบ error หลังจาก try ทั้งสองวิธีแล้ว
      if (error) {
        throw error;
      }

      showToast("ลบประกาศออกจากระบบเรียบร้อย");
      setItemToDelete(null);
      // ✅ รีเฟรชรายการหลังลบสำเร็จจริงๆ
      fetchItems();
    } catch (err: unknown) {
      console.error("Error deleting item:", err);
      const msg = err && typeof err === "object" && "message" in err
        ? (err as { message: string }).message
        : "";
      // FK constraint → แสดงข้อความบอก admin ให้ลบ claims ที่อ้างอิงก่อน
      if (msg.includes("foreign key") || msg.includes("violates") || msg.includes("constraint")) {
        showToast("ไม่สามารถลบได้: มีคำขอรับของ (Claims) ที่อ้างอิงประกาศนี้อยู่ กรุณาจัดการ Claims ก่อน");
      } else {
        showToast("เกิดข้อผิดพลาดในการลบข้อมูล กรุณาลองอีกครั้ง");
      }
    }
  };

  const filteredItems = items[tab].filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reporter.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const DeleteConfirmModal = () => {
    if (!itemToDelete) return null;
    return (
      <div className='fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4'>
        <div className='bg-white rounded-3xl p-6 max-w-sm w-full text-center animate-in zoom-in-95 duration-200 shadow-2xl'>
          <div className='w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-rose-50'>
            <AlertTriangle size={28} />
          </div>
          <h3 className='text-xl font-extrabold text-slate-900 mb-2'>
            ยืนยันการลบประกาศ
          </h3>
          <p className='text-slate-500 text-sm mb-6 font-medium px-2 leading-relaxed'>
            คุณต้องการลบประกาศ <br /><span className="text-slate-800 font-bold">"{itemToDelete.title}"</span> <br /> ออกจากระบบอย่างถาวรใช่หรือไม่?
          </p>
          <div className='flex gap-3'>
            <button
              onClick={() => setItemToDelete(null)}
              className='flex-1 py-3 bg-slate-100 font-bold rounded-xl text-slate-600 hover:bg-slate-200 transition-colors text-sm'
            >
              ยกเลิก
            </button>
            <button
              onClick={handleDelete}
              className='flex-1 py-3 bg-rose-600 font-bold rounded-xl text-white hover:bg-rose-700 shadow-[0_4px_12px_rgba(225,29,72,0.2)] transition-all text-sm active:scale-95'
            >
              ยืนยันการลบ
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <div className='w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin'></div>
      </div>
    );
  }

  return (
    <div className='animate-in fade-in duration-500'>
      <DeleteConfirmModal />
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4'>
        <div>
          <h1 className='text-3xl font-extrabold flex items-center text-slate-900 tracking-tight'>
            <PackageSearch className='text-indigo-600 mr-3' size={32} />
            จัดการประกาศ 
          </h1>
          <p className='text-slate-500 mt-2 font-medium'>ดูรายการทั้งหมดและจัดการประกาศ</p>
        </div>
      </div>

      <div className='bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden'>
        <div className='p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between bg-slate-50/50 gap-4 items-center'>
          <div className='flex bg-slate-200/60 p-1.5 rounded-2xl gap-1 w-full sm:w-auto'>
            <button
              onClick={() => setTab("found")}
              className={`flex-1 sm:flex-none px-6 py-2.5 font-bold rounded-xl transition-all text-sm ${tab === "found"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
                }`}
            >
              ประกาศแจ้งพบ ({items.found.length})
            </button>
            <button
              onClick={() => setTab("lost")}
              className={`flex-1 sm:flex-none px-6 py-2.5 font-bold rounded-xl transition-all text-sm ${tab === "lost"
                  ? "bg-white text-rose-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
                }`}
            >
              ประกาศแจ้งหาย ({items.lost.length})
            </button>
          </div>
          <div className='relative w-full sm:w-72'>
            <Search size={16} className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400' />
            <input
              type='text'
              placeholder='ค้นหาชื่อสิ่งของ หรือผู้แจ้ง...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full pl-11 pr-4 py-3 border border-slate-200 bg-white rounded-xl text-sm font-medium outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all'
            />
          </div>
        </div>

        <div className='p-4 sm:p-6 space-y-3'>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              // เช็คสถานะเพื่อเลือกสีป้าย (รองรับ RETURNED)
              const isActive = ["active", "AVAILABLE", "SEARCHING"].includes(item.status);
              const isReturned = ["RETURNED", "CLAIMED"].includes(item.status);

              return (
              <div
                key={item.id}
                className='p-4 sm:p-5 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between hover:border-slate-300 hover:shadow-sm transition-all bg-white gap-4'
              >
                <div className='flex-1'>
                  <h4 className='font-bold text-slate-900 mb-2.5 text-base sm:text-lg'>
                    {item.title}
                  </h4>
                  <div className='flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-600 font-medium'>
                    <p className="flex items-center gap-1.5"><User size={14} className="text-slate-400" /> {item.reporter}</p>
                    <p className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {item.location}</p>
                    <p className="flex items-center gap-1.5"><CalendarDays size={14} className="text-slate-400" /> {item.date}</p>
                  </div>
                </div>
                <div className='flex items-center justify-between sm:justify-end gap-4 sm:gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-slate-100'>
                  <span
                    className={`text-xs font-bold px-3.5 py-1.5 rounded-full border ${
                      isActive
                        ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                        : isReturned 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-slate-50 text-slate-500 border-slate-200"
                      }`}
                  >
                    {isActive ? "ยังประกาศอยู่" : isReturned ? "ส่งคืนสำเร็จ 🎉" : "ปิดประกาศแล้ว"}
                  </span>
                  <button aria-label="ลบประกาศ" title="ลบประกาศ"
                    onClick={() => setItemToDelete(item)}
                    className='p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 border border-rose-100 transition-colors active:scale-95'
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )})
          ) : (
            <div className='text-center py-16 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed'>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                <PackageSearch className='text-slate-300' size={28} />
              </div>
              <h3 className="font-bold text-slate-700 text-lg mb-1">ไม่พบประกาศ</h3>
              <p className="text-sm font-medium text-slate-500">ลองเปลี่ยนคำค้นหา หรือสลับแท็บดูนะ</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}