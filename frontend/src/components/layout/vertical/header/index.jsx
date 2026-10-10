import { useState } from "react";
import Search from "../../shared/header/search";
import Profile from "../../shared/header/profile";
import FullLogo from "../../shared/logo/full-logo";
import LightDark from "../../shared/header/light-dark";
import Notifications from "../../shared/header/notifications";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PanelLeft, SunDim, ChevronDown, MessageSquare, Maximize, SlidersHorizontal } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
function Header() {
  const { toggleSidebar } = useSidebar();
  const [currentInstallation, setCurrentInstallation] = useState("Villa Soleil Residence");
  const [currentLang, setCurrentLang] = useState("US");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {
        });
        setIsFullscreen(false);
      }
    }
  };
  return <header className={cn("sticky top-0 z-40 bg-card dark:bg-card border-b border-border/80 dark:border-border px-4 py-2.5 shadow-xs transition-colors")}>
      <nav>
        <div className="mx-auto flex flex-wrap items-center justify-between gap-3">
          {
    /* Left section: Toggle, Mobile Logo, Installation Dropdown, Search */
  }
          <div className="flex gap-3 items-center">
            <div className="block lg:hidden">
              <FullLogo />
            </div>

            <Button
    variant="ghost"
    size="icon"
    className="p-2 hover:bg-muted dark:hover:bg-muted text-muted-foreground dark:text-muted-foreground rounded-full transition cursor-pointer"
    onClick={toggleSidebar}
    title="Toggle sidebar"
  >
              <PanelLeft className="w-5 h-5" />
            </Button>

            <Separator
    orientation="vertical"
    className="h-4 bg-muted dark:bg-muted max-lg:hidden"
  />

            {
    /* Installation Selector Dropdown */
  }
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden md:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-muted dark:bg-muted/80 border border-border dark:border-border hover:bg-muted/60 dark:hover:bg-muted text-foreground dark:text-foreground transition-colors cursor-pointer select-none">
                <SunDim className="w-3.5 h-3.5 text-primary" />
                <span>{currentInstallation}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-card dark:bg-card border border-border dark:border-border text-foreground dark:text-foreground shadow-md">
                <DropdownMenuItem
    className="text-xs cursor-pointer hover:bg-muted dark:hover:bg-muted"
    onClick={() => setCurrentInstallation("Villa Soleil Residence")}
  >
                  Villa Soleil Residence (Tunis)
                </DropdownMenuItem>
                <DropdownMenuItem
    className="text-xs cursor-pointer hover:bg-muted dark:hover:bg-muted"
    onClick={() => setCurrentInstallation("Sousse Coastal Annex")}
  >
                  Sousse Coastal Annex (Sousse)
                </DropdownMenuItem>
                <DropdownMenuItem
    className="text-xs cursor-pointer hover:bg-muted dark:hover:bg-muted"
    onClick={() => setCurrentInstallation("Monastir Solar Plant")}
  >
                  Monastir Solar Plant (Monastir)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {
    /* Search Input Pill */
  }
            <div className="sm:block hidden">
              <Search />
            </div>
          </div>

          {
    /* Right section: Controls & Profile */
  }
          <div className="flex items-center gap-1.5 sm:gap-2">
            {
    /* Dark / Light Theme Toggle */
  }
            <LightDark />

            {
    /* Notifications Dropdown */
  }
            <Notifications className="sm:block" />

            {
    /* Help / Messages Button */
  }
            <Button
    variant="ghost"
    size="icon"
    className="h-9 w-9 rounded-full text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted"
    title="Help & Messages"
  >
              <MessageSquare className="w-4 h-4" />
            </Button>

            {
    /* Language Selector Dropdown */
  }
            <DropdownMenu>
              <DropdownMenuTrigger className="h-9 px-2.5 rounded-full text-xs font-bold text-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted flex items-center gap-1 cursor-pointer">
                <span className="text-sm">🇺🇸</span>
                <span className="hidden sm:inline">{currentLang}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card dark:bg-card border border-border dark:border-border">
                <DropdownMenuItem className="text-xs cursor-pointer" onClick={() => setCurrentLang("US")}>
                  🇺🇸 English (US)
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs cursor-pointer" onClick={() => setCurrentLang("FR")}>
                  🇫🇷 Français (FR)
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs cursor-pointer" onClick={() => setCurrentLang("TN")}>
                  🇹🇳 العربية (TN)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {
    /* Fullscreen Toggle */
  }
            <Button
    variant="ghost"
    size="icon"
    className="h-9 w-9 rounded-full text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted hidden md:flex"
    onClick={toggleFullscreen}
    title="Toggle Fullscreen"
  >
              <Maximize className="w-4 h-4" />
            </Button>

            {
    /* Settings Filter Quick Icon */
  }
            <Button
    variant="ghost"
    size="icon"
    className="h-9 w-9 rounded-full text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted hidden md:flex"
    title="Dashboard Filter Settings"
  >
              <SlidersHorizontal className="w-4 h-4" />
            </Button>

            {
    /* User Profile Menu */
  }
            <Profile />
          </div>
        </div>
      </nav>
    </header>;
}
export {
  Header as default
};
