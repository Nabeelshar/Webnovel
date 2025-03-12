
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowLeft, BookmarkPlus, BookmarkCheck, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChapterContent from '@/components/reader/ChapterContent';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from '@/components/ui/separator';
import { Chapter } from '@/types/novels';

interface ChapterData {
  id: string;
  title: string;
  content: string;
  chapter_number: number;
  novel_id: string;
  is_premium: boolean;
  coin_cost: number;
}

interface Novel {
  id: string;
  title: string;
  author_id: string;
  author?: string;
}

const ChapterPage = () => {
  const { novelId, chapterNumber } = useParams<{ novelId: string, chapterNumber: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [novel, setNovel] = useState<Novel | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [chaptersInNovel, setChaptersInNovel] = useState<Chapter[]>([]);
  const [userPurchasedChapter, setUserPurchasedChapter] = useState(false);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [userCoins, setUserCoins] = useState(0);
  const [authorName, setAuthorName] = useState("");

  useEffect(() => {
    if (!novelId || !chapterNumber) return;

    const fetchChapterData = async () => {
      setLoading(true);
      try {
        // Fetch novel info
        const { data: novelData, error: novelError } = await supabase
          .from('novels')
          .select('*, profiles:author_id(username, display_name)')
          .eq('id', novelId)
          .single();

        if (novelError) throw novelError;

        const authorDisplayName = novelData.profiles?.display_name || novelData.profiles?.username || 'Unknown Author';
        setAuthorName(authorDisplayName);
        
        setNovel({
          id: novelData.id,
          title: novelData.title,
          author_id: novelData.author_id,
          author: authorDisplayName
        });

        // Fetch all chapters for navigation
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('id, title, chapter_number, is_premium, coin_cost, content, novel_id')
          .eq('novel_id', novelId)
          .order('chapter_number', { ascending: true });

        if (chaptersError) throw chaptersError;
        
        if (chaptersData) {
          // Transform data to match Chapter interface
          const typedChapters: Chapter[] = chaptersData.map(chapter => ({
            id: chapter.id,
            title: chapter.title,
            chapterNumber: chapter.chapter_number,
            content: chapter.content,
            novel_id: chapter.novel_id,
            isPremium: chapter.is_premium,
            coin_cost: chapter.coin_cost,
            chapter_number: chapter.chapter_number,
            is_premium: chapter.is_premium
          }));
          setChaptersInNovel(typedChapters);
        }

        // Fetch current chapter
        const { data: chapterData, error: chapterError } = await supabase
          .from('chapters')
          .select('*')
          .eq('novel_id', novelId)
          .eq('chapter_number', parseInt(chapterNumber, 10))
          .single();

        if (chapterError) throw chapterError;
        
        setChapter(chapterData);

        // Check if novel is bookmarked
        if (user) {
          const { data: bookmarkData, error: bookmarkError } = await supabase
            .from('bookmarks')
            .select('id')
            .eq('user_id', user.id)
            .eq('novel_id', novelId)
            .maybeSingle();

          if (!bookmarkError && bookmarkData) {
            setBookmarked(true);
          }

          // Check if user has purchased this chapter if it's premium
          if (chapterData.is_premium) {
            const { data: purchaseData, error: purchaseError } = await supabase
              .from('purchases')
              .select('id')
              .eq('user_id', user.id)
              .eq('chapter_id', chapterData.id)
              .maybeSingle();

            if (!purchaseError && purchaseData) {
              setUserPurchasedChapter(true);
            }

            // Get user's coin balance
            const { data: userData, error: userError } = await supabase
              .from('profiles')
              .select('coins')
              .eq('id', user.id)
              .single();

            if (!userError && userData) {
              setUserCoins(userData.coins);
            }
          }
        }

        // Update view count
        if (user) {
          try {
            // Log reading history - fixing the onConflict issue
            const { error: historyError } = await supabase
              .from('reading_history')
              .insert({
                user_id: user.id,
                novel_id: novelId,
                chapter_id: chapterData.id,
                read_at: new Date().toISOString(),
              });

            if (historyError) {
              console.error("Error updating reading history:", historyError);
            }
          } catch (historyErr) {
            console.error("Error in reading history:", historyErr);
          }
        }

        try {
          // Increment views - this might need a custom implementation if the RPC doesn't exist
          const { error: viewUpdateError } = await supabase
            .from('chapters')
            .update({ views: (chapterData.views || 0) + 1 })
            .eq('id', chapterData.id);

          if (viewUpdateError) {
            console.error("Error updating chapter views:", viewUpdateError);
          }
        } catch (viewErr) {
          console.error("Error in updating views:", viewErr);
        }

      } catch (error) {
        console.error("Error fetching chapter:", error);
        toast({
          title: "Error",
          description: "Failed to load chapter data",
          variant: "destructive"
        });
        navigate(`/novel/${novelId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchChapterData();
  }, [novelId, chapterNumber, user, navigate, toast]);

  const handleToggleBookmark = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "You need to be logged in to bookmark novels",
        variant: "destructive"
      });
      navigate('/auth/login');
      return;
    }

    try {
      if (bookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('novel_id', novelId);

        if (error) throw error;

        setBookmarked(false);
        toast({
          title: "Bookmark removed",
          description: "Novel removed from your library"
        });
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            novel_id: novelId
          });

        if (error) throw error;

        setBookmarked(true);
        toast({
          title: "Bookmark added",
          description: "Novel added to your library"
        });
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive"
      });
    }
  };

  const navigateToChapter = (chapterNum: number) => {
    navigate(`/novel/${novelId}/chapter/${chapterNum}`);
  };

  const handlePurchaseChapter = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "You need to be logged in to purchase chapters",
        variant: "destructive"
      });
      navigate('/auth/login');
      return;
    }

    if (!chapter) return;

    try {
      // Check user's coin balance first
      if (userCoins < chapter.coin_cost) {
        toast({
          title: "Insufficient coins",
          description: `You need ${chapter.coin_cost} coins to purchase this chapter. You currently have ${userCoins} coins.`,
          variant: "destructive"
        });
        return;
      }

      // Process the purchase
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          chapter_id: chapter.id,
          coin_amount: chapter.coin_cost
        });

      if (purchaseError) throw purchaseError;

      // Deduct coins from user's balance
      const { error: coinError } = await supabase
        .from('profiles')
        .update({ coins: userCoins - chapter.coin_cost })
        .eq('id', user.id);

      if (coinError) throw coinError;

      // Log the transaction
      const { error: transactionError } = await supabase
        .from('coin_transactions')
        .insert({
          user_id: user.id,
          amount: -chapter.coin_cost,
          transaction_type: 'purchase',
          reference_id: chapter.id,
          description: `Purchased chapter ${chapter.chapter_number} of "${novel?.title}"`
        });

      if (transactionError) throw transactionError;

      // Give coins to author (70% of the cost)
      const authorShare = Math.floor(chapter.coin_cost * 0.7);
      
      if (novel?.author_id) {
        // Direct update to author's coins
        const { data: authorData, error: authorFetchError } = await supabase
          .from('profiles')
          .select('coins')
          .eq('id', novel.author_id)
          .single();
          
        if (!authorFetchError && authorData) {
          const currentCoins = authorData.coins || 0;
          
          const { error: authorCoinError } = await supabase
            .from('profiles')
            .update({ coins: currentCoins + authorShare })
            .eq('id', novel.author_id);

          if (authorCoinError) {
            console.error("Error giving coins to author:", authorCoinError);
            // This is not critical, so we don't throw here
          }
        }

        // Log the transaction for author
        const { error: authorTransactionError } = await supabase
          .from('coin_transactions')
          .insert({
            user_id: novel.author_id,
            amount: authorShare,
            transaction_type: 'sale',
            reference_id: chapter.id,
            description: `Earnings from chapter ${chapter.chapter_number} of "${novel.title}"`
          });

        if (authorTransactionError) {
          console.error("Error logging author transaction:", authorTransactionError);
          // Also not critical
        }
      }

      setUserPurchasedChapter(true);
      setUserCoins(userCoins - chapter.coin_cost);
      setIsPurchaseDialogOpen(false);

      toast({
        title: "Purchase successful",
        description: `You've purchased chapter ${chapter.chapter_number} for ${chapter.coin_cost} coins.`
      });
    } catch (error) {
      console.error("Error purchasing chapter:", error);
      toast({
        title: "Error",
        description: "Failed to process your purchase",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!chapter || !novel) {
    return (
      <div className="container py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Chapter Not Found</h1>
          <p className="mb-6">The chapter you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate(`/novel/${novelId}`)}>
            Back to Novel
          </Button>
        </div>
      </div>
    );
  }

  // Check if this is a premium chapter and user hasn't purchased it
  const isPremiumLocked = chapter.is_premium && !userPurchasedChapter && novel.author_id !== user?.id;

  // Find prev/next chapter numbers
  const currentIndex = chaptersInNovel.findIndex(
    (c) => c.chapterNumber === Number(chapterNumber)
  );
  const prevChapter = currentIndex > 0 ? chaptersInNovel[currentIndex - 1] : null;
  const nextChapter = currentIndex < chaptersInNovel.length - 1 ? chaptersInNovel[currentIndex + 1] : null;

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/novel/${novelId}`)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="ml-2">
              <h2 className="text-lg font-medium line-clamp-1">{novel.title}</h2>
              <p className="text-sm text-muted-foreground">by {authorName}</p>
            </div>
          </div>
          <Button
            variant={bookmarked ? "default" : "outline"}
            size="sm"
            onClick={handleToggleBookmark}
          >
            {bookmarked ? <BookmarkCheck className="w-4 h-4 mr-2" /> : <BookmarkPlus className="w-4 h-4 mr-2" />}
            {bookmarked ? "Bookmarked" : "Bookmark"}
          </Button>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <h1 className="text-2xl font-bold mb-2">
              Chapter {chapter.chapter_number}: {chapter.title}
            </h1>
            
            {isPremiumLocked ? (
              <div className="my-12 py-12 text-center">
                <div className="mb-6 flex justify-center">
                  <Lock className="w-16 h-16 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Premium Chapter</h3>
                <p className="text-muted-foreground mb-6">
                  This is a premium chapter that costs {chapter.coin_cost} coins to unlock.
                </p>
                <Button onClick={() => setIsPurchaseDialogOpen(true)}>
                  Purchase for {chapter.coin_cost} coins
                </Button>
              </div>
            ) : (
              <ChapterContent content={chapter.content} />
            )}
          </CardContent>
          <CardFooter className="flex justify-between pt-4 pb-6">
            <Button
              variant="outline"
              onClick={() => prevChapter && navigateToChapter(prevChapter.chapterNumber)}
              disabled={!prevChapter}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Link to={`/novel/${novelId}`}>
              <Button variant="secondary" size="sm">
                Chapter List
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => nextChapter && navigateToChapter(nextChapter.chapterNumber)}
              disabled={!nextChapter}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">Enjoyed this chapter?</p>
          <Link to={`/novel/${novelId}`}>
            <Button variant="outline" size="sm">
              Rate this novel
            </Button>
          </Link>
        </div>
      </div>

      <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase Chapter</DialogTitle>
            <DialogDescription>
              You're about to purchase Chapter {chapter.chapter_number}: {chapter.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex justify-between mb-2">
              <span>Your balance:</span>
              <span className="font-semibold">{userCoins} coins</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Chapter cost:</span>
              <span className="font-semibold">{chapter.coin_cost} coins</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between">
              <span>Balance after purchase:</span>
              <span className="font-semibold">{userCoins - chapter.coin_cost} coins</span>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPurchaseDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handlePurchaseChapter}
              disabled={userCoins < chapter.coin_cost}
            >
              Confirm Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChapterPage;
