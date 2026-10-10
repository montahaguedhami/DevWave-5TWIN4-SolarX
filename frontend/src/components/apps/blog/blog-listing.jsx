import { useContext } from "react";
import { orderBy } from "lodash";
import { BlogContext } from "../../../context/blog-context";
import BlogFeaturedCard from "./blog-featuredcard";
import BlogCard from "./blog-card";
const BlogListing = () => {
  const { posts, sortBy } = useContext(BlogContext);
  const filterBlogs = (posts2, sortBy2) => {
    let filteredPosts = [...posts2];
    if (sortBy2 === "newest") {
      filteredPosts = orderBy(filteredPosts, ["createdAt"], ["desc"]);
    } else if (sortBy2 === "oldest") {
      filteredPosts = orderBy(filteredPosts, ["createdAt"], ["asc"]);
    } else if (sortBy2 === "popular") {
      filteredPosts = orderBy(filteredPosts, ["view"], ["desc"]);
    }
    return filteredPosts.filter((post) => !post.featured);
  };
  const filterFeaturedPosts = (posts2) => {
    return posts2.filter((post) => post.featured);
  };
  const blogPosts = filterBlogs(posts, sortBy);
  const featuredPosts = filterFeaturedPosts(posts);
  return <div className="grid grid-cols-12 gap-px">
      {featuredPosts.map((post, index) => {
    return <BlogFeaturedCard index={index} post={post} key={post.id} />;
  })}
      {blogPosts.map((post) => {
    return <BlogCard post={post} key={post.id} />;
  })}
    </div>;
};
var stdin_default = BlogListing;
export {
  stdin_default as default
};
