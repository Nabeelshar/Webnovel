
import React from 'react';
import { Link } from 'react-router-dom';
import { Novel } from '@/types/novels';
import { Button } from '@/components/ui/button';
import { Edit, Trash, Eye } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface NovelTableProps {
  novels: Novel[];
  loading: boolean;
  searchQuery: string;
  openDeleteDialog: (novel: Novel) => void;
}

const NovelTable = ({ novels, loading, searchQuery, openDeleteDialog }: NovelTableProps) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  const filteredNovels = novels.filter(novel => 
    novel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    novel.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (novel.profiles as any)?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredNovels.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No novels matching your search" : "No novels found"}
              </TableCell>
            </TableRow>
          ) : (
            filteredNovels.map((novel) => (
              <TableRow key={novel.id}>
                <TableCell className="font-medium">{novel.title}</TableCell>
                <TableCell>
                  {novel.profiles?.display_name || novel.profiles?.username || 'Unknown author'}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    novel.status.toLowerCase() === 'completed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {novel.status.charAt(0).toUpperCase() + novel.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>{novel.rating ? novel.rating.toFixed(1) : 'N/A'}</TableCell>
                <TableCell>{new Date(novel.created_at || novel.createdAt || '').toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link to={`/novel/${novel.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye size={16} />
                      </Button>
                    </Link>
                    <Link to={`/author/novels/${novel.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit size={16} />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => openDeleteDialog(novel)}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default NovelTable;
