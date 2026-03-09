import { GraphState } from "../graphs/state";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { buildModel } from "../config/model";
import { log } from "../utils/logger";

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

  try {
    const parsed = JSON.parse(rawContent);
    if (parsed && typeof parsed === "object") {
      if (parsed.type === "clarification") {
        finalReply = JSON.stringify(parsed);
      } else if (parsed.type === "final" && parsed.message) {
        finalReply = parsed.message;
      } else if (parsed.message) {
        finalReply = parsed.message;
      }
    }
  } catch {
    // LLM sometimes returns a JSON object followed by trailing text.
    if (rawContent.trimStart().startsWith("{")) {
      let braceIdx = rawContent.indexOf("}");
      while (braceIdx !== -1) {
        try {
          const candidate = rawContent.substring(0, braceIdx + 1);
          const parsed = JSON.parse(candidate);
          const trailing = rawContent.substring(braceIdx + 1).trim();

          if (parsed.type === "clarification") {
            if (trailing) {
              parsed.question = parsed.question
                ? `${parsed.question}\n\n${trailing}`
                : trailing;
            }
            finalReply = JSON.stringify(parsed);
          } else if (parsed.message) {
            finalReply = trailing
              ? `${parsed.message}\n\n${trailing}`
              : parsed.message;
          }
          break;
        } catch {
          braceIdx = rawContent.indexOf("}", braceIdx + 1);
        }
      }
    }

    // Fallback: extract JSON from fenced code block
    if (!finalReply) {
      const match = rawContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) {
        try {
          const parsed = JSON.parse(match[1]);
          if (parsed.type === "clarification") {
            finalReply = JSON.stringify(parsed);
          } else if (parsed.type === "final" && parsed.message) {
            finalReply = parsed.message;
          }
        } catch {
          finalReply = rawContent;
        }
      } else {
        finalReply = rawContent;
      }
    }
  }

  if (!finalReply) finalReply = rawContent;

  if (!finalReply || !finalReply.trim()) {
    finalReply =
      "I'm sorry, I wasn't able to process that request. Could you try again?";
  }

  return { reply: finalReply };
};
