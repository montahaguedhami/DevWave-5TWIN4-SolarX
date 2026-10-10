import BreadcrumbComp from "../../layout/shared/breadcrumb/breadcrumb-comp";
import IconifyIcon from "@/components/icons/iconify-icons";
import StyleAwareWrapper from "@/components/shared/StyleAwareWrapper";
import StyleDivider from "@/components/shared/StyleDivider";
const metadata = {
  title: "Iconify Tabler Icons"
};
const BCrumb = [
  {
    to: "/",
    title: "Home"
  },
  {
    title: "Iconify Icons"
  }
];
const page = () => {
  return <StyleAwareWrapper
    lyraClassName="flex flex-col p-px gap-px bg-border"
  >
      <BreadcrumbComp title='Iconify Icons' items={BCrumb} />
      <StyleDivider wrapperClassName="col-span-12" />
      <IconifyIcon />
    </StyleAwareWrapper>;
};
var page_default = page;
export {
  page_default as default,
  metadata
};
