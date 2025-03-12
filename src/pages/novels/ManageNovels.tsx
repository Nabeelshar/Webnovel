
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Novel } from '@/types/novels';
import Container from '@/components/common/Container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, BookOpen, Eye, Star, Edit2, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthorNovel extends Novel {
  _count: {
    chapters: number;
  };
}

const ManageNovels = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [novels, setNovels] = useState<AuthorNovel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }

    const fetchNovels = async () => {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('novels')
        .select(`
          *,
          novel_genres!inner(genres(*)),
          chapters(count)
        `)
        .eq('author_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching novels:', error);
        setIsLoading(false);
        return;
      }

      if (data) {
        // Transform the data to match our Novel type with chapter count
        const transformedData = data.map(novel => ({
          id: novel.id,
          title: novel.title,
          author: user.user_metadata.name || 'Anonymous',
          authorId: novel.author_id,
          coverImage: novel.cover_image || 'https://picsum.photos/800/1200',
          description: novel.description || '',
          rating: novel.rating || 0,
          views: novel.views || 0,
          bookmarks: novel.bookmarks || 0,
          genres: novel.novel_genres?.map((ng: any) => ng.genres.name) || [],
          status: novel.status as 'Ongoing' | 'Completed' | 'Hiatus',
          tags: [],
          createdAt: novel.created_at,
          updatedAt: novel.updated_at,
          chapters: [],
          _count: {
            chapters: novel.chapters?.[0]?.count || 0
          }
        }));

        setNovels(transformedData);
      }
      
      setIsLoading(false);
    };

    fetchNovels();
  }, [user, navigate]);

  return (
    <Container>
      <div className="py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Novels</h1>
          <Button onClick={() => navigate('/author/novels/create')}>
            <Plus className="mr-2 h-4 w-4" /> Create New Novel
          </Button>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="flex mb-4">
                    <Skeleton className="h-32 w-24 rounded-md mr-4" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-9 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : novels.length === 0 ? (
          <Card className="p-10 text-center">
            <CardTitle className="mb-4">No Novels Yet</CardTitle>
            <CardDescription className="mb-6">
              You haven't created any novels yet. Click the button below to create your first novel.
            </CardDescription>
            <Button onClick={() => navigate('/author/novels/create')}>
              <Plus className="mr-2 h-4 w-4" /> Create New Novel
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {novels.map((novel) => (
              <Card key={novel.id}>
                <CardHeader>
                  <CardTitle className="line-clamp-1">{novel.title}</CardTitle>
                  <CardDescription>
                    <span className="capitalize">{novel.status}</span> • {novel._count.chapters} chapter{novel._count.chapters !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex mb-4">
                    <div className="flex-shrink-0 w-24 h-32 bg-muted rounded-md overflow-hidden">
                      <img 
                        src={novel.coverImage} 
                        alt={novel.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://picsum.photos/800/1200';
                        }}
                      />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                        {novel.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1 text-muted-foreground" />
                          <span>{novel.views.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-1 text-amber-500 fill-amber-500" />
                          <span>{novel.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <div className="w-full grid grid-cols-2 gap-2">
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={`/author/novels/${novel.id}/edit`}>
                        <Edit2 className="w-4 h-4 mr-2" /> Edit Novel
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={`/author/novels/${novel.id}/chapters`}>
                        <FileText className="w-4 h-4 mr-2" /> Manage Chapters
                      </Link>
                    </Button>
                  </div>
                  <Button variant="default" className="w-full" asChild>
                    <Link to={`/novel/${novel.id}`}>
                      <BookOpen className="w-4 h-4 mr-2" /> View Novel
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export default ManageNovels;
