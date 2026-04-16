"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import { Users, Search, X, CheckCircle2, UserCog } from "lucide-react";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joined: string;
}

function EditUserModal({
  selectedUser,
  setSelectedUser,
  fetchUsers,
  showToast,
}: {
  selectedUser: UserRecord | null;
  setSelectedUser: (user: UserRecord | null) => void;
  fetchUsers: () => void;
  showToast: (msg: string) => void;
}) {
  const [role, setRole] = useState(selectedUser?.role || "user");
  const [status, setStatus] = useState(selectedUser?.status || "active");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedUser) {
      setRole(selectedUser.role);
      setStatus(selectedUser.status);
    }
  }, [selectedUser]);

  if (!selectedUser) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      await supabase
        .from("users")
        .update({ role, status })
        .eq("user_id", selectedUser.id);

      showToast(`อัปเดตสิทธิ์ของ ${selectedUser.name} สำเร็จ!`);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      showToast("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4'>
      <div className='bg-white rounded-[2rem] w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden shadow-2xl'>
        <div className='bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center'>
          <h2 className='text-lg font-extrabold text-slate-900 flex items-center'>
            <UserCog className="mr-2 text-indigo-600" size={20} />
            แก้ไขข้อมูลสิทธิ์ผู้ใช้
          </h2>
          <button aria-label="ปิด" title="ปิด"
            onClick={() => setSelectedUser(null)}
            className='p-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-full transition-colors'
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        
        <div className='p-6 space-y-6'>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="mb-3">
              <p className='text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1'>ชื่อ-นามสกุล</p>
              <p className='text-slate-900 font-bold text-base'>{selectedUser.name}</p>
            </div>
            <div>
              <p className='text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1'>อีเมล</p>
              <p className='text-slate-700 font-medium text-sm'>{selectedUser.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className='text-sm font-bold text-slate-700 mb-2 block'>
                สิทธิ์การใช้งาน
              </label>
              <select aria-label="สิทธิ์" title="สิทธิ์"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className='w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium text-sm transition-all'
              >
                <option value='user'>User (ผู้ใช้ทั่วไป)</option>
                <option value='admin'>Admin (ผู้ดูแลระบบ)</option>
              </select>
            </div>
            <div>
              <label className='text-sm font-bold text-slate-700 mb-2 block'>สถานะบัญชี</label>
              <select aria-label="สถานะ" title="สถานะ"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className='w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium text-sm transition-all'
              >
                <option value='active'>Active (เปิดใช้งานปกติ)</option>
                <option value='suspended'>Suspended (ระงับชั่วคราว)</option>
                <option value='banned'>Banned (แบนถาวร)</option>
              </select>
            </div>
          </div>
        </div>

        <div className='p-5 border-t border-slate-100 bg-white flex gap-3 justify-end'>
          <button
            onClick={() => setSelectedUser(null)}
            className='px-6 py-3 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-sm'
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className='px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.2)] hover:bg-indigo-700 hover:shadow-[0_6px_16px_rgba(79,70,229,0.3)] transition-all flex items-center gap-2 text-sm disabled:opacity-70 active:scale-95'
          >
            <CheckCircle2 size={18} /> บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersView({ showToast }: { showToast: (msg: string) => void; }) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("users")
        .select("user_id, email, full_name, role, status, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedUsers = (data || []).map((user: any) => ({
        id: user.user_id || user.id, 
        name: user.full_name || "ไม่ระบุชื่อ",
        email: user.email,
        role: user.role || "user",
        status: user.status || "active",
        joined: new Date(user.created_at).toLocaleDateString("th-TH"),
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      showToast("เกิดข้อผิดพลาดในการโหลดผู้ใช้");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <div className='w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin'></div>
      </div>
    );
  }

  return (
    <div className='animate-in fade-in duration-500'>
      <EditUserModal
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        fetchUsers={fetchUsers}
        showToast={showToast}
      />
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4'>
        <div>
          <h1 className='text-3xl font-extrabold flex items-center text-slate-900 tracking-tight'>
            <Users className='text-indigo-600 mr-3' size={32} />
            จัดการผู้ใช้
          </h1>
          <p className='text-slate-500 mt-2 font-medium'>ค้นหารายชื่อ ปรับสิทธิ์ และจัดการสถานะบัญชีของผู้ใช้ระบบ</p>
        </div>
      </div>
      <div className='bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden'>
        <div className='p-4 sm:p-5 border-b border-slate-100 flex bg-slate-50/50'>
          <div className='relative w-full sm:w-80'>
            <Search size={18} className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400' />
            <input
              type='text'
              placeholder='ค้นหาชื่อ หรืออีเมลผู้ใช้...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all font-medium'
            />
          </div>
        </div>

        <div className='hidden md:grid grid-cols-5 gap-4 p-5 bg-slate-50 border-b border-slate-100 font-bold text-[11px] text-slate-500 uppercase tracking-wider'>
          <div className="col-span-2">ข้อมูลผู้ใช้</div>
          <div>สิทธิ์</div>
          <div>สถานะบัญชี</div>
          <div>วันที่สมัคร</div>
        </div>

        <div className='divide-y divide-slate-100 p-2 sm:p-0'>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className='grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4 p-4 md:p-5 hover:bg-slate-50 transition-colors items-center cursor-pointer group rounded-2xl md:rounded-none'
                onClick={() => setSelectedUser(user)}
              >
                <div className="md:col-span-2 flex flex-col">
                  <div className='font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-base'>{user.name}</div>
                  <div className='text-sm font-medium text-slate-500'>{user.email}</div>
                </div>
                <div className="flex justify-between md:block items-center">
                  <span className="md:hidden text-xs font-bold text-slate-400">สิทธิ์: </span>
                  <span
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                      user.role.toLowerCase() === "admin"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    {user.role.toLowerCase() === "admin" ? "Admin" : "User"}
                  </span>
                </div>
                <div className="flex justify-between md:block items-center">
                  <span className="md:hidden text-xs font-bold text-slate-400">สถานะ: </span>
                  <span
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                      (user.status || "").toLowerCase() === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : (user.status || "").toLowerCase() === "suspended"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : !user.status
                            ? "bg-slate-50 text-slate-500 border-slate-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {!user.status
                      ? "ไม่ระบุ"
                      : (user.status || "").toLowerCase() === "active"
                        ? "ใช้งานปกติ"
                        : (user.status || "").toLowerCase() === "suspended"
                          ? "ระงับชั่วคราว"
                          : (user.status || "").toLowerCase() === "banned"
                            ? "แบนถาวร"
                            : user.status}
                  </span>
                </div>
                <div className="flex justify-between md:block items-center">
                  <span className="md:hidden text-xs font-bold text-slate-400">วันที่สมัคร: </span>
                  <span className='text-sm font-medium text-slate-600'>{user.joined}</span>
                </div>
              </div>
            ))
          ) : (
            <div className='text-center py-16 bg-slate-50/50'>
              <Search className='mx-auto mb-3 text-slate-300' size={40} />
              <h3 className="font-bold text-slate-700 text-lg mb-1">ไม่พบผู้ใช้ที่ค้นหา</h3>
              <p className="text-sm font-medium text-slate-500">ลองตรวจสอบการสะกดคำอีกครั้ง</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}