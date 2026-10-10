import { Link } from "react-router-dom";
import { Sun } from "lucide-react";
const FullLogo = () => {
  return <Link to={"/"} className="flex items-center gap-2.5 group shrink-0 select-none">
      <div className="flex items-center justify-center w-8.5 h-8.5 rounded-xl bg-primary text-primary-foreground shadow-btn-shadow transition-transform group-hover:scale-105">
        <Sun className="w-5 h-5 fill-current stroke-[2.2]" />
      </div>
      <div className="flex flex-col">
        <span className="font-black text-sm tracking-tight text-foreground dark:text-foreground leading-none flex items-center gap-1">
          SOLAR<span className="text-primary dark:text-primary font-extrabold">X</span>
        </span>
        <span className="text-[9px] text-muted-foreground dark:text-muted-foreground font-semibold tracking-wider uppercase mt-1">
          Monitor. Optimize. Save.
        </span>
      </div>
    </Link>;
};
var full_logo_default = FullLogo;
export {
  full_logo_default as default
};
