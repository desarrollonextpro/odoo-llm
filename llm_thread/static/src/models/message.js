/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { Message } from "@mail/core/common/message_model";

/**
 * Helper function to safely parse JSON strings.
 * Returns defaultValue if parsing fails or input is invalid.
 * @param {String} jsonString - JSON string to parse
 * @param {any} [defaultValue=undefined] - Default value on failure
 * @returns {any} Parsed JSON or defaultValue
 */
function safeJsonParse(jsonString, defaultValue = undefined) {
  if (!jsonString || typeof jsonString !== "string") {
    return defaultValue;
  }
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return defaultValue;
  }
}

// Patch Message model for LLM-specific fields
patch(Message.prototype, {
    /**
     * @override
     */
    setup() {
        super.setup();
        
        // Initialize LLM-specific fields
        this.user_vote = this.user_vote || 0;
        this.llmRole = this.llmRole || null;
        this.bodyJson = this.bodyJson || null;
    },

    /**
     * Check if message is empty (override for LLM messages)
     */
    get isEmpty() {
        return super.isEmpty && !this.bodyJson;
    },

    /**
     * Get tool data from body_json field for tool/assistant messages
     */
    get toolData() {
        return ['tool', 'assistant'].includes(this.llmRole) && this.bodyJson ? this.bodyJson : null;
    },

    /**
     * Get tool call ID from tool data
     */
    get toolCallId() {
        return this.toolData?.tool_call_id || null;
    },

    /**
     * Get tool call definition from tool data
     */
    get toolCallDefinitionFormatted() {
        return this.toolData?.tool_call || null;
    },

    /**
     * Get tool call result from tool data
     */
    get toolCallResultData() {
        const toolData = this.toolData;
        if (toolData) {
            if ("result" in toolData) {
                return toolData.result;
            } else if ("error" in toolData) {
                return { error: toolData.error };
            }
        }
        return null;
    },

    /**
     * Check if tool call result is an error
     */
    get toolCallResultIsError() {
        return this.toolData && this.toolData.status === "error";
    },

    /**
     * Format tool call result for display
     */
    get toolCallResultFormatted() {
        const resultData = this.toolCallResultData;
        if (resultData === undefined || resultData === null) {
            return "";
        }
        try {
            return typeof resultData === "object"
                ? JSON.stringify(resultData, null, 2)
                : String(resultData);
        } catch (e) {
            console.error("Error formatting tool call result:", e);
            return String(resultData);
        }
    },

    /**
     * Get tool name from tool data
     */
    get toolName() {
        return this.toolData?.tool_name || null;
    },

    /**
     * Tool calls associated with bodyJson
     */
    get toolCalls() {
        return this.toolData?.tool_calls || [];
    },
});

// Patch Message model methods
patch(Message, {
    /**
     * @override
     */
    convertData(data) {
        const data2 = super.convertData(data);
        if ("user_vote" in data) {
            data2.user_vote = data.user_vote;
        }
        if ("llm_role" in data) {
            data2.llmRole = data.llm_role;
        }
        if ("body_json" in data) {
            data2.bodyJson = data.body_json;
        }
        return data2;
    },
});
