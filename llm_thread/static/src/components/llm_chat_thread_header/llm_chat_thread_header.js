/** @odoo-module **/

import { Component, useState, useRef } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class LLMChatThreadHeader extends Component {
  static template = "llm_thread.LLMChatThreadHeader";
  static props = {
    thread: { type: Object, optional: true },
    onToggleThreadList: { type: Function, optional: true },
  };

  setup() {
    this.llmChatService = useService("llm_chat");
    this.nameInputRef = useRef("nameInput");
    
    this.state = useState({
      isEditingName: false,
      tempName: "",
      selectedModelId: null,
      selectedProviderId: null,
    });
  }

  get thread() {
    return this.props.thread || this.llmChatService.state.activeThread;
  }

  get llmModels() {
    return this.llmChatService.state.llmModels || [];
  }

  get availableProviders() {
    const providers = new Map();
    this.llmModels.forEach(model => {
      if (model.llmProvider) {
        providers.set(model.llmProvider.id, model.llmProvider);
      }
    });
    return Array.from(providers.values());
  }

  get filteredModels() {
    if (!this.state.selectedProviderId) {
      return this.llmModels;
    }
    return this.llmModels.filter(
      model => model.llmProvider?.id === this.state.selectedProviderId
    );
  }

  /**
   * Toggle thread list visibility
   */
  _onToggleThreadList() {
    if (this.props.onToggleThreadList) {
      this.props.onToggleThreadList();
    }
  }

  /**
   * Start editing thread name
   */
  _onEditName() {
    if (!this.thread) return;
    this.state.isEditingName = true;
    this.state.tempName = this.thread.name || "";
  }

  /**
   * Save thread name
   */
  async _onSaveName() {
    if (!this.thread || !this.state.tempName.trim()) return;

    try {
      await this.llmChatService.orm.write("llm.thread", [this.thread.id], {
        name: this.state.tempName.trim(),
      });
      
      // Update local thread data
      if (this.thread) {
        this.thread.name = this.state.tempName.trim();
      }
      
      this.state.isEditingName = false;
    } catch (error) {
      console.error("Error saving thread name:", error);
    }
  }

  /**
   * Cancel name editing
   */
  _onCancelEditName() {
    this.state.isEditingName = false;
    this.state.tempName = "";
  }

  /**
   * Handle model selection
   */
  async onSelectModel(model) {
    if (!this.thread || !model) return;

    try {
      await this.llmChatService.orm.write("llm.thread", [this.thread.id], {
        model_id: model.id,
        provider_id: model.llmProvider?.id,
      });
      
      // Update local thread data
      if (this.thread) {
        this.thread.llmModel = model;
      }
      
      this.state.selectedModelId = model.id;
      this.state.selectedProviderId = model.llmProvider?.id;
    } catch (error) {
      console.error("Error updating model:", error);
    }
  }

  /**
   * Handle provider selection
   */
  onSelectProvider(provider) {
    this.state.selectedProviderId = provider.id;
    this.state.selectedModelId = null; // Reset model selection
  }
}