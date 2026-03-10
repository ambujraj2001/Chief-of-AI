import { ChatOpenAI } from "@langchain/openai";
import { StructuredToolInterface } from "@langchain/core/tools";

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const buildModel = (tools?: StructuredToolInterface[]) => {
  const apiKey = getEnv("MISTRAL_API_KEY");
  const modelName = getEnv("MISTRAL_MODEL");
  const baseURL = process.env.MISTRAL_API_BASE || "https://api.mistral.ai/v1";

  if (!apiKey || apiKey === "your_mistral_api_key_here") {
    console.warn(
      "⚠️ MISTRAL_API_KEY is missing or using placeholder in buildModel",
    );
  }

  const llm = new ChatOpenAI({
    modelName,
    apiKey,
    openAIApiKey: apiKey,
    configuration: {
      baseURL,
      apiKey: apiKey,
    },
    temperature: 0.3,
  });

  if (tools && tools.length > 0) {
    return llm.bindTools(tools, { parallel_tool_calls: false });
  }
  return llm;
};
