
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import Container from '@/components/common/Container';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Genre {
  id: string;
  name: string;
  novelCount?: number;
}

const fetchGenres = async (): Promise<Genre[]> => {
  // First get all genres
  const { data: genres, error } = await supabase
    .from('genres')
    .select('*')
    .order('name');
  
  if (error) {
    throw error;
  }
  
  // For each genre, count the novels
  const genresWithCounts = await Promise.all(
    genres.map(async (genre) => {
      const { count, error: countError } = await supabase
        .from('novel_genres')
        .select('*', { count: 'exact', head: true })
        .eq('genre_id', genre.id);
      
      return {
        ...genre,
        novelCount: count || 0
      };
    })
  );
  
  return genresWithCounts;
};

const Genres = () => {
  const { data: genres, isLoading, error } = useQuery({
    queryKey: ['genres'],
    queryFn: fetchGenres,
  });

  return (
    <Container>
      <div className="py-10">
        <h1 className="text-3xl font-bold mb-6">Browse by Genre</h1>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <h3 className="text-lg font-medium text-red-500">Error loading genres</h3>
            <p className="text-muted-foreground mt-2">Please try again later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {genres?.map((genre) => (
              <Link key={genre.id} to={`/browse?genre=${genre.name}`}>
                <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                  <CardContent className="flex flex-col items-center justify-center h-full p-6">
                    <h3 className="text-xl font-semibold text-center mb-2">{genre.name}</h3>
                    <p className="text-muted-foreground text-sm text-center">
                      {genre.novelCount} {genre.novelCount === 1 ? 'novel' : 'novels'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export default Genres;
