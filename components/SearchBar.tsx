"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce"; // ถ้ายังไม่มี: npm i use-debounce

export function SearchBar() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  // ฟังก์ชันนี้จะทำงานหลังจากหยุดพิมพ์ 0.3 วินาที (เพื่อไม่ให้ refresh ถี่เกินไป)
  // *ถ้าไม่อยากลง npm เพิ่ม ให้ใช้ onChange ธรรมดาแล้วกด Enter ก็ได้ครับ แต่แบบนี้ UX ดีกว่า
  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    
    // อัปเดต URL โดยไม่โหลดหน้าใหม่ทั้งหมด
    replace(`/?${params.toString()}`);
  }, 300);

  return (
    <div className="relative w-full ">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
      <Input
        type="search"
        placeholder="ค้นหา (ชื่อ, สถานที่)..."
        className="pl-9 bg-white"
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get("q")?.toString()}
      />
    </div>
  );
}