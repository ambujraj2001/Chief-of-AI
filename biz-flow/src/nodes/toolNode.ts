import { GraphState } from "../graphs/state";
import { tools } from "../tools";
import { ToolMessage, AIMessage } from "@langchain/core/messages";
import { log } from "../utils/logger";
import { debugGraphState } from "../utils/debugGraphState";

export const toolNode = async (state: GraphState) => {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;

  if (!lastMessage.tool_calls || lastMessage.tool_calls.length === 0) {
    return { messages: [] };
  }

  const toolMessages: ToolMessage[] = [];
  const results: any[] = [];
  let newBoundActions: Record<string, { action: string; id: string }> = {};

  for (const toolCall of lastMessage.tool_calls) {
    debugGraphState("toolNode", state, {
      toolExecuted: toolCall.name,
    });

    if (!toolCall.id) {
      throw new Error("Missing tool_call_id from LLM tool call.");
    }

    const matchedTool =
      tools.find((t) => t.name === toolCall.name) ||
      (state.retrievedTools || []).find((t: any) => t.name === toolCall.name);

    if (!matchedTool) {
      toolMessages.push(
        new ToolMessage({
          tool_call_id: toolCall.id,
          name: toolCall.name,
          content: `Tool "${toolCall.name}" not found.`,
        }),
      );
      continue;
    }

    log({
      event: "tool_execution_started",
      toolName: toolCall.name,
      arguments: toolCall.args,
      userId: state.userId,
    });

    try {
      // @ts-ignore - invoking dynamic tool
      const toolResult = await matchedTool.invoke(toolCall.args);

      log({
        event: "tool_execution_completed",
        toolName: toolCall.name,
        result: toolResult,
        userId: state.userId,
      });

      results.push(toolResult);

      const contentStr =
        typeof toolResult === "string" ? toolResult : toolResult?.content || "";
      if (toolCall.name === "get_memories" && contentStr) {
        const regex = /\[ID:\s*([^\]]+)\]\s*(?:\(([^)]+)\))?/g;
        let m;
        while ((m = regex.exec(contentStr)) !== null) {
          if (m[1] && m[2])
            newBoundActions[m[2]] = { action: "delete_memory", id: m[1] };
        }
      } else if (toolCall.name === "get_tasks" && contentStr) {
        const regex = /ID:\s*([^\n]+)\nTitle:\s*([^\n]+)/g;
        let m;
        while ((m = regex.exec(contentStr)) !== null) {
          if (m[1] && m[2])
            newBoundActions[m[2].trim()] = {
              action: "delete_task",
              id: m[1].trim(),
            };
        }
      } else if (toolCall.name === "get_reminders" && contentStr) {
        const regex = /\[ID:\s*([^\]]+)\]\s*(.+)/g;
        let m;
        while ((m = regex.exec(contentStr)) !== null) {
          if (m[1] && m[2])
            newBoundActions[m[2].trim()] = {
              action: "delete_reminder",
              id: m[1].trim(),
            };
        }
      } else if (toolCall.name === "list_files" && contentStr) {
        try {
          const parsed = JSON.parse(contentStr);
          if (Array.isArray(parsed)) {
            parsed.forEach((f: any) => {
              if (f.id && f.name)
                newBoundActions[f.name] = { action: "delete_file", id: f.id };
            });
          }
        } catch (e) {}
      }

      toolMessages.push(
        new ToolMessage({
          tool_call_id: toolCall.id,
          name: toolCall.name,
          content:
            typeof toolResult === "string"
              ? toolResult
              : JSON.stringify(toolResult),
        }),
      );
    } catch (error: any) {
      const errMsg = error instanceof Error ? error.message : String(error);
      log({
        event: "tool_execution_failed",
        toolName: toolCall.name,
        error: errMsg,
        userId: state.userId,
      });

      toolMessages.push(
        new ToolMessage({
          tool_call_id: toolCall.id,
          name: toolCall.name,
          content: `Error executing ${toolCall.name}: ${errMsg}`,
        }),
      );
    }
  }

  return {
    messages: toolMessages,
    toolResults: results,
    ...(Object.keys(newBoundActions).length > 0
      ? { boundActions: newBoundActions }
      : {}),
  };
};

export const shouldContinue = (state: GraphState) => {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return "tools";
  }
  return "respond";
};
