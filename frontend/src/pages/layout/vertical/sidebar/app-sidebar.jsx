import { Suspense } from "react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader } from "@/components/ui/sidebar";
import FullLogo from "../../shared/logo/full-logo";
import sidebaritems from "./sidebaritems";
import NavCollapse from "./nav-collapse";
import SimpleBar from "simplebar-react";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
function NavSkeleton() {
  return <div className="flex w-full flex-col gap-2 p-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-4 w-20 mt-2" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>;
}
function AppSidebar({ ...props }) {
  return <Sidebar
    variant="inset"
    collapsible="icon"
    {...props}
    className="sidebar-box **:data-[slot=sidebar-inner]:bg-sidebar **:data-[slot=sidebar-inner]:border-r **:data-[slot=sidebar-inner]:border-sidebar-border group-data-[state=collapsed]:hover:shadow-lg transition-colors"
    side="left"
  >
      <SidebarHeader className="p-3 group-data-[state=collapsed]:px-2.5 flex flex-row items-center justify-between border-b border-sidebar-border">
        <FullLogo />
        <Badge className="group-data-[state=collapsed]:hidden bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border font-bold text-[10px]" variant="secondary">
          v2.4 Pro
        </Badge>
      </SidebarHeader>

      <SidebarContent>
        <SimpleBar style={{ height: "100%" }}>
          <SidebarGroup className="flex items-center justify-center group-data-[state=collapsed]:px-2 px-3 py-3">
            <div className="px-0 group-data-[state=collapsed]:px-0 w-full flex flex-col gap-3">
              <Suspense fallback={<NavSkeleton />}>
                <NavCollapse menu={sidebaritems} className="text-sm font-medium text-foreground dark:text-muted-foreground" />
              </Suspense>
            </div>
          </SidebarGroup>
        </SimpleBar>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className="hide-menu flex flex-col gap-2">
          <NavSecondary />
          <NavUser />
        </div>
      </SidebarFooter>
    </Sidebar>;
}
export {
  AppSidebar
};
