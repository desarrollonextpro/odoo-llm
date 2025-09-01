/** @odoo-module **/

import { Component } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class LLMChatThread extends Component {
  static template = "llm_thread.LLMChatThread";
  static props = {
    thread: { type: Object, optional: true },
    isStreaming: { type: Boolean, optional: true },
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
}
