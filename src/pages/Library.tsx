
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Container from '@/components/common/Container';
import NovelCard from '@/components/novels/NovelCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { BookmarkX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const fetchBookmarkedNovels = async (userId: string) => {
  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      novel_id,
      novels!inner(
        *,
        author:profiles(username, display_name),
        novel_genres(genres(*))
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching bookmarks:', error);
    throw error;
  }

  return data.map(bookmark => ({
    id: bookmark.novels.id,
    title: bookmark.novels.title,
    author: bookmark.novels.author.display_name || bookmark.novels.author.username,
    authorId: bookmark.novels.author_id,
    coverImage: bookmark.novels.cover_image || 'https://picsum.photos/800/1200',
    description: bookmark.novels.description || '',
    rating: bookmark.novels.rating || 0,
    views: bookmark.novels.views || 0,
    bookmarks: bookmark.novels.bookmarks || 0,
    genres: bookmark.novels.novel_genres?.map((ng: any) => ng.genres.name) || [],
    status: bookmark.novels.status
  }));
};

const fetchReadingHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from('reading_history')
    .select(`
      id,
      chapter_id,
      novel_id,
      read_at,
      novels:novels(
        *,
        author:profiles(username, display_name),
        novel_genres(genres(*))
      ),
      chapters:chapters(
        chapter_number,
        title
      )
    `)
    .eq('user_id', userId)
    .order('read_at', { ascending: false });

  if (error) {
    console.error('Error fetching reading history:', error);
    throw error;
  }

  // Get unique novels from history (latest read first)
  const uniqueNovels = new Map();
  data.forEach(item => {
    if (!uniqueNovels.has(item.novel_id)) {
      uniqueNovels.set(item.novel_id, {
        id: item.novels.id,
        title: item.novels.title,
        author: item.novels.author.display_name || item.novels.author.username,
        authorId: item.novels.author_id,
        coverImage: item.novels.cover_image || 'https://picsum.photos/800/1200',
        description: item.novels.description || '',
        rating: item.novels.rating || 0,
        views: item.novels.views || 0,
        bookmarks: item.novels.bookmarks || 0,
        genres: item.novels.novel_genres?.map((ng: any) => ng.genres.name) || [],
        status: item.novels.status,
        lastReadChapter: {
          number: item.chapters.chapter_number,
          title: item.chapters.title
        },
        lastReadAt: item.read_at
      });
    }
  });

  return Array.from(uniqueNovels.values());
};

const Library = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { 
    data: bookmarkedNovels, 
    isLoading: isLoadingBookmarks, 
    error: bookmarksError, 
    refetch: refetchBookmarks 
  } = useQuery({
    queryKey: ['bookmarkedNovels', user?.id],
    queryFn: () => user ? fetchBookmarkedNovels(user.id) : Promise.resolve([]),
    enabled: !!user,
  });

  const { 
    data: readingHistory, 
    isLoading: isLoadingHistory, 
    error: historyError,
    refetch: refetchHistory
  } = useQuery({
    queryKey: ['readingHistory', user?.id],
    queryFn: () => user ? fetchReadingHistory(user.id) : Promise.resolve([]),
    enabled: !!user,
  });

  React.useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      toast({
        title: "Authentication required",
        description: "You need to be logged in to view your library",
        variant: "destructive"
      });
    }
  }, [user, navigate, toast]);

  const removeBookmark = async (novelId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('novel_id', novelId);
        
      if (error) throw error;
      
      toast({
        title: "Removed from library",
        description: "The novel has been removed from your library",
      });
      
      refetchBookmarks();
    } catch (error) {
      console.error('Error removing bookmark:', error);
      toast({
        title: "Error",
        description: "There was an error removing the novel from your library",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <Container>
      <div className="py-10">
        <h1 className="text-3xl font-bold mb-6">My Library</h1>
        
        <Tabs defaultValue="bookmarked">
          <TabsList className="mb-6">
            <TabsTrigger value="bookmarked">Bookmarked</TabsTrigger>
            <TabsTrigger value="reading-history">Reading History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bookmarked" className="mt-0">
            {isLoadingBookmarks ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex flex-col space-y-2">
                    <Skeleton className="w-full h-64 rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : bookmarksError ? (
              <div className="text-center py-10">
                <h3 className="text-lg font-medium text-red-500">Error loading your library</h3>
                <p className="text-muted-foreground mt-2">Please try again later</p>
              </div>
            ) : bookmarkedNovels && bookmarkedNovels.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {bookmarkedNovels.map(novel => (
                  <div key={novel.id} className="relative group">
                    <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeBookmark(novel.id)}
                        className="h-8 w-8"
                        title="Remove from library"
                      >
                        <BookmarkX className="h-4 w-4" />
                      </Button>
                    </div>
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
            ) : (
              <div className="text-center py-10">
                <h3 className="text-lg font-medium">No bookmarked novels</h3>
                <p className="text-muted-foreground mt-2">Bookmark novels to save them to your library</p>
                <Button 
                  className="mt-4"
                  onClick={() => navigate('/browse')}
                >
                  Browse Novels
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="reading-history" className="mt-0">
            {isLoadingHistory ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex flex-col space-y-2">
                    <Skeleton className="w-full h-32 rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : historyError ? (
              <div className="text-center py-10">
                <h3 className="text-lg font-medium text-red-500">Error loading your reading history</h3>
                <p className="text-muted-foreground mt-2">Please try again later</p>
              </div>
            ) : readingHistory && readingHistory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {readingHistory.map(novel => (
                  <div key={novel.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex gap-4">
                      <img 
                        src={novel.coverImage} 
                        alt={novel.title}
                        className="w-24 h-32 object-cover rounded-md"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://picsum.photos/800/1200';
                        }}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg line-clamp-1">{novel.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{novel.author}</p>
                        
                        <div className="text-sm">
                          <p>Last read: Chapter {novel.lastReadChapter.number}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(novel.lastReadAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="mt-3">
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => navigate(`/novel/${novel.id}/chapter/${novel.lastReadChapter.number}`)}
                          >
                            Continue Reading
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <h3 className="text-lg font-medium">No reading history</h3>
                <p className="text-muted-foreground mt-2">Your reading history will appear here</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Container>
  );
};

export default Library;
