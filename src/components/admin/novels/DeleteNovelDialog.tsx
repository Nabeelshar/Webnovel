
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Novel } from '@/types/novels';

interface DeleteNovelDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedNovel: Novel | null;
  onDelete: () => Promise<void>;
}

const DeleteNovelDialog = ({ open, setOpen, selectedNovel, onDelete }: DeleteNovelDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Novel</DialogTitle>
        </DialogHeader>
        <p className="py-4">
          Are you sure you want to delete "{selectedNovel?.title}"? This action cannot be undone.
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

export default DeleteNovelDialog;
