
// Mock data for the NovelHaven app

export interface Novel {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  description: string;
  rating: number;
  views: number;
  bookmarks: number;
  chapters: Chapter[];
  genres: string[];
  status: 'Ongoing' | 'Completed' | 'Hiatus';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  title: string;
  chapterNumber: number;
  content: string;
  views: number;
  createdAt: string;
  isPremium: boolean;
}

// Generic lorem ipsum paragraph generator
const generateParagraphs = (count: number): string => {
  const paragraphs = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl vel ultricies lacinia, nisl nisl aliquam nisl, nec aliquam nisl nisl nec nisl. Sed euismod, nisl vel ultricies lacinia, nisl nisl aliquam nisl, nec aliquam nisl nisl nec nisl.",
    "Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula. Curabitur non nulla sit amet nisl tempus convallis quis ac lectus. Pellentesque in ipsum id orci porta dapibus. Quisque velit nisi, pretium ut lacinia in, elementum id enim.",
    "Curabitur aliquet quam id dui posuere blandit. Nulla quis lorem ut libero malesuada feugiat. Nulla porttitor accumsan tincidunt. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula.",
    "Praesent sapien massa, convallis a pellentesque nec, egestas non nisi. Curabitur arcu erat, accumsan id imperdiet et, porttitor at sem. Donec sollicitudin molestie malesuada. Vivamus suscipit tortor eget felis porttitor volutpat.",
    "Nulla porttitor accumsan tincidunt. Curabitur aliquet quam id dui posuere blandit. Vestibulum ac diam sit amet quam vehicula elementum sed sit amet dui. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus.",
    "Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus. Nulla quis lorem ut libero malesuada feugiat. Praesent sapien massa, convallis a pellentesque nec, egestas non nisi. Curabitur non nulla sit amet nisl tempus convallis quis ac lectus.",
    "Sed porttitor lectus nibh. Nulla quis lorem ut libero malesuada feugiat. Donec rutrum congue leo eget malesuada. Pellentesque in ipsum id orci porta dapibus.",
    "Donec rutrum congue leo eget malesuada. Nulla quis lorem ut libero malesuada feugiat. Curabitur arcu erat, accumsan id imperdiet et, porttitor at sem. Praesent sapien massa, convallis a pellentesque nec, egestas non nisi.",
    "Praesent sapien massa, convallis a pellentesque nec, egestas non nisi. Curabitur non nulla sit amet nisl tempus convallis quis ac lectus. Vivamus suscipit tortor eget felis porttitor volutpat. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula.",
    "Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus. Nulla quis lorem ut libero malesuada feugiat. Curabitur arcu erat, accumsan id imperdiet et, porttitor at sem. Praesent sapien massa, convallis a pellentesque nec, egestas non nisi."
  ];
  
  const selected = Array.from({ length: count }, () => 
    paragraphs[Math.floor(Math.random() * paragraphs.length)]
  );
  
  return selected.join('\n\n');
};

export const novels: Novel[] = [
  {
    id: "1bec2c1d-b240-46f9-a00e-72494ce70134",
    title: "The Crystal Chronicles",
    author: "Elena Blackwood",
    coverImage: "https://picsum.photos/800/1200",
    description: "In a world where crystals hold the key to magical powers, young apprentice Aria must navigate political intrigue and ancient prophecies to save her realm from impending darkness.",
    rating: 4.7,
    views: 152890,
    bookmarks: 23567,
    genres: ["Fantasy", "Adventure", "Romance"],
    status: "Ongoing",
    tags: ["Magic", "Politics", "Prophecy", "Coming of Age"],
    createdAt: "2023-08-15T10:30:00Z",
    updatedAt: "2024-02-20T15:45:00Z",
    chapters: [
      {
        id: "e0f3dc39-f96f-4011-a758-e62cb61279eb",
        title: "The Awakening",
        chapterNumber: 1,
        content: generateParagraphs(10),
        views: 152890,
        createdAt: "2023-08-15T10:30:00Z",
        isPremium: false
      },
      {
        id: "7d9a7b83-7203-4ee4-8825-8491277d0704",
        title: "Shadows of the Past",
        chapterNumber: 2,
        content: generateParagraphs(12),
        views: 148234,
        createdAt: "2023-08-22T14:20:00Z",
        isPremium: false
      },
      {
        id: "c1f5d831-e14c-4012-a869-989d8e8123a7",
        title: "The First Trial",
        chapterNumber: 3,
        content: generateParagraphs(11),
        views: 142567,
        createdAt: "2023-08-29T09:15:00Z",
        isPremium: true
      }
    ]
  },
  // ... Add more novels as needed
];

export const getNovel = (id: string): Novel | undefined => {
  return novels.find(novel => novel.id === id);
};

export const getChapter = (novelId: string, chapterId: string): (Chapter & { novel: Novel }) | undefined => {
  const novel = novels.find(n => n.id === novelId);
  if (!novel) return undefined;
  
  const chapter = novel.chapters.find(c => c.id === chapterId);
  if (!chapter) return undefined;
  
  return { ...chapter, novel };
};

export const getFeaturedNovel = (): Novel => {
  return novels[0]; // For now, just return the first novel as featured
};

export const getRelatedNovels = (novelId: string, limit = 4): Novel[] => {
  return novels
    .filter(novel => novel.id !== novelId)
    .slice(0, limit);
};

