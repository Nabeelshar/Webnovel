
import React from 'react';
import { Link } from 'react-router-dom';
import { Star, BookOpen, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Novel } from '@/types/novels';

export interface NovelCardProps {
  id?: string;
  title?: string;
  author?: string;
  coverImage?: string;
  rating?: number;
  genres?: string[];
  views?: number;
  bookmarks?: number;
  className?: string;
  novel?: Novel;
}

const NovelCard: React.FC<NovelCardProps> = ({
  id,
  title,
  author,
  coverImage,
  rating = 0,
  genres = [],
  views = 0,
  bookmarks = 0,
  className,
  novel
}) => {
  // If novel prop is provided, use its properties
  const novelId = novel?.id || id;
  const novelTitle = novel?.title || title;
  const novelAuthor = novel?.author || author;
  const novelCover = novel?.coverImage || coverImage;
  const novelRating = novel?.rating || rating;
  const novelGenres = novel?.genres || genres;
  const novelViews = novel?.views || views;
  const novelBookmarks = novel?.bookmarks || bookmarks;

  return (
    <div 
      className={cn(
        "neo-card rounded-xl overflow-hidden animate-fade-in", 
        className
      )}
    >
      <Link to={`/novel/${novelId}`} className="group block">
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={novelCover} 
            alt={novelTitle}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs">{novelViews.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span className="text-xs">{novelBookmarks.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>

      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
              <Link to={`/novel/${novelId}`}>{novelTitle}</Link>
            </h3>
            <p className="text-sm text-muted-foreground">by {novelAuthor}</p>
          </div>
          <div className="flex items-center">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="ml-1 text-sm">{(typeof novelRating === 'number' ? novelRating.toFixed(1) : '0.0')}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          {novelGenres.slice(0, 2).map((genre, index) => (
            <span 
              key={index}
              className="inline-block px-2 py-0.5 bg-secondary text-xs rounded-full"
            >
              {genre}
            </span>
          ))}
          {novelGenres.length > 2 && (
            <span className="inline-block px-2 py-0.5 bg-secondary text-xs rounded-full">
              +{novelGenres.length - 2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NovelCard;
