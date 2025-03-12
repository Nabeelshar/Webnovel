
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Container from '@/components/common/Container';
import NovelCard from '@/components/novels/NovelCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const fetchNovels = async () => {
  const { data, error } = await supabase
    .from('novels')
    .select(`
      *,
      author:profiles(username, display_name),
      novel_genres(genres(*)),
      chapters(count)
    `)
    .limit(30);

  if (error) {
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
    status: novel.status,
    chapterCount: novel.chapters?.[0]?.count || 0
  }));
};

const Browse = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const { data: novels, isLoading, error } = useQuery({
    queryKey: ['browsedNovels'],
    queryFn: fetchNovels,
  });

  const filteredNovels = novels?.filter(novel => 
    novel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    novel.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    novel.genres.some(genre => genre.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Container>
      <div className="py-10">
        <h1 className="text-3xl font-bold mb-6">Browse Novels</h1>
        
        <div className="relative mb-8">
          <Input
            placeholder="Search by title, author, or genre"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        </div>
        
        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Novels</TabsTrigger>
            <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            {renderNovelGrid(filteredNovels, isLoading, error)}
          </TabsContent>
          
          <TabsContent value="ongoing" className="mt-0">
            {renderNovelGrid(
              filteredNovels?.filter(novel => novel.status?.toLowerCase() === 'ongoing'),
              isLoading,
              error
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="mt-0">
            {renderNovelGrid(
              filteredNovels?.filter(novel => novel.status?.toLowerCase() === 'completed'),
              isLoading,
              error
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Container>
  );
};

const renderNovelGrid = (novels: any[] | undefined, isLoading: boolean, error: Error | null) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
          <div key={i} className="flex flex-col space-y-2">
            <Skeleton className="w-full h-64 rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex space-x-2">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium text-red-500">Error loading novels</h3>
        <p className="text-muted-foreground mt-2">Please try again later</p>
      </div>
    );
  }
  
  if (!novels || novels.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium">No novels found</h3>
        <p className="text-muted-foreground mt-2">Try a different search or check back later</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {novels.map(novel => (
        <NovelCard
          key={novel.id}
          id={novel.id}
          title={novel.title}
          author={novel.author}
          coverImage={novel.coverImage}
          rating={novel.rating}
          genres={novel.genres}
          views={novel.views}
          bookmarks={novel.bookmarks}
        />
      ))}
    </div>
  );
};

export default Browse;
