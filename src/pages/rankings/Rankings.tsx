
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Container from '@/components/common/Container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Novel } from '@/types/novels';
import NovelCard from '@/components/novels/NovelCard';
import { Skeleton } from '@/components/ui/skeleton';

interface RankingNovel extends Omit<Novel, 'chapters'> {
  chapterCount: number;
}

const fetchNovels = async (sortBy: string): Promise<RankingNovel[]> => {
  let query = supabase
    .from('novels')
    .select(`
      *,
      author:profiles(username, display_name),
      novel_genres(genres(*)),
      chapters(count)
    `);
  
  switch (sortBy) {
    case 'views':
      query = query.order('views', { ascending: false });
      break;
    case 'rating':
      query = query.order('rating', { ascending: false });
      break;
    case 'bookmarks':
      query = query.order('bookmarks', { ascending: false });
      break;
    default:
      query = query.order('views', { ascending: false });
  }
  
  const { data, error } = await query.limit(20);
  
  if (error) {
    console.error('Error fetching rankings:', error);
    throw error;
  }
  
  return data.map(novel => ({
    id: novel.id,
    title: novel.title,
    author: novel.author.display_name || novel.author.username,
    authorId: novel.author_id,
    coverImage: novel.cover_image || 'https://picsum.photos/800/1200',
    description: novel.description || '',
    rating: novel.rating || 0,
    views: novel.views || 0,
    bookmarks: novel.bookmarks || 0,
    genres: novel.novel_genres?.map((ng: any) => ng.genres.name) || [],
    status: novel.status as 'Ongoing' | 'Completed' | 'Hiatus',
    tags: [],
    createdAt: novel.created_at,
    updatedAt: novel.updated_at,
    chapterCount: novel.chapters?.[0]?.count || 0
  }));
};

const Rankings = () => {
  const [activeTab, setActiveTab] = useState('views');
  
  const { data: novels, isLoading, error } = useQuery({
    queryKey: ['rankings', activeTab],
    queryFn: () => fetchNovels(activeTab),
  });

  return (
    <Container>
      <div className="py-10">
        <h1 className="text-3xl font-bold mb-6">Novel Rankings</h1>
        
        <Tabs defaultValue="views" onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="views">Popular</TabsTrigger>
            <TabsTrigger value="rating">Top Rated</TabsTrigger>
            <TabsTrigger value="bookmarks">Most Bookmarked</TabsTrigger>
          </TabsList>
          
          <TabsContent value="views" className="mt-0">
            <h2 className="text-xl font-semibold mb-4">Most Popular Novels</h2>
            {renderNovelList(novels, isLoading, error)}
          </TabsContent>
          
          <TabsContent value="rating" className="mt-0">
            <h2 className="text-xl font-semibold mb-4">Highest Rated Novels</h2>
            {renderNovelList(novels, isLoading, error)}
          </TabsContent>
          
          <TabsContent value="bookmarks" className="mt-0">
            <h2 className="text-xl font-semibold mb-4">Most Bookmarked Novels</h2>
            {renderNovelList(novels, isLoading, error)}
          </TabsContent>
        </Tabs>
      </div>
    </Container>
  );
};

const renderNovelList = (novels: RankingNovel[] | undefined, isLoading: boolean, error: Error | null) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex">
            <Skeleton className="w-24 h-36 rounded-l-md" />
            <div className="flex-1 p-4 bg-card rounded-r-md border-t border-r border-b">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-3" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-full mb-3" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-semibold text-red-500">Error loading rankings</h3>
        <p className="text-muted-foreground">Please try again later</p>
      </div>
    );
  }
  
  if (!novels || novels.length === 0) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-semibold">No novels found</h3>
        <p className="text-muted-foreground">Check back later for updated rankings</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {novels.map((novel, index) => (
        <div key={novel.id} className="relative">
          {index < 3 && (
            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold z-10">
              {index + 1}
            </div>
          )}
          <NovelCard 
            id={novel.id}
            title={novel.title}
            author={novel.author}
            coverImage={novel.coverImage}
            rating={novel.rating}
            genres={novel.genres}
            views={novel.views}
            bookmarks={novel.bookmarks}
          />
        </div>
      ))}
    </div>
  );
};

export default Rankings;
