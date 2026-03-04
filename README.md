# Chief of AI

## Deployment & Dashboard Links

- **Frontend App:** [https://chief-of-ai.vercel.app/login](https://chief-of-ai.vercel.app/login)
- **Frontend Dashboard (Vercel):** [https://vercel.com/ambujraj2001s-projects/chief-of-ai/DSuBykqhJfEuGQki9tsrrEBjj1Y4](https://vercel.com/ambujraj2001s-projects/chief-of-ai/DSuBykqhJfEuGQki9tsrrEBjj1Y4)
- **Backend API:** [https://chief-of-ai.onrender.com](https://chief-of-ai.onrender.com)
- **Backend Dashboard (Render):** [https://dashboard.render.com/web/srv-d6k9venkijhs73bltrqg](https://dashboard.render.com/web/srv-d6k9venkijhs73bltrqg)
- **UX Design (Stitch):** [https://stitch.withgoogle.com/projects/1326706984944929208](https://stitch.withgoogle.com/projects/1326706984944929208)

## Project Overview

Chief of AI is a powerful enterprise-grade AI assistant platform designed to streamline operations through a unified, secure interface. It features a modern design focused on high-performance task management and AI personalization.

![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node%20%7C%20Supabase-success?style=for-the-badge)

## 🚀 Features

- **Strategic AI Dashboard**: A central hub for real-time AI operations and task tracking.
- **Deep Personalization**: Fine-tune the AI's interaction tone, response complexity (from Simple to Expert), and voice models.
- **Security-First Onboarding**: Multi-step protected signup with unique master access code generation for zero-knowledge security.
- **Persistent Operations**: Seamless navigation between chats, settings, and upcoming feature modules.
- **Micro-interactions**: Glassmorphism UI, smooth transitions, and real-time state management via Redux.

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Ant Design, Redux Toolkit.
- **Backend**: Node.js, Express, TypeScript.
- **Database**: Supabase (PostgreSQL).
- **Authentication**: Access Code based security model.

---

## 🚦 Getting Started

### 1. Prerequisites

- Node.js (v18+)
- A Supabase project and API keys.

### 2. Environment Setup

#### Backend (`/biz-flow`)

Create a `.env` file in the `biz-flow` directory:

```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

#### Frontend (`/client`)

Create a `.env` file in the `client` directory:

```env
VITE_API_BASE_URL=http://localhost:5000
```

### 3. Installation

From the project root:

```bash
# Install backend dependencies
cd biz-flow && npm install

# Install frontend dependencies
cd ../client && npm install
```

### 4. Running the Project

Open two terminal windows/tabs:

**Terminal 1: Backend**

```bash
cd biz-flow
npm run dev
```

**Terminal 2: Frontend**

```bash
cd client
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## 📖 Main Modules

### **New Conversation**

The core interaction area. Type or use **Voice Input** (WebSpeech API) to communicate with your AI assistant.

### **Settings (Profile & AI)**

A comprehensive module to manage your identity and AI behavior:

- **Tone**: Professional, Casual, Technical, or Concise.
- **Complexity**: 5 levels of response depth (Simple → Expert).
- **Security**: Manage your identity and clear context memory.

### **Security Model**

During signup, the system generates a unique **Master Access Code** (e.g., `AI-XXXX-XXXX`). This code is your only way to login. **Store it safely!**

---

## 📁 Repository Structure

```text
.
├── client/           # React Frontend (Vite)
├── biz-flow/         # Node.js Backend (Express)
├── .gitignore        # Root level ignore (Monorepo)
└── README.md         # You are here
```

Created with ❤️
