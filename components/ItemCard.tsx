import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar } from "lucide-react"; 

// สร้าง Interface กลาง ที่รับได้ทั้ง Lost และ Found
export interface CommonItem {
  id: string;
  title: string;
  image_url: string | null;
  location_text: string;
  date: string;
  status: string;
  type: 'LOST' | 'FOUND'; // ตัวบอกประเภท
  categories: {
    name: string;
  } | null; // อนุญาตให้ null ได้กัน error
}

// Type Definition ให้ตรงกับ Database
interface ItemProps {
    item: CommonItem;
}

export function ItemCard({ item }: ItemProps) {
    // เลือกสี Badge ตามสถานะ
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return "default"; // เขียว (ปกติของ shadcn default คือดำ แต่อ่านง่ายกว่า)
      case 'SEARCHING': return "destructive"; // แดง
      case 'RETURNED': return "secondary"; // เทา
      default: return "outline";
    }
  };

  // ลิงก์ไปหน้า Detail แยกตามประเภท
  const linkHref = item.type === 'FOUND' ? `/found/${item.id}` : `/item/${item.id}`;
  return (
    <Link href={linkHref}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col group">
        <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No Image
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge variant={getStatusColor(item.status) as any}>
              {item.status}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 flex-1">
          <div className="flex justify-between items-start mb-2">
            <Badge variant="outline" className="mb-2">
              {item.categories?.name || "Other"}
            </Badge>
            {/* โชว์ประเภทเล็กๆ ให้รู้ */}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              item.type === 'FOUND' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {item.type === 'FOUND' ? 'FOUND' : 'LOST'}
            </span>
          </div>
          <h3 className="font-bold text-lg line-clamp-1 mb-1">{item.title}</h3>
          
          <div className="text-sm text-gray-500 space-y-1">
            <div className="flex items-center gap-1">
              <MapPin size={16} />
              <span className="line-clamp-1">{item.location_text}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={16} />
              <span>
                {new Date(item.date).toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}