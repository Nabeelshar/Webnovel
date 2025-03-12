
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Container from '@/components/common/Container';
import FeaturedNovel from '@/components/novels/FeaturedNovel';
import NovelCard from '@/components/novels/NovelCard';
import { getFeaturedNovel } from '@/services/novels';
import { Novel } from '@/types/novels';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const getFallbackNovel = async (): Promise<Novel> => {
  const { getFeaturedNovel: getMockFeaturedNovel } = await import('@/lib/data');
  return getMockFeaturedNovel();
};

const fetchTrendingNovels = async () => {
  const { data, error } = await supabase
    .from('novels')
    .select(`
      *,
      author:profiles(username, display_name),
      novel_genres(genres(*)),
      chapters(count)
    `)
    .order('views', { ascending: false })
    .limit(5);

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
    status: novel.status
  }));
};

const fetchRecentlyUpdated = async () => {
  const { data, error } = await supabase
    .from('novels')
    .select(`
      *,
      author:profiles(username, display_name),
      novel_genres(genres(*)),
      chapters(count)
    `)
    .order('updated_at', { ascending: false })
    .limit(5);

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
    status: novel.status
  }));
};

const Index = () => {
  const { user } = useAuth();
  
  const { data: featuredNovel, isLoading: isLoadingFeatured } = useQuery({
    queryKey: ['featuredNovel'],
    queryFn: async () => {
      const novel = await getFeaturedNovel();
      if (!novel) {
        return getFallbackNovel();
      }
      return novel;
    }
  });
  
  const { data: trendingNovels, isLoading: isLoadingTrending } = useQuery({
    queryKey: ['trendingNovels'],
    queryFn: fetchTrendingNovels
  });
  
  const { data: recentNovels, isLoading: isLoadingRecent } = useQuery({
    queryKey: ['recentNovels'],
    queryFn: fetchRecentlyUpdated
  });
  
  return (
    <div className="page-appear pt-20">
      <Container>
        <section className="py-8">
          {isLoadingFeatured ? (
            <div className="rounded-2xl bg-gradient-to-b from-primary/10 to-transparent p-6 md:p-10">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8 md:gap-12">
                <div className="order-2 md:order-1 space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-6 w-20 rounded-full" />
                    ))}
                  </div>
                  <Skeleton className="h-24 w-full" />
                  <div className="flex flex-wrap gap-4">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </div>
                <div className="order-1 md:order-2 flex justify-center md:justify-end">
                  <Skeleton className="w-48 md:w-64 h-72 md:h-96 rounded-xl" />
                </div>
              </div>
            </div>
          ) : featuredNovel ? (
            <FeaturedNovel 
              {...featuredNovel} 
              chapters={featuredNovel.chapters.length} 
              coverImage={featuredNovel.coverImage || featuredNovel.cover_image || 'https://picsum.photos/800/1200'}
              genres={featuredNovel.genres || []}
            />
          ) : null}
        </section>
        
        {user && (
          <section className="py-6">
            <div className="rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 p-6">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Share Your Story</h2>
                  <p className="text-muted-foreground max-w-xl">Ready to publish your own novel? Create a new story and share it with our growing community of readers.</p>
                </div>
                <Button className="mt-4 md:mt-0" asChild>
                  <Link to="/author/novels/create">Create a Novel</Link>
                </Button>
              </div>
            </div>
          </section>
        )}
        
        <section className="py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Trending Now</h2>
            <Button variant="ghost" asChild>
              <Link to="/rankings" className="flex items-center">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          {isLoadingTrending ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex flex-col space-y-2">
                  <Skeleton className="w-full h-64 rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : trendingNovels && trendingNovels.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {trendingNovels.map(novel => (
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
          ) : (
            <div className="text-center py-12 border rounded-xl bg-card">
              <h3 className="text-lg font-medium">No trending novels yet</h3>
              <p className="text-muted-foreground mt-2">
                Check back soon for the latest trending stories
              </p>
            </div>
          )}
        </section>
        
        <section className="py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Recently Updated</h2>
            <Button variant="ghost" asChild>
              <Link to="/browse" className="flex items-center">
                Browse All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          {isLoadingRecent ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex flex-col space-y-2">
                  <Skeleton className="w-full h-64 rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : recentNovels && recentNovels.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {recentNovels.map(novel => (
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
          ) : (
            <div className="text-center py-12 border rounded-xl bg-card">
              <h3 className="text-lg font-medium">No recently updated novels</h3>
              <p className="text-muted-foreground mt-2">
                Check back soon for the latest content
              </p>
            </div>
          )}
        </section>
      </Container>
    </div>
  );
};

export default Index;
