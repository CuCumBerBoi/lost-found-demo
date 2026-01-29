"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function DeleteButton({ id, type }: { id: string; type: "lost" | "found" }) {
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    // ถามยืนยันก่อนลบ
    if (!confirm("Are you sure? This cannot be undone.")) return;

    const table = type === "lost" ? "lost_items" : "found_items";
    // 👇 ตรงนี้สำคัญ: ชื่อ column ID ต้องตรงกับ DB ใหม่
    const idColumn = type === "lost" ? "lost_id" : "found_id";

    const { error } = await supabase
      .from(table)
      .delete()
      .eq(idColumn, id);

    if (error) {
      toast.error("Error deleting item");
      console.error(error);
    } else {
      toast.success("Item deleted");
      router.refresh();
    }
  };

  return (
    <Button 
      variant="destructive" 
      size="icon" // เปลี่ยนเป็น icon ล้วนให้ดูมินิมอล
      className="h-8 w-8 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 border border-rose-100 shadow-none transition-colors"
      onClick={handleDelete}
    >
      <Trash2 size={14} />
    </Button>
  );
}