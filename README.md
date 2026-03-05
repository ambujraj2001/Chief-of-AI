# 🤖 Chief of AI

**Chief of AI** is a professional, enterprise-grade AI assistant platform designed to orchestrate complex operations through a unified, high-performance interface. Managed with precision, secured by zero-knowledge architecture, and observed with state-of-the-art telemetry.

---

## 🔗 Project Ecosystem

| Module                | Link                                                                                    |
| :-------------------- | :-------------------------------------------------------------------------------------- |
| **🚀 Production App** | [chief-of-ai.vercel.app](https://chief-of-ai.vercel.app/login)                          |
| **⚡ Backend API**    | [chief-of-ai.onrender.com](https://chief-of-ai.onrender.com)                            |
| **📊 Axiom Logs**     | [Real-time Stream](https://app.axiom.co/ambuj-amwx/stream/chief-of-ai-logs)             |
| **🧪 LangSmith**      | [smith.langchain.com](https://smith.langchain.com/)                                     |
| **🎨 UX Design**      | [Stitch Workspace](https://stitch.withgoogle.com/projects/1326706984944929208)          |
| **✉️ Brevo SMTP**     | [Real-time SMTP Logs](https://app-smtp.brevo.com/real-time)                             |
| **💾 Upstash Redis**  | [Redis Console](https://console.upstash.com/redis/bdfb762f-b708-40d2-920d-c4102ca0a9e5) |

---

## ✨ Core Capabilities

- **Strategic AI Orchestration**: Centralized command center for real-time AI operations and task delegation.
- **Deep Personalization Engine**: Fine-tune interaction tone, response complexity (Simple to Expert), and cognitive behavioral patterns.
- **Zero-Knowledge Security**: Multi-step onboarding with unique `AI-XXXX-XXXX` master access code generation for maximum privacy.
- **Persistent Cognitive Context**: Seamlessly maintains user state across sessions via optimized Redux management.
- **Premium UI/UX**: Modern glassmorphism design, fluid micro-interactions, and real-time state visualization.

---

## 🛠 Advanced Tech Stack

### Frontend Architecture

- **Framework**: React 18 & TypeScript (Vite)
- **Styling**: Tailwind CSS & Ant Design
- **State**: Redux Toolkit & Persistence
- **Voice**: Web Speech API for persistent voice-to-text.

### Backend Infrastructure

- **Runtime**: Node.js & Express (TypeScript)
- **Intelligence**: Mistral AI (Small/Latest) via LangChain
- **Storage**: Supabase (PostgreSQL) & Edge Functions
- **Observability**: Axiom & LangSmith

---

## 👁️ Observability & Monitoring

We employ a robust observability strategy to ensure maximum reliability and transparency.

### **Distributed Tracing**

- **LangSmith Integration**: Full agent reasoning path tracing, tool execution metrics, and latency analysis.
- **X-Trace-ID Service**: End-to-end trace propagation from frontend to backend for precise request debugging.

### **Centralized Logging**

- **Axiom Cloud Logging**: Structured JSON logs streamed directly to Axiom for advanced analysis and dashboarding.
- **Log Stream**: [Chief of AI Axiom Dashboard](https://app.axiom.co/ambuj-amwx/stream/chief-of-ai-logs)

---

## 🚦 Getting Started

### 1. Prerequisites

- Node.js (v18+)
- Mistral AI API Key
- Supabase Project
- Axiom & LangSmith API Keys

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/ambujraj2001/Chief-of-AI.git
cd Chief-of-AI

# Install Workspace Dependencies
cd biz-flow && npm install
cd ../client && npm install
```

### 3. Environment Configuration

Copy the legacy example files and fill in your secrets:

**Backend (`/biz-flow`):**

```bash
cp .env.example .env
```

_Required: MISTRAL_API_KEY, SUPABASE_URL, AXIOM_TOKEN, LANGCHAIN_API_KEY_

**Frontend (`/client`):**

```bash
cp .env.example .env
```

_Required: VITE_API_URL_

### 4. Local Development

```bash
# Terminal 1: Backend
cd biz-flow && npm run dev

# Terminal 2: Frontend
cd client && npm run dev
```

---

## 📁 Repository Structure

```text
.
├── client/           # React Frontend (Vite)
├── biz-flow/         # Node.js Backend (Express)
├── .gitignore        # Monorepo ignore configuration
└── README.md         # Documentation Hub
```

---

<p align="center">
  Built with precision for the next generation of AI Operations. 🚀
</p>
