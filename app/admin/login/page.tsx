import { redirect } from "next/navigation";

/**
 * /admin/login — redirect ไปหน้า Login หลักของระบบ
 * หลังจาก Login สำเร็จ Admin จะถูก redirect ไป /admin โดยอัตโนมัติ
 */
export default function AdminLoginRedirect() {
  redirect("/login");
}
