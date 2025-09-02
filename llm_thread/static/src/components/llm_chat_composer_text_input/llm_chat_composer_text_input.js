/** @odoo-module **/

import { Component, useRef, onMounted } from "@odoo/owl";

export class LLMChatComposerTextInput extends Component {
  static template = "llm_thread.LLMChatComposerTextInput";
  static props = {
    value: { type: String, optional: true },
    placeholder: { type: String, optional: true },
    disabled: { type: Boolean, optional: true },
    onInput: { type: Function, optional: true },
    onKeydown: { type: Function, optional: true },
  };

  setup() {
    this.textareaRef = useRef("textarea");
    
    onMounted(() => {
      if (this.textareaRef.el) {
        // Set the value if provided
        if (this.props.value) {
          this.textareaRef.el.value = this.props.value;
        }
        // Focus on the textarea to enable typing
        setTimeout(() => {
          this.textareaRef.el.focus();
        }, 100);
      }
    });
  }

  /**
   * Handle input events
   */
  onInput(event) {
    if (this.props.onInput) {
      this.props.onInput(event);
    }
  }

  /**
   * Handle keydown events
   */
  onKeydown(event) {
    if (this.props.onKeydown) {
      this.props.onKeydown(event);
    }
  }

  /**
   * Get placeholder text
   */
  get placeholder() {
    return this.props.placeholder || "Ask anything...";
  }
}

