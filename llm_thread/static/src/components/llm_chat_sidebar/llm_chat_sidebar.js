/** @odoo-module **/

import { Component } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class LLMChatSidebar extends Component {
  static template = "llm_thread.LLMChatSidebar";
  static props = {
    isThreadListVisible: { type: Boolean },
    onToggleThreadList: { type: Function, optional: true },
  };

  setup() {
    this.llmChatService = useService("llm_chat");
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
