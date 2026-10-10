import { BlogProvider } from "@/context/blog-context/index";
import BlogListing from "./blog-listing";
const BlogPost = () => {
  return <>
      <BlogProvider>
        <BlogListing />
      </BlogProvider>
    </>;
};
var stdin_default = BlogPost;
export {
  stdin_default as default
};
