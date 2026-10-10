import { Suspense } from "react";
import BreadcrumbComp from "@/components/layout/shared/breadcrumb/breadcrumb-comp";
import BlogDetailData from "@/components/apps/blog/detail";
import { BlogProvider } from "@/context/blog-context/index";
import StyleAwareWrapper from "@/components/shared/StyleAwareWrapper";
import StyleDivider from "@/components/shared/StyleDivider";
import { Skeleton } from "@/components/ui/skeleton";
const metadata = {
  title: "Blog Details"
};
function generateStaticParams() {
  return [{ slug: "garmins-instinct-crossover-is-a-rugged-hybrid-smartwatch" }];
}
const BCrumb = [
  { to: "/", title: "Home" },
  { title: "Blog Detail" }
];
function BlogDetailFallback() {
  return <div className="flex flex-col gap-4 p-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>;
}
const BlogDetail = () => {
  return <BlogProvider>
      <StyleAwareWrapper
    lyraClassName="flex flex-col p-px gap-px bg-border"
  >
        <BreadcrumbComp title="Blog Detail" items={BCrumb} />
        <StyleDivider />
        <Suspense fallback={<BlogDetailFallback />}>
          <BlogDetailData />
        </Suspense>
      </StyleAwareWrapper>
    </BlogProvider>;
};
var page_default = BlogDetail;
export {
  page_default as default,
  generateStaticParams,
  metadata
};
