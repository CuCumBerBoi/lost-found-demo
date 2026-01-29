import { NextRequest, NextResponse } from "next/server";
// Import ฟังก์ชันจากไฟล์ Logic ของคุณ
// หมายเหตุ: ต้องแก้ path ให้ตรงนะครับ ถ้า file อยู่ app/model_test/imageAnalyzer.js
import { analyzeItemImage } from "@/app/model_test/imageAnalyzer"; 

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // เรียกใช้ Logic ของคุณตรงนี้!
    const result = await analyzeItemImage(buffer, file.type);

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}