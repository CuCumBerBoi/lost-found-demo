"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import { Users, Search, X, CheckCircle2 } from "lucide-react";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  joined: string;
}

interface SupabaseUserRow {
  user_id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role?: string;
  status?: string;
  created_at: string;
}

// ย้าย EditUserModal ออกมาจาก Component หลักเพื่อไม่ให้ผิด Rules of Hooks
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

  // อัพเดท local state เมื่อ selectedUser เปลี่ยน
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
      showToast("เกิดข้อผิดพลาดในการอัปเดต");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4'>
      <div className='bg-white rounded-[2rem] w-full max-w-md animate-in zoom-in-95 overflow-hidden shadow-2xl'>
        <div className='bg-slate-50 border-b border-slate-200 p-5 flex justify-between items-center'>
          <h2 className='text-lg font-bold text-slate-900'>
            แก้ไขข้อมูลผู้ใช้
          </h2>
          <button aria-label="ปิด" title="ปิด"
            onClick={() => setSelectedUser(null)}
            className='p-2 hover:bg-slate-200 rounded-full'
          >
            <X size={20} />
          </button>
        </div>
        <div className='p-6 space-y-5'>
          <div>
            <p className='text-sm font-bold text-slate-600 mb-2'>ชื่อ</p>
            <p className='text-slate-900 font-medium'>{selectedUser.name}</p>
          </div>
          <div>
            <p className='text-sm font-bold text-slate-600 mb-2'>อีเมล</p>
            <p className='text-slate-900 font-medium'>{selectedUser.email}</p>
          </div>
          <div>
            <label className='text-sm font-bold text-slate-600'>
              สิทธิ์ (Role)
            </label>
            <select aria-label="สิทธิ์" title="สิทธิ์"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className='w-full mt-2 p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-400'
            >
              <option value='user'>User (ผู้ใช้ทั่วไป)</option>
              <option value='admin'>Admin (ผู้ดูแลระบบ)</option>
            </select>
          </div>
          <div>
            <label className='text-sm font-bold text-slate-600'>สถานะ</label>
            <select aria-label="สถานะ" title="สถานะ"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className='w-full mt-2 p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-400'
            >
              <option value='active'>Active (ใช้งาน)</option>
              <option value='suspended'>Suspended (ระงับ)</option>
              <option value='banned'>Banned (แบน)</option>
            </select>
          </div>
        </div>
        <div className='p-5 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end'>
          <button
            onClick={() => setSelectedUser(null)}
            className='px-5 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-lg'
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className='px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-70'
          >
            <CheckCircle2 size={16} /> บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersView({
  showToast,
}: {
  showToast: (msg: string) => void;
}) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("users")
        .select("user_id, email, full_name, phone, role, status, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedUsers = (data || []).map((user: SupabaseUserRow) => ({
        id: user.user_id,
        name: user.full_name || "Unknown",
        email: user.email,
        phone: user.phone || "N/A",
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
      <div className='flex justify-between items-end mb-6'>
        <div>
          <h1 className='text-2xl font-extrabold flex items-center'>
            <Users className='text-indigo-600 mr-3' size={28} />
            จัดการผู้ใช้ (Users)
          </h1>
          <p className='text-slate-500 mt-1'>
            ปรับสิทธิ์ (Role) และจัดการสถานะบัญชี
          </p>
        </div>
      </div>
      <div className='bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden'>
        <div className='p-4 border-b border-slate-100 flex justify-between bg-slate-50'>
          <div className='relative'>
            <Search
              size={16}
              className='absolute left-3 top-2 text-slate-400'
            />
            <input
              type='text'
              placeholder='ค้นหาชื่อ, อีเมล...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none w-64 focus:border-indigo-400'
            />
          </div>
        </div>
        <div className='divide-y divide-slate-100'>
          <div className='grid grid-cols-5 gap-4 p-4 bg-slate-50 font-bold text-xs text-slate-600 uppercase'>
            <div>ชื่อผู้ใช้</div>
            <div>อีเมล</div>
            <div>สิทธิ์</div>
            <div>สถานะ</div>
            <div>วันที่เข้าร่วม</div>
          </div>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className='grid grid-cols-5 gap-4 p-4 hover:bg-slate-50 transition-colors items-center cursor-pointer'
                onClick={() => setSelectedUser(user)}
              >
                <div className='font-medium text-slate-900'>{user.name}</div>
                <div className='text-sm text-slate-600'>{user.email}</div>
                <div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {user.role === "admin" ? "Admin" : "User"}
                  </span>
                </div>
                <div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      user.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : user.status === "suspended"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {user.status === "active"
                      ? "ใช้งาน"
                      : user.status === "suspended"
                        ? "ระงับ"
                        : "แบน"}
                  </span>
                </div>
                <div className='text-sm text-slate-600'>{user.joined}</div>
              </div>
            ))
          ) : (
            <div className='text-center py-10 text-slate-500'>
              <Search className='mx-auto mb-2 text-slate-300' size={32} />
              <p>ไม่พบผู้ใช้ที่ตรงกัน</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
