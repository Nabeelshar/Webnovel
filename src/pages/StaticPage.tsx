
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Container from '@/components/common/Container';

interface PageData {
  id: string;
  title: string;
  content: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

const StaticPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!slug) {
          setError('Page not found');
          return;
        }

        const { data, error } = await supabase
          .from('pages')
          .select('*')
          .eq('slug', slug)
          .eq('published', true)
          .single();

        if (error) {
          console.error('Error fetching page:', error);
          setError('This page does not exist or is no longer available');
          return;
        }

        setPage(data);
      } catch (err) {
        console.error('Error in fetchPage:', err);
        setError('Failed to load page content');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <Container className="py-12">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </Container>
    );
  }

  if (error || !page) {
    return (
      <Container className="py-12">
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl font-bold">Page Not Found</h1>
          <p className="mt-4 text-muted-foreground max-w-md">
            {error || 'The page you are looking for does not exist or is no longer available.'}
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <article className="prose prose-primary dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold mb-8">{page.title}</h1>
        
        <div className="mt-8">
          {/* This would ideally be a rich text renderer or markdown renderer */}
          <div dangerouslySetInnerHTML={{ __html: page.content.replace(/\n/g, '<br />') }} />
        </div>
        
        <div className="mt-16 pt-8 border-t text-sm text-muted-foreground">
          <p>Last updated: {new Date(page.updated_at).toLocaleDateString()}</p>
        </div>
      </article>
    </Container>
  );
};

export default StaticPage;
