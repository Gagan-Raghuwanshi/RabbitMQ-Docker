# Microservice Application

A complete microservice-based application with messaging, caching, and secure authentication.

## Features

- ✅ REST API with Node.js/Express
- ✅ JWT-based authentication
- ✅ Redis caching
- ✅ RabbitMQ messaging
- ✅ Role-based access control
- ✅ Docker containerization

## Prerequisites

- Docker and Docker Compose
- node:22-alpine (for development)

## Quick Start

1. Clone the repository:

```bash
git clone https://github.com/Gagan-Raghuwanshi/RabbitMQ-Docker.git
cd microservice-app
```

2. docker compose up --build -d
3. Verify containers are running:
- docker ps
4. Open Postman or browser:
- http://localhost:3000

Expected response:
{
"success": true,
"message": "API Server is running..."
}
