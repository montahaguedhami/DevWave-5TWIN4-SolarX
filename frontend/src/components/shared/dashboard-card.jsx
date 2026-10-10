import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
function DashboardCard({
  className,
  ...props
}) {
  return <Card
    className={cn("rounded-none bg-background shadow-none ring-0 h-full", className)}
    {...props}
  />;
}
export {
  DashboardCard
};
