  avatar: string;
  name: string;
  time: string;
};

  value: number;
};

  featured?: boolean;
  title?: string;
};

  comment?: string;
  likes?: Likes;
  video?: string;
  replies?: Reply[];
};

  profile?: ProfileType;
  data: CommentDataType;
};

  profile: ProfileType;
  data?: CommentDataType;
};

  content: string;
  images: PostImageType[];
  video?: string;
  likes: Likes;
  comments?: Comment[];
};

  profile: ProfileType;
  data: PostDataType;
};

  role: string;
  avatar: string;
  coverImage: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
};
