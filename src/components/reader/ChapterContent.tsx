
import React from 'react';
import { Lock } from 'lucide-react';

interface ChapterContentProps {
  content: string;
}

const ChapterContent: React.FC<ChapterContentProps> = ({ content }) => {
  const paragraphs = content.split('\n\n').filter(p => p.trim() !== '');

  return (
    <div className="prose prose-stone dark:prose-invert max-w-none">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="mb-4">{paragraph}</p>
      ))}
    </div>
  );
};

export default ChapterContent;
