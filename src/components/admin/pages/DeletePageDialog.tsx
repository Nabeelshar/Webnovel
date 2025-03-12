
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  created_at: string;
  updated_at: string;
  published: boolean;
}

interface DeletePageDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedPage: Page | null;
  onDelete: () => Promise<void>;
}

const DeletePageDialog = ({
  open,
  setOpen,
  selectedPage,
  onDelete
}: DeletePageDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Page</DialogTitle>
        </DialogHeader>
        <p className="py-4">
          Are you sure you want to delete "{selectedPage?.title}"? This action cannot be undone.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeletePageDialog;
