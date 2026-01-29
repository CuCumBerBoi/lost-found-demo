"use client"; // จำเป็นสำหรับ Next.js App Router

import { useState, ChangeEvent } from "react";

export default function CreateItemForm() {
  // State สำหรับเก็บข้อมูลในฟอร์ม
  const [formData, setFormData] = useState({
    item_name: "",
    category: "",
    description: "",
    color: "",
  });

  // State สำหรับจัดการรูปภาพและ Loading
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ฟังก์ชันเมื่อมีการเลือกไฟล์
  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Show Preview ทันที
    const url = URL.createObjectURL(file);
    setImagePreview(url);

    // 2. เริ่มกระบวนการ AI Auto-fill
    setIsAnalyzing(true);
    
    try {
      const uploadData = new FormData();
      uploadData.append("image", file);

      // ยิงไปที่ API Route ของเรา
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: uploadData,
      });

      if (!response.ok) throw new Error("Analysis failed");

      const aiData = await response.json();

      // 3. เมื่อได้ข้อมูลมา ใส่ลงใน State (Auto-fill)
      setFormData({
        item_name: aiData.item_name || "",
        category: aiData.category || "",
        description: aiData.description || "",
        color: aiData.color || "",
      });

    } catch (error) {
      console.error(error);
      alert("AI ช่วยกรอกข้อมูลไม่สำเร็จ กรุณากรอกเองนะครับ");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ฟังก์ชันจัดการพิมพ์แก้ไขข้อมูล (เผื่อ User อยากแก้สิ่งที่ AI เขียน)
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">ลงประกาศสินค้า</h2>

      {/* --- ส่วนอัปโหลดรูปภาพ --- */}
      <div className="mb-8">
        <label className="block mb-2 font-medium text-gray-700">รูปภาพสินค้า</label>
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="h-full object-contain p-2" />
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                   <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span></p>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
        </div>
      </div>

      {/* --- Loading Indicator --- */}
      {isAnalyzing && (
        <div className="flex items-center justify-center mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg animate-pulse">
          <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          AI กำลังวิเคราะห์รูปภาพและกรอกข้อมูลให้คุณ... ✨
        </div>
      )}

      {/* --- Form Inputs --- */}
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า</label>
          <input
            type="text"
            name="item_name"
            value={formData.item_name}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="เช่น เสื้อยืดสีดำ Nike Size L"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
              <select
                title="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">เลือกหมวดหมู่...</option>
                <option value="เสื้อผ้า">เสื้อผ้า</option>
                <option value="อุปกรณ์ไอที">อุปกรณ์ไอที</option>
                <option value="ของใช้ทั่วไป">ของใช้ทั่วไป</option>
                <option value="เครื่องเขียน">เครื่องเขียน</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สี</label>
              <input
                placeholder="color"
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
          <textarea
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="รายละเอียดสินค้า..."
          />
        </div>

        <button
          type="button" // เปลี่ยนเป็น submit เมื่อเชื่อมต่อ DB
          className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition duration-200"
        >
          ยืนยันข้อมูล (Save)
        </button>
      </form>
    </div>
  );
}