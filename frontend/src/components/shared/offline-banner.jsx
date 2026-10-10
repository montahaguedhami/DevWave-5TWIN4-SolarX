import { useEffect, useState } from "react";
function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  if (!isOffline) return null;
  return <div
    role="status"
    aria-live="polite"
    className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-amber-500/95 px-4 py-2 text-center text-sm font-medium text-amber-950 shadow-lg"
  >
      You&apos;re offline. Retrying when you reconnect.
    </div>;
}
export {
  OfflineBanner
};
