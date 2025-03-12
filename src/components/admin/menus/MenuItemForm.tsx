
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X } from 'lucide-react';

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

interface MenuItemFormProps {
  item: MenuItem | null;
  onSave: (item: MenuItem) => void;
  onCancel: () => void;
  menuItems: MenuItem[];
}

const MenuItemForm: React.FC<MenuItemFormProps> = ({ item, onSave, onCancel, menuItems }) => {
  const [formData, setFormData] = useState<MenuItem>({
    id: '',
    menu_location: 'header',
    title: '',
    url: '',
    display_order: 0,
    parent_id: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  useEffect(() => {
    if (item) {
      setFormData(item);
    }
  }, [item]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value === 'null' ? null : value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Filter out the current item and its children to prevent circular references
  const availableParents = menuItems.filter(menuItem => {
    // Can't select self as parent
    if (formData.id && menuItem.id === formData.id) return false;
    
    // Can't select children as parent (to prevent circular references)
    if (formData.id && menuItem.parent_id === formData.id) return false;
    
    // Can only select items from the same menu location
    if (menuItem.menu_location !== formData.menu_location) return false;
    
    return true;
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="menu_location">Menu Location</Label>
          <Select 
            disabled={!!formData.id} // Can't change location for existing items
            value={formData.menu_location} 
            onValueChange={(value) => handleSelectChange('menu_location', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="header">Header</SelectItem>
              <SelectItem value="footer">Footer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="parent_id">Parent Item (Optional)</Label>
          <Select 
            value={formData.parent_id || 'null'} 
            onValueChange={(value) => handleSelectChange('parent_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="No parent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">No parent</SelectItem>
              {availableParents.map(parent => (
                <SelectItem key={parent.id} value={parent.id}>
                  {parent.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => handleSwitchChange('is_active', checked)}
        />
        <Label htmlFor="is_active">Active</Label>
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <Button type="submit">
          <Save className="mr-2 h-4 w-4" /> Save
        </Button>
      </div>
    </form>
  );
};

export default MenuItemForm;
