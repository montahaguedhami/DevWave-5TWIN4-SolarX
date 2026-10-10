import GeneralDetail from "@/components/apps/blog/blogadd/general-detail";
import CategoryTags from "@/components/apps/blog/blogadd/category-tags";
import PostDate from "@/components/apps/blog/blogadd/post-date";
import { Button } from "@/components/ui/button";
import BreadcrumbComp from "@/components/layout/shared/breadcrumb/breadcrumb-comp";
import Media from "@/components/apps/blog/blogadd/medias";
import Status from "@/components/apps/blog/blogadd/blog-status";
import StyleAwareWrapper from "@/components/shared/StyleAwareWrapper";
import StyleDivider from "@/components/shared/StyleDivider";
const metadata = {
  title: "Blog Create"
};
const BCrumb = [
  { to: "/", title: "Home" },
  { title: "Blog Create" }
];
const BlogCreate = () => {
  return <StyleAwareWrapper
    lyraClassName="flex flex-col p-px gap-px bg-border"
  >
      <BreadcrumbComp title="Blog Create" items={BCrumb} />
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
        <div className="col-span-12 bg-background p-4">
          <div className="flex gap-3">
            <Button className="sm:mb-0 mb-3 w-fit">Add Blog</Button>
            <Button variant={"destructive"}>Cancel</Button>
          </div>
        </div>
      </div>
    </StyleAwareWrapper>;
};
var page_default = BlogCreate;
export {
  page_default as default,
  metadata
};
