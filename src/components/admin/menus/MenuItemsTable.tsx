import React from 'react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Edit, Trash, ExternalLink } from 'lucide-react';

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

interface MenuItemsTableProps {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down', location: string) => void;
  loading: boolean;
}

const MenuItemsTable: React.FC<MenuItemsTableProps> = ({ 
  items, 
  onEdit, 
  onDelete, 
  onMove,
  loading 
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md bg-muted/40">
        <p className="text-muted-foreground">No menu items found. Add your first item using the button above.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>URL</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, index) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">
              <div className="flex items-center space-x-2">
                <span>{index + 1}</span>
                <div className="flex flex-col">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => onMove(item.id, 'up', item.menu_location)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => onMove(item.id, 'down', item.menu_location)}
                    disabled={index === items.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TableCell>
            <TableCell>
              {item.title}
              {item.parent_id && <span className="ml-2 text-xs text-muted-foreground">(Child item)</span>}
            </TableCell>
            <TableCell>
              <div className="flex items-center">
                {item.url}
                <a href={item.url} target="_blank" rel="noreferrer" className="ml-1 text-muted-foreground hover:text-primary">
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </TableCell>
            <TableCell>
              {item.is_active ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                  Inactive
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default MenuItemsTable;
