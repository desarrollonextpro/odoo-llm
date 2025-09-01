/** @odoo-module **/

import { LLMAssistant } from "./llm_assistant";
import { LLMPrompt } from "./llm_prompt";

/**
 * Assistant Management Service for LLM Chat in v17
 * Handles loading and managing assistants without the old Record system
 */
export class LLMAssistantService {
  constructor(orm, env) {
    this.orm = orm;
    this.env = env;
    this.assistants = [];
    this.prompts = new Map();
  }

  /**
   * Load assistants from the server
   */
  async loadAssistants() {
    try {
      // Load assistants with their basic data
      const assistantResult = await this.orm.searchRead(
        "llm.assistant",
        [["active", "=", true]],
        ["name", "default_values", "prompt_id"]
      );

      // Extract all prompt IDs to fetch their details
      const promptIds = assistantResult
        .map((assistant) => assistant.prompt_id && assistant.prompt_id[0])
        .filter((id) => id);

      // If we have prompt IDs, fetch their details
      if (promptIds.length > 0) {
        const promptResult = await this.orm.searchRead(
          "llm.prompt",
          [["id", "in", promptIds]],
          ["name", "input_schema_json"]
        );

        // Store prompts in map for easy lookup
        promptResult.forEach(promptData => {
          this.prompts.set(promptData.id, LLMPrompt.fromServerData(promptData));
        });
      }

      // Create assistant instances
      this.assistants = assistantResult.map(assistantData => {
        const assistant = LLMAssistant.fromServerData(assistantData);
        
        // Link prompt if available
        if (assistant.promptId && this.prompts.has(assistant.promptId)) {
          assistant.llmPrompt = this.prompts.get(assistant.promptId);
        }
        
        return assistant;
      });

      return this.assistants;
    } catch (error) {
      console.error("Error loading assistants:", error);
      return [];
    }
  }

  /**
   * Get assistant by ID
   */
  getAssistant(assistantId) {
    return this.assistants.find(a => a.id === assistantId);
  }

  /**
   * Fetch thread-specific evaluated default values for an assistant
   */
  async fetchAssistantValuesForThread(threadId, assistantId) {
    try {
      const result = await this.orm.call(
        "llm.thread",
        "get_assistant_values",
        [],
        {
          thread_id: threadId,
          assistant_id: assistantId,
        }
      );

      if (result.success) {
        const assistant = this.getAssistant(assistantId);
        if (assistant) {
          // Update assistant with thread-specific values
          assistant.update({
            defaultValues: result.default_values,
            evaluatedDefaultValues: result.evaluated_default_values,
          });

          // Update prompt if provided
          if (result.prompt) {
            const prompt = LLMPrompt.fromServerData(result.prompt);
            this.prompts.set(prompt.id, prompt);
            assistant.llmPrompt = prompt;
          }
        }
        return result;
      } else {
        console.error("Error fetching assistant values:", result.error);
        return null;
      }
    } catch (error) {
      console.error("Error in fetchAssistantValuesForThread:", error);
      return null;
    }
  }
}