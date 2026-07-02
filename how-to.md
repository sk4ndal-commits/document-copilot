# How to Run Document Copilot

This guide explains how to set up and run the Document Copilot application using Docker and Docker Compose.

## 📋 Prerequisites

Ensure you have the following installed:
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## 🛠️ Configuration

Before running the application, you need to set up your environment variables.

1. Create a `.env` file in the root directory of the project:
   ```env
   KIMI_API_KEY=your_kimi_api_key_here
   JWT_SECRET=your_super_secret_jwt_signing_key
   ```
   - `KIMI_API_KEY`: Your API key for the Kimi LLM service.
   - `JWT_SECRET`: A random string used to sign security tokens.

## 🚀 Running the Application

To build and start all services, run:

```bash
docker-compose up --build -d
```

This command will:
1. Build the frontend and backend Docker images.
2. Pull the PostgreSQL and Qdrant images.
3. Start all containers in the background.

## 🌐 Accessing the App

Once the containers are running, you can access the application at:

- **Frontend UI**: [http://localhost:8080](http://localhost:8080)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

## 🔍 Service Overview

The application consists of the following services:

| Service | Technology | Description |
| :--- | :--- | :--- |
| `frontend` | React + Vite + Nginx | The user interface for interacting with documents and search. |
| `backend` | FastAPI (Python) | Orchestrates RAG, document processing, and API routes. |
| `postgres` | PostgreSQL | Stores metadata, user roles, and chat history. |
| `qdrant` | Qdrant | Vector database for semantic search and retrieval. |

## 🛑 Stopping the Application

To stop and remove the containers, run:

```bash
docker-compose down
```

To also remove the stored data (PostgreSQL and Qdrant volumes), run:

```bash
docker-compose down -v
```

## 🛠️ Troubleshooting

- **Check logs**: If something isn't working, check the logs for a specific service:
  ```bash
  docker-compose logs -f backend
  ```
- **Rebuild**: If you've made changes to the code, rebuild the containers:
  ```bash
  docker-compose up --build
  ```
