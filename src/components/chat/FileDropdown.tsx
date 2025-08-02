import React, { useState, useEffect, useRef } from "react";
import { FileText, Search } from "lucide-react";
import { useAppFiles, type AppFile } from "@/hooks/useAppFiles";

interface FileDropdownProps {
  isVisible: boolean;
  onFileSelect: (file: AppFile) => void;
  onClose: () => void;
  position: { top: number; left: number };
  searchTerm?: string;
}

export function FileDropdown({
  isVisible,
  onFileSelect,
  onClose,
  position,
  searchTerm = "",
}: FileDropdownProps) {
  const { files, isLoading } = useAppFiles();
  const [filteredFiles, setFilteredFiles] = useState<AppFile[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter files based on search term
  useEffect(() => {
    if (!files) return;

    const filtered = files.filter((file) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        file.name.toLowerCase().includes(searchLower) ||
        file.relativePath.toLowerCase().includes(searchLower)
      );
    });

    setFilteredFiles(filtered);
    setSelectedIndex(0);
  }, [files, searchTerm]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredFiles.length - 1 ? prev + 1 : prev,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredFiles[selectedIndex]) {
            onFileSelect(filteredFiles[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, filteredFiles, selectedIndex, onFileSelect, onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div
      ref={dropdownRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-64 w-80 overflow-hidden"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <div className="p-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
          <Search size={14} className="mr-2" />
          <span>
            {isLoading ? "Loading..." : `${filteredFiles.length} files`}
          </span>
        </div>
      </div>

      <div className="max-h-48 overflow-y-auto">
        {isLoading ? (
          <div className="p-3 text-center text-gray-500 dark:text-gray-400">
            Loading files...
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="p-3 text-center text-gray-500 dark:text-gray-400">
            No files found
          </div>
        ) : (
          filteredFiles.map((file, index) => (
            <div
              key={file.relativePath}
              className={`flex items-center p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                index === selectedIndex
                  ? "bg-blue-50 dark:bg-blue-900/30 border-l-2 border-blue-500"
                  : ""
              }`}
              onClick={() => onFileSelect(file)}
            >
              <FileText
                size={16}
                className="mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {file.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {file.relativePath}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {filteredFiles.length > 0 && (
        <div className="p-2 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Use ↑↓ to navigate, Enter to select, Esc to close
          </div>
        </div>
      )}
    </div>
  );
}
