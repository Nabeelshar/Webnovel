
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  GripVertical, 
  Eye, 
  EyeOff,
  Trash, 
  FileText,
  Menu as MenuIcon
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

interface Page {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  in_menu: boolean;
  menu_order: number;
  content: string;
  created_at: string;
  updated_at: string;
}

const PagesMenu = () => {
  const { toast } = useToast();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('menu_order', { ascending: true });

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

  const toggleMenuStatus = async (page: Page) => {
    try {
      const updatedInMenu = !page.in_menu;
      let updatedMenuOrder = page.menu_order;
      
      // If adding to menu, assign the next highest menu_order
      if (updatedInMenu && !page.in_menu) {
        const maxOrder = Math.max(0, ...pages.filter(p => p.in_menu).map(p => p.menu_order));
        updatedMenuOrder = maxOrder + 1;
      }
      
      const { error } = await supabase
        .from('pages')
        .update({ 
          in_menu: updatedInMenu,
          menu_order: updatedMenuOrder
        })
        .eq('id', page.id);

      if (error) throw error;
      
      // Update local state
      setPages(pages.map(p => 
        p.id === page.id 
          ? { ...p, in_menu: updatedInMenu, menu_order: updatedMenuOrder } 
          : p
      ));
      
      toast({
        title: updatedInMenu ? "Added to Menu" : "Removed from Menu",
        description: `"${page.title}" has been ${updatedInMenu ? 'added to' : 'removed from'} the navigation menu`,
      });
    } catch (error: any) {
      console.error('Error updating menu status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update menu",
        variant: "destructive",
      });
    }
  };

  const updateMenuOrder = async (pageId: string, newOrder: number) => {
    if (newOrder < 1) newOrder = 1;
    
    try {
      const { error } = await supabase
        .from('pages')
        .update({ menu_order: newOrder })
        .eq('id', pageId);

      if (error) throw error;
      
      // Update local state and re-sort
      const updatedPages = pages.map(p => 
        p.id === pageId ? { ...p, menu_order: newOrder } : p
      );
      
      // Sort by menu_order
      updatedPages.sort((a, b) => {
        if (!a.in_menu && !b.in_menu) return 0;
        if (!a.in_menu) return 1;
        if (!b.in_menu) return -1;
        return a.menu_order - b.menu_order;
      });
      
      setPages(updatedPages);
    } catch (error: any) {
      console.error('Error updating menu order:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update menu order",
        variant: "destructive",
      });
    }
  };

  // Get only the pages that are in the menu
  const menuPages = pages.filter(page => page.in_menu).sort((a, b) => a.menu_order - b.menu_order);
  const nonMenuPages = pages.filter(page => !page.in_menu);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MenuIcon className="mr-2 h-5 w-5" />
          Navigation Menu
        </CardTitle>
        <CardDescription>
          Manage which pages appear in the site's navigation menu and their order.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="loading loading-spinner loading-md"></div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Menu Items</h3>
              {menuPages.length === 0 ? (
                <div className="text-muted-foreground text-center py-6 border rounded-md">
                  No pages are currently in the menu. Add pages from the list below.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Page Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {menuPages.map((page) => (
                      <TableRow key={page.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <Input 
                              type="number"
                              min="1"
                              value={page.menu_order}
                              onChange={(e) => updateMenuOrder(page.id, parseInt(e.target.value))}
                              className="w-16 h-8"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                            {page.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          {page.published ? (
                            <span className="flex items-center text-xs text-green-600">
                              <Eye className="h-3 w-3 mr-1" /> Published
                            </span>
                          ) : (
                            <span className="flex items-center text-xs text-amber-600">
                              <EyeOff className="h-3 w-3 mr-1" /> Draft
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleMenuStatus(page)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Available Pages</h3>
              {nonMenuPages.length === 0 ? (
                <div className="text-muted-foreground text-center py-6 border rounded-md">
                  All pages are already in the menu.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page Title</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">In Menu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nonMenuPages.map((page) => (
                      <TableRow key={page.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                            {page.title}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          /{page.slug}
                        </TableCell>
                        <TableCell>
                          {page.published ? (
                            <span className="flex items-center text-xs text-green-600">
                              <Eye className="h-3 w-3 mr-1" /> Published
                            </span>
                          ) : (
                            <span className="flex items-center text-xs text-amber-600">
                              <EyeOff className="h-3 w-3 mr-1" /> Draft
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Switch 
                            checked={page.in_menu}
                            onCheckedChange={() => toggleMenuStatus(page)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PagesMenu;
