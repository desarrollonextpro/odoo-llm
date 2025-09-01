/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { Chatter } from "@mail/core/web/chatter";

patch(Chatter.prototype, {
    setup() {
        super.setup();
        
        // Initialize LLM chat state
        this.llmChatService = this.env.services.llm_chat;
        if (this.state.is_chatting_with_llm === undefined) {
            this.state.is_chatting_with_llm = false;
        }
        this.llmChatThread = null;
        this.llmChatThreadView = null;
    },

    /**
     * Toggle LLM chat mode for the current thread
     */
    async toggleLLMChat() {
        const thread = this.props.thread;
        if (!thread) {
            return;
        }

        // If already active, deactivate
        if (this.state.is_chatting_with_llm) {
            this.state.is_chatting_with_llm = false;
            this.llmChatThread = null;
            this.llmChatThreadView = null;
            return;
        }

        try {
            // Ensure LLM thread for this record
            const ensuredThread = await this.llmChatService.ensureThread({
                relatedThreadModel: thread.model,
                relatedThreadId: thread.id,
            });

            if (!ensuredThread) {
                throw new Error("Failed to ensure thread");
            }

            // Select the thread in LLM service
            await this.llmChatService.selectThread(ensuredThread.id);

            // Set up chatter state
            this.llmChatThread = ensuredThread;
            this.llmChatThreadView = {
                threadViewer: { thread: ensuredThread },
                messageListView: {},
                llmChatThreadHeaderView: {},
            };
            this.state.is_chatting_with_llm = true;
        } catch (error) {
            this.env.services.notification.add(
                error?.message || "An error occurred",
                { type: "danger", title: "Failed to Start AI Chat" }
            );
        }
    },

    // Override native chatter actions to exit LLM mode
    toggleComposer(type) {
        if (this.state.is_chatting_with_llm) {
            this.toggleLLMChat();
        }
        return super.toggleComposer?.(type);
    },

    scheduleActivity() {
        if (this.state.is_chatting_with_llm) {
            this.toggleLLMChat();
        }
        return super.scheduleActivity?.();
    },

    onClickAddAttachments(ev) {
        if (this.state.is_chatting_with_llm) {
            this.toggleLLMChat();
        }
        return super.onClickAddAttachments?.(ev);
    },

    onClickAttachFile(ev) {
        if (this.state.is_chatting_with_llm) {
            this.toggleLLMChat();
        }
        return super.onClickAttachFile?.(ev);
    },
});
