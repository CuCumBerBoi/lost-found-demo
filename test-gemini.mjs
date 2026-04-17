import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const genAI = new GoogleGenerativeAI(env['GEMINI_API_KEY']);

async function testGemini() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello, what model are you?");
    const response = await result.response;
    console.log("Success:", response.text());
  } catch (err) {
    console.error("Error with 1.5-flash:", err.message);
  }

  try {
    const model2 = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result2 = await model2.generateContent("Hello, what model are you?");
    const response2 = await result2.response;
    console.log("Success 2.5:", response2.text());
  } catch (err) {
    console.error("Error with 2.5-flash:", err.message);
  }
}

testGemini();
