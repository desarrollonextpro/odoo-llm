/** @odoo-module **/

import { Component, useState, onMounted } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class LLMChatThreadRelatedRecord extends Component {
  static template = "llm_thread.LLMChatThreadRelatedRecord";
  static props = {
    thread: { type: Object, optional: true },
  };

  setup() {
    this.orm = useService("orm");
    this.action = useService("action");
    this.notification = useService("notification");
    
    this.state = useState({
      relatedRecordDisplayName: "",
      isLoading: false,
    });

    onMounted(() => {
      this._loadRelatedRecordDisplayName();
    });
  }

  get thread() {
    return this.props.thread;
  }

  get hasRelatedRecord() {
    return Boolean(this.thread?.relatedThreadModel && this.thread?.relatedThreadId);
  }

  /**
   * Load the display name of the related record
   */
  async _loadRelatedRecordDisplayName() {
    if (!this.hasRelatedRecord) {
      this.state.relatedRecordDisplayName = "";
      return;
    }

    try {
      this.state.isLoading = true;
      const result = await this.orm.call(
        this.thread.relatedThreadModel,
        "name_get",
        [[this.thread.relatedThreadId]]
      );

      if (result && result.length > 0) {
        this.state.relatedRecordDisplayName = result[0][1];
      }
    } catch (error) {
      console.error("Error loading related record display name:", error);
      this.state.relatedRecordDisplayName = "";
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Get icon for the related record based on model
   */
  getRelatedRecordIcon() {
    if (!this.thread?.relatedThreadModel) {
      return "fa-file-o";
    }

    const iconMap = {
      "res.partner": "fa-user",
      "res.users": "fa-user",
      "sale.order": "fa-shopping-cart",
      "purchase.order": "fa-shopping-bag",
      "account.move": "fa-file-text-o",
      "project.project": "fa-folder-open",
      "project.task": "fa-check-square-o",
      "crm.lead": "fa-bullseye",
      "hr.employee": "fa-user-circle",
      "product.product": "fa-cube",
      "stock.picking": "fa-truck",
    };

    return iconMap[this.thread.relatedThreadModel] || "fa-file-o";
  }

  /**
   * Handle click on related record button
   */
  async onClickRelatedRecord() {
    if (!this.hasRelatedRecord) {
      return;
    }

    try {
      await this.action.doAction({
        type: "ir.actions.act_window",
        res_model: this.thread.relatedThreadModel,
        res_id: this.thread.relatedThreadId,
        views: [[false, "form"]],
        target: "current",
      });
    } catch (error) {
      console.error("Error opening related record:", error);
      this.notification.add("Failed to open related record", { type: "danger" });
    }
  }

  /**
   * Handle unlinking the current related record
   */
  async onClickUnlinkRecord() {
    if (!this.hasRelatedRecord) {
      return;
    }

    try {
      await this.orm.write("llm.thread", [this.thread.id], {
        model: false,
        res_id: false,
      });

      // Update local state
      this.thread.relatedThreadModel = null;
      this.thread.relatedThreadId = null;
      this.state.relatedRecordDisplayName = "";

      this.notification.add("Record unlinked successfully", { type: "success" });
    } catch (error) {
      console.error("Error unlinking record:", error);
      this.notification.add("Failed to unlink record", { type: "danger" });
    }
  }
}