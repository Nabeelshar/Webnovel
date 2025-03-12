
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Container from '@/components/common/Container';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ChapterFormData {
  title: string;
  content: string;
  isPremium: boolean;
}

const EditChapter = () => {
  const { novelId, chapterId } = useParams<{ novelId: string, chapterId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [novelTitle, setNovelTitle] = useState('');
  const [chapterNumber, setChapterNumber] = useState<number | null>(null);
  
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<ChapterFormData>({
    defaultValues: {
      title: '',
      content: '',
      isPremium: false
    }
  });
  
  const isPremium = watch('isPremium');

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }

    const fetchNovelAndChapter = async () => {
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
          description: "You don't have permission to edit chapters for this novel.",
          variant: "destructive"
        });
        navigate('/author/novels');
        return;
      }
      
      setNovelTitle(novel.title);
      
      // Fetch the chapter
      const { data: chapter, error: chapterError } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .single();
      
      if (chapterError) {
        console.error('Error fetching chapter:', chapterError);
        toast({
          title: "Error",
          description: "Could not load the chapter. Please try again.",
          variant: "destructive"
        });
        navigate(`/author/novels/${novelId}/chapters`);
        return;
      }
      
      setChapterNumber(chapter.chapter_number);
      
      // Set form values
      reset({
        title: chapter.title,
        content: chapter.content,
        isPremium: chapter.is_premium
      });
      
      setIsLoading(false);
    };

    fetchNovelAndChapter();
  }, [user, novelId, chapterId, navigate, toast, reset]);
  
  const onSubmit = async (data: ChapterFormData) => {
    if (!user || !novelId || !chapterId) return;
    
    setIsSaving(true);
    
    try {
      // Update chapter
      const { error } = await supabase
        .from('chapters')
        .update({
          title: data.title,
          content: data.content,
          is_premium: data.isPremium,
          updated_at: new Date().toISOString()
        })
        .eq('id', chapterId);
      
      if (error) throw error;
      
      toast({
        title: "Chapter updated!",
        description: "Your chapter has been successfully updated.",
      });
      
      navigate(`/author/novels/${novelId}/chapters`);
    } catch (error) {
      console.error('Error updating chapter:', error);
      toast({
        title: "Error",
        description: "There was an error updating your chapter. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Container>
        <div className="py-10">
          <div className="flex items-center mb-6">
            <Skeleton className="h-10 w-10 mr-2" />
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32 mt-1" />
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-40 w-full" />
              </div>
              <Skeleton className="h-6 w-40" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-10">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(`/author/novels/${novelId}/chapters`)}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{novelTitle || 'Loading...'}</h1>
            <p className="text-muted-foreground">Edit Chapter {chapterNumber}</p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Edit Chapter</CardTitle>
            <CardDescription>
              Update your chapter's content and settings
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Chapter Title</Label>
                <Input
                  id="title"
                  placeholder="Enter chapter title"
                  {...register("title", { required: true })}
                />
                {errors.title && <p className="text-sm text-red-500">Title is required</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Chapter Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your chapter content here..."
                  rows={15}
                  {...register("content", { required: true })}
                  className="font-serif"
                />
                {errors.content && <p className="text-sm text-red-500">Content is required</p>}
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="premium"
                  checked={isPremium}
                  onCheckedChange={(checked) => setValue('isPremium', checked)}
                />
                <Label htmlFor="premium">Premium Chapter</Label>
              </div>
              {isPremium && (
                <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                  <p className="text-amber-700 text-sm">
                    This chapter will be marked as premium. Readers will need to pay to access it.
                  </p>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                type="button"
                onClick={() => navigate(`/author/novels/${novelId}/chapters`)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Container>
  );
};

export default EditChapter;
