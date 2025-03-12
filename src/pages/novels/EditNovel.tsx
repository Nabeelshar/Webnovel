
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload } from 'lucide-react';

interface NovelFormData {
  title: string;
  description: string;
}

type NovelStatusType = 'ongoing' | 'completed' | 'hiatus';

const EditNovel = () => {
  const { novelId } = useParams<{ novelId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [availableGenres, setAvailableGenres] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [novelStatus, setNovelStatus] = useState<NovelStatusType>('ongoing');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<NovelFormData>();

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }

    const fetchNovelAndGenres = async () => {
      setIsLoading(true);
      
      // Fetch the novel
      const { data: novel, error: novelError } = await supabase
        .from('novels')
        .select('*')
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
          description: "You don't have permission to edit this novel.",
          variant: "destructive"
        });
        navigate('/author/novels');
        return;
      }
      
      // Fetch novel's genres
      const { data: novelGenres, error: genresError } = await supabase
        .from('novel_genres')
        .select('genre_id')
        .eq('novel_id', novelId);
      
      if (genresError) {
        console.error('Error fetching novel genres:', genresError);
      } else if (novelGenres) {
        setSelectedGenres(novelGenres.map(g => g.genre_id));
      }
      
      // Fetch all available genres
      const { data: genres, error: allGenresError } = await supabase
        .from('genres')
        .select('id, name');
      
      if (allGenresError) {
        console.error('Error fetching all genres:', allGenresError);
      } else if (genres) {
        setAvailableGenres(genres);
      }
      
      // Set form values and novel status
      setNovelStatus(novel.status as NovelStatusType || 'ongoing');
      setCoverImageUrl(novel.cover_image || '');
      
      reset({
        title: novel.title,
        description: novel.description || '',
      });
      
      setIsLoading(false);
    };
    
    fetchNovelAndGenres();
  }, [user, novelId, navigate, toast, reset]);

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverImageUrl(URL.createObjectURL(file));
    }
  };

  const uploadCoverImage = async (novelId: string, file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${novelId}.${fileExt}`;
    const filePath = `${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw uploadError;
    }
    
    const { data } = supabase.storage
      .from('covers')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };
  
  const onSubmit = async (data: NovelFormData) => {
    if (!user || !novelId) return;
    
    setIsSaving(true);
    
    try {
      // Handle cover image upload if selected
      let coverImagePath = coverImageUrl;
      
      if (coverImage) {
        try {
          coverImagePath = await uploadCoverImage(novelId, coverImage);
        } catch (uploadError) {
          console.error('Error during image upload:', uploadError);
          // Continue with novel update even if image upload fails
        }
      }
      
      // Update novel
      const { error } = await supabase
        .from('novels')
        .update({
          title: data.title,
          description: data.description,
          cover_image: coverImagePath,
          status: novelStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', novelId);
      
      if (error) throw error;
      
      // Clear existing genre relationships
      const { error: deleteError } = await supabase
        .from('novel_genres')
        .delete()
        .eq('novel_id', novelId);
      
      if (deleteError) {
        console.error('Error removing existing genres:', deleteError);
      }
      
      // Add new genre relationships
      if (selectedGenres.length > 0) {
        const genreInserts = selectedGenres.map(genreId => ({
          novel_id: novelId,
          genre_id: genreId
        }));
        
        const { error: genreError } = await supabase
          .from('novel_genres')
          .insert(genreInserts);
          
        if (genreError) {
          console.error('Error adding genres:', genreError);
        }
      }
      
      toast({
        title: "Novel updated!",
        description: "Your novel has been successfully updated.",
      });

      // Navigate to the manage novels page after successful update
      navigate('/author/novels');
    } catch (error) {
      console.error('Error updating novel:', error);
      toast({
        title: "Error",
        description: "There was an error updating your novel. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleGenreChange = (genreId: string, checked: boolean) => {
    if (checked) {
      setSelectedGenres(prev => [...prev, genreId]);
    } else {
      setSelectedGenres(prev => prev.filter(id => id !== genreId));
    }
  };

  const handleStatusChange = (value: string) => {
    setNovelStatus(value as NovelStatusType);
  };

  if (isLoading) {
    return (
      <Container>
        <div className="py-10">
          <Skeleton className="h-10 w-1/3 mb-6" />
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-1/4" />
              <Skeleton className="h-5 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-1/5" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
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
        <h1 className="text-3xl font-bold mb-6">Edit Novel</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Novel Details</CardTitle>
            <CardDescription>
              Update the details of your novel
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter your novel's title"
                  {...register("title", { required: true })}
                />
                {errors.title && <p className="text-sm text-red-500">Title is required</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter a description for your novel"
                  rows={5}
                  {...register("description", { required: true })}
                />
                {errors.description && <p className="text-sm text-red-500">Description is required</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="coverImage">Cover Image</Label>
                <div className="flex items-center gap-4">
                  {coverImageUrl && (
                    <div className="relative w-24 h-32 bg-muted rounded-md overflow-hidden">
                      <img 
                        src={coverImageUrl} 
                        alt="Cover preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <label 
                      htmlFor="cover-upload" 
                      className="flex items-center justify-center w-full h-24 border-2 border-dashed border-muted-foreground/25 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col items-center space-y-2 text-muted-foreground">
                        <Upload className="h-6 w-6" />
                        <span className="text-sm">Click to upload or replace cover image</span>
                      </div>
                      <input 
                        type="file" 
                        id="cover-upload"
                        className="hidden" 
                        accept="image/*"
                        onChange={handleCoverImageChange}
                      />
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended size: 800x1200 pixels. Max size: 5MB
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={novelStatus}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="hiatus">Hiatus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Genres</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {availableGenres.map((genre) => (
                    <div className="flex items-center space-x-2" key={genre.id}>
                      <Checkbox
                        id={`genre-${genre.id}`}
                        checked={selectedGenres.includes(genre.id)}
                        onCheckedChange={(checked) => 
                          handleGenreChange(genre.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={`genre-${genre.id}`}>{genre.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => navigate('/author/novels')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Container>
  );
};

export default EditNovel;
