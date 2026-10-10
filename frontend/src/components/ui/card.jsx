import { cn } from "@/lib/utils";
import { Maximize2 } from "lucide-react";
function Card({
  className,
  size = "default",
  variant = "glass",
  expandable = true,
  children,
  ...props
}) {
  const isGlass = variant === "glass";
  return <div
    data-slot="card"
    data-size={size}
    data-variant={variant}
    className={cn(
      "cn-card group/card relative flex flex-col gap-4 overflow-hidden text-sm text-card-foreground transition-all duration-300",
      isGlass ? "bg-card/80 dark:bg-card/90 backdrop-blur-xl border border-border rounded-2xl shadow-lg text-foreground hover:border-primary/30" : "rounded-2xl bg-card py-4 text-card-foreground ring-1 ring-border shadow-sm",
      isGlass && "py-5",
      className
    )}
    {...props}
  >
      {expandable && <button
    type="button"
    aria-label="Expand widget"
    className="absolute top-4 right-4 z-10 opacity-40 hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-foreground cursor-pointer"
  >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>}
      {children}
    </div>;
}
function CardHeader({ className, ...props }) {
  return <div
    data-slot="card-header"
    className={cn(
      "cn-card-header group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-4 group-data-[size=sm]/card:px-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
      className
    )}
    {...props}
  />;
}
function CardTitle({ className, ...props }) {
  return <div
    data-slot="card-title"
    className={cn(
      "cn-card-title text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
      className
    )}
    {...props}
  />;
}
function CardDescription({ className, ...props }) {
  return <div
    data-slot="card-description"
    className={cn("cn-card-description text-sm text-muted-foreground", className)}
    {...props}
  />;
}
function CardAction({ className, ...props }) {
  return <div
    data-slot="card-action"
    className={cn(
      "cn-card-action col-start-2 row-span-2 row-start-1 self-start justify-self-end",
      className
    )}
    {...props}
  />;
}
function CardContent({ className, ...props }) {
  return <div
    data-slot="card-content"
    className={cn("cn-card-content px-4 group-data-[size=sm]/card:px-3", className)}
    {...props}
  />;
}
function CardFooter({ className, ...props }) {
  return <div
    data-slot="card-footer"
    className={cn(
      "cn-card-footer flex items-center rounded-b-xl border-t bg-muted/50 p-4 group-data-[size=sm]/card:p-3",
      className
    )}
    {...props}
  />;
}
export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
};
