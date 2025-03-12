
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Eye, BookOpen, Clock, Bookmark, BookmarkPlus } from 'lucide-react';
import Button from '../common/Button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface FeaturedNovelProps {
  id: string;
  title: string;
  author: string;
  authorId?: string;
  coverImage: string;
  description: string;
  rating: number;
  genres: string[];
  views: number;
  chapters: number;
  status: 'ongoing' | 'completed' | 'hiatus' | 'Ongoing' | 'Completed' | 'Hiatus';
}

const FeaturedNovel: React.FC<FeaturedNovelProps> = ({
  id,
  title,
  author,
  authorId,
  coverImage,
  description,
  rating,
  genres,
  views,
  chapters,
  status
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Function to format status display
  const formatStatus = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  // Check if the novel is bookmarked
  React.useEffect(() => {
    if (!user) return;
    
    const checkBookmark = async () => {
      const { data, error } = await supabase
        .from('bookmarks')
        .select()
        .eq('user_id', user.id)
        .eq('novel_id', id)
        .single();
        
      if (!error && data) {
        setIsBookmarked(true);
      }
    };
    
    checkBookmark();
  }, [user, id]);

  const handleBookmark = async () => {
    if (!user) {
      navigate('/auth/login');
      toast({
        title: "Authentication required",
        description: "You need to be logged in to bookmark novels",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('novel_id', id);
          
        if (error) throw error;
        
        setIsBookmarked(false);
        toast({
          title: "Removed from library",
          description: "Novel has been removed from your library"
        });
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            novel_id: id
          });
          
        if (error) throw error;
        
        setIsBookmarked(true);
        toast({
          title: "Added to library",
          description: "Novel has been added to your library"
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast({
        title: "Error",
        description: "There was an error updating your library",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-primary/10 to-transparent">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10 blur-xl"
          style={{ backgroundImage: `url(${coverImage})` }}
        />
      </div>
      
      <div className="relative z-10 p-6 md:p-10 grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8 md:gap-12 items-center animate-fade-in">
        <div className="order-2 md:order-1">
          <div className="flex flex-wrap gap-2 mb-4">
            {genres.map((genre, index) => (
              <span 
                key={index}
                className="inline-block px-3 py-1 bg-background/80 backdrop-blur-sm text-xs font-medium rounded-full"
              >
                {genre}
              </span>
            ))}
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
            {title}
          </h1>
          
          <p className="text-lg md:text-xl text-foreground/80 mb-3">
            by <Link to={`/author/${authorId}`} className="hover:text-primary">{author}</Link>
          </p>
          
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500 mr-1" />
              <span>{rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center">
              <Eye className="w-5 h-5 text-muted-foreground mr-1" />
              <span>{views.toLocaleString()}</span>
            </div>
            <div className="flex items-center">
              <BookOpen className="w-5 h-5 text-muted-foreground mr-1" />
              <span>{chapters} chapters</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-muted-foreground mr-1" />
              <span>{formatStatus(status)}</span>
            </div>
          </div>
          
          <p className="text-foreground/80 mb-8 line-clamp-3 md:line-clamp-4 max-w-xl">
            {description}
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Button 
              size="lg"
              iconRight={<BookOpen className="w-4 h-4" />}
            >
              <Link to={`/novel/${id}/chapter/1`}>Start Reading</Link>
            </Button>
            
            <Button 
              variant={isBookmarked ? "primary" : "outline"}
              size="lg"
              onClick={handleBookmark}
              disabled={isLoading}
            >
              {isBookmarked ? (
                <>
                  <Bookmark className="w-4 h-4 mr-2" />
                  In Library
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-4 h-4 mr-2" />
                  Add to Library
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="order-1 md:order-2 flex justify-center md:justify-end animate-float">
          <div className="relative w-48 md:w-64">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>
            <img
              src={coverImage}
              alt={title}
              className="w-full h-auto rounded-xl shadow-2xl object-cover aspect-[2/3]"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://picsum.photos/800/1200'; // Fallback image
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedNovel;
