import { Outlet } from "react-router-dom";
import Header from "./layout/vertical/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Footer from "./layout/footer/page";
import { AppSidebar } from "./layout/vertical/sidebar/app-sidebar";
import { cn } from "@/lib/utils";
import RouteErrorBoundary from "@/components/shared/route-error-boundary";
function Layout({ children }) {
  return <SidebarProvider
    defaultOpen={true}
    style={{ "--sidebar-width-icon": "52px" }}
  >
      <AppSidebar />
      <SidebarInset className="bg-transparent border-0 overflow-x-hidden">
        <Header />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className={cn("w-full mx-auto", "container")}>
            <div className="min-h-[calc(100vh-140px)]">
              <RouteErrorBoundary title="Page error">
                {children || <Outlet />}
              </RouteErrorBoundary>
            </div>
            <div className="pt-6">
              <Footer />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>;
}
export {
  Layout as default
};
