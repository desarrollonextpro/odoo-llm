/** @odoo-module **/

/**
 * Simple LLM Prompt model for v17
 */
export class LLMPrompt {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.inputSchemaJson = data.inputSchemaJson || "{}";
    // Relations handled by IDs rather than Record relationships
    this.assistantIds = data.assistantIds || [];
  }

  /**
   * Update prompt properties
   */
  update(data) {
    Object.assign(this, data);
  }

  /**
   * Create prompt from server data
   */
  static fromServerData(data) {
    return new LLMPrompt({
      id: data.id,
      name: data.name,
      inputSchemaJson: data.input_schema_json || "{}",
    });
  }
}