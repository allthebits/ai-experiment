// Scoped variables
const DEFAULT_MODEL_NAME = "llama3";

class ChatController {
    constructor(modelEndpoint, chatEndpoint, hostname, https = false) {
        const protocol = https ? "https://" : "http://";

        this.modelEndpoint = protocol + hostname + modelEndpoint;
        this.chatEndpoint  = protocol + hostname + chatEndpoint;

        this.ai_models = [];
    }

    async fetchModelsData() {
        try {
            const response = await fetch(this.modelEndpoint);
            if (!response.ok) {
                throw new Error("Failed to fetch models data");
            }
            const data = await response.json();
            
            this.ai_models = data.models.map(model => {
                const parts = model.model.split(":");
                return [parts[0], parts.length > 1 ? parts.slice(1).join(":") : ""];
            });

            this.populateAI_Models();
        } catch (error) {
            console.error("Error fetching models data:", error);
            this.displayError("Failed to fetch model data. Please try again later.");
        }
    }

    disableSendButton() {
        const sendButton = document.getElementById("send-button");
        sendButton.disabled = true;
        sendButton.textContent = "Sending...";
    }

    enableSendButton() {
        const sendButton = document.getElementById("send-button");
        sendButton.disabled = false;
        sendButton.textContent = "Send";
    }

    async send() {
        this.disableSendButton();
        
        const message = document.getElementById("msg").value.trim(); // Trim whitespace
        const maxLength = 2048; // Define a maximum character length for the message

        // Validate input
        if (message === "") {
            alert("Please enter a message.");
            this.enableSendButton();
            return;
        }
        
        if (message.length > maxLength) {
            alert(`Message exceeds the maximum length of ${maxLength} characters.`);
            this.enableSendButton();
            return;
        }

        const ai_model = this.getModelName();

        try {
            const response = await fetch(this.chatEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: ai_model,
                    messages: [
                        { role: "user", content: message }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error("Failed to send message");
            }

            const data = await response.json();
            this.handleResponse(data);
        } catch (err) {
            document.getElementById("response-props").value = `Error: ${err.message || err.toString()}`;
            this.handleResponse(null, err);
            this.enableSendButton();
        }
    }

    handleResponse(data, error) {
        const outMarkdownContainer = document.getElementById("out-markdown");
        const responsePropsTextarea = document.getElementById("response-props");

        if (data) {
            this.handleResponseMessage(data, outMarkdownContainer);
            this.handleResponseProperties(data);
        } else {
            outMarkdownContainer.innerHTML = `<p style="color: red;">Error: ${error.toString()}</p>`;
            responsePropsTextarea.value = ""; // Clear any previous props content on error
        }
    }

    handleResponseMessage(data, outMarkdownContainer) {
        const messageContent = data.message ? data.message.content : "";
        
        // Render Markdown using marked.js and sanitize with DOMPurify
        outMarkdownContainer.innerHTML = DOMPurify.sanitize(marked.parse(messageContent));
    }

    handleResponseProperties(data) {
        const { message, ...properties } = JSON.parse(JSON.stringify(data));
        document.getElementById("response-props").value = JSON.stringify(properties, null, 2);
    }

    populateAI_Models() {
        const modelSelect = document.getElementById("model-select");
        // Remove all existing options
        while (modelSelect.firstChild) {
            modelSelect.removeChild(modelSelect.firstChild);
        }
        
        // Add new options based on ai_models
        this.ai_models.forEach(([submitValue, displayText]) => {
            const option = document.createElement("option");
            const whole_value = submitValue + ':' + displayText;

            option.value = whole_value;
            option.textContent = whole_value;
            modelSelect.appendChild(option);
        });

        this.enableSendButton();
    }

    getModelName() {
        const modelSelect = document.getElementById("model-select");
        const selectedModel = modelSelect.value;
        return selectedModel || DEFAULT_MODEL_NAME;
    }

    displayError(message) {
        const errorContainer = document.getElementById("error-container");
        errorContainer.innerHTML = `<p style="color: red;">${message}</p>`;
    }
}

// Initialize the ChatController with configurable endpoints
const hostname1 = "localhost:3000";
const hostname2 = "192.168.81.119:8888";

const chatController = new ChatController(
    "/tags",
    "/chat",
    hostname1,
    false
);


// Fetch models data when the page loads
chatController.fetchModelsData();

// Add event listener for the send button
document.getElementById("send-button").addEventListener("click", () => chatController.send());