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
    const url = "https://official-joke-api.appspot.com/random_joke";
    log({ event: "external_api_call", url });

    const response = await fetch(url);

    if (!response.ok) {
      log({
        event: "external_api_response",
        status: response.status,
        ok: false,
      });
      throw new Error(`Joke API returned status ${response.status}`);
    }

    log({ event: "external_api_response", status: response.status, ok: true });

    const joke = (await response.json()) as JokeApiResponse;
    return `${joke.setup} ${joke.punchline}`;
  },
  {
    name: "get_joke",
    description:
      "Fetches a random joke and returns it. Use this when the user asks for a joke, wants to laugh, or wants something funny.",
    schema: z.object({}),
  },
);
