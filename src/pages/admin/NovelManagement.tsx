
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { Novel } from '@/types/novels';
import NovelTable from '@/components/admin/novels/NovelTable';
import DeleteNovelDialog from '@/components/admin/novels/DeleteNovelDialog';

const NovelManagement = () => {
  const { toast } = useToast();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);

  useEffect(() => {
    fetchNovels();
  }, []);

  const fetchNovels = async () => {
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

      const transformedData: Novel[] = (data || []).map(novel => ({
        ...novel,
        author: novel.profiles?.display_name || novel.profiles?.username || 'Unknown Author',
        status: (novel.status?.toLowerCase() || 'ongoing') as Novel['status'],
        coverImage: novel.cover_image
      }));
      
      setNovels(transformedData);
    } catch (error: any) {
      console.error('Error fetching novels:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load novels",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNovel) return;
    
    try {
      // First delete related data to avoid foreign key constraint errors
      await deleteRelatedData(selectedNovel.id);
      
      // Then delete the novel
      const { error } = await supabase
        .from('novels')
        .delete()
        .eq('id', selectedNovel.id);

      if (error) throw error;
      
      setNovels(novels.filter(novel => novel.id !== selectedNovel.id));
      toast({
        title: "Novel Deleted",
        description: `Successfully deleted "${selectedNovel.title}"`,
      });
    } catch (error: any) {
      console.error('Error deleting novel:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete novel",
        variant: "destructive",
      });
    } finally {
      setDeleteDialog(false);
      setSelectedNovel(null);
    }
  };

  const deleteRelatedData = async (novelId: string) => {
    try {
      // Delete related records from these tables in sequence
      const tables = [
        'reading_history', 
        'bookmarks', 
        'novel_ratings', 
        'novel_genres', 
        'novel_tags',
        'featured_novels',
        'chapters'
      ];
      
      for (const table of tables) {
        // Use the table name directly without dynamic string for type-safety
        if (table === 'reading_history') {
          await supabase.from('reading_history').delete().eq('novel_id', novelId);
        } else if (table === 'bookmarks') {
          await supabase.from('bookmarks').delete().eq('novel_id', novelId);
        } else if (table === 'novel_ratings') {
          await supabase.from('novel_ratings').delete().eq('novel_id', novelId);
        } else if (table === 'novel_genres') {
          await supabase.from('novel_genres').delete().eq('novel_id', novelId);
        } else if (table === 'novel_tags') {
          await supabase.from('novel_tags').delete().eq('novel_id', novelId);
        } else if (table === 'featured_novels') {
          await supabase.from('featured_novels').delete().eq('novel_id', novelId);
        } else if (table === 'chapters') {
          await supabase.from('chapters').delete().eq('novel_id', novelId);
        }
      }
    } catch (error) {
      console.error('Error deleting related novel data:', error);
      throw error;
    }
  };

  const openDeleteDialog = (novel: Novel) => {
    setSelectedNovel(novel);
    setDeleteDialog(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Manage Novels</h2>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search novels..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <NovelTable 
            novels={novels}
            loading={loading}
            searchQuery={searchQuery}
            openDeleteDialog={openDeleteDialog}
          />
        </CardContent>
      </Card>

      <DeleteNovelDialog 
        open={deleteDialog}
        setOpen={setDeleteDialog}
        selectedNovel={selectedNovel}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default NovelManagement;
