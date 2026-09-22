# Chat Application with Docker and Apache

This project is an Ollama AI chat application that uses Apache as the web server and Docker to containerize the application. The chat communicates with Ollama which is hosted on an arbitrary system.

## **Table of Contents**

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Building and Running the Docker Container](#building-and-running-the-docker-container)
- [Configuration](#configuration)
- [Accessing the Application](#accessing-the-application)

## **Overview**

The Chat Application is a simple web-based chat interface that communicates with an AI backend (in this case, Ollama). It uses Apache to serve the static HTML, CSS, and JavaScript files. The application is containerized using Docker for easy deployment and scalability.

In this case of thia application, Ollama is hosted on Docker running on WSL:Ubuntu on a Windows 11 host system. This introduces some Windows 11 WSL:Ubuntu networking issues, which we will demonstrate how to resolve.

The Apache piece also includes a configuration to handle CORS (Cross-Origin Resource Sharing) directly in Apache. Without this, Ollama would reject all http requests.

## **Prerequisites**

Before you begin, ensure that you have the following installed on your machine:

- **Docker**: [Install Docker](https://docs.docker.com/get-docker/)
- **Git (Optional)**: If you plan to clone the repository, you need Git: [Install Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)

## **Project Structure**

The project has the following structure:

ai-experiment/
├── chat.css # Stylesheet for the chat interface
├── chat.html # HTML file for the chat interface
├── chat.js # JavaScript file for the chat interface
├── cors_proxy.conf # Apache configuration for CORS
├── Dockerfile # Dockerfile to build the container
├── ollama-agent.json # Configuration for Ollama agent (if used)
└── proxy.py # Python script to handle CORS (not used with Apache)

## **Building and Running the Docker Container**

### **Step 1: Build the Docker Image**

#### **Build to remote Docker**

SSH Keys

1. Create and add to local system:  ```ssh-keygen -t ed25519 -C "mj.kelleher@gmail.com"```
1. Start an SSH agent, config current shell to use it:  ```eval "$(ssh-agent -s)"```
1. Add the keys to the local system: ```ssh-add ~/.ssh/id_ed25519```
1. Copy the keys to remote server *docker-server*: ```ssh-copy-id mjkel@docker-server```

Remote Docker Context

1. To create a remote Context:  ```docker context create remote-docker --docker "host=ssh://mjkel@docker-server"```
1. To set the remote Docker context: ```docker context use remote-docker```
1. To revert the context (when you are done): ```docker context use default```

#### **Building to Docker**

1. Open a terminal, navigate to the project directory
1. Set the Docker context if remote, if not, go to the next step
1. Run the following command to build the Docker image:

```docker build -t ollama-chat-app .```

- **`-t chat-app`**: Tags the Docker image with the name `chat-app`.

This will either built to your local or remote Docker server

### **Step 2: Run the Docker Container**

After building the image, you can run a container using the following command. Again, if it's remote, set the remote Docker context.

```docker run -d -p 8888:80 -e OLLAMA_BACKEND=http://192.168.81.119:11434  --name ollama-chat ollama-chat-app```

- **`-p 8888:80`**: Forward system port 8888 to Docker image port 80
- **`-e OLLAMA_BACKEND=http://192.168.0.124:11434`**: Set Apache Environment variable OLLAMA_BACKEND to be used in the Apache config
- **`-name ollama-chat`**: The name of the Docker container when running
- **`ollama-chat-app`**: The name of the Docker image to base the new container on

## **Configuration**

### **Step 3: Fixing Windows 11 / WSL:Ubuntu Networking Issues**

#### 1. Add Proxy on Windows 11 Host from Windows 11 to the Docker Container

```netsh interface portproxy add v4tov4  listenaddress=192.168.0.124 listenport=11434 connectaddress=192.168.81.119 connectport=11434````

Check to see if it was added:

```netsh interface portproxy show all```

To Remove this Proxy:

```netsh interface portproxy delete v4tov4 listenaddress=192.168.0.124 listenport=11434```

#### 2. Allow the port through the Windows Firewall

````New-NetFirewallRule -DisplayName "WSL Docker Ollama" -Direction Inbound -Protocol TCP -LocalPort 11434 -Action Allow````

Check to see if it was added:

```Get-NetFirewallRule -DisplayName "WSL Docker Ollama"```

OR

```Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Ollama*"} | Format-Table DisplayName, Enabled, Direction, Action```

To remove this Firewall rule:

```Remove-NetFirewallRule -DisplayName "WSL Docker Ollama"```

## **Accessing the Application**

### **Step 4: Accessing the Chat App**

1. In a browser navigate to:  [Ollama Chat App](http://192.168.0.115:8888/chat.html) - or whatever your hostname or IP Address is

*NOTE:* Ollama must be running on (in this case) http://192.168.81.119:11434 - or the app will not function