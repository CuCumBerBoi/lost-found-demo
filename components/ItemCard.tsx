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
  } | null;
}

interface ItemProps {
  item: CommonItem;
}

export function ItemCard({ item }: ItemProps) {
  // เลือกสี Badge ตามสถานะ
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return "default";
      case 'SEARCHING': return "destructive";
      case 'RETURNED': return "secondary";
      default: return "outline";
    }
  };

  // ลิงก์ไปหน้า Detail แยกตามประเภท
  const linkHref = item.type === 'FOUND' ? `/found/${item.id}` : `/item/${item.id}`;

  return (
    <Link href={linkHref}>
      <Card className="overflow-hidden bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col group hover:scale-[1.02] hover:border-gray-200">
        
        {/* Image Container */}
        <div className="relative h-48 w-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <MapPin className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm font-light">No Image</p>
              </div>
            </div>
          )}
          
          {/* Type Badge - Top Right */}
          <div className="absolute top-3 right-3">
            <Badge 
              className={`${
                item.type === 'FOUND' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              } text-white border-0 shadow-lg text-xs font-bold px-3 py-1 rounded-xl`}
            >
              {item.type === 'FOUND' ? '🎁 เจอ' : '🔍 หาย'}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-4 flex-1 flex flex-col">
          {/* Category Badge */}
          <div className="mb-3">
            <Badge 
              variant="outline" 
              className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 text-purple-700 text-xs font-medium px-3 py-1 rounded-xl"
            >
              {item.categories?.name || "อื่นๆ"}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-3 min-h-[56px] group-hover:text-gray-700 transition-colors">
            {item.title}
          </h3>
          
          {/* Details */}
          <div className="text-sm text-gray-500 space-y-2 mt-auto font-light">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-gray-400 flex-shrink-0" />
              <span className="line-clamp-1">{item.location_text}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-gray-400 flex-shrink-0" />
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

        {/* Footer - Hover Action */}
        <div className="px-4 pb-4">
          <div className="h-0 group-hover:h-10 overflow-hidden transition-all duration-300">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-center">
              <span className="text-xs font-bold text-gray-700">
                {item.type === 'FOUND' ? 'ดูรายละเอียด →' : 'ดูข้อมูล →'}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}