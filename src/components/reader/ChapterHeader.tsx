
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookmarkPlus, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChapterHeaderProps {
  novelId: string;
  novelTitle: string;
  authorName: string;
  bookmarked: boolean;
  handleToggleBookmark: () => void;
}

const ChapterHeader = ({
  novelId,
  novelTitle,
  authorName,
  bookmarked,
  handleToggleBookmark
}: ChapterHeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/novel/${novelId}`)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="ml-2">
          <h2 className="text-lg font-medium line-clamp-1">{novelTitle}</h2>
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
  );
};

export default ChapterHeader;
