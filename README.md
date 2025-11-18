# Predictive-Transaction-Intelligence-using-for-BFSI


# 🚀 BFSI Predictive Intelligence Platform

A full-stack web application integrating **Machine Learning** and **Large Language Models (LLMs)** for BFSI (Banking, Financial Services & Insurance) applications. The platform provides **fraud detection**, a **domain-tuned chatbot**, and a **transaction data viewer** in a modern single-page UI.

---

## 📚 Table of Contents

* [Overview](#overview)
* [Features](#features)
* [Architecture](#architecture)
* [Setup & Installation](#setup--installation)
* [Configuration](#configuration)
* [How to Use](#how-to-use)
* [API Endpoints](#api-endpoints)
* [Project Structure](#project-structure)
* [Troubleshooting](#troubleshooting)
* [Contributors](#contributors)

---

## 🎯 Overview

The platform integrates:

* **Fraud Detection Model** (scikit-learn)
* **BFSI Chatbot** built on Phi-3 with LoRA fine-tuning
* **CSV Transaction Viewer**
* **Frontend SPA** built with HTML, JS, and Tailwind CSS

It is lightweight, deployable locally, and ideal for demos, prototypes, and academic or personal AI projects.

---

## ✨ Features

### 🔍 1. Fraud Detection

* Predicts whether a transaction is *Fraud* or *Normal*
* Handles 17+ transaction features (amount, location, device, category, time, etc.)
* Outputs fraud probability score

### 🤖 2. BFSI Chatbot

* Based on **Phi-3-Mini-4K-Instruct**
* Finetuned using **LoRA adapters** for BFSI domain Q&A
* Maintains conversation history
* Optimized for CPU inference

### 📊 3. Data Viewer

* Displays up to 100 rows from a CSV file
* Useful for analyzing transaction history
* Fast and responsive frontend table

### 🖥️ 4. Frontend UI

* Single-Page Application (SPA)
* Navigation pages:

  * Home
  * Fraud Detection
  * Chatbot
  * Data Viewer
  * About
* Built using **Tailwind CSS**

---

## 🏗️ Architecture

### Backend (FastAPI)

* FastAPI for routing
* Uvicorn ASGI server
* scikit-learn (fraud model)
* Transformers + PEFT + PyTorch (chatbot)

### Frontend

* HTML5 + Vanilla JavaScript
* Tailwind CSS
* Fetch API for backend communication
* No build system; works directly in the browser

### Models Used

* `fraud_detector.pkl`
* `scaler.pkl`
* Phi-3 LLM with LoRA adapters (`phi3-bfsi-finetuned`)

---

## ⚙️ Setup & Installation

### 1. Clone the project

```bash
git clone <repository-url>
cd BFSI-Predictive-Intelligence
```

### 2. Backend Setup

```bash
cd bfsi_backend
python -m venv venv
source venv/bin/activate     # macOS/Linux
# or
venv\Scripts\activate        # Windows
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 3. Place Model Files

Add the following to `bfsi_backend/app/models/`:

```
fraud_detector.pkl
scaler.pkl
```

### 4. Configure Chatbot

In `chatbot_wrapper.py`:

```python
LORA_ADAPTER_PATH = r"<path-to-your-fine-tuned-lora-adapters>"
```

### 5. Optional: CSV Viewer

In `main.py`:

```python
csv_path = r"<your-csv-file-path>"
```

---

## 🧩 Configuration

### Change Backend Port

In `app.py`:

```python
uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Configure Frontend API URL

In `script.js` and `main.js`:

```javascript
const API_BASE_URL = "http://127.0.0.1:8000";
```

---

## 🚀 How to Use

### Start Backend

```bash
cd bfsi_backend
python app.py
```

Backend starts at:

```
http://127.0.0.1:8000
```

### Open Frontend

Option 1 — Just open:

```
Front-End/index.html
```

Option 2 — Use a local server:

```bash
cd Front-End
python -m http.server 8080
```

---

## 🛰️ API Endpoints

### ✔️ 1. Health Check

```
GET /
```

### 🔍 2. Fraud Prediction

```
POST /predict_fraud
```

Request:

```json
{
  "feature_vector": [1250.75, 10, 445, 876, 1, 0, 2, 12, 50.2, 15.5, 1, 3, 3, 2024, 1, 15, 14]
}
```

### 🤖 3. Chatbot

```
POST /chat
```

### 📊 4. CSV Data

```
GET /csv_data
```

---

## 📂 Project Structure

```
BFSI-Predictive-Intelligence/
│
├── bfsi_backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── chatbot_wrapper.py
│   │   └── models/
│   │       ├── fraud_detector.pkl
│   │       └── scaler.pkl
│   ├── app.py
│   └── requirements.txt
│
├── Front-End/
│   ├── index.html
│   ├── script.js
│   ├── main.js
│   ├── encoders_full.js
│   └── style.css
│
└── README.md
```

---

## 🛠️ Troubleshooting (Quick)

| Issue             | Reason              | Fix                           |
| ----------------- | ------------------- | ----------------------------- |
| Port 8000 in use  | Another app running | Kill process or change port   |
| “Model not found” | Wrong path          | Place PKL files in `/models/` |
| Chatbot slow      | CPU inference       | Reduce `max_new_tokens`       |
| “Failed to fetch” | API URL mismatch    | Check `API_BASE_URL`          |
| CSV not loading   | Missing file        | Update CSV path               |

---

## 👥 Contributors

**Your Name / Team Name**
(Feel free to add more contributors)


