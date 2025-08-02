import { useState, useCallback } from "react";
import type { AppFile } from "./useAppFiles";

export interface ContextTag {
  file: AppFile;
  id: string;
}

export function useContextTags() {
  const [contextTags, setContextTags] = useState<ContextTag[]>([]);

  const addContextTag = useCallback(
    (file: AppFile, allFiles?: AppFile[]) => {
      // Check if file is already in context
      const exists = contextTags.some(
        (tag) => tag.file.relativePath === file.relativePath,
      );
      if (exists) return;

      const newTag: ContextTag = {
        file,
        id: `${file.relativePath}-${Date.now()}`,
      };

      setContextTags((prev) => {
        const updatedTags = [...prev, newTag];

        // If this is the first user-added file (not AI_RULES.md), automatically add AI_RULES.md
        const hasUserAddedFiles = updatedTags.some(
          (tag) => tag.file.relativePath !== "AI_RULES.md",
        );
        const hasAIRules = updatedTags.some(
          (tag) => tag.file.relativePath === "AI_RULES.md",
        );

        if (hasUserAddedFiles && !hasAIRules && allFiles) {
          // Find AI_RULES.md in the available files
          const aiRulesFile = allFiles.find(
            (f) => f.relativePath === "AI_RULES.md",
          );
          if (aiRulesFile) {
            const aiRulesTag: ContextTag = {
              file: aiRulesFile,
              id: `AI_RULES.md-${Date.now()}-auto`,
            };
            return [...updatedTags, aiRulesTag];
          }
        }

        return updatedTags;
      });
    },
    [contextTags],
  );

  const removeContextTag = useCallback((id: string) => {
    setContextTags((prev) => prev.filter((tag) => tag.id !== id));
  }, []);

  const clearContextTags = useCallback(() => {
    setContextTags([]);
  }, []);

  const getContextFiles = useCallback(() => {
    return contextTags.map((tag) => tag.file);
  }, [contextTags]);

  return {
    contextTags,
    addContextTag,
    removeContextTag,
    clearContextTags,
    getContextFiles,
  };
}
