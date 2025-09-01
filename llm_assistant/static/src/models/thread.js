/** @odoo-module **/

// Thread extensions for LLM Assistant in v17
// Since v17 has a different architecture, we keep this minimal

/**
 * Utility functions for thread-assistant relationships
 */
export class ThreadAssistantUtils {
  
  /**
   * Update thread settings with assistant information
   * @param {Object} orm - ORM service
   * @param {Number} threadId - Thread ID
   * @param {Object} settings - Settings to update
   */
  static async updateLLMChatThreadSettings(orm, threadId, settings = {}) {
    const { assistantId, ...otherSettings } = settings;
    const updateData = { ...otherSettings };
    
    if (assistantId !== undefined) {
      updateData.assistant_id = assistantId || false;
    }
    
    return await orm.write("llm.thread", [threadId], updateData);
  }
}