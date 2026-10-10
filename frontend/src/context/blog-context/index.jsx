import {
  createContext,
  useState,
  useEffect
} from "react";
import { getFetcher } from "@/services/global-fetcher";
import useSWR from "swr";
const BlogContext = createContext({
  posts: [],
  sortBy: "newest",
  selectedPost: null,
  isLoading: true,
  setPosts: () => {
  },
  setSortBy: () => {
  },
  setSelectedPost: () => {
  },
  setLoading: () => {
  },
  addComment: () => {
  },
  fetchPostById: (id) => {
  },
  error: null
});
const BlogProvider = ({
  children
}) => {
  const [posts, setPosts] = useState([]);
  const [sortBy, setSortBy] = useState("newest");
  const [selectedPost, setSelectedPost] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {
    data: postsData,
    isLoading: isPostsLoading,
    error: postsError
  } = useSWR("/api/blog", getFetcher);
  useEffect(() => {
    if (postsData) {
      setPosts(postsData.data);
      setLoading(isPostsLoading);
    } else if (postsError) {
      setError(postsError);
      setLoading(isPostsLoading);
    } else {
      setLoading(isPostsLoading);
    }
  }, [postsData, postsError]);
  const addComment = (postId, newComment) => {
    setPosts(
      (prevPosts) => prevPosts.map(
        (post) => post.id === postId ? { ...post, comments: [newComment, ...post.comments || []] } : post
      )
    );
  };
  const fetchPostById = (id) => {
    const {
      data: specificPostData,
      isLoading: isSpecificPostLoading,
      error: isSpecificPostError
    } = useSWR(`/api/blog/${id}`, getFetcher);
    if (specificPostData) {
      setLoading(isSpecificPostLoading);
      setSelectedPost(specificPostData);
    } else if (isSpecificPostError) {
      setError(isSpecificPostError);
      setLoading(isSpecificPostLoading);
    } else {
      setLoading(isSpecificPostLoading);
    }
  };
  const value = {
    posts,
    sortBy,
    selectedPost,
    isLoading,
    setPosts,
    setSortBy,
    setSelectedPost,
    setLoading,
    addComment,
    fetchPostById,
    error
  };
  return <BlogContext.Provider value={value}>{children}</BlogContext.Provider>;
};
export {
  BlogContext,
  BlogProvider
};
