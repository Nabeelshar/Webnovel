
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PageTable from '@/components/admin/pages/PageTable';
import PageDialog from '@/components/admin/pages/PageDialog';
import DeletePageDialog from '@/components/admin/pages/DeletePageDialog';
import PagesMenu from '@/components/admin/pages/PagesMenu';

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  created_at: string;
  updated_at: string;
  published: boolean;
  in_menu?: boolean;
  menu_order?: number;
}

const PageManagement = () => {
  const { toast } = useToast();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    published: false,
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPages(data || []);
    } catch (error: any) {
      console.error('Error fetching pages:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load pages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: checked,
    }));
  };

  const generateSlug = () => {
    const title = formData.title.trim();
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setFormData(prevData => ({
      ...prevData,
      slug: slug,
    }));
  };

  const resetForm = () => {
    setOpen(false);
    setFormData({
      title: '',
      slug: '',
      content: '',
      published: false,
    });
  };

  const handleAddEditPage = async () => {
    try {
      if (!formData.title || !formData.slug || !formData.content) {
        toast({
          title: "Error",
          description: "Please fill in all fields.",
          variant: "destructive",
        });
        return;
      }

      if (isEdit && selectedPage) {
        // Update existing page
        const { error } = await supabase
          .from('pages')
          .update({
            title: formData.title,
            slug: formData.slug,
            content: formData.content,
            published: formData.published,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedPage.id);

        if (error) throw error;

        setPages(pages.map(page =>
          page.id === selectedPage.id ? { ...page, ...formData } : page
        ));
        toast({
          title: "Page Updated",
          description: `Page "${formData.title}" has been updated.`,
        });
      } else {
        // Add new page
        const { data, error } = await supabase
          .from('pages')
          .insert([
            {
              title: formData.title,
              slug: formData.slug,
              content: formData.content,
              published: formData.published,
            },
          ])
          .select();

        if (error) throw error;

        setPages([...pages, data![0]]);
        toast({
          title: "Page Added",
          description: `Page "${formData.title}" has been created.`,
        });
      }
      resetForm();
    } catch (error: any) {
      console.error('Error adding/editing page:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add/edit page",
        variant: "destructive",
      });
    } finally {
      setOpen(false);
    }
  };

  const openEditDialog = (page: Page) => {
    setIsEdit(true);
    setSelectedPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content,
      published: page.published,
    });
    setOpen(true);
  };

  const openDeleteDialog = (page: Page) => {
    setSelectedPage(page);
    setDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedPage) return;

    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', selectedPage.id);

      if (error) throw error;

      setPages(pages.filter(page => page.id !== selectedPage.id));
      toast({
        title: "Page Deleted",
        description: `Page "${selectedPage.title}" has been deleted.`,
      });
    } catch (error: any) {
      console.error('Error deleting page:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete page",
        variant: "destructive",
      });
    } finally {
      setDeleteDialog(false);
      setSelectedPage(null);
    }
  };

  const togglePublished = async (page: Page) => {
    try {
      const { error } = await supabase
        .from('pages')
        .update({ published: !page.published })
        .eq('id', page.id);

      if (error) throw error;

      setPages(pages.map(p =>
        p.id === page.id ? { ...p, published: !p.published } : p
      ));
      toast({
        title: "Page Status Updated",
        description: `Page "${page.title}" is now ${!page.published ? 'published' : 'unpublished'}.`,
      });
    } catch (error: any) {
      console.error('Error toggling published status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update page status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manage Pages</h2>
        <Button onClick={() => {
          resetForm();
          setIsEdit(false);
          setOpen(true);
        }}>
          Add New Page
        </Button>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardContent className="p-0">
            <PageTable 
              pages={pages}
              loading={loading}
              openEditDialog={openEditDialog}
              openDeleteDialog={openDeleteDialog}
              togglePublished={togglePublished}
            />
          </CardContent>
        </Card>

        <PagesMenu />
      </div>

      <PageDialog
        open={open}
        setOpen={setOpen}
        formData={formData}
        handleInputChange={handleInputChange}
        handleCheckboxChange={handleCheckboxChange}
        generateSlug={generateSlug}
        resetForm={resetForm}
        handleAddEditPage={handleAddEditPage}
        isEdit={isEdit}
      />

      <DeletePageDialog
        open={deleteDialog}
        setOpen={setDeleteDialog}
        selectedPage={selectedPage}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default PageManagement;
