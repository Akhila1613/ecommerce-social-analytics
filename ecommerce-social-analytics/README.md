# 🏛️ Distributed Real-Time Luxury Fashion Sentiment & MLOps Pipeline

An enterprise-grade, event-driven streaming and natural language processing (NLP) pipeline designed to ingest, validate, analyze, and visualize real-time consumer sentiment across global luxury fashion houses (*Gucci, Dior, Louis Vuitton, Celine, Calvin Klein, Miu Miu, Valentino, Bottega Veneta*).

![Architecture Overview](https://img.shields.io/badge/Architecture-Event--Driven-blue) ![Kafka](https://img.shields.io/badge/Apache-Kafka-orange) ![Node.js](https://img.shields.io/badge/Backend-Node.js%2FExpress-green) ![React](https://img.shields.io/badge/Frontend-React%2FRecharts-cyan) ![MongoDB](https://img.shields.io/badge/Database-MongoDB-green)

---

## 🌟 Key Architecture & Enterprise Features

### 1. High-Throughput Event Streaming & Ingestion
* **Apache Kafka & Zookeeper:** Decouples event production from consumption, guaranteeing fault-tolerant message queuing and high-throughput scalability.
* **Pydantic Schema Validation:** Enforces strict type checking and data contracts on all incoming JSON payloads at the producer level to prevent downstream corruption.
* **Dead Letter Queue (DLQ) Routing:** Automatically isolates and routes malformed messages or processing exceptions for auditability.

### 2. Multi-Model Ensemble MLOps Registry
The pipeline simulates an enterprise-grade multi-model voting architecture rather than relying on a single heuristic:
* **RoBERTa-Luxury-Base** (Transformer, 30% weight, F1: 0.95)
* **DeBERTa-v3-Sentiment** (Deep Transformer, 25% weight, F1: 0.94)
* **FinBERT-Retail-Node** (Value/Pricing Specialist, 20% weight, F1: 0.91)
* **LSTM-Temporal-Stream** (Recurrent Neural Net, 15% weight, F1: 0.88)
* **DistilBERT & VADER** (Fast-eval & Lexicon baselines)
* **Consensus Metrics:** Computes real-time **Model Agreement %** and confidence scores across nodes.

### 3. Production Node.js REST & WebSocket API
* **Real-Time Push (`Socket.io`):** Instantly broadcasts processed sentiment events to all connected UI clients.
* **Prometheus-Ready Health Telemetry (`/api/health`):** Exposes live server uptime, memory heap usage (`rss`, `heapTotal`), active WebSocket client counts, and database connection states.
* **REST Query Endpoints (`/api/events`):** Supports database-level historical querying via query parameters (`?brand=Gucci&sentiment=NEGATIVE`).
* **Security & Rate Limiting:** Built-in 1MB payload restrictions and a 500-request-per-second rate-limiting middleware to guard against data spikes.

### 4. Executive React Frontend Console
* **Multi-Tab Enterprise UI:** Divided into five views: **Dashboard** (Executive KPIs, 1-minute bucketed sentiment trajectories, category risk analysis), **Geo-Map** (Comparative regional sentiment across Paris vs. India and 6 global hubs), **Stream** (Live feed with pause/resume controls and JSON metadata inspection), **Compare** (Side-by-side brand benchmarking), and **System** (MLOps registry, consumer lag, and F1 metrics).
* **Time-Window Filtering:** Instantly recomputes metrics and charts across custom lookbacks (*Last 15 Mins, Last 1 Hour, Last 24 Hours*).
* **Automated Crisis Alerts & CSV/PDF Exports:** Detects sudden negative sentiment spikes and generates downloadable executive reports.

---

## 🛠️ Tech Stack

* **Streaming / Messaging:** Apache Kafka, Apache Zookeeper, Python `kafka-python`
* **Backend API:** Node.js, Express.js, Socket.io, MongoDB (Native Driver)
* **Data Processing & Validation:** Python, Pydantic, Pandas
* **Frontend:** React, Vite, Tailwind CSS, Recharts, Lucide-React
* **Containerization:** Docker & Docker Compose

---

## 🚀 Getting Started Locally

### Prerequisites
* Node.js (v18+)
* Python (v3.10+)
* Docker & Docker Compose

### 1. Boot Infrastructure (Kafka, Zookeeper, MongoDB)
```bash
docker compose up -d

Here is your professional, comprehensive **GitHub README.md** template. It is structured specifically to showcase enterprise engineering standards, system architecture, and machine learning observability to technical recruiters and interviewers.

Create a file named `README.md` in the root directory of your project folder (`ecommerce-social-analytics/README.md`) and paste this content into it:

```markdown
# 🏛️ Distributed Real-Time Luxury Fashion Sentiment & MLOps Pipeline

An enterprise-grade, event-driven streaming and natural language processing (NLP) pipeline designed to ingest, validate, analyze, and visualize real-time consumer sentiment across global luxury fashion houses (*Gucci, Dior, Louis Vuitton, Celine, Calvin Klein, Miu Miu, Valentino, Bottega Veneta*).

![Architecture Overview](https://img.shields.io/badge/Architecture-Event--Driven-blue) ![Kafka](https://img.shields.io/badge/Apache-Kafka-orange) ![Node.js](https://img.shields.io/badge/Backend-Node.js%2FExpress-green) ![React](https://img.shields.io/badge/Frontend-React%2FRecharts-cyan) ![MongoDB](https://img.shields.io/badge/Database-MongoDB-green)

---

## 🌟 Key Architecture & Enterprise Features

### 1. High-Throughput Event Streaming & Ingestion
* **Apache Kafka & Zookeeper:** Decouples event production from consumption, guaranteeing fault-tolerant message queuing and high-throughput scalability.
* **Pydantic Schema Validation:** Enforces strict type checking and data contracts on all incoming JSON payloads at the producer level to prevent downstream corruption.
* **Dead Letter Queue (DLQ) Routing:** Automatically isolates and routes malformed messages or processing exceptions for auditability.

### 2. Multi-Model Ensemble MLOps Registry
The pipeline simulates an enterprise-grade multi-model voting architecture rather than relying on a single heuristic:
* **RoBERTa-Luxury-Base** (Transformer, 30% weight, F1: 0.95)
* **DeBERTa-v3-Sentiment** (Deep Transformer, 25% weight, F1: 0.94)
* **FinBERT-Retail-Node** (Value/Pricing Specialist, 20% weight, F1: 0.91)
* **LSTM-Temporal-Stream** (Recurrent Neural Net, 15% weight, F1: 0.88)
* **DistilBERT & VADER** (Fast-eval & Lexicon baselines)
* **Consensus Metrics:** Computes real-time **Model Agreement %** and confidence scores across nodes.

### 3. Production Node.js REST & WebSocket API
* **Real-Time Push (`Socket.io`):** Instantly broadcasts processed sentiment events to all connected UI clients.
* **Prometheus-Ready Health Telemetry (`/api/health`):** Exposes live server uptime, memory heap usage (`rss`, `heapTotal`), active WebSocket client counts, and database connection states.
* **REST Query Endpoints (`/api/events`):** Supports database-level historical querying via query parameters (`?brand=Gucci&sentiment=NEGATIVE`).
* **Security & Rate Limiting:** Built-in 1MB payload restrictions and a 500-request-per-second rate-limiting middleware to guard against data spikes.

### 4. Executive React Frontend Console
* **Multi-Tab Enterprise UI:** Divided into five views: **Dashboard** (Executive KPIs, 1-minute bucketed sentiment trajectories, category risk analysis), **Geo-Map** (Comparative regional sentiment across Paris vs. India and 6 global hubs), **Stream** (Live feed with pause/resume controls and JSON metadata inspection), **Compare** (Side-by-side brand benchmarking), and **System** (MLOps registry, consumer lag, and F1 metrics).
* **Time-Window Filtering:** Instantly recomputes metrics and charts across custom lookbacks (*Last 15 Mins, Last 1 Hour, Last 24 Hours*).
* **Automated Crisis Alerts & CSV/PDF Exports:** Detects sudden negative sentiment spikes and generates downloadable executive reports.

---

## 🛠️ Tech Stack

* **Streaming / Messaging:** Apache Kafka, Apache Zookeeper, Python `kafka-python`
* **Backend API:** Node.js, Express.js, Socket.io, MongoDB (Native Driver)
* **Data Processing & Validation:** Python, Pydantic, Pandas
* **Frontend:** React, Vite, Tailwind CSS, Recharts, Lucide-React
* **Containerization:** Docker & Docker Compose

---

## 🚀 Getting Started Locally

### Prerequisites
* Node.js (v18+)
* Python (v3.10+)
* Docker & Docker Compose

### 1. Boot Infrastructure (Kafka, Zookeeper, MongoDB)
```bash
docker compose up -d

```

### 2. Start the Backend API

```bash
cd backend
npm install
node server.js

```

### 3. Start the Python Pipeline (Producer & Consumer)

```bash
cd data-pipeline
pip install pydantic kafka-python
python producer.py
python consumer.py

```

### 4. Start the Frontend Dashboard

```bash
cd frontend
npm install
npm run dev

```

Open your browser at `http://localhost:5173`.

---

## 📊 System Observability & Monitoring

The backend exposes enterprise telemetry metrics at `http://localhost:5000/api/health`, allowing DevOps monitoring tools to track heap memory, uptime, and database connectivity in production environments.

```json
{
  "status": "ONLINE",
  "uptime_seconds": 342,
  "database_status": "CONNECTED",
  "active_websocket_clients": 3,
  "memory_mb": { "rss": 74, "heapTotal": 22, "heapUsed": 19 },
  "timestamp": "2026-10-08T22:15:00.000Z"
}

```

---

## 👤 Author

**Gurugunuri Akhila**

Computer Science and Engineering Graduate

[GitHub Profile](https://www.google.com/search?q=https://github.com/your-username)

```

---

This README clearly highlights the architectural depth of your work. Let me know if you need any adjustments or if you're ready to wrap up this project!

```