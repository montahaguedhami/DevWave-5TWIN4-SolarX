import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings, User, Bell, Zap } from "lucide-react";
import { mockDashboardData } from "@/lib/mock-data";
function SettingsPage() {
  return <div className="space-y-6 pb-8 max-w-5xl">
      {
    /* Header */
  }
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-card/50 text-[var(--primary)] border border-border">
            <Settings className="w-5 h-5" />
          </div>
          Account & System Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage system preferences, notification triggers, and utility rate configurations.
        </p>
      </div>

      {
    /* User Profile Settings */
  }
      <Card variant="glass" expandable>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-[var(--primary)]" />
            <span>Profile Information</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Account identity and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Full Name</Label>
              <Input defaultValue={mockDashboardData.user.name} className="text-sm bg-card/50 border-border text-foreground" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Email Address</Label>
              <Input defaultValue={mockDashboardData.user.email} className="text-sm bg-card/50 border-border text-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      {
    /* Utility Rate & Solar Config */
  }
      <Card variant="glass" expandable>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Zap className="w-4 h-4 text-[var(--primary)]" />
            <span>Utility Rate & Grid Tariff Settings</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Configure utility rate parameters for financial ROI calculation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Base Electricity Tariff (DT / kWh)</Label>
              <Input defaultValue="0.34" className="font-mono text-sm bg-card/50 border-border text-foreground" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Feed-in Export Tariff (DT / kWh)</Label>
              <Input defaultValue="0.22" className="font-mono text-sm bg-card/50 border-border text-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      {
    /* Notifications & AI Preferences */
  }
      <Card variant="glass" expandable>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Bell className="w-4 h-4 text-[var(--primary)]" />
            <span>Smart Automation & Alert Triggers</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Configure automated system actions and notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-card/50">
            <div>
              <div className="font-semibold text-foreground text-xs sm:text-sm">Smart AI Recommendations</div>
              <div className="text-xs text-muted-foreground">Receive real-time peak solar load dispatch suggestions</div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-card/50">
            <div>
              <div className="font-semibold text-foreground text-xs sm:text-sm">Battery Thermal & Health Alerts</div>
              <div className="text-xs text-muted-foreground">Instant notifications if battery temperature or SoC exceeds limits</div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl border border-border bg-card/50">
            <div>
              <div className="font-semibold text-foreground text-xs sm:text-sm">Weekly Financial ROI Reports</div>
              <div className="text-xs text-muted-foreground">Receive automated weekly savings summaries via email</div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="pt-2 flex justify-end">
            <Button className="bg-[var(--primary)] hover:bg-[var(--primary)] text-primary-foreground font-bold text-xs">
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>;
}
export {
  SettingsPage as default
};
