
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface PageFormProps {
  formData: {
    title: string;
    slug: string;
    content: string;
    published: boolean;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  generateSlug: () => void;
  isEdit: boolean;
}

const PageForm = ({ 
  formData, 
  handleInputChange, 
  handleCheckboxChange, 
  generateSlug,
  isEdit
}: PageFormProps) => {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <label htmlFor="title" className="text-right text-sm font-medium">
          Title
        </label>
        <div className="col-span-3">
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            onBlur={() => {
              if (!isEdit && !formData.slug && formData.title) {
                generateSlug();
              }
            }}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <label htmlFor="slug" className="text-right text-sm font-medium">
          Slug
        </label>
        <div className="col-span-3 flex gap-2">
          <Input
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleInputChange}
            placeholder="page-url-path"
            className="flex-1"
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={generateSlug}
            title="Generate slug from title"
          >
            Generate
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-4 items-start gap-4">
        <label htmlFor="content" className="text-right text-sm font-medium pt-2">
          Content
        </label>
        <Textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleInputChange}
          className="col-span-3 min-h-[200px]"
        />
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <div className="text-right text-sm font-medium">
          Status
        </div>
        <div className="col-span-3 flex items-center space-x-2">
          <input
            type="checkbox"
            id="published"
            name="published"
            checked={formData.published}
            onChange={handleCheckboxChange}
            className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
          />
          <label htmlFor="published" className="text-sm font-medium">
            Published
          </label>
        </div>
      </div>
    </div>
  );
};

export default PageForm;
