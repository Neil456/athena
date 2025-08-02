import React from "react";
import { FileText, X } from "lucide-react";
import type { AppFile } from "@/hooks/useAppFiles";

interface ContextTag {
  file: AppFile;
  id: string;
}

interface ContextTagsProps {
  tags: ContextTag[];
  onRemove: (id: string) => void;
}

export function ContextTags({ tags, onRemove }: ContextTagsProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 p-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30">
      {tags.map((tag) => (
        <div
          key={tag.id}
          className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-700/70 rounded-md border border-gray-200/50 dark:border-gray-600/50 hover:bg-gray-150 dark:hover:bg-gray-700/90 transition-colors"
        >
          <FileText
            size={11}
            className="text-gray-500 dark:text-gray-400 flex-shrink-0"
          />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
            {tag.file.name}
          </span>
          <button
            onClick={() => onRemove(tag.id)}
            className="ml-0.5 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600/50 rounded-sm transition-colors"
            title="Remove from context"
          >
            <X size={10} className="text-gray-400 dark:text-gray-500" />
          </button>
        </div>
      ))}
    </div>
  );
}
