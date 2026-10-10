import { Card } from "@/components/ui/card";
import TicketFilter from "@/components/apps/tickets/ticket-filter";
import TicketListing from "@/components/apps/tickets/ticket-listing";
import { TicketProvider } from "@/context/ticket-context/index";
const TicketsApp = () => {
  return <>
      <TicketProvider>
        <Card className="p-6">
          <TicketFilter />
          <TicketListing />
        </Card>
      </TicketProvider>
    </>;
};
var stdin_default = TicketsApp;
export {
  stdin_default as default
};
