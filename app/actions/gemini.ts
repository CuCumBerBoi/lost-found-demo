'use server';

import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function analyzeImage(base64Image: string) {
  try {
    // 1. จัดการแยกประเภทไฟล์ (MIME Type) และ ข้อมูล Base64 ให้ยืดหยุ่น
    // ป้องกัน Error กรณีผู้ใช้อัปโหลดไฟล์ PNG, WEBP, หรือรูปแบบอื่นๆ
    const mimeType = base64Image.substring(base64Image.indexOf(":") + 1, base64Image.indexOf(";"));
    const base64Data = base64Image.split(",")[1];

    // 2. กำหนดโครงสร้าง JSON (Schema) ที่ต้องการให้ตรงกับ Database 100%
    // แก้ปัญหา TypeScript Error โดยการกำหนด Type เป็น : Schema อย่างชัดเจน
    const responseSchema: Schema = {
      type: SchemaType.OBJECT,
      properties: {
        title: {
          type: SchemaType.STRING,
          description: "ชื่อเรียกสิ่งของสั้นๆ ให้ชัดเจน เช่น 'iPhone 13 สีดำ', 'กระเป๋าสตางค์หนัง'"
        },
        description: {
          type: SchemaType.STRING,
          description: "อธิบายสภาพสิ่งของ จุดสังเกตพิเศษ ตำหนิ หรือสิ่งที่พอจะมองเห็นได้จากภาพ"
        },
        category_name: {
          type: SchemaType.STRING,
          description: "เลือก 1 หมวดหมู่ที่ตรงกับสิ่งของที่สุดจากตัวเลือกนี้เท่านั้น: 'อุปกรณ์อิเล็กทรอนิกส์', 'เครื่องเขียน', 'กระเป๋า/ของใช้ส่วนตัว', 'เอกสาร/บัตร', 'ยานพาหนะ/กุญแจ'"
        },
        // ก้อนนี้เตรียมไว้โยนเข้าฟิลด์ ai_metadata (jsonb) ตรงๆ ได้เลย
        ai_metadata: {
          type: SchemaType.OBJECT,
          properties: {
            color: { type: SchemaType.STRING, description: "สีหลักของสิ่งของ" },
            brand: { type: SchemaType.STRING, description: "ยี่ห้อ (ถ้าไม่เห็นโลโก้หรือยี่ห้อ ให้ระบุว่า 'ไม่ระบุ')" },
            type: { type: SchemaType.STRING, description: "ประเภทสิ่งของแบบเจาะจง เช่น 'โทรศัพท์มือถือ', 'กุญแจรถ', 'บัตรประชาชน'" }
          },
          required: ["color", "brand", "type"]
        }
      },
      required: ["title", "description", "category_name", "ai_metadata"]
    };

    // 3. ตั้งค่า Model
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { 
          responseMimeType: "application/json",
          responseSchema: responseSchema // บังคับให้ตอบกลับตามโครงสร้างที่เราจัดไว้
        } 
    });

    const prompt = "วิเคราะห์รูปภาพสิ่งของสูญหาย/พบเจอชิ้นนี้ สกัดจุดเด่นที่สำคัญ และตอบกลับเป็นภาษาไทยตามโครงสร้าง JSON ที่กำหนด";

    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType, // ใช้ mimeType ที่ดึงมาได้แบบ Dynamic
        },
      },
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    // แปลง Text JSON ให้กลายเป็น Object เพื่อส่งกลับไปให้ Frontend
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Analyze Error:", error);
    return null;
  }
}