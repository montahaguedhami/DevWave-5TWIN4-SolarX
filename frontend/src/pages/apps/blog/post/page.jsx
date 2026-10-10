import BreadcrumbComp from "@/components/layout/shared/breadcrumb/breadcrumb-comp";
import BlogPost from "@/components/apps/blog/blog-post";
import StyleAwareWrapper from "@/components/shared/StyleAwareWrapper";
import StyleDivider from "@/components/shared/StyleDivider";
const BCrumb = [
  { to: "/", title: "Home" },
  { title: "Blog app" }
];
const metadata = {
  title: "Blog Post"
};
const Blog = () => {
  return <StyleAwareWrapper
    lyraClassName="flex flex-col p-px gap-px bg-border"
  >
      <BreadcrumbComp title="Blog app" items={BCrumb} />
      <StyleDivider />
      <BlogPost />
    </StyleAwareWrapper>;
};
var page_default = Blog;
export {
  page_default as default,
  metadata
};
