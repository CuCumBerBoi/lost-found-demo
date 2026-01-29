const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

// เรียกใช้ API Key จาก Environment Variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// กำหนดโครงสร้างข้อมูล (Schema) ที่เราอยากได้
// ตรงนี้สำคัญมาก! มันจะบังคับให้ AI ตอบตามฟอร์มนี้เท่านั้น ข้อมูลจะไม่มั่ว
const itemSchema = {
  description: "Item details extraction",
  type: SchemaType.OBJECT,
  properties: {
    item_name: {
      type: SchemaType.STRING,
      description: "ชื่อสินค้าภาษาไทย สั้นกระชับ ระบุแบรนด์และรุ่น (ถ้ามี)",
      nullable: false,
    },
    category: {
      type: SchemaType.STRING,
      description: "หมวดหมู่สินค้า เลือกจาก: เสื้อผ้า, อุปกรณ์ไอที, เครื่องเขียน, ของใช้ทั่วไป, อื่นๆ",
      nullable: false,
    },
    color: {
      type: SchemaType.STRING,
      description: "สีหลักของสินค้า",
      nullable: true,
    },
    description: {
      type: SchemaType.STRING,
      description: "คำบรรยายสินค้าอย่างละเอียด ดึงดูดความสนใจ สภาพสินค้า จุดสังเกต",
      nullable: false,
    },
    suggested_tags: {
      type: SchemaType.ARRAY,
      description: "Tag ที่เกี่ยวข้อง 3-5 tags",
      items: { type: SchemaType.STRING },
    },
  },
  required: ["item_name", "category", "description"],
};

// ฟังก์ชันหลัก
async function analyzeItemImage(imageBuffer, mimeType) {
  // เลือกโมเดล Gemini 1.5 Flash (เร็ว ฟรี และเก่งพอตัว)
  const model = genAI.getGenerativeModel({
    model: "gemini-pro-vision",
    generationConfig: {
      responseMimeType: "application/json", // บังคับตอบเป็น JSON
      responseSchema: itemSchema,          // บังคับโครงสร้างตาม Schema ด้านบน
    },
  });

  const prompt = "ขอข้อมูลสินค้าจากภาพนี้ ตอบเป็น JSON format เท่านั้น โดยมี key: item_name, category, description";

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString("base64"),
      mimeType: mimeType,
    },
  };

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    
    // Parse JSON กลับมาเป็น Object
    const itemData = JSON.parse(responseText);
    return itemData;

  } catch (error) {
    console.error("Gemini Error:", error);
    return null; // หรือ handle error ตามที่ทีมตกลงกัน
  }
}

// วิธีเรียกใช้ (Example Usage)
// const fs = require('fs');
// const img = fs.readFileSync('my-bag.jpg');
// analyzeItemImage(img, 'image/jpeg').then(data => console.log(data));

module.exports = { analyzeItemImage };