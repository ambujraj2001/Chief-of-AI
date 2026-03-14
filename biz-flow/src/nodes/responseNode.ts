import { GraphState } from "../graphs/state";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { buildModel } from "../config/model";
import { log } from "../utils/logger";
import { debugGraphState } from "../utils/debugGraphState";

const extractJSON = (text: string): string | null => {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last < first) return null;
  return text.slice(first, last + 1);
};

const cleanReply = (raw: unknown): string => {
  const text = typeof raw === "string" ? raw : JSON.stringify(raw);
  return text
    .replace(/<\/?tool_call>/gi, "")
    .replace(/<\/?tool_response>/gi, "")
    .replace(/<\/?function_calls>/gi, "")
    .replace(/[a-zA-Z_]+\{[^}]*\}/g, "")
    .replace(/[a-zA-Z_]+\([^)]*\)/g, "")
    .replace(/^(add_|get_|delete_|update_|search_|web_)[a-zA-Z_]+$/gm, "")
    .trim();
};

export const responseNode = async (state: GraphState) => {
  debugGraphState("responseNode_start", state);
  let finalReply: string | undefined = undefined;

  let lastMessage = state.messages[state.messages.length - 1];

  // If the last response was a tool call (no text) OR if we skipped planner entirely (last message is Human),
  // force one final text-only LLM call
  if (
    lastMessage._getType() === "human" ||
    ((lastMessage as AIMessage).tool_calls?.length &&
      !cleanReply(lastMessage.content))
  ) {
    log({ event: "forcing_text_response", userId: state.userId });
    const textOnlyLlm = buildModel([]);
    const forcedResponse = await textOnlyLlm.invoke([
      ...state.messages,
      new HumanMessage(
        "Based on the tool results or the conversation above, provide your response to the user. " +
          "Return a raw JSON object in the required response format (clarification or final). Do not call any more tools.",
      ),
    ]);
    lastMessage = forcedResponse as AIMessage;
  }

  const rawContent = cleanReply(lastMessage.content);
  const jsonString = extractJSON(rawContent);

  if (jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === "object") {
        if (parsed.type === "clarification") {
          finalReply = JSON.stringify(parsed);
        } else if (parsed.type === "final" && parsed.message) {
          finalReply = parsed.message;
        } else if (parsed.type === "ui_component") {
          finalReply = JSON.stringify(parsed);
        } else if (parsed.message) {
          finalReply = parsed.message;
        }
      }
    } catch {
      // JSON parse failed
    }
  }

  if (!finalReply) {
    finalReply = rawContent;
  }

  if (!finalReply || !finalReply.trim()) {
    finalReply =
      "I'm sorry, I wasn't able to process that request. Could you try again?";
  }

  debugGraphState("responseNode", state, {
    finalReply,
  });

  return { reply: finalReply };
};
