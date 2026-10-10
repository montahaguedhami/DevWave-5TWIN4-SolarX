import { useEffect } from "react";
import { Button } from "@/components/ui/button";
function DashboardError({
  error,
  retry = () => window.location.reload()
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-2xl font-semibold text-foreground">Something went wrong</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || "An unexpected error occurred while loading this page."}
      </p>
      <Button type="button" onClick={() => retry()}>
        Try again
      </Button>
    </div>;
}
export {
  DashboardError as default
};
