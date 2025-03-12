
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Save, ArrowUp, ArrowDown, Trash } from 'lucide-react';
import MenuItemForm from '@/components/admin/menus/MenuItemForm';
import MenuItemsTable from '@/components/admin/menus/MenuItemsTable';
import SiteSettingsForm from '@/components/admin/settings/SiteSettingsForm';

interface MenuItem {
  id: string;
  menu_location: string;
  title: string;
  url: string;
  display_order: number;
  parent_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const MenuManagement = () => {
  const { toast } = useToast();
  const [headerMenuItems, setHeaderMenuItems] = useState<MenuItem[]>([]);
  const [footerMenuItems, setFooterMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("header");

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      const header = data?.filter(item => item.menu_location === 'header') || [];
      const footer = data?.filter(item => item.menu_location === 'footer') || [];
      
      setHeaderMenuItems(header);
      setFooterMenuItems(footer);
    } catch (error: any) {
      console.error('Error fetching menu items:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load menu items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleAdd = (location: 'header' | 'footer') => {
    const newItem: MenuItem = {
      id: '',
      menu_location: location,
      title: '',
      url: '',
      display_order: location === 'header' 
        ? headerMenuItems.length 
        : footerMenuItems.length,
      parent_id: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setEditingItem(newItem);
    setShowForm(true);
    setActiveTab(location); // Switch to the correct tab
  };

  const handleSave = async (item: MenuItem) => {
    try {
      if (item.id) {
        // Update existing item
        const { error } = await supabase
          .from('menu_items')
          .update({
            title: item.title,
            url: item.url,
            is_active: item.is_active,
            display_order: item.display_order,
            parent_id: item.parent_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        if (error) throw error;
        
        toast({
          title: "Menu Item Updated",
          description: "The menu item has been updated successfully.",
        });
      } else {
        // Create new item
        const { error } = await supabase
          .from('menu_items')
          .insert({
            menu_location: item.menu_location,
            title: item.title,
            url: item.url,
            display_order: item.display_order,
            parent_id: item.parent_id,
            is_active: item.is_active
          });

        if (error) throw error;
        
        toast({
          title: "Menu Item Created",
          description: "The menu item has been created successfully.",
        });
      }

      // Refresh the list
      fetchMenuItems();
      setShowForm(false);
      setEditingItem(null);
      
    } catch (error: any) {
      console.error('Error saving menu item:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save menu item",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // First check if item has children
      const { data: children, error: childError } = await supabase
        .from('menu_items')
        .select('id')
        .eq('parent_id', id);
      
      if (childError) throw childError;
      
      if (children && children.length > 0) {
        toast({
          title: "Cannot Delete",
          description: "This menu item has child items. Please delete them first.",
          variant: "destructive",
        });
        return;
      }
      
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Menu Item Deleted",
        description: "The menu item has been deleted successfully.",
      });
      
      // Refresh the list
      fetchMenuItems();
      
    } catch (error: any) {
      console.error('Error deleting menu item:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete menu item",
        variant: "destructive",
      });
    }
  };

  const handleMoveItem = async (id: string, direction: 'up' | 'down', location: string) => {
    const items = location === 'header' ? headerMenuItems : footerMenuItems;
    const currentIndex = items.findIndex(item => item.id === id);
    
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === items.length - 1)
    ) {
      return; // Can't move further
    }
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const targetItem = items[newIndex];
    const currentItem = items[currentIndex];
    
    try {
      // Update both items in a batch
      const batch = [
        {
          id: currentItem.id,
          display_order: targetItem.display_order
        },
        {
          id: targetItem.id,
          display_order: currentItem.display_order
        }
      ];
      
      for (const item of batch) {
        const { error } = await supabase
          .from('menu_items')
          .update({ 
            display_order: item.display_order,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);
        
        if (error) throw error;
      }
      
      toast({
        title: "Order Updated",
        description: "Menu item order has been updated successfully.",
      });
      
      // Refresh the list
      fetchMenuItems();
      
    } catch (error: any) {
      console.error('Error updating menu item order:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update menu item order",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Menu Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Manage the header and footer menus of your website. Changes will be reflected immediately on the site.
          </p>
        </CardContent>
      </Card>

      <SiteSettingsForm />

      {showForm && (
        <Card className="my-6">
          <CardHeader>
            <CardTitle>{editingItem?.id ? 'Edit Menu Item' : 'Add Menu Item'}</CardTitle>
          </CardHeader>
          <CardContent>
            <MenuItemForm
              item={editingItem}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditingItem(null);
              }}
              menuItems={[...headerMenuItems, ...footerMenuItems]}
            />
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="header" value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="header">Header Menu</TabsTrigger>
          <TabsTrigger value="footer">Footer Menu</TabsTrigger>
        </TabsList>

        <TabsContent value="header" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button onClick={() => handleAdd('header')}>
              <Plus className="mr-2 h-4 w-4" /> Add Header Item
            </Button>
          </div>
          
          <MenuItemsTable 
            items={headerMenuItems}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMove={handleMoveItem}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="footer" className="mt-6">
          <div className="flex justify-end mb-4">
            <Button onClick={() => handleAdd('footer')}>
              <Plus className="mr-2 h-4 w-4" /> Add Footer Item
            </Button>
          </div>
          
          <MenuItemsTable 
            items={footerMenuItems}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMove={handleMoveItem}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MenuManagement;
