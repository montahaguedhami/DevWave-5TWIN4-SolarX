import { Chance } from 'chance';
import { uniqueId, random } from 'lodash';
import { sub } from 'date-fns';

const chance = new Chance();

let NotesData = [
  {
    id: 1,
    color: 'primary',
    title:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    datef: '2023-06-03T23:28:56.782Z',
    deleted: false,
  },
  {
    id: 2,
    color: 'destructive',
    title:
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
    datef: '2023-06-02T23:28:56.782Z',
    deleted: false,
  },
  {
    id: 3,
    color: 'chart-4',
    title:
      'consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.',
    datef: '2023-06-01T23:28:56.782Z',
    deleted: false,
  },
  {
    id: 4,
    color: 'chart-3',
    title:
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.',
    datef: '2023-06-03T23:28:56.782Z',
    deleted: false,
  },
];

let TicketData = [
  {
    Id: 1,
    ticketTitle: 'Sed ut perspiciatis unde omnis iste',
    ticketDescription:
      'ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.',
    Status: 'Closed',
    Label: 'error',
    thumb: '/images/profile/user-10.png',
    AgentName: 'Liam',
    Date: chance.date(),
    deleted: false,
  },
  {
    Id: 2,
    ticketTitle: 'Consequuntur magni dolores eos qui ratione',
    ticketDescription:
      'ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.',
    Status: 'Pending',
    Label: 'warning',
    thumb: '/images/profile/user-2.png',
    AgentName: 'Steve',
    Date: chance.date(),
    deleted: false,
  },
  {
    Id: 3,
    ticketTitle: 'Exercitationem ullam corporis',
    ticketDescription:
      'ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.',
    Status: 'Open',
    Label: 'success',
    thumb: '/images/profile/user-3.png',
    AgentName: 'Jack',
    Date: chance.date(),
    deleted: false,
  },
];

const BlogComment = [
  {
    id: uniqueId('#comm_'),
    profile: {
      id: uniqueId(),
      avatar: '/images/profile/user-5.png',
      name: chance.name(),
    },
    time: chance.date(),
    comment: chance.paragraph({ sentences: 2 }),
    replies: [],
  },
];

let BlogPost = [
  {
    id: '1',
    title: 'Garmins Instinct Crossover is a rugged hybrid smartwatch',
    content: chance.paragraph({ sentences: 2 }),
    coverImg: '/images/blog/blog-img2.png',
    createdAt: sub(new Date(), { days: 8, hours: 6, minutes: 20 }),
    view: random(9999),
    share: random(9999),
    category: 'Gadget',
    featured: false,
    author: {
      id: uniqueId(),
      avatar: '/images/profile/user-5.png',
      name: chance.name(),
    },
    comments: BlogComment,
    published: true,
  },
  {
    id: '2',
    title: 'After Twitter Staff Cuts, Survivors Face Radio Silence',
    content: chance.paragraph({ sentences: 2 }),
    coverImg: '/images/blog/blog-img1.png',
    createdAt: sub(new Date(), { days: 7, hours: 3, minutes: 20 }),
    view: random(9999),
    share: random(9999),
    category: 'Lifestyle',
    featured: false,
    author: {
      id: uniqueId(),
      avatar: '/images/profile/user-2.png',
      name: chance.name(),
    },
    comments: BlogComment,
    published: true,
  },
];

const mockPosts = [
  {
    id: "1",
    profile: {
      id: "2",
      avatar: "/images/profile/user-10.png",
      name: 'Macky Dawn',
      time: '15 min ago',
    },
    data: {
      content: chance.paragraph({ sentences: 2 }),
      images: [
        {
          img: '/images/products/advance-macbook.jpg',
          featured: true,
        },
      ],
      likes: {
        like: true,
        value: 67,
      },
      comments: [],
    },
  },
];

export const getFetcher = async (url) => {
  if (url === '/api/notes') {
    return { status: 200, msg: 'Success', data: NotesData };
  }
  if (url === '/api/ticket') {
    return { status: 200, msg: 'Success', data: TicketData };
  }
  if (url === '/api/blog') {
    return { status: 200, data: BlogPost, msg: 'success' };
  }
  if (url.includes('/api/userprofile')) {
    return { status: 200, data: mockPosts, msg: 'success' };
  }
  try {
    const res = await fetch(url, { headers: { browserrefreshed: 'false' } });
    if (!res.ok) throw new Error('Failed to fetch data');
    return await res.json();
  } catch (err) {
    return { status: 200, data: [], msg: 'Fallback' };
  }
};

export const postFetcher = async (url, arg) => {
  if (url === '/api/notes') {
    const newNote = {
      id: NotesData.length + 1,
      title: arg.title || arg,
      color: arg.color || 'primary',
      deleted: false,
      datef: new Date().toISOString(),
    };
    NotesData.push(newNote);
    return { status: 200, msg: 'Success', data: NotesData };
  }
  if (url === '/api/ticket') {
    TicketData.push(arg);
    return { status: 200, msg: 'Success', data: TicketData };
  }
  if (url === '/api/blog') {
    if (arg && arg.postId) {
      const post = BlogPost.find((x) => x.id === arg.postId);
      if (post) {
        post.comments = [arg.comment, ...(post.comments || [])];
      }
    }
    return { status: 200, data: { posts: [...BlogPost] }, msg: 'success' };
  }
  return { status: 200, msg: 'Success', data: [] };
};

export const putFetcher = async (url, arg) => {
  if (url === '/api/notes') {
    const index = NotesData.findIndex((n) => n.id === arg.id);
    if (index !== -1) {
      NotesData[index] = { ...NotesData[index], title: arg.title, color: arg.color };
    }
    return { status: 200, msg: 'Success', data: NotesData };
  }
  return { status: 200, msg: 'Success', data: [] };
};

export const deleteFetcher = async (url, arg) => {
  if (url === '/api/notes') {
    NotesData = NotesData.filter((n) => n.id !== arg.id);
    return { status: 200, msg: 'Success', data: NotesData };
  }
  if (url === '/api/ticket') {
    TicketData = TicketData.filter((t) => t.Id !== arg.id);
    return { status: 200, msg: 'Success', data: TicketData };
  }
  return { status: 200, msg: 'Success', data: [] };
};

export const patchFetcher = async (url, arg) => {
  return { status: 200, msg: 'Success', data: [] };
};
