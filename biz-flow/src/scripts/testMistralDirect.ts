import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function testMistralDirect() {
  const apiKey = process.env.MISTRAL_API_KEY;
  const url = "https://api.mistral.ai/v1/embeddings";

  try {
    const response = await axios.post(
      url,
      {
        model: "mistral-embed",
        input: [
          "This is a test to check tool embedding dimensions and values.",
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    const vector = response.data.data[0].embedding;
    console.log("Vector length:", vector.length);
    console.log("Vector (first 10):", vector.slice(0, 10));
    const allZeros = vector.every((x: any) => x === 0);
    console.log("Is vector all zeros?", allZeros);
  } catch (err: any) {
    console.error("Mistral Direct failed:", err.response?.data || err.message);
  }
}

testMistralDirect();
