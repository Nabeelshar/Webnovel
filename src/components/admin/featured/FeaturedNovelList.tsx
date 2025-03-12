
import React from 'react';
import { Star, XCircle } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Novel } from '@/types/novels';

interface FeaturedNovelListProps {
  featuredNovels: Novel[];
  loading: boolean;
  removeFromFeatured: (novelId: string) => void;
}

const FeaturedNovelList = ({ featuredNovels, loading, removeFromFeatured }: FeaturedNovelListProps) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Genre</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {featuredNovels.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No featured novels. Click "Add Novel to Featured" to feature novels.
              </TableCell>
            </TableRow>
          ) : (
            featuredNovels.map((novel) => (
              <TableRow key={novel.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <Star className="text-yellow-500 h-4 w-4 mr-2" />
                    {novel.title}
                  </div>
                </TableCell>
                <TableCell>
                  {novel.profiles?.display_name || novel.profiles?.username || novel.author || 'Unknown author'}
                </TableCell>
                <TableCell>
                  Fantasy, Adventure {/* This would come from novel_genres in a real app */}
                </TableCell>
                <TableCell>{novel.rating ? novel.rating.toFixed(1) : 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeFromFeatured(novel.id)}
                  >
                    <XCircle size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default FeaturedNovelList;
