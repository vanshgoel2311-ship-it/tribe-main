# Tribe
**Tribe** - A modern, containerized messaging platform designed to keep communities connected. Utilizing Docker, it ensures environment consistency across development and production. With WebSockets at its core, Tribe delivers instant, low-latency communication, making real-time interaction seamless for every user.

## 🚀 Features
*   **Real-time Messaging**: Instant communication using WebSockets (Socket.io).
*   **Topic Channels**: Create and join specific "Tribes" based on interests.
*   **Dockerized Environment**: Zero-config setup using Docker Compose.
*   **Scalable Architecture**: Uses Redis Pub/Sub to allow horizontal scaling of backend nodes.
*   **Persistent History**: Chat logs are stored securely in MongoDB.
*   **Live Presence**: See who is currently online in your Tribe.

## 📂 Project Structure
```bash
tribe/
├── frontend/           # React Frontend
│   ├── Dockerfile
│   └── src/
├── backend/            # Node.js Backend
│   ├── Dockerfile
│   └── src/
├── docker-compose.yml  # Orchestration file
└── README.md
```

## 🏗️ Architectural Overview
Tribe abandons the monolithic approach in favor of decoupled services. This ensures that a failure or high load in one component (e.g., video processing) does not degrade the performance of another (e.g., text messaging).

*   **Containerization (Docker)**: Every service runs in its own container, guaranteeing that the application works identically across development (local) and production (cloud) environments.
*   **Orchestration**: Services communicate via an internal Docker network, while an API Gateway (like Nginx) manages external traffic routing.

### Core Microservices

#### A. The Chat Service (The Nervous System)
*   **Role**: Handles persistent connections, real-time event broadcasting, and message storage.
*   **Technology**: Node.js with WebSockets (e.g., Socket.io).
*   **Function**: Maintains an open bi-directional pipe between the server and the user. It is responsible for delivering text, images, and—crucially—Meeting Invites.

#### B. The Meet Service (The Video Engine)
*   **Role**: A dedicated, stateless service focused solely on real-time media.
*   **Technology**: WebRTC (Web Real-Time Communication) and a Signaling Server.
*   **Function**: It does not store user data. Its only job is to generate unique "Rooms" and facilitate the peer-to-peer (P2P) video streams between users who join those rooms.

#### C. Persistence & Caching
*   **Redis**: Used as a message broker and presence cache (handling "Who is Online" status).
*   **Database (MongoDB/Postgres)**: Stores user profiles, chat history, and team structures.

## 🔗 The "Link-Based" Meeting Workflow
This is the specific logic that powers the video integration, decoupling the invitation from the session.

**Step 1: The Trigger (Room Generation)**
*   User A decides to start a call and clicks the "Video Camera" icon in the UI.
*   The Client sends a REST API request to the Meet Service container (e.g., POST `/create-room`).
*   The Meet Service generates a unique UUID (e.g., `meet-8x92-zk41`) and returns a joinable URL: `https://localhost:3000/chats/`

**Step 2: The Invitation (Signaling via Chat)**
*   User A's client automatically takes this URL and wraps it in a formatted message payload.
*   The client emits this payload via the Chat Service WebSocket connection.
*   The Chat Service broadcasts this message to the channel. It appears in the chat history as a clickable "Join Meeting" card.

**Step 3: The Connection (Joining the Room)**
*   User B sees the invite in the chat stream and clicks the link.
*   User B's browser opens the Meet interface and connects directly to the Meet Service using the Room ID from the URL.
*   Since User A is already waiting in that room, the Meet Service initiates the WebRTC handshake, and video begins streaming.

## 🏁 Getting Started
Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites
*   Docker and Docker Compose installed on your machine.
*   [Get Docker Desktop](https://www.docker.com/products/docker-desktop)

### Installation
1.  **Clone the repository**
    ```bash
    git clone https://github.com/Rishabhkothiyal1/tribe.git
    cd tribe
    ```

2.  **Environment Configuration**
    Create a `.env` file in the `backend` directory (or use the provided example):
    ```bash
    PORT=5000
    MONGO_URI=mongodb://mongo:27017/tribe
    REDIS_HOST=redis
    CLIENT_URL=http://localhost:3000
    ```

3.  **Run with Docker Compose**
    This command will build the images and start the containers for the Client, Server, MongoDB, and Redis.
    ```bash
    docker-compose up --build
    ```

### Access the Application
*   **Frontend**: Open [http://localhost:3000](http://localhost:3000)
*   **Backend API**: Running at [http://localhost:5000](http://localhost:5000)
