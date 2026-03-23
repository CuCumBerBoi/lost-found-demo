import { Sidebar, SidebarContent } from "@/components/ui/sidebar";

export const AppSidebar = () => {
  return (
    <Sidebar>
      <SidebarContent>
        <div className='p-4'>
          <h2 className='text-lg font-semibold'>Navigation</h2>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};
