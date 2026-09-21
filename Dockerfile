# Use the official Apache HTTP Server image as the base image
FROM httpd:2.4

# Enable required Apache modules
RUN sed -i 's/#LoadModule headers_module/LoadModule headers_module/' /usr/local/apache2/conf/httpd.conf
RUN sed -i 's/#LoadModule proxy_module/LoadModule proxy_module/' /usr/local/apache2/conf/httpd.conf
RUN sed -i 's/#LoadModule proxy_http_module/LoadModule proxy_http_module/' /usr/local/apache2/conf/httpd.conf
RUN sed -i 's/#LoadModule rewrite_module/LoadModule rewrite_module/' /usr/local/apache2/conf/httpd.conf
RUN sed -i 's/#LoadModule dumpio_module/LoadModule dumpio_module/' /usr/local/apache2/conf/httpd.conf

# Add reverse proxy + CORS config
COPY cors_proxy.conf /usr/local/apache2/conf/extra/cors_proxy.conf
RUN echo "Include conf/extra/cors_proxy.conf" >> /usr/local/apache2/conf/httpd.conf


# Copy the HTML, CSS, and JavaScript files to the Apache document root
COPY chat.html /usr/local/apache2/htdocs/
COPY chat.js /usr/local/apache2/htdocs/
COPY chat.css /usr/local/apache2/htdocs/

# Expose port 80 to allow external access
EXPOSE 80

# Start Apache server
CMD ["httpd-foreground"]

# Build the container
#    docker build -t ollama-chat-app .

# No Persistent storage
#     docker run -d -p 8888:80 --name ollama-chat ollama-chat-app
#     docker run -d -p 8888:80 -e OLLAMA_BACKEND=http://192.168.81.119:11434  --name ollama-chat ollama-chat-app
#     docker run -d -p 8888:80 --name ollama-chat --network host ollama-chat-app

# Persistent storage
#     docker run -d -p 8888:80 --name ollama-chat -v $(pwd)/htdocs:/usr/local/apache2/htdocs ollama-chat-app

