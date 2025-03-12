import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Container from '@/components/common/Container';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Eye, BookOpen, Clock, Bookmark, Heart, Share, ArrowLeft } from 'lucide-react';
import { Novel } from '@/types/novels';
import { useToast } from '@/components/ui/use-toast';
import NovelRating from '@/components/novels/NovelRating';

interface ChapterListItem {
  id: string;
  title: string;
  chapterNumber: number;
  isPremium: boolean;
  createdAt: string;
}

const NovelPage = () => {
  const { novelId } = useParams<{ novelId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [chapters, setChapters] = useState<ChapterListItem[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  const { data: novel, isLoading: isNovelLoading, error: novelError } = useQuery({
    queryKey: ['novel', novelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('novels')
        .select(`
          *,
          author:profiles(username, display_name, avatar_url),
          novel_genres(genres(*)),
          novel_tags(tags(*))
        `)
        .eq('id', novelId)
        .single();
      
      if (error) throw error;
      
      if (!data) throw new Error('Novel not found');
            
      return {
        id: data.id,
        title: data.title,
        author: data.author.display_name || data.author.username,
        authorId: data.author_id,
        authorAvatar: data.author.avatar_url,
        coverImage: data.cover_image || 'https://picsum.photos/800/1200',
        description: data.description || '',
        rating: data.rating || 0,
        views: data.views || 0,
        bookmarks: data.bookmarks || 0,
        genres: data.novel_genres?.map((ng: any) => ng.genres.name) || [],
        tags: data.novel_tags?.map((nt: any) => nt.tags.name) || [],
        status: data.status as 'Ongoing' | 'Completed' | 'Hiatus',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as Novel & { authorAvatar?: string };
    }
  });

  useEffect(() => {
    if (!user || !novelId) return;
    
    const checkBookmarkStatus = async () => {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('novel_id', novelId)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking bookmark status:', error);
        return;
      }
      
      setIsBookmarked(!!data);
    };
    
    checkBookmarkStatus();
  }, [user, novelId]);

  useEffect(() => {
    if (!novelId) return;
    
    const fetchChapters = async () => {
      const { data, error } = await supabase
        .from('chapters')
        .select('id, title, chapter_number, is_premium, created_at')
        .eq('novel_id', novelId)
        .order('chapter_number', { ascending: true });
      
      if (error) {
        console.error('Error fetching chapters:', error);
        return;
      }
      
      if (data) {
        const formattedChapters = data.map(chapter => ({
          id: chapter.id,
          title: chapter.title,
          chapterNumber: chapter.chapter_number,
          isPremium: chapter.is_premium,
          createdAt: chapter.created_at
        }));
        
        setChapters(formattedChapters);
      }
    };
    
    fetchChapters();
  }, [novelId]);

  const handleBookmarkToggle = async () => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    
    setIsBookmarking(true);
    
    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('novel_id', novelId);
        
        if (error) throw error;
        
        setIsBookmarked(false);
        toast({
          title: "Bookmark removed",
          description: "Novel removed from your library"
        });
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            novel_id: novelId
          });
        
        if (error) throw error;
        
        setIsBookmarked(true);
        toast({
          title: "Bookmark added",
          description: "Novel added to your library"
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast({
        title: "Error",
        description: "There was an error updating your bookmarks. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsBookmarking(false);
    }
  };

  const formatStatus = (status?: string): string => {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (isNovelLoading) {
    return (
      <Container>
        <div className="py-10 animate-fade-in">
          <div className="flex items-center mb-6">
            <Skeleton className="h-10 w-10 mr-2" />
            <Skeleton className="h-8 w-48" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
            <div>
              <div className="flex flex-col md:flex-row gap-6 mb-8">
                <Skeleton className="w-48 h-64 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-4">
                  <Skeleton className="h-10 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                  <div className="flex gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <Skeleton key={i} className="h-6 w-20" />
                    ))}
                  </div>
                  <Skeleton className="h-24 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </div>
              </div>
              
              <Skeleton className="h-8 w-40 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
            
            <div className="space-y-6">
              <Skeleton className="h-8 w-40 mb-4" />
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-8 w-40 mb-4" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (novelError || !novel) {
    return (
      <Container>
        <div className="py-10 text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Novel</h1>
          <p className="mb-6">There was an error loading this novel. It may have been removed or doesn't exist.</p>
          <Button asChild>
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-10 animate-fade-in">
        <div className="flex items-center gap-2 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <nav className="text-sm breadcrumbs">
            <ul className="flex items-center gap-2">
              <li><Link to="/" className="hover:underline">Home</Link></li>
              <li className="before:content-['/'] before:mr-2">
                {novel.title}
              </li>
            </ul>
          </nav>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
          <div>
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <div className="w-48 h-64 rounded-lg shadow-lg overflow-hidden flex-shrink-0 bg-muted">
                <img 
                  src={novel.coverImage}
                  alt={novel.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://picsum.photos/800/1200';
                  }}
                />
              </div>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{novel.title}</h1>
                
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    <img 
                      src={novel.authorAvatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(novel.author)}
                      alt={novel.author}
                      className="w-6 h-6 rounded-full mr-2"
                    />
                    <Link to={`/author/${novel.authorId}`} className="hover:underline">
                      {novel.author}
                    </Link>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500 mr-1" />
                    <span>{novel.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center">
                    <Eye className="w-5 h-5 text-muted-foreground mr-1" />
                    <span>{novel.views.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center">
                    <BookOpen className="w-5 h-5 text-muted-foreground mr-1" />
                    <span>{chapters.length} chapters</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-muted-foreground mr-1" />
                    <span>{formatStatus(novel.status)}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {novel.genres.map((genre, index) => (
                    <span 
                      key={index}
                      className="inline-block px-3 py-1 bg-background border border-border text-xs font-medium rounded-full"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
                
                <p className="text-foreground/80 mb-6">
                  {novel.description}
                </p>
                
                <div className="flex flex-wrap gap-3 mb-4">
                  {chapters.length > 0 && (
                    <Button asChild>
                      <Link to={`/novel/${novel.id}/chapter/1`}>
                        <BookOpen className="w-4 h-4 mr-2" /> Start Reading
                      </Link>
                    </Button>
                  )}
                  
                  <Button 
                    variant={isBookmarked ? "default" : "outline"}
                    onClick={handleBookmarkToggle}
                    disabled={isBookmarking}
                  >
                    <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked ? 'fill-primary-foreground' : ''}`} />
                    {isBookmarked ? "Bookmarked" : "Add to Library"}
                  </Button>
                  
                  <Button variant="outline" size="icon">
                    <Share className="w-4 h-4" />
                  </Button>
                </div>
                
                <NovelRating 
                  novelId={novel.id} 
                  initialRating={novel.rating}
                  className="mt-4"
                />
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Chapters
              </h2>
              
              {chapters.length === 0 ? (
                <div className="p-8 text-center border rounded-lg">
                  <p className="text-muted-foreground">No chapters available yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chapters.map((chapter) => (
                    <div 
                      key={chapter.id} 
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <Link 
                          to={`/novel/${novel.id}/chapter/${chapter.chapterNumber}`}
                          className="flex-1"
                        >
                          <div className="flex items-center">
                            <span className="font-medium">Chapter {chapter.chapterNumber}:</span>
                            <span className="ml-2">{chapter.title}</span>
                            
                            {chapter.isPremium && (
                              <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                                Premium
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {formatDate(chapter.createdAt)}
                          </div>
                        </Link>
                        
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/novel/${novel.id}/chapter/${chapter.chapterNumber}`}>
                            Read
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">
                About the Author
              </h2>
              <div className="border rounded-lg p-6">
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={novel.authorAvatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(novel.author)}
                    alt={novel.author}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-lg">{novel.author}</h3>
                    <Link to={`/author/${novel.authorId}`} className="text-sm text-primary hover:underline">
                      View Profile
                    </Link>
                  </div>
                </div>
                
                <Button className="w-full" variant="outline" asChild>
                  <Link to={`/author/${novel.authorId}`}>
                    View All Novels
                  </Link>
                </Button>
              </div>
            </div>
            
            {novel.tags.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {novel.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="inline-block px-3 py-1 bg-background border border-border text-xs font-medium rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
};

export default NovelPage;
