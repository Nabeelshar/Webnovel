
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import PageForm from './PageForm';

interface PageDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  formData: {
    title: string;
    slug: string;
    content: string;
    published: boolean;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  generateSlug: () => void;
  resetForm: () => void;
  handleAddEditPage: () => Promise<void>;
  isEdit: boolean;
}

const PageDialog = ({
  open,
  setOpen,
  formData,
  handleInputChange,
  handleCheckboxChange,
  generateSlug,
  resetForm,
  handleAddEditPage,
  isEdit
}: PageDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Page' : 'Add New Page'}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Make changes to the existing page.' 
              : 'Create a new page that will be accessible on your site.'}
          </DialogDescription>
        </DialogHeader>
        
        <PageForm
          formData={formData}
          handleInputChange={handleInputChange}
          handleCheckboxChange={handleCheckboxChange}
          generateSlug={generateSlug}
          isEdit={isEdit}
        />
        
        <DialogFooter>
          <Button variant="outline" onClick={resetForm}>
            Cancel
          </Button>
          <Button onClick={handleAddEditPage}>
            {isEdit ? 'Save Changes' : 'Create Page'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PageDialog;
