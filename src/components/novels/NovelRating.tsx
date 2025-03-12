
import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

interface NovelRatingProps {
  novelId: string;
  initialRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  onRatingChange?: (newRating: number) => void;
}

const NovelRating: React.FC<NovelRatingProps> = ({
  novelId,
  initialRating = 0,
  size = 'md',
  showLabel = true,
  className = '',
  onRatingChange,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userRating, setUserRating] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [novelAverageRating, setNovelAverageRating] = useState(initialRating);
  const [userRatingId, setUserRatingId] = useState<string | null>(null);

  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // Fetch the user's rating and novel's average rating
  useEffect(() => {
    if (!novelId) return;
    
    const fetchRatings = async () => {
      try {
        // Fetch novel's current average rating
        const { data: novelData, error: novelError } = await supabase
          .from('novels')
          .select('rating')
          .eq('id', novelId)
          .maybeSingle();
          
        if (novelError) {
          console.error('Error fetching novel rating:', novelError);
        } else if (novelData) {
          setNovelAverageRating(novelData.rating);
        }
        
        // Only fetch user rating if logged in
        if (user) {
          const { data, error } = await supabase
            .from('novel_ratings')
            .select('id, rating')
            .eq('user_id', user.id)
            .eq('novel_id', novelId)
            .maybeSingle();
            
          if (error) {
            console.error('Error fetching user rating:', error);
            return;
          }
          
          if (data) {
            setUserRating(data.rating);
            setUserRatingId(data.id);
          }
        }
      } catch (error) {
        console.error('Error in fetchRatings:', error);
      }
    };
    
    fetchRatings();
  }, [user, novelId]);

  const handleRateNovel = async (rating: number) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "You need to be logged in to rate novels",
        variant: "destructive"
      });
      navigate('/auth/login');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (userRatingId) {
        // Update existing rating
        const { error } = await supabase
          .from('novel_ratings')
          .update({ rating })
          .eq('id', userRatingId);
          
        if (error) throw error;
      } else {
        // Insert new rating
        const { data, error } = await supabase
          .from('novel_ratings')
          .insert({
            user_id: user.id,
            novel_id: novelId,
            rating
          })
          .select('id')
          .single();
          
        if (error) throw error;
        setUserRatingId(data.id);
      }
      
      setUserRating(rating);
      
      // Fetch the updated novel rating
      const { data: updatedNovel, error: novelError } = await supabase
        .from('novels')
        .select('rating')
        .eq('id', novelId)
        .maybeSingle();
        
      if (!novelError && updatedNovel) {
        setNovelAverageRating(updatedNovel.rating);
        if (onRatingChange) {
          onRatingChange(updatedNovel.rating);
        }
      }
      
      toast({
        title: "Rating saved",
        description: `You've rated this novel ${rating} stars.`
      });
    } catch (error) {
      console.error('Error rating novel:', error);
      toast({
        title: "Error",
        description: "There was an error saving your rating.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      {showLabel && (
        <span className="mr-2 text-sm font-medium">Rate:</span>
      )}
      <div 
        className="flex items-center" 
        onMouseLeave={() => setIsHovering(false)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            disabled={isLoading}
            onClick={() => handleRateNovel(star)}
            onMouseEnter={() => {
              setIsHovering(true);
              setHoverRating(star);
            }}
            className={`p-1 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            aria-label={`Rate ${star} stars`}
          >
            <Star 
              className={`${starSizes[size]} transition-colors ${
                (isHovering ? hoverRating >= star : userRating >= star) 
                  ? 'text-amber-500 fill-amber-500' 
                  : 'text-muted-foreground'
              }`} 
            />
          </button>
        ))}
      </div>
      {initialRating > 0 || novelAverageRating > 0 ? (
        <span className="ml-3 text-sm text-muted-foreground">
          {novelAverageRating.toFixed(1)}
        </span>
      ) : null}
    </div>
  );
};

export default NovelRating;
