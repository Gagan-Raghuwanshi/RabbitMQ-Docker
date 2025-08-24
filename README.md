Microservice Application

A complete microservice-based application built with Node.js that supports messaging, caching, and secure authentication.

Features

✅ REST API built with Node.js/Express

✅ JWT-based authentication

✅ Redis caching for improved performance

✅ RabbitMQ messaging for asynchronous communication

✅ Role-based access control

✅ Docker containerization for easy deployment

Prerequisites

Docker
 and Docker Compose
 installed

Node.js environment: node:22-alpine (for development)

Quick Start

Clone the repository:

git clone https://github.com/Gagan-Raghuwanshi/RabbitMQ-Docker.git
cd microservice-app


Start the application with Docker Compose:

docker compose up --build -d


Verify containers are running:

docker ps


Access the API:

Open Postman or your browser and visit:

http://localhost:3000


Expected response:

{
    "success": true,
    "message": "API Server is running..."
}