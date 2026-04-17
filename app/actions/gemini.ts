'use server';

import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function analyzeImage(base64Image: string, existingCategories: string[] = []) {
  try {
    // 1. จัดการแยกประเภทไฟล์ (MIME Type) และ ข้อมูล Base64 ให้ยืดหยุ่น
    // ป้องกัน Error กรณีผู้ใช้อัปโหลดไฟล์ PNG, WEBP, หรือรูปแบบอื่นๆ
    const mimeType = base64Image.substring(base64Image.indexOf(":") + 1, base64Image.indexOf(";"));
    const base64Data = base64Image.split(",")[1];

    const categoryPromptList = existingCategories.length > 0 
      ? `เลือกหมวดหมู่ที่ตรงที่สุดจากรายการนี้เท่านั้น: ${existingCategories.map(c => `'${c}'`).join(', ')} (ห้ามสร้างคำใหม่เด็ดขาด หากไม่มีให้เลือกคำที่ใกล้เคียงที่สุด)`
      : `ระบุหมวดหมู่ที่เหมาะสมที่สุด 1 คำสั้นๆ`;

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
          description: categoryPromptList
        },
        // ก้อนนี้เตรียมไว้โยนเข้าฟิลด์ ai_metadata (jsonb) ตรงๆ ได้เลย
        ai_metadata: {
          type: SchemaType.OBJECT,
          properties: {
            color: { type: SchemaType.STRING, description: "สีหลักของสิ่งของ เช่น 'ดำ', 'ขาว', 'แดง'" },
            brand: { type: SchemaType.STRING, description: "ชื่อยี่ห้อหรือแบรนด์ (ถ้ามองไม่เห็นโลโก้ชัดเจน ให้ระบุว่า 'ไม่ระบุ')" },
            type: { type: SchemaType.STRING, description: "ประเภทสิ่งของคำสั้นๆ เช่น 'โทรศัพท์มือถือ', 'กุญแจรถ', 'กระเป๋าสตางค์'" },
            // characteristic: { type: SchemaType.STRING, description: "สรุปลักษณะเด่นหรือตำหนิสั้นๆ ไม่เกิน 1 ประโยค เช่น 'มีรอยร้าวที่หน้าจอ', 'ห้อยพวงกุญแจหมี'" }
          },
          required: ["color", "brand", "type"]
        }
      },
      required: ["title", "description", "category_name", "ai_metadata"]
    };

    // 3. ตั้งค่า Model
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        systemInstruction: "คุณคือผู้เชี่ยวชาญด้านการวิเคราะห์รูปภาพสิ่งของสูญหาย คุณต้องตอบกลับเป็นภาษาไทยที่กระชับ แม่นยำ และเป็นกลางเสมอ หลีกเลี่ยงการเดาสุ่มหากมองไม่เห็นชัดเจน",
        generationConfig: { 
          responseMimeType: "application/json",
          responseSchema: responseSchema // บังคับให้ตอบกลับตามโครงสร้างที่เราจัดไว้
        } 
    });

    const prompt = "วิเคราะห์รูปภาพสิ่งของชิ้นนี้ สกัดจุดเด่น สี ยี่ห้อ และหมวดหมู่ที่เหมาะสมที่สุด และตอบกลับตามโครงสร้าง JSON ที่กำหนดอย่างเคร่งครัด";

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
    let text = response.text();
    
    // ตัดข้อความขยะ หรือ Markdown (```json) ที่ Gemini อาจจะเผลอสร้างมาด้วย
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }
    
    // แปลง Text JSON ให้กลายเป็น Object เพื่อส่งกลับไปให้ Frontend
    const parsedData = JSON.parse(text);
    return { success: true, data: parsedData };

  } catch (error) {
    console.error("Gemini Analyze Error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "ไม่สามารถวิเคราะห์ภาพได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง" 
    };
  }
}