/** @odoo-module **/

import { Component, useState, useRef } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { LLMChatThreadRelatedRecord } from "@llm_thread/components/llm_chat_thread_related_record/llm_chat_thread_related_record";

export class LLMChatThreadHeader extends Component {
  static template = "llm_thread.LLMChatThreadHeader";
  static components = {
    LLMChatThreadRelatedRecord,
  };
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
      modelSearchQuery: "",
    });

    // Watch for thread changes
    this._watchThreadChanges();
  }

  /**
   * Watch for thread changes and call _onThreadChanged if it exists
   */
  _watchThreadChanges() {
    // Use a simple interval to check for thread changes
    // In a more sophisticated implementation, you might use a proper reactive system
    this._threadCheckInterval = setInterval(() => {
      if (this._onThreadChanged && typeof this._onThreadChanged === 'function') {
        this._onThreadChanged();
      }
    }, 1000);
  }

  /**
   * Clean up interval on component destruction
   */
  willUnmount() {
    if (this._threadCheckInterval) {
      clearInterval(this._threadCheckInterval);
    }
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
    let models = this.llmModels;
    
    // Filter by provider if selected
    if (this.state.selectedProviderId) {
      models = models.filter(
        model => model.llmProvider?.id === this.state.selectedProviderId
      );
    }
    
    // Filter by search query if provided
    if (this.state.modelSearchQuery && this.state.modelSearchQuery.trim()) {
      const query = this.state.modelSearchQuery.trim().toLowerCase();
      models = models.filter(model => 
        model.name && model.name.toLowerCase().includes(query)
      );
    }
    
    return models;
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

  /**
   * Handle tool selection change
   */
  async onToolSelectChange(event, tool) {
    if (!this.thread) return;

    try {
      const isChecked = event.target.checked;
      const currentSelectedTools = this.thread.selectedToolIds || [];
      
      let newSelectedTools;
      if (isChecked) {
        // Add tool if not already selected
        if (!currentSelectedTools.includes(tool.id)) {
          newSelectedTools = [...currentSelectedTools, tool.id];
        } else {
          return; // Already selected
        }
      } else {
        // Remove tool from selection
        newSelectedTools = currentSelectedTools.filter(id => id !== tool.id);
      }

      // Update on server
      await this.llmChatService.orm.write("llm.thread", [this.thread.id], {
        selected_tool_ids: [[6, 0, newSelectedTools]], // Replace with new selection
      });
      
      // Update local thread data
      if (this.thread) {
        this.thread.selectedToolIds = newSelectedTools;
      }
    } catch (error) {
      console.error("Error updating tool selection:", error);
      // Revert checkbox state
      event.target.checked = !event.target.checked;
    }
  }
}