# Deterministic Flow System Documentation

This document outlines the architecture, implementation, and flows of the Deterministic Flow System in the Chief of AI backend.

---

## 🏗️ Architecture: Before vs. After

### **Earlier: Pure Agentic Approach**
Every user message was sent directly to the LangChain Agent.
*   **Execution Flow**: `User Message` → `LangChain Agent` → `Tool Execution` → `SSE Response`.
*   **Issues**: Higher latency (LLM reasoning), potential hallucinations for simple actions, and occasional failure to extract specific parameters for CRUD operations.

### **Now: Hybrid Router-Flow-Agent Approach**
A deterministic layer now sits in front of the agent to handle common, high-frequency intents with 100% predictability and minimal latency.
*   **Execution Flow**: `User Message` → `Deterministic Flow Engine` → `Outcome?`
    *   ✅ **Match**: Execute Code Flow → `Success` → `SSE Response`.
    *   ❌ **No Match/Error**: Fallback to `LangChain Agent`.

---

## 🧩 Core Components (`src/flows/`)

| Component | Responsibility |
| :--- | :--- |
| **`FlowRegistry`** | Centralized manifest of all registered flows, sorted by priority. |
| **`FlowRouter`** | Stage 1 (Regex) and Stage 2 (Heuristic) matching engine. |
| **`FlowEngine`** | Orchestrates execution, creates context (services, DB, Redis), and handles errors/fallbacks. |
| **`FlowSessionManager`** | Manages multi-turn state using Upstash Redis with a 5-minute TTL. |

---

## ⚡ Implemented Flows

### **1. Reminders (`reminders/`)**
*   **`list_reminders`**: Instantly shows all user reminders.
*   **`create_reminder`**: Extracts title/time using regex and saves them directly.
*   **`delete_reminder`**: **(Stateful)** Lists reminders, asks user for a number/title, and deletes.

### **2. Tasks (`tasks/`)**
*   **`list_tasks`**: Displays a numbered list of tasks with status indicators.
*   **`create_task`**: Parses new tasks (e.g., "add task finish YC app").
*   **`delete_task`**: **(Stateful)** Multi-turn selection for deletion.
*   **`update_task`**: **(Stateful)** Step-by-step update for task titles (Select → New Title → Update).

### **3. Memory (`memory/`)**
*   **`share_memory`**: **(Stateful)** Lists memories for selection if multiple exist, then generates a `MEM-XXXXXX` share code.
*   **`join_memory`**: Detects a share code or prompts the user to enter one, then adds them to the memory access list.

### **4. Apps (`app/`)**
*   **`join_app`**: **(Stateful)** Detects `APP-XXXXXX` codes to join shared workspaces/apps instantly. Guidance is provided if the code is missing or invalid.

---

## 🛠️ Integration Point
The system is integrated into `src/controllers/chat.controller.ts`. It attempts to run a flow first; if the flow returns `{ type: "fallback" }` or throws an error, it proceeds to the existing `runAgent()` logic, ensuring no degradation in user experience.

---

## 📊 Benefits
1.  **Speed**: Replies happen in milliseconds instead of seconds (no LLM call).
2.  **Reliability**: Deterministic parameters ensure no "guessing" for deletions or updates.
3.  **Cost**: Significantly reduces tokens spent on repetitive CRUD operations.
4.  **State Management**: Complex multi-turn interactions are now managed outside of LLM context windows.
