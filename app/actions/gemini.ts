'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function analyzeImage(base64Image: string) {
  try {
    // ใช้โมเดล gemini-1.5-flash (รุ่นปัจจุบันที่เร็วและรองรับ Vision)
    // ถ้าในอนาคตมี 2.5 ให้เปลี่ยน string ตรงนี้ได้เลย
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" } // บังคับให้ตอบเป็น JSON
    });

    const prompt = `
      Analyze this image of a lost/found item. 
      Return a JSON object with these fields (in Thai language):
      - title: A short, clear name of the item (e.g. "iPhone 13 สีดำ", "กระเป๋าสตางค์ Gucci").
      - description: A detailed description including brand, model, color, distinct features, or scratches.
      - color: The dominant color of the item.
      - category_guess: Guess the category name in English (e.g. Electronics, Clothing, Accessories, Wallet, Keys, Others).
    `;

    // ตัด prefix ของ base64 ออก (เช่น "data:image/jpeg;base64,")
    const imageParts = [
      {
        inlineData: {
          data: base64Image.split(",")[1],
          mimeType: "image/jpeg",
        },
      },
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
}