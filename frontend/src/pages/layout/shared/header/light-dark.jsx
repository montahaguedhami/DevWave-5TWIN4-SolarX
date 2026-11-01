import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
const LightDark = () => {
  const { resolvedTheme: activeMode, setTheme: setActiveMode } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const toggleTheme = async () => {
    const toggleMode = () => {
      setActiveMode(activeMode === "light" ? "dark" : "light");
    };
    if (!document.startViewTransition) {
      toggleMode();
      return;
    }
    const transition = document.startViewTransition(() => {
      toggleMode();
    });
    await transition.ready;
    document.documentElement.animate(
      {
        clipPath: ["inset(0 0 100% 0)", "inset(0)"]
      },
      {
        duration: 800,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)"
      }
    );
  };
  if (!isMounted) {
    return null;
  }
  return <div>
      {
    /* Theme Toggle */
  }
      {activeMode === "light" ? <Button
    aria-label="Passer en mode sombre"
    title="Passer en mode sombre"
    variant="ghost"
    className=" h-10 w-10  hover:bg-primary/5  rounded-full cursor-pointer"
    onClick={toggleTheme}
  >
          <Moon className="size-5" />
        </Button> : (
    // Dark Mode Button
    <Button
      aria-label="Passer en mode clair"
      title="Passer en mode clair"
      variant="ghost"
      className=" h-10 w-10  hover:bg-primary/5  rounded-full cursor-pointer"
      onClick={toggleTheme}
    >
          <Sun className="size-5" />
        </Button>
  )}
    </div>;
};
var light_dark_default = LightDark;
export {
  light_dark_default as default
};
