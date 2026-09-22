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

            // Extract the real browser network error if available
            let detailedMessage = error.message;

            // Chrome exposes the real network error in error.cause
            if (error.cause && error.cause.message) {
                detailedMessage = error.cause.message;
            }

            // Some browsers expose it in error.toString()
            const errorString = error.toString();
            if (errorString && !errorString.includes("TypeError")) {
                detailedMessage = errorString;
            }
            const failedURL = this.modelEndpoint;
            detailedMessage += `</br>Network error while fetching ${failedURL}. The server may be offline, unreachable, or refusing connections.`;

            this.displayError(`Failed to fetch model data. Network error: ${detailedMessage}`);
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
      
      const message = document.getElementById("msg").value.trim();
      const maxLength = 2048;

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

          // Dynamically detect streaming vs non-streaming
          await this.handleDynamicResponse(response);

      } catch (err) {
          document.getElementById("response-props").value = `Error: ${err.message || err.toString()}`;
          this.handleResponse(null, err);
          this.enableSendButton();
      }
  }

  async handleDynamicResponse(response) {
      const outMarkdownContainer = document.getElementById("out-markdown");
      const responsePropsTextarea = document.getElementById("response-props");

      // Try non-streaming first
      try {
          const data = await response.clone().json();
          this.handleResponse(data);
          this.enableSendButton();
          return;
      } catch (e) {}

      // STREAMING MODE
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalObject = null;
      let fullContent = "";   // <-- ACCUMULATE CONTENT HERE

      while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split(/(?<=})\s*(?={)/g);

          for (let i = 0; i < parts.length - 1; i++) {
              try {
                  const obj = JSON.parse(parts[i]);
                  finalObject = obj;

                  // Extract streaming content tokens
                  if (obj.message && obj.message.content) {
                      fullContent += obj.message.content;
                  }

              } catch (err) {
                  console.warn("Streaming chunk parse error:", err);
              }
          }

          buffer = parts[parts.length - 1];
      }

      // Try parsing final buffer
      try {
          const obj = JSON.parse(buffer);
          finalObject = obj;
      } catch (e) {}

      // Inject the assembled content into the final object
      if (finalObject) {
          if (!finalObject.message) finalObject.message = {};
          finalObject.message.content = fullContent;
          this.handleResponse(finalObject);
      } else {
          this.handleResponse(null, new Error("Failed to parse streaming response"));
      }

      this.enableSendButton();
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
        // response-props
        // out-markdown
        const errorContainer = document.getElementById("out-markdown");
        const messageContent = `<p style="color: red;">${message}</p>`;
        errorContainer.innerHTML = DOMPurify.sanitize(marked.parse(messageContent));
    }
}

// Initialize the ChatController with configurable endpoints
const hostname1 = "localhost:3000";
const hostname2 = "192.168.81.119:8888";

// Dynamically choose based on browser URL
const currentURL = window.location.href;

const isLocalUbuntu = currentURL.includes("/Ubuntu/home/mjkel/");

// Determine browser protocol + host + port
const browserProtocol = window.location.protocol;   // "http:" or "https:"
const browserHost = window.location.hostname;       // e.g., "192.168.81.119"
const browserPort = window.location.port;           // e.g., "8888" or ""
const isHttps = browserProtocol === "https:";

// Build hostname from browser if not local Ubuntu
let dynamicHostname = browserHost;
if (browserPort) {
    dynamicHostname += `:${browserPort}`;
}

// Final hostname selection
const hostname = isLocalUbuntu ? hostname1 : dynamicHostname;

const chatController = new ChatController(
    "/tags",
    "/chat",
    hostname,
    false
);

// Fetch models data when the page loads
chatController.fetchModelsData();

// Add event listener for the send button
document.getElementById("send-button").addEventListener("click", () => chatController.send());