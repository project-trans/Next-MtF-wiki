'use client';

import { ArrowUpRight, ChevronRight, FileText } from 'lucide-react';
import { useState } from 'react';

interface EmbedPageClientProps {
  children: React.ReactNode;
  displaySlug: string;
  url: string;
  viewSourceText: string;
}

export default function EmbedPageClient({
  children,
  displaySlug,
  url,
  viewSourceText,
}: EmbedPageClientProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="my-4 border border-base-300 rounded-lg overflow-hidden bg-base-100 shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div
        className="bg-base-200/50 hover:bg-base-200 px-4 py-3 flex items-center justify-between cursor-pointer select-none group transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
          <ChevronRight
            className={`w-4 h-4 text-base-content/50 transition-transform duration-200 ${
              isOpen ? 'rotate-90' : ''
            }`}
          />
          <FileText className="w-4 h-4 text-primary shrink-0" />
          <span className="font-medium text-sm truncate opacity-80 group-hover:opacity-100 transition-opacity text-base-content">
            {displaySlug}
          </span>
        </div>

        <a
          href={url}
          className="flex items-center gap-1.5 text-xs font-medium text-base-content/60 hover:text-primary px-2.5 py-1.5 rounded-md hover:bg-base-100 transition-all ml-2 border border-transparent hover:border-base-300"
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {viewSourceText}
          <ArrowUpRight className="w-3 h-3" />
        </a>
      </div>

      {/* Content */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden min-h-0">
          <div className="p-4 pt-2 prose max-w-none text-sm border-t border-base-200/50 mt-2 max-h-[400px] overflow-y-auto overscroll-contain">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
