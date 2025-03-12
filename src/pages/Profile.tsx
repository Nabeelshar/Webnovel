
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import NovelCard from '@/components/novels/NovelCard';
import { Novel } from '@/types/novels';
import { useToast } from '@/components/ui/use-toast';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [bookmarkedNovels, setBookmarkedNovels] = useState<Novel[]>([]);
  const [readingHistory, setReadingHistory] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }

    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch bookmarked novels
        const { data: bookmarks, error: bookmarksError } = await supabase
          .from('bookmarks')
          .select('novel_id')
          .eq('user_id', user.id);

        if (bookmarksError) throw bookmarksError;

        if (bookmarks && bookmarks.length > 0) {
          const novelIds = bookmarks.map(bookmark => bookmark.novel_id);
          
          const { data: novels, error: novelsError } = await supabase
            .from('novels')
            .select(`
              *,
              profiles!novels_author_id_fkey(username, display_name)
            `)
            .in('id', novelIds);

          if (novelsError) throw novelsError;

          if (novels) {
            const formattedNovels = novels.map(novel => {
              return {
                id: novel.id,
                title: novel.title,
                author: novel.profiles?.display_name || novel.profiles?.username || 'Unknown Author',
                authorId: novel.author_id,
                coverImage: novel.cover_image || '/placeholder.svg',
                rating: novel.rating || 0,
                views: novel.views || 0,
                bookmarks: novel.bookmarks || 0,
                genres: [],
                status: novel.status as "Ongoing" | "Completed" | "Hiatus",
                chapters: [],
                tags: [],
                createdAt: novel.created_at,
                updatedAt: novel.updated_at,
                description: novel.description || '',
              };
            });
            setBookmarkedNovels(formattedNovels as Novel[]);
          }
        }

        // Fetch reading history
        const { data: history, error: historyError } = await supabase
          .from('reading_history')
          .select('novel_id')
          .eq('user_id', user.id)
          .order('read_at', { ascending: false })
          .limit(10);

        if (historyError) throw historyError;

        if (history && history.length > 0) {
          const novelIds = history.map(item => item.novel_id);
          const uniqueNovelIds = [...new Set(novelIds)];
          
          const { data: novels, error: novelsError } = await supabase
            .from('novels')
            .select(`
              *,
              profiles!novels_author_id_fkey(username, display_name)
            `)
            .in('id', uniqueNovelIds);

          if (novelsError) throw novelsError;

          if (novels) {
            const formattedNovels = novels.map(novel => {
              return {
                id: novel.id,
                title: novel.title,
                author: novel.profiles?.display_name || novel.profiles?.username || 'Unknown Author',
                authorId: novel.author_id,
                coverImage: novel.cover_image || '/placeholder.svg',
                rating: novel.rating || 0,
                views: novel.views || 0,
                bookmarks: novel.bookmarks || 0,
                genres: [],
                status: novel.status as "Ongoing" | "Completed" | "Hiatus",
                chapters: [],
                tags: [],
                createdAt: novel.created_at,
                updatedAt: novel.updated_at,
                description: novel.description || '',
              };
            });
            setReadingHistory(formattedNovels as Novel[]);
          }
        }

      } catch (error) {
        console.error('Error fetching profile data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [user, navigate, toast]);

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center">
          <p>Profile not found</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatar_url || ''} alt={profile.display_name || profile.username} />
              <AvatarFallback>{(profile.display_name || profile.username || 'User')[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{profile.display_name || profile.username}</CardTitle>
              {profile.display_name && profile.username && (
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              )}
              {profile.bio && (
                <p className="mt-2 text-sm">{profile.bio}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{profile.coins}</p>
              <p className="text-sm text-muted-foreground">Coins</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{bookmarkedNovels.length}</p>
              <p className="text-sm text-muted-foreground">Bookmarked Novels</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm">
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="bookmarks">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bookmarks">Bookmarked Novels</TabsTrigger>
          <TabsTrigger value="history">Reading History</TabsTrigger>
        </TabsList>
        <TabsContent value="bookmarks">
          {bookmarkedNovels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {bookmarkedNovels.map((novel) => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">You haven't bookmarked any novels yet.</p>
              <Button onClick={() => navigate('/browse')} className="mt-4">
                Browse Novels
              </Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="history">
          {readingHistory.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {readingHistory.map((novel) => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">You haven't read any novels yet.</p>
              <Button onClick={() => navigate('/browse')} className="mt-4">
                Browse Novels
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
