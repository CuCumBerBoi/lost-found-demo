import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const genAI = new GoogleGenerativeAI(env['GEMINI_API_KEY']);

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING, description: "ชื่อ" },
    description: { type: SchemaType.STRING, description: "คำอธิบาย" },
    category_name: { type: SchemaType.STRING, description: "หมวดหมู่" },
    ai_metadata: {
      type: SchemaType.OBJECT,
      properties: {
        color: { type: SchemaType.STRING, description: "สี" },
        brand: { type: SchemaType.STRING, description: "แบรนด์" },
        type: { type: SchemaType.STRING, description: "ประเภท" },
      },
      required: ["color", "brand", "type"]
    }
  },
  required: ["title", "description", "category_name", "ai_metadata"]
};

async function testGemini() {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { 
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    const prompt = "วิเคราะห์สิ่งที่อยู่ในภาพ";
    // We don't have an image, let's just pass text and see if schema generation works for text
    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log("Success 2.5 JSON:", response.text());
  } catch (err) {
    console.error("Error with 2.5-flash JSON:", err);
  }
}

testGemini();
