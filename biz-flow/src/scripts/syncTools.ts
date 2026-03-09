import { tools } from "../tools";
import { supabase } from "../config/supabase";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * Syncs all tools defined in the codebase to the Supabase tools_registry.
 * Uses direct Mistral API for reliable 1024-dim embeddings.
 */

async function getMistralEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.MISTRAL_API_KEY;
  const url = "https://api.mistral.ai/v1/embeddings";

  const response = await axios.post(
    url,
    {
      model: "mistral-embed",
      input: [text],
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data.data[0].embedding;
}

async function syncToolsToRegistry() {
  console.log(
    `\n🚀 Starting sync of ${tools.length} tools to Supabase tools_registry (Mistral 1024)...\n`,
  );

  for (const tool of tools) {
    const { name, description } = tool;

    // Simplified schema extraction
    const schemaObj = (tool as any).schema;
    const properties = schemaObj?.shape
      ? Object.keys(schemaObj.shape).reduce((acc: any, key) => {
          acc[key] = { type: "any" };
          return acc;
        }, {})
      : {};

    const textToEmbed = `Name: ${name}. Description: ${description}`;

    console.log(`[Syncing] "${name}"...`);

    try {
      const embedding = await getMistralEmbedding(textToEmbed);

      const { error } = await supabase.from("tools_registry").upsert(
        {
          name,
          description,
          schema: { properties },
          embedding,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "name" },
      );

      if (error) {
        console.error(`  ❌ Database Error for ${name}:`, error.message);
      } else {
        console.log(
          `  ✅ Successfully synced "${name}" (Dim: ${embedding.length})`,
        );
      }
    } catch (err: any) {
      console.error(
        `  ❌ Sync failed for ${name}:`,
        err.response?.data || err.message,
      );
    }
  }

  console.log("\n✨ Tool registry sync complete!\n");
  process.exit(0);
}

syncToolsToRegistry().catch((err) => {
  console.error("Fatal sync error:", err);
  process.exit(1);
});
