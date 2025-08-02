import { useState, useCallback, useRef } from "react";
import type { AppFile } from "./useAppFiles";

interface FileDropdownState {
  isVisible: boolean;
  position: { top: number; left: number };
  searchTerm: string;
  atSignPosition: number; // Position of the "@" character
}

export function useFileDropdown() {
  const [dropdownState, setDropdownState] = useState<FileDropdownState>({
    isVisible: false,
    position: { top: 0, left: 0 },
    searchTerm: "",
    atSignPosition: -1,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate cursor position relative to viewport
  const getCursorPosition = useCallback(
    (textarea: HTMLTextAreaElement, cursorPos: number) => {
      const textBeforeCursor = textarea.value.substring(0, cursorPos);
      const lines = textBeforeCursor.split("\n");
      const currentLineText = lines[lines.length - 1];

      // Create a temporary element to measure text width
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.visibility = "hidden";
      tempDiv.style.whiteSpace = "pre";
      tempDiv.style.font = window.getComputedStyle(textarea).font;
      tempDiv.textContent = currentLineText;
      document.body.appendChild(tempDiv);

      const textWidth = tempDiv.offsetWidth;
      document.body.removeChild(tempDiv);

      const rect = textarea.getBoundingClientRect();
      const lineHeight =
        parseInt(window.getComputedStyle(textarea).lineHeight) || 20;
      const lineNumber = lines.length - 1;

      // Calculate position relative to the textarea
      let top = rect.top + lineNumber * lineHeight + lineHeight + 5; // Position below the current line
      let left = rect.left + textWidth + 5; // Position to the right of the cursor

      // Ensure dropdown doesn't go off screen
      const dropdownWidth = 320;
      const dropdownHeight = 256; // max-h-64 = 16rem = 256px

      // Check if dropdown would go off the right edge
      if (left + dropdownWidth > window.innerWidth) {
        left = Math.max(10, window.innerWidth - dropdownWidth - 10);
      }

      // Check if dropdown would go off the bottom edge
      if (top + dropdownHeight > window.innerHeight) {
        // Position above the textarea instead
        top = rect.top - dropdownHeight - 5;
      }

      // Ensure minimum position
      top = Math.max(10, top);
      left = Math.max(10, left);

      return { top, left };
    },
    [],
  );

  // Handle textarea input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const textarea = e.target;
      const value = textarea.value;
      const cursorPosition = textarea.selectionStart;

      // Look for "@" before the cursor
      const textBeforeCursor = value.substring(0, cursorPosition);
      const lastAtSignIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtSignIndex !== -1) {
        // Check if there's a space or newline after the last "@" (which would break the mention)
        const textAfterAtSign = textBeforeCursor.substring(lastAtSignIndex + 1);

        if (!textAfterAtSign.includes(" ") && !textAfterAtSign.includes("\n")) {
          // We have a valid "@" mention in progress
          const searchTerm = textAfterAtSign;
          const position = getCursorPosition(textarea, cursorPosition);

          setDropdownState({
            isVisible: true,
            position,
            searchTerm,
            atSignPosition: lastAtSignIndex,
          });
          return;
        }
      }

      // No valid "@" mention found, hide dropdown
      setDropdownState((prev) => ({ ...prev, isVisible: false }));
    },
    [getCursorPosition],
  );

  // Handle file selection - now adds to context tags instead of inserting text
  const handleFileSelect = useCallback(
    (
      file: AppFile,
      addContextTag: (file: AppFile) => void,
      inputValue: string,
      setInputValue: (value: string) => void,
    ) => {
      // Add file to context tags
      addContextTag(file);

      // Remove the "@searchTerm" from the input
      const { atSignPosition } = dropdownState;
      if (atSignPosition !== -1) {
        const beforeAtSign = inputValue.substring(0, atSignPosition);
        const afterSearchTerm = inputValue.substring(
          textareaRef.current?.selectionStart || atSignPosition,
        );
        const newValue = beforeAtSign + afterSearchTerm;
        setInputValue(newValue);

        // Set cursor position after the removed text
        setTimeout(() => {
          if (textareaRef.current) {
            const newCursorPosition = beforeAtSign.length;
            textareaRef.current.setSelectionRange(
              newCursorPosition,
              newCursorPosition,
            );
            textareaRef.current.focus();
          }
        }, 0);
      }

      // Hide dropdown
      setDropdownState((prev) => ({ ...prev, isVisible: false }));
    },
    [dropdownState],
  );

  // Handle closing dropdown
  const handleCloseDropdown = useCallback(() => {
    setDropdownState((prev) => ({ ...prev, isVisible: false }));
  }, []);

  // Handle key events that might affect dropdown
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (dropdownState.isVisible) {
        // Let the FileDropdown component handle these keys
        if (["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) {
          // Don't interfere with dropdown navigation
          return;
        }
      }
    },
    [dropdownState.isVisible],
  );

  return {
    dropdownState,
    textareaRef,
    handleInputChange,
    handleFileSelect,
    handleCloseDropdown,
    handleKeyDown,
  };
}
