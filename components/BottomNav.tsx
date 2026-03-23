"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, AlertCircle, Sparkles, User, type LucideIcon } from "lucide-react";

// NavItem component ย้ายออกมาจาก BottomNav เพื่อไม่ให้สร้างซ้ำทุกครั้งที่เรนเดอร์
function NavItem({ href, label, icon: Icon, activeColorClass, bgActive, pathname }: {
  href: string;
  label: string;
  icon: LucideIcon;
  activeColorClass: string;
  bgActive: string;
  pathname: string;
}) {
  // เช็คว่าหน้าปัจจุบันตรงกับลิงก์หรือไม่
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <Link href={href} className={`flex flex-col items-center justify-center w-full py-2 transition-colors ${isActive ? activeColorClass : 'text-gray-400 hover:text-gray-600'}`}>
      <div className={`p-1.5 rounded-full transition-colors ${isActive ? bgActive : ''}`}>
         <Icon size={22} className={isActive ? 'fill-current opacity-20' : ''} style={isActive ? { fill: 'currentColor' } : {}} />
      </div>
      <span className="text-[10px] font-bold mt-1">{label}</span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-100 flex justify-around items-center pt-2 pb-6 z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
       <NavItem href="/" icon={Home} label="หน้าแรก" activeColorClass="text-purple-600" bgActive="bg-purple-50" pathname={pathname} />
       <NavItem href="/lost" icon={AlertCircle} label="แจ้งหาย" activeColorClass="text-red-600" bgActive="bg-red-50" pathname={pathname} />
       <NavItem href="/found" icon={Package} label="แจ้งเจอ" activeColorClass="text-green-600" bgActive="bg-green-50" pathname={pathname} />
       <NavItem href="/matches" icon={Sparkles} label="Match" activeColorClass="text-blue-600" bgActive="bg-blue-50" pathname={pathname} />
       <NavItem href="/profile" icon={User} label="บัญชี" activeColorClass="text-gray-900" bgActive="bg-gray-100" pathname={pathname} />
    </div>
  );
}