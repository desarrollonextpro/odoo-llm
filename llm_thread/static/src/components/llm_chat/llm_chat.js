/** @odoo-module **/

import { Component } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { LLMChatSidebar } from "@llm_thread/components/llm_chat_sidebar/llm_chat_sidebar";
import { LLMChatThread } from "@llm_thread/components/llm_chat_thread/llm_chat_thread";

export class LLMChat extends Component {
  static template = "llm_thread.LLMChat";
  static components = { 
    LLMChatSidebar, 
    LLMChatThread 
  };
  static props = {
    action: { type: Object, optional: true },
    actionId: { type: Number, optional: true },
  };

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

  /**
   * Get props for LLMChatSidebar, only including non-null values
   */
  get sidebarProps() {
    const props = {
      threads: this.threads || [],
      isThreadListVisible: this.isThreadListVisible,
    };
    
    // Only include activeThread if it's not null
    if (this.activeThread) {
      props.activeThread = this.activeThread;
    }
    
    return props;
  }
}

