import { SendIcon, StopCircleIcon } from "lucide-react";
import type React from "react";
import { useEffect } from "react";

import { useSettings } from "@/hooks/useSettings";
import { homeChatInputValueAtom } from "@/atoms/chatAtoms"; // Use a different atom for home input
import { useAtom } from "jotai";
import { useStreamChat } from "@/hooks/useStreamChat";
import { useAttachments } from "@/hooks/useAttachments";
import { AttachmentsList } from "./AttachmentsList";
import { DragDropOverlay } from "./DragDropOverlay";
import { FileAttachmentDropdown } from "./FileAttachmentDropdown";

import { HomeSubmitOptions } from "@/pages/home";
import { ChatInputControls } from "../ChatInputControls";
import { useFileDropdown } from "@/hooks/useFileDropdown";
import { FileDropdown } from "./FileDropdown";
import { useContextTags } from "@/hooks/useContextTags";
import { ContextTags } from "./ContextTags";
import { useAppFiles } from "@/hooks/useAppFiles";
export function HomeChatInput({
  onSubmit,
}: {
  onSubmit: (options?: HomeSubmitOptions) => void;
}) {
  const [inputValue, setInputValue] = useAtom(homeChatInputValueAtom);
  const { settings } = useSettings();
  const { isStreaming } = useStreamChat({
    hasChatId: false,
  }); // eslint-disable-line @typescript-eslint/no-unused-vars

  // Use the attachments hook
  const {
    attachments,
    isDraggingOver,
    handleFileSelect,
    removeAttachment,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    clearAttachments,
    handlePaste,
  } = useAttachments();

  // Use the file dropdown hook for @ file selection
  const {
    dropdownState,
    textareaRef,
    handleInputChange: handleFileDropdownInputChange,
    handleFileSelect: handleFileDropdownFileSelect,
    handleCloseDropdown,
    handleKeyDown: handleFileDropdownKeyDown,
  } = useFileDropdown();

  // Use the context tags hook
  const {
    contextTags,
    addContextTag,
    removeContextTag,
    clearContextTags,
    getContextFiles,
  } = useContextTags();

  // Get all files for AI_RULES.md auto-addition
  const { files: allFiles } = useAppFiles();

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "0px";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight + 4}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [inputValue]);

  // Combined input change handler
  const handleInputChangeWithDropdown = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setInputValue(e.target.value);
    handleFileDropdownInputChange(e);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle file dropdown navigation first
    handleFileDropdownKeyDown(e);

    // Then handle regular enter to submit
    if (e.key === "Enter" && !e.shiftKey && !dropdownState.isVisible) {
      e.preventDefault();
      handleCustomSubmit();
    }
  };

  // Custom submit function that wraps the provided onSubmit
  const handleCustomSubmit = () => {
    if (
      (!inputValue.trim() &&
        attachments.length === 0 &&
        contextTags.length === 0) ||
      isStreaming
    ) {
      return;
    }

    // Get context files for the message
    const contextFiles = getContextFiles();

    // Call the parent's onSubmit handler with attachments and context files
    onSubmit({ attachments, contextFiles });

    // Clear attachments and context tags as part of submission process
    clearAttachments();
    clearContextTags();
  };

  if (!settings) {
    return null; // Or loading state
  }

  return (
    <>
      {/* File dropdown for @ mentions - rendered at document level */}
      {dropdownState.isVisible && (
        <FileDropdown
          isVisible={dropdownState.isVisible}
          onFileSelect={(file) =>
            handleFileDropdownFileSelect(
              file,
              (file) => addContextTag(file, allFiles),
              inputValue,
              setInputValue,
            )
          }
          onClose={handleCloseDropdown}
          position={dropdownState.position}
          searchTerm={dropdownState.searchTerm}
        />
      )}

      <div className="p-4" data-testid="home-chat-input-container">
        <div
          className={`relative flex flex-col space-y-2 border border-border rounded-lg bg-(--background-lighter) shadow-sm ${
            isDraggingOver ? "ring-2 ring-blue-500 border-blue-500" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Context tags for selected files */}
          <ContextTags tags={contextTags} onRemove={removeContextTag} />

          {/* Attachments list */}
          <AttachmentsList
            attachments={attachments}
            onRemove={removeAttachment}
          />

          {/* Drag and drop overlay */}
          <DragDropOverlay isDraggingOver={isDraggingOver} />

          <div className="flex items-start space-x-2 ">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChangeWithDropdown}
              onKeyPress={handleKeyPress}
              onPaste={handlePaste}
              placeholder="Ask Athena to build... (Type @ to select files)"
              className="flex-1 p-2 focus:outline-none overflow-y-auto min-h-[40px] max-h-[200px]"
              style={{ resize: "none" }}
              disabled={isStreaming} // Should ideally reflect if *any* stream is happening
            />

            {/* File attachment dropdown */}
            <FileAttachmentDropdown
              className="mt-1 mr-1"
              onFileSelect={handleFileSelect}
              disabled={isStreaming}
            />

            {isStreaming ? (
              <button
                className="px-2 py-2 mt-1 mr-2 text-(--sidebar-accent-fg) rounded-lg opacity-50 cursor-not-allowed" // Indicate disabled state
                title="Cancel generation (unavailable here)"
              >
                <StopCircleIcon size={20} />
              </button>
            ) : (
              <button
                onClick={handleCustomSubmit}
                disabled={!inputValue.trim() && attachments.length === 0}
                className="px-2 py-2 mt-1 mr-2 hover:bg-(--background-darkest) text-(--sidebar-accent-fg) rounded-lg disabled:opacity-50"
                title="Send message"
              >
                <SendIcon size={20} />
              </button>
            )}
          </div>
          <div className="px-2 pb-2">
            <ChatInputControls />
          </div>
        </div>
      </div>
    </>
  );
}
