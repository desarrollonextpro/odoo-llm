/** @odoo-module **/

import { Component } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class LLMChat extends Component {
  static template = "llm_thread.LLMChat";

  setup() {
    this.llmChatService = useService("llm_chat");
  }

  /**
   * Get the LLM chat service state
   */
  get llmChatState() {
    return this.llmChatService.state;
  }

  /**
   * Check if chat is active and has threads
   */
  get isActive() {
    return this.llmChatState.isActive;
  }

  /**
   * Get active thread
   */
  get activeThread() {
    return this.llmChatState.activeThread;
  }

  /**
   * Get threads list
   */
  get threads() {
    return this.llmChatState.threads;
  }

  /**
   * Check if thread list is visible
   */
  get isThreadListVisible() {
    return this.llmChatState.isThreadListVisible;
  }
}

