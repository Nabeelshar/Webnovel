
import { supabase } from '@/integrations/supabase/client';
import { Novel, Chapter } from '@/types/novels';

export const getFeaturedNovel = async (): Promise<Novel | null> => {
  try {
    const { data, error } = await supabase
      .from('novels')
      .select(`
        *,
        author:profiles(username, display_name, avatar_url),
        novel_genres:novel_genres(genres(*)),
        novel_tags:novel_tags(tags(*)),
        chapters:chapters(*)
      `)
      .order('views', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching featured novel:', error);
      return null;
    }

    if (!data) return null;

    // Transform the data to match our Novel type
    const novel: Novel = {
      id: data.id,
      title: data.title,
      author: data.author.display_name || data.author.username,
      authorId: data.author_id,
      coverImage: data.cover_image || 'https://picsum.photos/800/1200', // Fallback image
      description: data.description || '',
      rating: data.rating || 0,
      views: data.views || 0,
      bookmarks: data.bookmarks || 0,
      chapters: data.chapters.map((chapter: any) => ({
        id: chapter.id,
        title: chapter.title,
        chapterNumber: chapter.chapter_number,
        content: chapter.content,
        views: chapter.views,
        createdAt: chapter.created_at,
        isPremium: chapter.is_premium
      })),
      genres: data.novel_genres.map((ng: any) => ng.genres.name),
      status: data.status as 'Ongoing' | 'Completed' | 'Hiatus',
      tags: data.novel_tags.map((nt: any) => nt.tags.name),
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    return novel;
  } catch (error) {
    console.error('Error in getFeaturedNovel:', error);
    return null;
  }
};

export const getNovel = async (id: string): Promise<Novel | null> => {
  try {
    const { data, error } = await supabase
      .from('novels')
      .select(`
        *,
        author:profiles(username, display_name, avatar_url),
        novel_genres:novel_genres(genres(*)),
        novel_tags:novel_tags(tags(*)),
        chapters:chapters(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching novel:', error);
      return null;
    }

    if (!data) return null;

    // Transform the data to match our Novel type
    const novel: Novel = {
      id: data.id,
      title: data.title,
      author: data.author.display_name || data.author.username,
      authorId: data.author_id,
      coverImage: data.cover_image || 'https://picsum.photos/800/1200', // Fallback image
      description: data.description || '',
      rating: data.rating || 0,
      views: data.views || 0,
      bookmarks: data.bookmarks || 0,
      chapters: data.chapters.map((chapter: any) => ({
        id: chapter.id,
        title: chapter.title,
        chapterNumber: chapter.chapter_number,
        content: chapter.content,
        views: chapter.views,
        createdAt: chapter.created_at,
        isPremium: chapter.is_premium
      })),
      genres: data.novel_genres.map((ng: any) => ng.genres.name),
      status: data.status as 'Ongoing' | 'Completed' | 'Hiatus',
      tags: data.novel_tags.map((nt: any) => nt.tags.name),
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    return novel;
  } catch (error) {
    console.error('Error in getNovel:', error);
    return null;
  }
};

export const getChapter = async (novelId: string, chapterId: string): Promise<(Chapter & { novel: Novel }) | null> => {
  try {
    // First get the chapter
    const { data: chapterData, error: chapterError } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .eq('novel_id', novelId)
      .single();

    if (chapterError) {
      console.error('Error fetching chapter:', chapterError);
      return null;
    }

    // Then get the novel
    const novel = await getNovel(novelId);
    if (!novel) return null;

    const chapter: Chapter & { novel: Novel } = {
      id: chapterData.id,
      title: chapterData.title,
      chapterNumber: chapterData.chapter_number,
      content: chapterData.content,
      views: chapterData.views,
      createdAt: chapterData.created_at,
      isPremium: chapterData.is_premium,
      novel
    };

    return chapter;
  } catch (error) {
    console.error('Error in getChapter:', error);
    return null;
  }
};

export const getRelatedNovels = async (novelId: string, limit = 4): Promise<Novel[]> => {
  try {
    // Get the genres of the current novel
    const { data: novelGenres, error: genresError } = await supabase
      .from('novel_genres')
      .select('genre_id')
      .eq('novel_id', novelId);

    if (genresError) {
      console.error('Error fetching novel genres:', genresError);
      return [];
    }

    const genreIds = novelGenres.map(g => g.genre_id);

    // Get novels with similar genres, excluding the current novel
    const { data, error } = await supabase
      .from('novels')
      .select(`
        *,
        author:profiles(username, display_name, avatar_url),
        novel_genres!inner(genre_id),
        chapters:chapters(count)
      `)
      .neq('id', novelId)
      .in('novel_genres.genre_id', genreIds)
      .order('views', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching related novels:', error);
      return [];
    }

    // Transform the data to match our Novel type
    const novels: Novel[] = data.map((novel: any) => ({
      id: novel.id,
      title: novel.title,
      author: novel.author?.display_name || novel.author?.username || 'Unknown Author',
      authorId: novel.author_id,
      coverImage: novel.cover_image || 'https://picsum.photos/800/1200',
      description: novel.description || '',
      rating: novel.rating || 0,
      views: novel.views || 0,
      bookmarks: novel.bookmarks || 0,
      chapters: [], // We don't need chapter details here
      genres: [], // We'll fetch this separately if needed
      status: novel.status as 'Ongoing' | 'Completed' | 'Hiatus',
      tags: [], // We'll fetch this separately if needed
      createdAt: novel.created_at,
      updatedAt: novel.updated_at
    }));

    return novels;
  } catch (error) {
    console.error('Error in getRelatedNovels:', error);
    return [];
  }
};
