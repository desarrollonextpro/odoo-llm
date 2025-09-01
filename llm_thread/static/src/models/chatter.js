/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { Chatter } from "@mail/components/chatter/chatter";

patch(Chatter.prototype, "llm_thread.ChatterLLM", {
    setup() {
        this._super(...arguments);

        // Estado y refs con los mismos nombres que usas en tu vista
        if (this.state.is_chatting_with_llm === undefined) {
            this.state.is_chatting_with_llm = false;
        }
        this.llmChatThread = null;
        this.llmChatThreadView = null;
    },

    /**
     * Alterna el modo LLM. Equivalente a tu versión previa,
     * pero ahora como método del componente (v17).
     */
    async toggleLLMChat() {
        const thread = this.state?.thread;
        if (!thread) {
            return;
        }

        const messaging = this.env?.services?.messaging || {};

        // Inicializa objeto llmChat si no existe (manteniendo tu contrato)
        if (!messaging.llmChat) {
            messaging.llmChat = { isInitThreadHandled: false };
        }
        const llmChat = messaging.llmChat;

        // Abre la vista LLM si tu servicio lo provee
        if (!llmChat.llmChatView && typeof messaging.openLLMChat === "function") {
            messaging.openLLMChat();
        }

        // Si ya está activo, desactiva
        if (this.state.is_chatting_with_llm) {
            this.state.is_chatting_with_llm = false;
            this.llmChatThread = null;
            this.llmChatThreadView = null;
            return;
        }

        try {
            // Equivalente a ensureThread({ relatedThreadModel, relatedThreadId })
            let ensuredThread = null;
            if (typeof messaging.ensureLLMThread === "function") {
                ensuredThread = await messaging.ensureLLMThread({
                    relatedThreadModel: thread.model,
                    relatedThreadId: thread.id,
                });
            } else {
                // Fallback: reutiliza el mismo thread si no tienes servicio aún
                ensuredThread = thread;
            }

            if (!ensuredThread) {
                throw new Error("Failed to ensure thread");
            }

            // Equivalente a selectThread(thread.id)
            if (typeof messaging.selectLLMThread === "function") {
                await messaging.selectLLMThread(ensuredThread.id);
            }

            // Expone los nombres que tu XML espera
            this.llmChatThread = ensuredThread;
            this.llmChatThreadView = {
                threadViewer: llmChat?.llmChatView?.threadViewer || null,
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

    // -------- Interceptores opcionales para "salir" del modo LLM al usar acciones nativas --------

    toggleComposer(type) {
        if (this.state.is_chatting_with_llm) {
            this.toggleLLMChat();
        }
        return this._super(type);
    },

    scheduleActivity() {
        if (this.state.is_chatting_with_llm) {
            this.toggleLLMChat();
        }
        return this._super();
    },

    onClickAddAttachments(ev) {
        if (this.state.is_chatting_with_llm) {
            this.toggleLLMChat();
        }
        return this._super(ev);
    },

    onClickAttachFile(ev) {
        if (this.state.is_chatting_with_llm) {
            this.toggleLLMChat();
        }
        return this._super(ev);
    },
});
