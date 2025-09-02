/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { LLMChatThreadHeader } from "@llm_thread/components/llm_chat_thread_header/llm_chat_thread_header";

// Patch the LLMChatThreadHeader component
const patchLLMChatThreadHeader = () => {
  try {
    if (!LLMChatThreadHeader) {
      console.warn("LLM Assistant: LLMChatThreadHeader component not found, retrying...");
      setTimeout(patchLLMChatThreadHeader, 100);
      return;
    }
    
    // Apply the patch
    patch(LLMChatThreadHeader.prototype, {
        setup() {
          // Call the original setup method
          super.setup();
          
          // Initialize assistant-related state  
          if (!this.state.selectedAssistantId) {
            this.state.selectedAssistantId = null;
          }
          this.assistantManager = null;
        },

        /**
         * Get all available assistants
         */
        get llmAssistants() {
          try {
            // Make sure we have a valid llmChatService reference
            if (!this.llmChatService || !this.llmChatService.state || !this.llmChatService.state.llmAssistants) {
              return [];
            }

            // Return the assistants array
            return this.llmChatService.state.llmAssistants || [];
          } catch (error) {
            console.warn("LLM Assistant: Error getting assistants:", error);
            return [];
          }
        },

        /**
         * Get the selected assistant
         */
        get selectedAssistant() {
          try {
            if (!this.llmChatService || !this.llmChatService.state || !this.llmChatService.state.llmAssistants) {
              return null;
            }
            
            const assistantId = this.state.selectedAssistantId;
            if (!assistantId) {
              return null;
            }
            
            return this.llmChatService.state.llmAssistants.find(a => a && a.id === assistantId) || null;
          } catch (error) {
            console.warn("LLM Assistant: Error getting selected assistant:", error);
            return null;
          }
        },

        /**
         * Handle assistant selection
         * @param {Object} assistant - The selected assistant
         */
        async onSelectAssistant(assistant) {
          try {
            if (!assistant || !this.thread) {
              return;
            }

            // Update local state immediately
            this.state.selectedAssistantId = assistant.id;
            
            // Update on server
            if (this.llmChatService && this.llmChatService.orm) {
              await this.llmChatService.orm.call(
                "llm.thread",
                "set_assistant",
                [],
                {
                  thread_id: this.thread.id,
                  assistant_id: assistant.id,
                }
              );
            }
          } catch (error) {
            console.error("LLM Assistant: Error selecting assistant:", error);
            // Revert local state on error
            this.state.selectedAssistantId = null;
          }
        },

        /**
         * Clear the selected assistant
         */
        async onClearAssistant() {
          try {
            if (!this.thread) {
              return;
            }

            // Update local state immediately
            this.state.selectedAssistantId = null;
            
            // Update on server
            if (this.llmChatService && this.llmChatService.orm) {
              await this.llmChatService.orm.call(
                "llm.thread",
                "set_assistant",
                [],
                {
                  thread_id: this.thread.id,
                  assistant_id: false,
                }
              );
            }
          } catch (error) {
            console.error("LLM Assistant: Error clearing assistant:", error);
          }
        },

        /**
         * Initialize assistant state when thread changes
         */
        _onThreadChanged() {
          try {
            if (this.thread && this.thread.assistant_id) {
              this.state.selectedAssistantId = this.thread.assistant_id;
            } else {
              this.state.selectedAssistantId = null;
            }
          } catch (error) {
            console.warn("LLM Assistant: Error in _onThreadChanged:", error);
          }
        },
    });
    
    console.log("LLM Assistant: Successfully patched LLMChatThreadHeader");
  } catch (error) {
    console.warn("LLM Assistant: Could not patch LLMChatThreadHeader component:", error);
    // Retry after a short delay
    setTimeout(patchLLMChatThreadHeader, 100);
  }
};

// Try to patch immediately, and also on DOM ready
patchLLMChatThreadHeader();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', patchLLMChatThreadHeader);
} else {
  // If DOM is already loaded, try again after a short delay
  setTimeout(patchLLMChatThreadHeader, 100);
}
