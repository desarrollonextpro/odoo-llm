/** @odoo-module **/

import { Component, useState } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class LLMChatThreadList extends Component {
  static template = "llm_thread.LLMChatThreadList";
  static props = {
    threads: { type: Array, optional: true },
    activeThread: { type: Object, optional: true },
    onThreadClick: { type: Function, optional: true },
  };

  setup() {
    this.llmChatService = useService("llm_chat");
    this.state = useState({
      isLoading: false,
    });
  }

  get threads() {
    return this.props.threads || this.llmChatService.state.threads;
  }

  get activeThread() {
    return this.props.activeThread || this.llmChatService.state.activeThread;
  }

  /**
   * Handle thread click
   * @param {Object} thread
   */
  async _onThreadClick(thread) {
    if (this.state.isLoading) return;

    this.state.isLoading = true;
    try {
      if (this.props.onThreadClick) {
        await this.props.onThreadClick(thread);
      } else {
        await this.llmChatService.selectThread(thread.id);
      }
    } catch (error) {
      console.error("Error selecting thread:", error);
      this.env.services.notification.add(
        "Failed to load thread",
        { type: "danger", title: "Error" }
      );
    } finally {
      this.state.isLoading = false;
    }
  }
}
