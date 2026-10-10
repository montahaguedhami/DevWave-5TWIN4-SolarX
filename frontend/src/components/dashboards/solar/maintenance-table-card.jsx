import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Wrench, Calendar } from "lucide-react";
import { mockDashboardData } from "@/lib/mock-data";
function MaintenanceTableCard() {
  const { maintenance } = mockDashboardData;
  return <Card variant="glass" expandable className="col-span-12 shadow-xl">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
        <div>
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[var(--primary)]" />
            <span>Maintenance History & Schedule</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground/80">
            System service logs and certified technician visits
          </CardDescription>
        </div>

        {
    /* Date highlights */
  }
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-card/50 px-3 py-1.5 rounded-xl border border-border text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>Last Maintenance: <strong className="text-foreground font-mono">{maintenance.lastDate}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 bg-[var(--primary)]/15 px-3 py-1.5 rounded-xl border border-[var(--primary)]/30 text-[var(--primary)]">
            <Calendar className="w-3.5 h-3.5" />
            <span>Next Scheduled: <strong className="font-mono font-bold">{maintenance.nextDate}</strong></span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {
    /* Existing shadcn Table wrapper */
  }
        <Table>
          <TableHeader className="bg-card/5 border-b border-border">
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cost</TableHead>
              <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Technician</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {maintenance.records.map((rec) => <TableRow key={rec.id} className="border-b border-border hover:bg-card/50 transition-colors">
                <TableCell className="text-xs font-mono font-bold text-foreground py-3">
                  {rec.date}
                </TableCell>
                <TableCell className="text-xs font-medium text-muted-foreground py-3">
                  {rec.description}
                </TableCell>
                <TableCell className="text-xs font-mono font-bold text-[var(--primary)] py-3">
                  {rec.cost}
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-6 w-6 border border-border">
                      <AvatarImage src={rec.technicianAvatar} alt={rec.technicianName} />
                      <AvatarFallback className="bg-[var(--primary)] text-primary-foreground text-[10px] font-bold">
                        {rec.technicianName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-semibold text-foreground">{rec.technicianName}</span>
                  </div>
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </CardContent>
    </Card>;
}
export {
  MaintenanceTableCard
};
