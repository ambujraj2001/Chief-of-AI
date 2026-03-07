import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { log } from "../utils/logger";
import { tavily } from "@tavily/core";

const webSearchSchema = z.object({
  query: z.string().describe("The search query to look up on the web"),
});

/**
 * Web Search Tool: Uses the Tavily API to search the web for up-to-date
 * information on topics, news, or general explanations.
 */
export const webSearchTool = tool(
  async ({ query }: { query: string }): Promise<string> => {
    log({
      event: "tool_execution_started",
      toolName: "web_search",
      args: { query },
    });

    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return "Error: TAVILY_API_KEY is not set in environment variables.";
    }

    try {
      const client = tavily({ apiKey });
      const data = await client.search(query, {
        searchDepth: "advanced",
        includeAnswer: true,
      });

      let resultText = data.answer ? `Summary: ${data.answer}\n\n` : "";

      if (data.results && data.results.length > 0) {
        resultText += "Sources:\n";
        data.results.forEach((r: any, i: number) => {
          resultText += `${i + 1}. ${r.title}\n   ${r.content}\n   URL: ${r.url}\n\n`;
        });
      }

      log({
        event: "tool_execution_completed",
        toolName: "web_search",
        resultLength: resultText.length,
      });

      return resultText.trim() || "No results found for the query.";
    } catch (error: any) {
      log({
        event: "tool_execution_error",
        toolName: "web_search",
        error: error.message,
      });
      return `Error performing web search: ${error.message}`;
    }
  },
  {
    name: "web_search",
    description:
      "Search the web for up-to-date information, news, current events, or explanations (e.g., about quantum mechanics). Provide a clear, natural language query.",
    schema: webSearchSchema,
  },
);
