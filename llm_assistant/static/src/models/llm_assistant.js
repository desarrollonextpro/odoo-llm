/** @odoo-module **/

/**
 * Simple LLM Assistant model for v17
 * Since v17 doesn't use the old Record system with attr/many/one,
 * we use plain JavaScript objects managed by services
 */
export class LLMAssistant {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.promptId = data.promptId;
    this.defaultValues = data.defaultValues;
    this.evaluatedDefaultValues = data.evaluatedDefaultValues;
    // Relations handled by IDs rather than Record relationships
    this.threadIds = data.threadIds || [];
    this.llmPromptId = data.llmPromptId;
    this.llmPrompt = data.llmPrompt || null; // Add this property
  }

  /**
   * Update assistant properties
   */
  update(data) {
    Object.assign(this, data);
  }

  /**
   * Create assistant from server data
   */
  static fromServerData(data) {
    return new LLMAssistant({
      id: data.id,
      name: data.name,
      promptId: data.prompt_id?.[0] || null,
      defaultValues: data.default_values,
      evaluatedDefaultValues: data.evaluated_default_values,
    });
  }
}