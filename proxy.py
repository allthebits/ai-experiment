from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

OLLAMA_CHAT_URL = "http://localhost:11434/api/chat"
OLLAMA_TAGS_URL = "http://localhost:11434/api/tags"

def get_tags():
    try:
        tags_response = requests.get(
            OLLAMA_TAGS_URL,
            headers={"Content-Type": "application/json"}
        )
        return jsonify(tags_response.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    return response

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()

        # Force Ollama to return ONE JSON object
        data["stream"] = False

        ollama_response = requests.post(
            OLLAMA_CHAT_URL,
            json=data,
            headers={"Content-Type": "application/json"}
        )

        return jsonify(ollama_response.json())

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/tags", methods=["GET"])
def tags():
    return get_tags()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000)
