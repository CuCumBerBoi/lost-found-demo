import CreateItemForm from "@/components/CreateItemForm"; // Import Component เข้ามา

export default function TestUploadPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">ทดสอบระบบ AI Auto-fill</h1>
        {/* เรียกใช้ Component ฟอร์ม */}
        <CreateItemForm />
      </div>
    </div>
  );
}