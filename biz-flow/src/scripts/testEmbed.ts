import { OpenAIEmbeddings } from "@langchain/openai";
import dotenv from "dotenv";

dotenv.config();

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.MISTRAL_API_KEY,
  configuration: {
    baseURL: process.env.MISTRAL_API_BASE,
  },
  modelName: "mistral-embed",
});

async function testEmbedding() {
  const text = "This is a test to check tool embedding dimensions and values.";
  try {
    const vector = await embeddings.embedQuery(text);
    console.log("Vector length:", vector.length);
    console.log("Vector (first 10):", vector.slice(0, 10));
    const allZeros = vector.every((x) => x === 0);
    console.log("Is vector all zeros?", allZeros);
  } catch (err) {
    console.error("Embedding test failed:", err);
  }
}

testEmbedding();
