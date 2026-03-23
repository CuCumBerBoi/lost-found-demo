"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import { PackageSearch, Search, AlertTriangle, Trash2 } from "lucide-react";

interface Item {
  id: string;
  title: string;
  reporter: string;
  location: string;
  date: string;
  status: string;
  type: "found" | "lost";
}

export default function ItemsView({
  showToast,
}: {
  showToast: (msg: string) => void;
}) {
  const [items, setItems] = useState<{ found: Item[]; lost: Item[] }>({
    found: [],
    lost: [],
  });
  const [tab, setTab] = useState<"found" | "lost">("found");
  const [searchTerm, setSearchTerm] = useState("");
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    try {
      const supabase = createClient();

      const [{ data: foundItems }, { data: lostItems }] = await Promise.all([
        supabase
          .from("found_items")
          .select("*, users(full_name)")
          .order("created_at", { ascending: false }),
        supabase
          .from("lost_items")
          .select("*, users(full_name)")
          .order("created_at", { ascending: false }),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formatItems = (items: any[] = [], type: "found" | "lost") =>
        items.map((item) => ({
          id: item.id as string,
          title: item.title as string,
          reporter: (item.users?.full_name as string) || "Unknown",
          location: item.location_text as string,
          date: new Date(
            type === "found" ? item.date_found : item.date_lost,
          ).toLocaleDateString("th-TH"),
          status: (item.status as string) || "active",
          type,
        }));

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
      const table =
        itemToDelete.type === "found" ? "found_items" : "lost_items";

      await supabase.from(table).delete().eq("id", itemToDelete.id);

      showToast("ลบประกาศเรียบร้อย");
      setItemToDelete(null);
      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      showToast("เกิดข้อผิดพลาดในการลบ");
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
        <div className='bg-white rounded-3xl p-6 max-w-sm w-full text-center animate-in zoom-in-95'>
          <div className='w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4'>
            <AlertTriangle size={32} />
          </div>
          <h3 className='text-xl font-bold text-slate-900 mb-2'>
            ยืนยันการลบประกาศ
          </h3>
          <p className='text-slate-500 text-sm mb-6'>
            คุณต้องการลบ &quot;{itemToDelete.title}&quot; ออกจากระบบใช่หรือไม่?
          </p>
          <div className='flex gap-3'>
            <button
              onClick={() => setItemToDelete(null)}
              className='flex-1 py-3 bg-slate-100 font-bold rounded-xl text-slate-700 hover:bg-slate-200'
            >
              ยกเลิก
            </button>
            <button
              onClick={handleDelete}
              className='flex-1 py-3 bg-rose-600 font-bold rounded-xl text-white hover:bg-rose-700 shadow-md'
            >
              ลบประกาศ
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
      <div className='flex justify-between items-end mb-6'>
        <div>
          <h1 className='text-2xl font-extrabold flex items-center'>
            <PackageSearch className='text-indigo-600 mr-3' size={28} />
            จัดการประกาศ (Items)
          </h1>
          <p className='text-slate-500 mt-1'>
            ลบประกาศสแปม หรือดูข้อมูลที่ AI สกัดได้
          </p>
        </div>
      </div>
      <div className='bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden'>
        <div className='p-3 border-b border-slate-100 flex justify-between bg-slate-50'>
          <div className='flex bg-slate-200/50 p-1 rounded-xl gap-1'>
            <button
              onClick={() => setTab("found")}
              className={`px-4 py-2 font-bold rounded-lg transition-colors ${
                tab === "found"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ของที่เจอ ({items.found.length})
            </button>
            <button
              onClick={() => setTab("lost")}
              className={`px-4 py-2 font-bold rounded-lg transition-colors ${
                tab === "lost"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ของที่หาย ({items.lost.length})
            </button>
          </div>
          <div className='relative'>
            <Search
              size={16}
              className='absolute left-3 top-2 text-slate-400'
            />
            <input
              type='text'
              placeholder='ค้นหาชื่อ, ผู้แจ้ง...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-sm outline-none shadow-sm focus:border-indigo-400'
            />
          </div>
        </div>
        <div className='divide-y divide-slate-100'>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className='p-4 flex items-center justify-between hover:bg-slate-50 transition-colors'
              >
                <div className='flex-1'>
                  <h4 className='font-bold text-slate-900 mb-1'>
                    {item.title}
                  </h4>
                  <div className='text-sm text-slate-600 space-y-0.5'>
                    <p>ผู้แจ้ง: {item.reporter}</p>
                    <p>พื้นที่: {item.location}</p>
                    <p>วันที่: {item.date}</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      item.status === "active" || item.status === "AVAILABLE"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.status === "active" || item.status === "AVAILABLE"
                      ? "อยู่"
                      : "อื่น"}
                  </span>
                  <button aria-label="ลบประกาศ" title="ลบประกาศ"
                    onClick={() => setItemToDelete(item)}
                    className='p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors'
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className='text-center py-10 text-slate-500'>
              <Search className='mx-auto mb-2 text-slate-300' size={32} />
              <p>ไม่พบประกาศที่ตรงกัน</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
