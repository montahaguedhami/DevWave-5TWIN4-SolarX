import BreadcrumbComp from "@/components/layout/shared/breadcrumb/breadcrumb-comp";
import { BlogProvider } from "@/context/blog-context/index";
import ManageBlogTable from "@/components/apps/blog/blogtable/manage-blogtable";
import StyleAwareWrapper from "@/components/shared/StyleAwareWrapper";
import StyleDivider from "@/components/shared/StyleDivider";
const metadata = {
  title: "Manage Blog "
};
const BCrumb = [
  { to: "/", title: "Home" },
  { title: "Manage Blog" }
];
const MangeBlog = () => {
  return <BlogProvider>
      <StyleAwareWrapper
    lyraClassName="flex flex-col p-px gap-px bg-border"
  >
        <BreadcrumbComp title=" Manage Blog" items={BCrumb} />
        <StyleDivider />
        <ManageBlogTable />
      </StyleAwareWrapper>
    </BlogProvider>;
};
var page_default = MangeBlog;
export {
  page_default as default,
  metadata
};
