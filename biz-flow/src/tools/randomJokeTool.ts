import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { log } from "../utils/logger";

interface JokeApiResponse {
  type: string;
  setup: string;
  punchline: string;
  id: number;
}

export const randomJokeTool = tool(
  async (): Promise<string> => {
    log({
      event: "tool_execution_started",
      toolName: "get_joke",
    });

    const url = "https://official-joke-api.appspot.com/random_joke";
    log({ event: "external_api_call", url });

    try {
      const response = await fetch(url);

      if (!response.ok) {
        log({
          event: "tool_execution_failed",
          toolName: "get_joke",
          status: response.status,
          error: `Joke API returned status ${response.status}`,
        });
        throw new Error(`Joke API returned status ${response.status}`);
      }

      log({
        event: "external_api_response",
        status: response.status,
        ok: true,
      });

      const joke = (await response.json()) as JokeApiResponse;

      log({
        event: "tool_execution_completed",
        toolName: "get_joke",
      });

      return `${joke.setup} ${joke.punchline}`;
    } catch (error: any) {
      log({
        event: "tool_execution_failed",
        toolName: "get_joke",
        error: error.message,
      });
      throw error;
    }
  },
  {
    name: "get_joke",
    description:
      "Fetches a random joke and returns it. Use this when the user asks for a joke, wants to laugh, or wants something funny.",
    schema: z.object({}),
  },
);
