"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation"; // ใช้ next/navigation ใน App Router
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import React from "react"; // เพิ่ม import React

// ต้องแกะ params แบบ Promise (Next.js 15)
export default function ClaimPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ใช้ React.use() เพื่อแกะ Promise params ใน Client Component
  const { id } = React.use(params);
  
  const router = useRouter();
  const supabase = createClient();
  const [proof, setProof] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proof.trim()) return alert("กรุณาระบุรายละเอียดหลักฐาน");
    
    setLoading(true);

    try {
      // 1. เช็ค Login
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("กรุณาเข้าสู่ระบบก่อน");
        router.push("/login");
        return;
      }

      // 2. บันทึกคำขอลงตาราง claims
      const { error } = await supabase.from("claims").insert({
        found_id: id,       // ของชิ้นไหน
        claimer_id: user.id, // ใครเป็นคนขอ
        proof_desc: proof,   // หลักฐาน (คำบรรยาย)
        status: "PENDING"    // รอการอนุมัติ
      });

      if (error) {
        // เช็คว่าเคยเคลมไปแล้วหรือยัง (Unique Constraint)
        if (error.code === "23505") {
          throw new Error("คุณได้ส่งคำขอคืนสำหรับของชิ้นนี้ไปแล้ว");
        }
        throw error;
      }

      alert("ส่งคำขอเรียบร้อย! กรุณารอการตอบกลับจากผู้ที่เจอของ");
      router.push(`/found/${id}`); // เด้งกลับไปหน้าของชิ้นนั้น

    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-xl">
      <Button 
        variant="ghost" 
        className="mb-4 text-gray-500"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader className="bg-blue-50">
          <CardTitle className="text-blue-900">
            Submit Claim Request (แบบฟอร์มขอรับคืน)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="font-bold">
                Proof of Ownership (หลักฐานแสดงความเป็นเจ้าของ)
              </Label>
              <p className="text-sm text-gray-500">
                กรุณาอธิบายรายละเอียดที่มีแค่เจ้าของเท่านั้นที่รู้ เช่น รหัสผ่าน, ตำหนิพิเศษ, สิ่งของที่อยู่ข้างใน, หรือ Wallpaper หน้าจอ
              </p>
              <Textarea
                required
                placeholder="เช่น: หน้าจอมือถือเป็นรูปแมวสีส้ม, เคสมีรอยร้าวที่มุมขวาล่าง, รหัสผ่านคือ 1234"
                rows={5}
                value={proof}
                onChange={(e) => setProof(e.target.value)}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Sending Request..." : "ยืนยันคำขอคืน (Submit Claim)"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}