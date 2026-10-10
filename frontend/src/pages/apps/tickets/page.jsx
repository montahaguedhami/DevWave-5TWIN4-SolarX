import TicketsApp from "@/components/apps/tickets";
import BreadcrumbComp from "../../layout/shared/breadcrumb/breadcrumb-comp";
import StyleAwareWrapper from "@/components/shared/StyleAwareWrapper";
import StyleDivider from "@/components/shared/StyleDivider";
const metadata = {
  title: "Ticket App"
};
const BCrumb = [
  { to: "/", title: "Home" },
  { title: "Tickets" }
];
const Tickets = () => {
  return <StyleAwareWrapper
    lyraClassName="flex flex-col p-px gap-px bg-border"
  >
      <BreadcrumbComp title="Tickets App" items={BCrumb} />
      <StyleDivider />
      <TicketsApp />
    </StyleAwareWrapper>;
};
var page_default = Tickets;
export {
  page_default as default,
  metadata
};
