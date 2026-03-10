import { GraphState } from "../graphs/state";
import { tools } from "../tools";
import { ToolMessage, AIMessage } from "@langchain/core/messages";
import { log } from "../utils/logger";
import { debugGraphState } from "../utils/debugGraphState";
import { recordToolExecutionEvent } from "../services/toolObservability.service";

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

    const startedAt = Date.now();
    try {
      // @ts-ignore - invoking dynamic tool
      const toolResult = await matchedTool.invoke(toolCall.args);
      const latencyMs = Date.now() - startedAt;

      log({
        event: "tool_execution_completed",
        toolName: toolCall.name,
        result: toolResult,
        userId: state.userId,
        latencyMs,
      });

      void recordToolExecutionEvent({
        userId: state.userId,
        toolName: toolCall.name,
        intent: state.intent || "general_chat",
        success: true,
        latencyMs,
      });

      results.push(toolResult);

      const contentStr =
        typeof toolResult === "string" ? toolResult : toolResult?.content || "";
      // No more automatic boundActions for now.
      // We want the AI to handle the intent based on history.

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
      const latencyMs = Date.now() - startedAt;
      const errMsg = error instanceof Error ? error.message : String(error);
      log({
        event: "tool_execution_failed",
        toolName: toolCall.name,
        error: errMsg,
        userId: state.userId,
        latencyMs,
      });

      void recordToolExecutionEvent({
        userId: state.userId,
        toolName: toolCall.name,
        intent: state.intent || "general_chat",
        success: false,
        latencyMs,
        errorMessage: errMsg,
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
