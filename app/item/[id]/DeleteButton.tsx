"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function DeleteButton({ itemId }: { itemId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        // 1. ถามความแน่ใจ
        const confirmed = window.confirm("Are you sure you want to delete this post?");
        if (!confirmed) return;

        setLoading(true);

        // 2. ลบข้อมูลจาก Supabase
        // (RLS จะเช็คให้เองว่าถ้าไม่ใช่เจ้าของจะลบไม่ได้)
        const { error } = await supabase
            .from("lost_items")
            .delete()
            .eq("lost_id", itemId);

        if (error) {
            alert("Error deleting item: " + error.message);
            setLoading(false);
        } else {
            alert("Item deleted successfully");
            router.push("/"); // ลบเสร็จถีบกลับหน้าแรก
            router.refresh(); // รีเฟรชข้อมูล
        }
    };

    return (
        <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="w-full md:w-auto"
        >
            <Trash2 className="mr-2 h-4 w-4" />
            {loading ? "Deleting..." : "Delete Post"}
        </Button>
    );
}