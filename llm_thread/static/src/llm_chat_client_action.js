/** @odoo-module **/

import { LLMChatContainer } from "@llm_thread/components/llm_chat_container/llm_chat_container";
import { registry } from "@web/core/registry";

// Debug logging
console.log("LLMChatContainer component:", LLMChatContainer);
console.log("Registry available:", registry);

// Simple registration without complex logic
registry
    .category("actions")
    .add("llm_thread.chat_client_action", LLMChatContainer);

console.log("Client action registered successfully");
