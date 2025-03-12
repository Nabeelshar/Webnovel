
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Chapter } from '@/types/novels';

interface ChapterNavigationProps {
  prevChapter: Chapter | null;
  nextChapter: Chapter | null;
  novelId: string;
  navigateToChapter: (chapterNum: number) => void;
}

const ChapterNavigation = ({ prevChapter, nextChapter, novelId, navigateToChapter }: ChapterNavigationProps) => {
  return (
    <div className="flex justify-between pt-4 pb-6">
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
    </div>
  );
};

export default ChapterNavigation;
