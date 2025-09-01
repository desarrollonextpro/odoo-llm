/** @odoo-module **/

import { Component, useEffect, useRef, useState, onMounted } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { Transition } from "@web/core/transition";

export class LLMChatMessageList extends Component {
  static template = "llm_thread.LLMChatMessageList";
  static components = { Transition };
  static props = {
    thread: { type: Object, optional: true },
    isStreaming: { type: Boolean, optional: true },
  };

  setup() {
    this.orm = useService("orm");
    this.rootRef = useRef("root");
    this.state = useState({
      messages: [],
      isLoading: false,
    });

    // Load messages when thread changes
    useEffect(
      () => {
        if (this.props.thread) {
          this._loadMessages();
        }
      },
      () => [this.props.thread?.id]
    );

    // Auto-scroll when messages or streaming changes
    useEffect(
      () => {
        if (this.props.thread) {
          this._scrollToEnd();
        }
      },
      () => [this.state.messages.length, this.props.isStreaming]
    );

    // Listen for real-time message updates
    onMounted(() => {
      this.env.bus.addEventListener("llm-message-update", this._onMessageUpdate.bind(this));
    });
  }

  async _loadMessages() {
    if (!this.props.thread?.id) return;

    this.state.isLoading = true;
    try {
      const messages = await this.orm.searchRead(
        "mail.message",
        [["res_id", "=", this.props.thread.id], ["model", "=", "llm.thread"]],
        ["id", "body", "author_id", "create_date", "message_type"],
        { order: "create_date ASC" }
      );
      this.state.messages = messages;
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      this.state.isLoading = false;
    }
  }

  _onMessageUpdate(event) {
    if (event.detail?.threadId === this.props.thread?.id) {
      // Reload messages to get the latest
      this._loadMessages();
    }
  }

  _scrollToEnd() {
    if (!this.rootRef.el) return;
    
    const scrollable = this.rootRef.el.closest(".o_LLMChatThread_content");
    if (scrollable) {
      scrollable.scrollTop = scrollable.scrollHeight;
    } else {
      this.rootRef.el.scrollTop = this.rootRef.el.scrollHeight;
    }
  }
}
