import BreadcrumbComp from "@/components/layout/shared/breadcrumb/breadcrumb-comp";
import { BlogProvider } from "@/context/blog-context/index";
import CategoryTags from "@/components/apps/blog/blogedit/category-tags";
import GeneralDetail from "@/components/apps/blog/blogedit/general-detail";
import { Button } from "@/components/ui/button";
import PostDate from "@/components/apps/blog/blogedit/post-date";
import Media from "@/components/apps/blog/blogedit/medias";
import Status from "@/components/apps/blog/blogedit/blog-status";
import StyleAwareWrapper from "@/components/shared/StyleAwareWrapper";
import StyleDivider from "@/components/shared/StyleDivider";
const metadata = {
  title: "Blog Edit"
};
const BCrumb = [
  { to: "/", title: "Home" },
  { title: "Blog Edit" }
];
const BlogEdit = () => {
  return <BlogProvider>
      <StyleAwareWrapper
    lyraClassName="flex flex-col p-px gap-px bg-border"
  >
        <BreadcrumbComp title="Blog Edit" items={BCrumb} />
        <StyleDivider />
        <div className="grid grid-cols-12 gap-px">
          <div className="lg:col-span-8 col-span-12">
            <div className="flex flex-col gap-px">
              <GeneralDetail />
              <Media />
            </div>
          </div>
          <div className="lg:col-span-4 col-span-12 self-stretch">
            <div className="flex flex-col gap-px h-full">
              <Status />
              <CategoryTags />
              <div className="flex-1 flex flex-col">
                <PostDate />
              </div>
            </div>
          </div>
          <div className="col-span-12 bg-background">
            <div className="flex gap-3 p-4">
              <Button className="sm:mb-0 mb-3 w-fit">Save changes</Button>
              <Button variant={"destructive"}>Cancel</Button>
            </div>
          </div>
        </div>
      </StyleAwareWrapper>
    </BlogProvider>;
};
var page_default = BlogEdit;
export {
  page_default as default,
  metadata
};
