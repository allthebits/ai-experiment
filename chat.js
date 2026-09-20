// Scoped variables
const AI_URL = "http://localhost:3000";
const DEFAULT_MODEL_NAME = "gemma4:26b";

// Global variable for models
let ai_models = [];

function getAI_URL() {
  return AI_URL;
}

function getModelName() {
  const modelSelect = document.getElementById("model-select");
  const selectedModel = modelSelect.value;
  return selectedModel || DEFAULT_MODEL_NAME;
}

async function fetchModelsData() {
  let ai_tags = getAI_URL() + "/tags";
  
  try {
    const response = await fetch(ai_tags);
    if (!response.ok) {
      throw new Error("Failed to fetch models data");
    }
    const data = await response.json();
    
    // Parse the response data
    ai_models = data.models.map(model => {
      const parts = model.model.split(":");
      return [parts[0], parts.length > 1 ? parts.slice(1).join(":") : ""];
    });
    
    // Wait for up to 10 seconds for ai_models to be non-empty
    setTimeout(() => {
      if (ai_models.length > 0) {
        populateAI_Models();
      }
    }, 10000);
  } catch (error) {
    console.error("Error fetching models data:", error);
    alert("Failed to fetch model data. Please try again later.");
  }
}

function disableSendButton() {
  const sendButton = document.getElementById("send-button");
  sendButton.disabled = true;
}

function enableSendButton() {
  const sendButton = document.getElementById("send-button");
  sendButton.disabled = false;
}

function send() {
  disableSendButton();
  
  const message = document.getElementById("msg").value.trim(); // Trim whitespace
  const maxLength = 2048; // Define a maximum character length for the message

  // Validate input
  if (message === "") {
    alert("Please enter a message.");
    enableSendButton();
    return;
  }
  
  if (message.length > maxLength) {
    alert(`Message exceeds the maximum length of ${maxLength} characters.`);
    enableSendButton();
    return;
  }

  const ai_url = getAI_URL() + "/chat";
  const ai_model = getModelName();

  try {
    fetch(ai_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ai_model,
        messages: [
          { role: "user", content: message }
        ]
      })
    })
    .then(response => response.json())
    .then(data => handleResponse(data))
    .catch(err => {
      // Write error into response-props textarea
      document.getElementById("response-props").value = `Error: ${err.message || err.toString()}`;
      handleResponse(null, err);
    })
    .finally(() => {
      enableSendButton();
    });
  } catch (err) {
    // Catch synchronous errors (rare but possible)
    document.getElementById("response-props").value = `Error: ${err.message || err.toString()}`;
    handleResponse(null, err);
    enableSendButton();
  }
}

function handleResponse(data, error) {
  const outMarkdownContainer = document.getElementById("out-markdown");
  const responsePropsTextarea = document.getElementById("response-props");

  if (data) {
    handleResponseMessage(data, outMarkdownContainer);
    handleResponseProperties(data);
  } else {
    outMarkdownContainer.innerHTML = `<p style="color: red;">Error: ${error.toString()}</p>`;
    responsePropsTextarea.value = ""; // Clear any previous props content on error
  }
}

function handleResponseMessage(data, outMarkdownContainer) {
  const messageContent = data.message ? data.message.content : "";
  const rawHtml = marked.parse(messageContent);
  outMarkdownContainer.innerHTML = DOMPurify.sanitize(rawHtml); 
}

function handleResponseProperties(data) {
  const { message, ...properties } = JSON.parse(JSON.stringify(data));
  document.getElementById("response-props").value = JSON.stringify(properties, null, 2);
}

// Populate the dropdown list box with values from ai_models
function populateAI_Models() {
  const modelSelect = document.getElementById("model-select");
  // Remove all existing options
  while (modelSelect.firstChild) {
    modelSelect.removeChild(modelSelect.firstChild);
  }
  
  // Add new options based on ai_models
  ai_models.forEach(([submitValue, displayText]) => {
    const option = document.createElement("option");
    const whole_value = submitValue + ':' + displayText;

    option.value = whole_value;
    option.textContent = whole_value;
    modelSelect.appendChild(option);
  });

  enableSendButton();
}

// Fetch models data when the page loads
fetchModelsData();