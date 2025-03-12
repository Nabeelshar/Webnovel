
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { Novel } from '@/types/novels';
import FeaturedNovelList from '@/components/admin/featured/FeaturedNovelList';
import NovelSelectionDialog from '@/components/admin/featured/NovelSelectionDialog';

const FeaturedContent = () => {
  const { toast } = useToast();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [featuredNovels, setFeaturedNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialog, setAddDialog] = useState(false);

  useEffect(() => {
    fetchFeaturedNovels();
  }, []);

  const fetchFeaturedNovels = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('novels')
        .select(`
          *,
          profiles:author_id(username, display_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Novel type
      const transformedData: Novel[] = (data || []).map(novel => ({
        ...novel,
        author: novel.profiles?.display_name || novel.profiles?.username || 'Unknown Author',
        status: (novel.status?.toLowerCase() || 'ongoing') as Novel['status'],
        coverImage: novel.cover_image
      }));
      
      setNovels(transformedData);
      // Only set first 4 as featured
      setFeaturedNovels(transformedData.slice(0, 4));
    } catch (error: any) {
      console.error('Error fetching featured novels:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load featured content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToFeatured = (novel: Novel) => {
    if (featuredNovels.find(n => n.id === novel.id)) {
      toast({
        title: "Already Featured",
        description: "This novel is already in your featured list",
        variant: "destructive",
      });
      return;
    }
    
    // In a real application, you would update your database
    setFeaturedNovels([...featuredNovels, novel]);
    setAddDialog(false);
    
    toast({
      title: "Novel Featured",
      description: `"${novel.title}" has been added to featured novels`,
    });
  };

  const removeFromFeatured = (novelId: string) => {
    // In a real application, you would update your database
    setFeaturedNovels(featuredNovels.filter(novel => novel.id !== novelId));
    
    toast({
      title: "Novel Removed",
      description: "Novel has been removed from featured list",
    });
  };

  const nonFeaturedNovels = novels.filter(
    novel => !featuredNovels.some(featured => featured.id === novel.id)
  );

  const filteredNonFeaturedNovels = nonFeaturedNovels.filter(novel => 
    novel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    novel.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (novel.profiles as any)?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Featured Content</h2>
        <p className="text-muted-foreground mt-1">
          Manage the novels that appear in the featured section on the homepage.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Currently Featured</CardTitle>
          <CardDescription>
            These novels will be displayed in the featured section of your site.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <FeaturedNovelList 
            featuredNovels={featuredNovels}
            loading={loading}
            removeFromFeatured={removeFromFeatured}
          />
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button onClick={() => setAddDialog(true)}>
          <Star className="mr-2 h-4 w-4" />
          Add Novel to Featured
        </Button>
      </div>

      <NovelSelectionDialog 
        open={addDialog}
        setOpen={setAddDialog}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredNovels={filteredNonFeaturedNovels}
        addToFeatured={addToFeatured}
      />
    </div>
  );
};

export default FeaturedContent;
