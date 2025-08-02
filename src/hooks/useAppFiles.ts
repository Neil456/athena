import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { IpcClient } from "@/ipc/ipc_client";

// File extensions that are relevant for context (matching codebase.ts)
const ALLOWED_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
  ".css",
  ".html",
  ".md",
  ".astro",
  ".vue",
  ".svelte",
  ".scss",
  ".sass",
  ".less",
  ".yml",
  ".yaml",
  ".xml",
  ".plist",
  ".entitlements",
  ".kt",
  ".java",
  ".gradle",
  ".swift",
];

// Files to always include regardless of extension
const ALWAYS_INCLUDE_FILES = ["package.json"];

export interface AppFile {
  path: string;
  name: string;
  relativePath: string;
}

export function useAppFiles() {
  const appId = useAtomValue(selectedAppIdAtom);

  const {
    data: files = [],
    isLoading,
    error,
  } = useQuery<AppFile[], Error>({
    queryKey: ["app-files", appId],
    queryFn: async () => {
      if (!appId) return [];

      const ipcClient = IpcClient.getInstance();
      const app = await ipcClient.getApp(appId);

      // Filter files to only include relevant ones for context
      const relevantFiles = app.files.filter((filePath) => {
        const fileName = filePath.split("/").pop() || "";
        const fileExtension = fileName.includes(".")
          ? "." + fileName.split(".").pop()
          : "";

        // Include if it's an allowed extension or always included file
        return (
          ALLOWED_EXTENSIONS.includes(fileExtension) ||
          ALWAYS_INCLUDE_FILES.includes(fileName)
        );
      });

      // Transform to AppFile objects with additional metadata
      return relevantFiles.map((filePath): AppFile => {
        const name = filePath.split("/").pop() || filePath;
        return {
          path: filePath,
          name,
          relativePath: filePath,
        };
      });
    },
    enabled: !!appId,
  });

  return {
    files,
    isLoading,
    error,
  };
}
