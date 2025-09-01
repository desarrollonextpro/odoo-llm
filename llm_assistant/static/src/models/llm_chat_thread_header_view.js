/** @odoo-module **/

/**
 * Thread Header Assistant Manager for v17
 * Manages assistant selection in thread headers without the old Record system
 */
export class ThreadHeaderAssistantManager {
  constructor() {
    this.selectedAssistantId = null;
  }

  /**
   * Initialize state based on current thread
   */
  initializeState(thread, assistants = []) {
    if (!thread) {
      this.selectedAssistantId = null;
      return;
    }

    // Look for assistant association in thread data
    this.selectedAssistantId = thread.assistant_id || thread.llmAssistant?.id || null;
  }

  /**
   * Get selected assistant from available assistants
   */
  getSelectedAssistant(assistants = []) {
    if (!this.selectedAssistantId || !Array.isArray(assistants)) {
      return null;
    }
    return assistants.find(assistant => assistant && assistant.id === this.selectedAssistantId) || null;
  }

  /**
   * Save selected assistant to thread
   */
  async saveSelectedAssistant(orm, threadId, assistantId) {
    if (assistantId === this.selectedAssistantId) {
      return { success: true };
    }

    try {
      // Update local state immediately
      this.selectedAssistantId = assistantId || null;

      // Update on server
      const result = await orm.call(
        "llm.thread", 
        "set_assistant",
        [],
        {
          thread_id: threadId,
          assistant_id: assistantId,
        }
      );

      return result.success ? result : { success: false, error: "Failed to update assistant" };
    } catch (error) {
      console.error("Error saving selected assistant:", error);
      // Revert local state on error
      this.selectedAssistantId = this.selectedAssistantId === assistantId ? null : this.selectedAssistantId;
      return { success: false, error: error.message };
    }
  }
}