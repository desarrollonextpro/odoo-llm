/** @odoo-module **/

import { Component, useState } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class LLMChatComposer extends Component {
  setup() {
    super.setup();
    this.llmChatService = useService("llm_chat");
    this.state = useState({
      messageInput: "",
    });
  }

  /**
   * Check if send is disabled
   */
  get isDisabled() {
    return !this.state.messageInput.trim() || !this.llmChatService.state.activeThread;
  }

  /**
   * Check if currently streaming
   */
  get isStreaming() {
    return this.llmChatService.state.isStreaming;
  }

  /**
   * Handle input change
   */
  onInputChange(event) {
    this.state.messageInput = event.target.value;
  }

  /**
   * Handle send button click
   */
  async onClickSend() {
    if (this.isDisabled) {
      return;
    }

    const message = this.state.messageInput.trim();
    this.state.messageInput = ""; // Clear input
    await this.llmChatService.sendMessage(message);
  }

  /**
   * Handle stop button click
   */
  onClickStop() {
    this.llmChatService.stopStreaming();
  }

  /**
   * Handle keydown events (e.g., Enter to send)
   */
  onKeydown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      this.onClickSend();
    }
  }
}

Object.assign(LLMChatComposer, {
  props: {},
  template: "llm_thread.LLMChatComposer",
});
