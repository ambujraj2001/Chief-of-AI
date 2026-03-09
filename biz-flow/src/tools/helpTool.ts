import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { log } from "../utils/logger";

export const helpTool = tool(
  async (): Promise<string> => {
    log({
      event: "tool_execution_started",
      toolName: "help_capabilities",
      args: {},
    });

    return `
I am Chief of AI, your personal assistant. Here is a quick overview of what I can currently do for you:

🧠 **Memories (Personal details & preferences)**
I can save, search, update, and forget your personal preferences or data.
• *Try saying:* "Remember that my WiFi password is 'Hunter2!_9982'"
• *Or ask:* "What is my favorite coffee order?"
• *Manage:* "Forget my WiFi password" or "Update my gym code to 2045#"

📚 **Knowledge (Facts & general information)**
I can store useful facts and notes to build your personal knowledge base.
• *Try saying:* "Add to knowledge: 'PostgreSQL pgvector uses IVFFlat indexes'"
• *Or ask:* "What did I save about PostgreSQL?"
• *Manage:* "Delete the note about PostgreSQL"

📝 **Journal (Daily reflections & thoughts)**
I can record your daily logs, thoughts, and progress.
• *Try saying:* "Write a journal entry for today: 'Successfully deployed the new AI features!'"
• *Or ask:* "Show my journal entries from last week"
• *Manage:* "Update today's journal entry to include my bug fix"

*(I can perform full CRUD operations—Create, Read, Update, Delete—on Memories, Knowledge, and Journals!)*

✅ **Tasks (Coming Soon)**
Manage your to-do lists and project milestones.
• *Try saying:* "Add a task to email the client by Friday"
• *Or ask:* "What tasks do I have due today?"

🔔 **Reminders (Coming Soon)**
Set alerts and time-based notifications.
• *Try saying:* "Remind me to take out the trash at 8pm"
• *Or ask:* "What are my upcoming reminders?"

📅 **Calendar (Coming Soon)**
Manage your schedule and appointments.
• *Try saying:* "Schedule a 30-minute sync with Sarah tomorrow at noon"
• *Or ask:* "What does my day look like tomorrow?"

📁 **Files (Coming Soon)**
Upload and chat with your personal documents.
• *Try saying:* "Summarize the Q3 financial PDF report I uploaded"
• *Or ask:* "Find that sales receipt I saved last month"

💵 **Expenses (Coming Soon)**
Track your spending and receipts.
• *Try saying:* "Log a $45 expense for team lunch"
• *Or ask:* "How much have I spent on coffee this week?"

🔌 **Integrations (Coming Soon)**
Direct API hookups to your favorite external apps.
• *Try saying:* "Sync my memories to Notion"
    `.trim();
  },
  {
    name: "get_capabilities",
    description:
      'Call this tool when the user asks "what can you do", "how can you help", or asks for a list of features or capabilities.',
    schema: z.object({}),
  },
);
