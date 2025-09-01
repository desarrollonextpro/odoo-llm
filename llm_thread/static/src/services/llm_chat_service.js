/** @odoo-module **/

import { reactive } from "@odoo/owl";
import { registry } from "@web/core/registry";

/**
 * LLM Chat Service - Replaces the old model system with reactive service
 * This service manages LLM chat state and operations in Odoo v17
 */
export class LLMChatService {
    constructor(env, services) {
        this.env = env;
        this.orm = services.orm;
        this.notification = services.notification;
        this.router = services.router;
        this.user = services.user;
        
        // Reactive state - replaces old model fields
        this.state = reactive({
            isActive: false,
            activeThread: null,
            threads: [],
            llmModels: [],
            tools: [],
            isStreaming: false,
            isInitThreadHandled: false,
            initActiveId: null,
            actionId: null,
            isThreadListVisible: true,
        });

        // EventSource for streaming
        this.eventSource = null;
    }

    /**
     * Initialize the LLM chat service with action context
     */
    async initialize(action, initActiveId) {
        this.state.actionId = action.id;
        this.state.initActiveId = initActiveId;
        this.state.isActive = true;
        this.state.isInitThreadHandled = false;

        await this.loadLLMModels();
        await this.loadThreads();
        await this.loadTools();

        if (!this.state.isInitThreadHandled) {
            this.state.isInitThreadHandled = true;
            if (!this.state.activeThread) {
                this.openInitThread();
            }
        }
    }

    /**
     * Close the LLM chat
     */
    close() {
        this.state.isActive = false;
        this.state.activeThread = null;
        this.closeEventSource();
    }

    /**
     * Load threads from server
     */
    async loadThreads(additionalFields = []) {
        const fields = [
            "name", "message_ids", "create_uid", "create_date", "write_date",
            "model_id", "provider_id", "model", "res_id", "tool_ids",
            ...additionalFields
        ];

        try {
            const result = await this.orm.searchRead(
                "llm.thread",
                [["create_uid", "=", this.user.userId]],
                fields,
                { order: "write_date desc" }
            );

            this.state.threads = result.map(thread => this._mapThreadDataFromServer(thread));
        } catch (error) {
            console.error("Error loading threads:", error);
            this.notification.add("Failed to load chat threads", { type: "danger" });
        }
    }

    /**
     * Load LLM models from server
     */
    async loadLLMModels() {
        try {
            const result = await this.orm.searchRead(
                "llm.model",
                [],
                ["name", "id", "provider_id", "default"]
            );

            this.state.llmModels = result.map(model => ({
                id: model.id,
                name: model.name,
                llmProvider: model.provider_id 
                    ? { id: model.provider_id[0], name: model.provider_id[1] }
                    : undefined,
                default: model.default,
            }));
        } catch (error) {
            console.error("Error loading LLM models:", error);
        }
    }

    /**
     * Load tools from server
     */
    async loadTools() {
        try {
            const result = await this.orm.searchRead(
                "llm.tool",
                [["active", "=", true]],
                ["name", "id"]
            );

            this.state.tools = result.map(tool => ({
                id: tool.id,
                name: tool.name,
            }));
        } catch (error) {
            console.error("Error loading tools:", error);
        }
    }

    /**
     * Select thread as active
     */
    async selectThread(threadId) {
        const thread = this.state.threads.find(t => t.id === threadId);
        if (thread) {
            this.state.activeThread = thread;
            this.router.pushState({
                action: this.state.actionId,
                active_id: `llm.thread_${threadId}`,
            });
        }
    }

    /**
     * Create a new thread
     */
    async createThread({ name, relatedThreadModel, relatedThreadId }) {
        const defaultModel = this.defaultLLMModel;
        if (!defaultModel) {
            this.notification.add(
                "Please add a new LLMModel to use this feature",
                { type: "warning", title: "No LLMModel available" }
            );
            throw new Error("No LLM model available");
        }

        const threadData = {
            name,
            model_id: defaultModel.id,
            provider_id: defaultModel.llmProvider.id,
        };

        if (relatedThreadModel && relatedThreadId) {
            threadData.model = relatedThreadModel;
            threadData.res_id = relatedThreadId;
        }

        try {
            const threadId = await this.orm.create("llm.thread", [threadData]);
            const threadDetails = await this.orm.read("llm.thread", [threadId], 
                ["name", "model_id", "provider_id", "write_date"]);

            if (!threadDetails || !threadDetails[0]) {
                this.notification.add("Failed to create thread", { type: "danger", title: "Error" });
                return null;
            }

            const newThread = {
                id: threadId,
                model: "llm.thread",
                name: threadDetails[0].name,
                message_needaction_counter: 0,
                isServerPinned: true,
                llmModel: defaultModel,
                updatedAt: threadDetails[0].write_date,
                ...(relatedThreadModel && { relatedThreadModel }),
                ...(relatedThreadId && { relatedThreadId }),
            };

            this.state.threads.unshift(newThread);
            return newThread;
        } catch (error) {
            console.error("Error creating thread:", error);
            this.notification.add("Failed to create thread", { type: "danger" });
            return null;
        }
    }

    /**
     * Send message and start streaming response
     */
    async sendMessage(messageBody) {
        const thread = this.state.activeThread;
        if (!messageBody?.trim() || !thread) {
            this.notification.add("Please enter a message.", { type: "danger" });
            return;
        }

        try {
            this.closeEventSource();
            
            const eventSource = new EventSource(
                `/llm/thread/generate?thread_id=${thread.id}&message=${encodeURIComponent(messageBody.trim())}`
            );
            this.eventSource = eventSource;
            this.state.isStreaming = true;

            eventSource.onmessage = async (event) => {
                const data = JSON.parse(event.data);
                switch (data.type) {
                    case "message_create":
                    case "message_chunk":
                    case "message_update":
                        // Trigger message list refresh in components
                        this.env.bus.trigger("llm-message-update", { 
                            threadId: thread.id, 
                            message: data.message 
                        });
                        break;
                    case "error":
                        this.closeEventSource();
                        this.notification.add(data.error, { type: "danger" });
                        break;
                    case "done":
                        this.closeEventSource();
                        break;
                }
            };

            eventSource.onerror = (error) => {
                console.error("EventSource failed:", error);
                this.notification.add("An unknown error occurred", { type: "danger" });
                this.closeEventSource();
            };
        } catch (error) {
            console.error("Error sending LLM message:", error);
            this.notification.add("Failed to send message.", { type: "danger" });
        }
    }

    /**
     * Stop current streaming
     */
    stopStreaming() {
        this.closeEventSource();
    }

    /**
     * Close EventSource connection
     */
    closeEventSource() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
            this.state.isStreaming = false;
        }
    }

    /**
     * Get default LLM model
     */
    get defaultLLMModel() {
        if (!this.state.llmModels || !Array.isArray(this.state.llmModels)) {
            return null;
        }
        const activeModel = this.state.activeThread?.llmModel;
        if (!activeModel) {
            return this.state.llmModels.length > 0 ? this.state.llmModels[0] : null;
        }
        return this.state.llmModels.find(m => m && m.id === activeModel.id) || null;
    }

    /**
     * Ensures LLM models and threads are loaded, creating a thread if needed.
     */
    async ensureThread({ relatedThreadModel, relatedThreadId } = {}) {
        if (this.state.llmModels.length === 0) {
            await this.loadLLMModels();
        }
        if (this.state.threads.length === 0) {
            await this.loadThreads();
        }
        if (!this.state.tools || this.state.tools.length === 0) {
            await this.loadTools();
        }

        if (relatedThreadModel && relatedThreadId) {
            const existingThread = this.state.threads.find(
                thread =>
                    thread.relatedThreadModel === relatedThreadModel &&
                    thread.relatedThreadId === relatedThreadId
            );
            if (existingThread) {
                return existingThread;
            }

            try {
                const name = `AI Chat for ${relatedThreadModel} ${relatedThreadId}`;
                return await this.createThread({
                    name,
                    relatedThreadModel,
                    relatedThreadId,
                });
            } catch (error) {
                console.error("Failed to create thread for related model:", error);
                // Fall through to use existing threads or create a generic thread
            }
        }

        if (this.state.threads.length > 0) {
            return this.state.threads[0];
        }

        try {
            const name = `New Chat ${new Date().toLocaleString()}`;
            return await this.createThread({ name });
        } catch (error) {
            console.error("Failed to create default thread:", error);
            return null;
        }
    }

    /**
     * Open initial thread
     */
    openInitThread() {
        if (!this.state.initActiveId) {
            if (this.state.threads.length > 0) {
                this.selectThread(this.state.threads[0].id);
            }
            return;
        }

        const [model, id] = typeof this.state.initActiveId === "number"
            ? ["llm.thread", this.state.initActiveId]
            : this.state.initActiveId.split("_");

        const thread = this.state.threads.find(t => t.id === Number(id) && t.model === model);
        if (!thread && this.state.threads.length > 0) {
            this.selectThread(this.state.threads[0].id);
        } else if (thread) {
            this.selectThread(thread.id);
        }
    }

    /**
     * Map server thread data to client format
     */
    _mapThreadDataFromServer(threadData) {
        const mappedData = {
            id: threadData.id,
            model: "llm.thread", 
            name: threadData.name,
            message_needaction_counter: 0,
            creator: threadData.create_uid ? { id: threadData.create_uid } : undefined,
            isServerPinned: true,
            updatedAt: threadData.write_date,
            relatedThreadModel: threadData.model,
            relatedThreadId: threadData.res_id,
            selectedToolIds: threadData.tool_ids || [],
        };

        if (threadData.model_id && threadData.provider_id) {
            mappedData.llmModel = {
                id: threadData.model_id[0],
                name: threadData.model_id[1],
                llmProvider: {
                    id: threadData.provider_id[0],
                    name: threadData.provider_id[1],
                },
            };
        }

        return mappedData;
    }
}

export const llmChatService = {
    dependencies: ["orm", "notification", "router", "user"],
    start(env, services) {
        return new LLMChatService(env, services);
    },
};

registry.category("services").add("llm_chat", llmChatService);