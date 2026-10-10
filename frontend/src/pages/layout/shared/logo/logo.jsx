import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import { Sun } from "lucide-react";
const Logo = () => {
  return <Link to={"/"}>
      <SidebarMenuButton
    size="lg"
    className="data-[state=open]:bg-card/50 data-[state=open]:text-foreground flex items-center justify-center"
  >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--primary)] text-[#1E261D] shadow-md">
          <Sun className="w-5 h-5 fill-[#1E261D] stroke-[2.2]" />
        </div>
      </SidebarMenuButton>
    </Link>;
};
var logo_default = Logo;
export {
  logo_default as default
};
