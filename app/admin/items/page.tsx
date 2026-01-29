import { createClient } from "@/lib/supabase-server";
import { DeleteButton } from "./DeleteButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export const revalidate = 0;

export default async function ManageItemsPage() {
  const supabase = await createClient();

  // 1. ดึงของหาย (Lost) - Join กับตาราง users
  const { data: lostItems } = await supabase
    .from("lost_items")
    .select("*, users(email)") // users(email) คือการ join
    .order("created_at", { ascending: false });

  // 2. ดึงของเจอ (Found)
  const { data: foundItems } = await supabase
    .from("found_items")
    .select("*, users(email)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Manage Items</h1>
      </div>

      <Tabs defaultValue="lost" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-200 p-1 rounded-xl">
          <TabsTrigger value="lost" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Lost Items ({lostItems?.length || 0})</TabsTrigger>
          <TabsTrigger value="found" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Found Items ({foundItems?.length || 0})</TabsTrigger>
        </TabsList>

        {/* Tab Lost */}
        <TabsContent value="lost" className="mt-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 font-semibold text-slate-600">Item</th>
                  <th className="p-4 font-semibold text-slate-600">User</th>
                  <th className="p-4 font-semibold text-slate-600">Status</th>
                  <th className="p-4 font-semibold text-slate-600 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lostItems?.map((item) => (
                  <tr key={item.lost_id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{item.title}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{new Date(item.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4 text-slate-600">
                      {/* 👇 ดึง email จากการ join */}
                      {(item.users as any)?.email || "Unknown"}
                    </td>
                    <td className="p-4">
                       <Badge variant={item.status === 'RETURNED' ? 'default' : 'secondary'} className="font-normal">
                         {item.status}
                       </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <DeleteButton id={item.lost_id} type="lost" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Tab Found (ทำเหมือนกัน) */}
        <TabsContent value="found" className="mt-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 font-semibold text-slate-600">Item</th>
                  <th className="p-4 font-semibold text-slate-600">User</th>
                  <th className="p-4 font-semibold text-slate-600">Status</th>
                  <th className="p-4 font-semibold text-slate-600 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {foundItems?.map((item) => (
                  <tr key={item.found_id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{item.title}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{item.location_text}</div>
                    </td>
                    <td className="p-4 text-slate-600">
                      {(item.users as any)?.email || "Unknown"}
                    </td>
                    <td className="p-4">
                       <Badge variant={item.status === 'RETURNED' ? 'default' : 'outline'} className="font-normal">
                         {item.status}
                       </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <DeleteButton id={item.found_id} type="found" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}