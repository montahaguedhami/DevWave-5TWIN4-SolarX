import NotesApp from "@/components/apps/notes";
import BreadcrumbComp from "../../layout/shared/breadcrumb/breadcrumb-comp";
import StyleAwareWrapper from "@/components/shared/StyleAwareWrapper";
import StyleDivider from "@/components/shared/StyleDivider";
const metadata = {
  title: "Notes App"
};
const BCrumb = [
  { to: "/", title: "Home" },
  { title: "Notes" }
];
const Notes = () => {
  return <StyleAwareWrapper
    lyraClassName="flex flex-col p-px gap-px bg-border"
  >
      <BreadcrumbComp title="Notes app" items={BCrumb} />
      <StyleDivider />
      <NotesApp />
    </StyleAwareWrapper>;
};
var page_default = Notes;
export {
  page_default as default,
  metadata
};
