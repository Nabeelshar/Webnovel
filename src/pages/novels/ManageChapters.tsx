
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Container from '@/components/common/Container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit2, Eye, Lock, Unlock, Trash2, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Chapter } from '@/types/novels';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface NovelChapter extends Chapter {
  views: number;
}

const ManageChapters = () => {
  const { novelId } = useParams<{ novelId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [chapters, setChapters] = useState<NovelChapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [novelTitle, setNovelTitle] = useState('');
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }

    const fetchNovelAndChapters = async () => {
      setIsLoading(true);
      
      // Fetch the novel to verify ownership
      const { data: novel, error: novelError } = await supabase
        .from('novels')
        .select('title, author_id')
        .eq('id', novelId)
        .single();
      
      if (novelError) {
        console.error('Error fetching novel:', novelError);
        toast({
          title: "Error",
          description: "Could not load the novel. Please try again.",
          variant: "destructive"
        });
        navigate('/author/novels');
        return;
      }
      
      // Check if user is the author
      if (novel.author_id !== user.id) {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to manage chapters for this novel.",
          variant: "destructive"
        });
        navigate('/author/novels');
        return;
      }
      
      setNovelTitle(novel.title);
      
      // Fetch chapters
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .eq('novel_id', novelId)
        .order('chapter_number', { ascending: true });
      
      if (chaptersError) {
        console.error('Error fetching chapters:', chaptersError);
        toast({
          title: "Error",
          description: "Could not load the chapters. Please try again.",
          variant: "destructive"
        });
      } else if (chaptersData) {
        const formattedChapters = chaptersData.map(chapter => ({
          id: chapter.id,
          title: chapter.title,
          chapterNumber: chapter.chapter_number,
          content: chapter.content,
          views: chapter.views || 0,
          createdAt: chapter.created_at,
          isPremium: chapter.is_premium || false
        }));
        setChapters(formattedChapters);
      }
      
      setIsLoading(false);
    };

    fetchNovelAndChapters();
  }, [user, novelId, navigate, toast]);

  const togglePremiumStatus = async (chapterId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('chapters')
        .update({ is_premium: !currentStatus })
        .eq('id', chapterId);
      
      if (error) throw error;
      
      // Update local state
      setChapters(prev => 
        prev.map(chapter => 
          chapter.id === chapterId 
            ? { ...chapter, isPremium: !currentStatus } 
            : chapter
        )
      );
      
      toast({
        title: "Chapter updated",
        description: `Chapter is now ${!currentStatus ? 'premium' : 'free'}.`,
      });
    } catch (error) {
      console.error('Error updating chapter status:', error);
      toast({
        title: "Error",
        description: "Failed to update chapter status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteChapter = async () => {
    if (!chapterToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterToDelete);
      
      if (error) throw error;
      
      // Update local state
      setChapters(prev => prev.filter(chapter => chapter.id !== chapterToDelete));
      
      toast({
        title: "Chapter deleted",
        description: "The chapter has been successfully deleted.",
      });
      
      setChapterToDelete(null);
    } catch (error) {
      console.error('Error deleting chapter:', error);
      toast({
        title: "Error",
        description: "Failed to delete the chapter. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Container>
      <div className="py-10">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/author/novels')}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{novelTitle || 'Loading...'}</h1>
            <p className="text-muted-foreground">Manage Chapters</p>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Chapters ({chapters.length})</h2>
          <Button onClick={() => navigate(`/author/novels/${novelId}/chapters/create`)}>
            <Plus className="mr-2 h-4 w-4" /> Add New Chapter
          </Button>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : chapters.length === 0 ? (
          <Card className="p-10 text-center">
            <CardTitle className="mb-4">No Chapters Yet</CardTitle>
            <CardDescription className="mb-6">
              You haven't added any chapters to this novel yet. Click the button below to create your first chapter.
            </CardDescription>
            <Button onClick={() => navigate(`/author/novels/${novelId}/chapters/create`)}>
              <Plus className="mr-2 h-4 w-4" /> Add First Chapter
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {chapters.map((chapter) => (
              <Card key={chapter.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Chapter {chapter.chapterNumber}: {chapter.title}</h3>
                        {chapter.isPremium && (
                          <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                            Premium
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center mt-1">
                        <Eye className="h-3 w-3 mr-1" /> {chapter.views.toLocaleString()} views
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/novel/${novelId}/chapter/${chapter.chapterNumber}`}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/author/novels/${novelId}/chapters/${chapter.id}/edit`}>
                          <Edit2 className="h-4 w-4 mr-1" /> Edit
                        </Link>
                      </Button>
                      <Button 
                        variant={chapter.isPremium ? "default" : "secondary"} 
                        size="sm"
                        onClick={() => togglePremiumStatus(chapter.id, chapter.isPremium)}
                      >
                        {chapter.isPremium ? (
                          <>
                            <Unlock className="h-4 w-4 mr-1" /> Make Free
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-1" /> Make Premium
                          </>
                        )}
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => setChapterToDelete(chapter.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Chapter</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete Chapter {chapter.chapterNumber}: {chapter.title}?
                              This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <Alert variant="destructive" className="mt-4">
                            <AlertTitle>Warning!</AlertTitle>
                            <AlertDescription>
                              Deleting this chapter will permanently remove it and all associated data.
                              Reader progress and comments will also be deleted.
                            </AlertDescription>
                          </Alert>
                          
                          <DialogFooter className="mt-6">
                            <Button 
                              variant="outline" 
                              onClick={() => setChapterToDelete(null)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={handleDeleteChapter}
                              disabled={isDeleting}
                            >
                              {isDeleting ? "Deleting..." : "Delete Chapter"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export default ManageChapters;
