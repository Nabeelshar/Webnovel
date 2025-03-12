
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

interface ChapterFormData {
  title: string;
  content: string;
  isPremium: boolean;
}

const CreateChapter = () => {
  const { novelId } = useParams<{ novelId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [novelTitle, setNovelTitle] = useState('');
  const [nextChapterNumber, setNextChapterNumber] = useState(1);
  
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ChapterFormData>({
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
          description: "You don't have permission to add chapters to this novel.",
          variant: "destructive"
        });
        navigate('/author/novels');
        return;
      }
      
      setNovelTitle(novel.title);
      
      // Find the highest chapter number
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('chapter_number')
        .eq('novel_id', novelId)
        .order('chapter_number', { ascending: false })
        .limit(1);
      
      if (chaptersError) {
        console.error('Error fetching chapters:', chaptersError);
      } else if (chaptersData && chaptersData.length > 0) {
        setNextChapterNumber(chaptersData[0].chapter_number + 1);
      }
      
      setIsLoading(false);
    };

    fetchNovelAndChapters();
  }, [user, novelId, navigate, toast]);
  
  const onSubmit = async (data: ChapterFormData) => {
    if (!user || !novelId) return;
    
    setIsSaving(true);
    
    try {
      // Create chapter
      const { data: chapter, error } = await supabase
        .from('chapters')
        .insert({
          novel_id: novelId,
          title: data.title,
          content: data.content,
          chapter_number: nextChapterNumber,
          is_premium: data.isPremium,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Chapter created!",
        description: "Your chapter has been successfully created.",
      });
      
      navigate(`/author/novels/${novelId}/chapters`);
    } catch (error) {
      console.error('Error creating chapter:', error);
      toast({
        title: "Error",
        description: "There was an error creating your chapter. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

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
            <p className="text-muted-foreground">Create New Chapter</p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Chapter {nextChapterNumber}</CardTitle>
            <CardDescription>
              Create a new chapter for your novel
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
                  disabled={isLoading}
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
                  disabled={isLoading}
                  className="font-serif"
                />
                {errors.content && <p className="text-sm text-red-500">Content is required</p>}
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="premium"
                  checked={isPremium}
                  onCheckedChange={(checked) => setValue('isPremium', checked)}
                  disabled={isLoading}
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
                disabled={isLoading || isSaving}
              >
                {isSaving ? "Creating..." : "Create Chapter"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Container>
  );
};

export default CreateChapter;
