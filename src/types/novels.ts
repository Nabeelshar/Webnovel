
export interface Novel {
  id: string;
  title: string;
  description: string;
  cover_image?: string;
  coverImage?: string; 
  author: string;
  author_id?: string;
  authorId?: string;
  rating: number;
  views: number;
  bookmarks: number;
  chapters?: Chapter[];
  genres?: string[];
  status: 'ongoing' | 'completed' | 'hiatus' | 'Ongoing' | 'Completed' | 'Hiatus';
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  profiles?: {
    username?: string;
    display_name?: string;
  };
  // For compatibility with both naming conventions
  is_premium?: boolean;
  isPremium?: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  chapterNumber: number;
  chapter_number?: number;
  content?: string;
  views?: number;
  createdAt?: string;
  created_at?: string;
  isPremium?: boolean;
  is_premium?: boolean;
  coin_cost?: number;
  novel_id?: string;
  // Added reference_id for transactions
  reference_id?: string;
}
