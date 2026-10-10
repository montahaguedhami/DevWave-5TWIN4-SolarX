import { Button } from "@/components/ui/button";
function RouteErrorFallback({
  title = "Something went wrong",
  error,
  retry = () => window.location.reload(),
  children
}) {
  if (children) {
    return children;
  }

  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "An unexpected error occurred.";
  return <div className="flex min-h-[24vh] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card p-6 text-center">
      <h2 className="text-lg font-semibold text-foreground">
        {title}
      </h2>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      <Button type="button" variant="outline" onClick={() => retry()}>
        Try again
      </Button>
    </div>;
}
var route_error_boundary_default = RouteErrorFallback;
export {
  route_error_boundary_default as default
};
