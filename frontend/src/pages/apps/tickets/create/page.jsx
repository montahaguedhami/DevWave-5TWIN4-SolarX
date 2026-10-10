import CreateTicketForm from "@/components/apps/tickets/create-ticketform";
import { TicketProvider } from "@/context/ticket-context/index";
import BreadcrumbComp from "@/components/layout/shared/breadcrumb/breadcrumb-comp";
import StyleAwareWrapper from "@/components/shared/StyleAwareWrapper";
import StyleDivider from "@/components/shared/StyleDivider";
const metadata = {
  title: "Ticket App"
};
const BCrumb = [
  { to: "/", title: "Home" },
  { title: "Tickets" }
];
const CreateTickets = () => {
  return <TicketProvider>
      <StyleAwareWrapper
    lyraClassName="flex flex-col p-px gap-px bg-border"
  >
        <BreadcrumbComp title="Tickets App" items={BCrumb} />
        <StyleDivider />
        <CreateTicketForm />
      </StyleAwareWrapper>
    </TicketProvider>;
};
var page_default = CreateTickets;
export {
  page_default as default,
  metadata
};
