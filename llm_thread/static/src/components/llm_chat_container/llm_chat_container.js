/** @odoo-module **/

import { LLMChat } from "@llm_thread/components/llm_chat/llm_chat";
import { Component, onWillDestroy, onMounted, useState } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class LLMChatContainer extends Component {
  static template = "llm_thread.LLMChatContainer";
  static components = { LLMChat };
  static props = {
    action: { type: Object },
    actionId: { type: Number, optional: true },
    className: { type: String, optional: true },
    globalState: { type: Object, optional: true },
  };

  setup() {
    this.llmChatService = useService("llm_chat");
    this.state = useState({
      isReady: false,
    });
    
    onMounted(() => this._onMounted());
    onWillDestroy(() => this._willDestroy());

    // Keep track of current instance to handle cleanup
    LLMChatContainer.currentInstance = this;
  }

  async _onMounted() {
    const { action } = this.props;
    const initActiveId =
      (action.context && action.context.active_id) ||
      (action.params && action.params.default_active_id) ||
      null;

    await this.llmChatService.initialize(action, initActiveId);
    this.state.isReady = true;
  }

  _willDestroy() {
    if (this.llmChatService && LLMChatContainer.currentInstance === this) {
      this.llmChatService.close();
    }
  }
}


export default LLMChatContainer;
