/** @odoo-module **/

import { Component } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { LLMChatThreadList } from "@llm_thread/components/llm_chat_thread_list/llm_chat_thread_list";

export class LLMChatSidebar extends Component {
  static template = "llm_thread.LLMChatSidebar";
  static components = {
    LLMChatThreadList,
  };
  static props = {
    threads: { type: Array, optional: true },
    activeThread: { type: Object, optional: true },
    isThreadListVisible: { type: Boolean, optional: true },
    onToggleThreadList: { type: Function, optional: true },
  };

  setup() {
    this.llmChatService = useService("llm_chat");
    this.ui = useService("ui");
  }

  /**
   * Check if device is small (mobile)
   */
  get isSmall() {
    return this.ui.isSmall;
  }

  /**
   * Handle backdrop click to close sidebar on mobile
   */
  _onBackdropClick() {
    if (this.props.onToggleThreadList) {
      this.props.onToggleThreadList(false);
    }
  }

  /**
   * Handle click on New Chat button
   */
  async _onClickNewChat() {
    try {
      const name = `New Chat ${new Date().toLocaleString()}`;
      await this.llmChatService.createThread({ name });
      if (this.props.onToggleThreadList) {
        this.props.onToggleThreadList(false);
      }
    } catch (error) {
      console.error("Failed to create new chat:", error);
    }
  }
}
