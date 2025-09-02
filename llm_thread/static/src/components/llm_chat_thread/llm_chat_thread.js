/** @odoo-module **/

import { Component } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { LLMChatThreadHeader } from "@llm_thread/components/llm_chat_thread_header/llm_chat_thread_header";
import { LLMChatMessageList } from "@llm_thread/components/llm_chat_message_list/llm_chat_message_list";
import { LLMChatComposer } from "@llm_thread/components/llm_chat_composer/llm_chat_composer";

export class LLMChatThread extends Component {
  static template = "llm_thread.LLMChatThread";
  static components = {
    LLMChatThreadHeader,
    LLMChatMessageList,
    LLMChatComposer,
  };
  static props = {
    thread: { type: Object, optional: true },
    isStreaming: { type: Boolean, optional: true },
    onToggleThreadList: { type: Function, optional: true },
  };

  setup() {
    this.llmChatService = useService("llm_chat");
  }

  get thread() {
    return this.props.thread || this.llmChatService.state.activeThread;
  }

  get isStreaming() {
    return this.props.isStreaming || this.llmChatService.state.isStreaming;
  }

  /**
   * Toggle thread list visibility
   */
  onToggleThreadList() {
    if (this.props.onToggleThreadList) {
      this.props.onToggleThreadList();
    } else {
      // Default behavior - toggle visibility in service
      this.llmChatService.state.isThreadListVisible = !this.llmChatService.state.isThreadListVisible;
    }
  }
}
