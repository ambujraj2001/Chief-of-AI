import { tools } from "../tools";
import { supabase } from "../config/supabase";
import { toolMetadataByName, toolMetadataList } from "../tools/toolMetadata";
import axios from "axios";
import dotenv from "dotenv";
import { createHash } from "crypto";
import { z } from "zod";

dotenv.config();

import { generateEmbedding } from "../services/embedding.service";

async function syncToolsToRegistry() {
  console.log(
    `\n🚀 Starting sync of ${tools.length} tools to Supabase tools_registry (Mistral 1024)...\n`,
  );

  const runtimeToolNames = new Set<string>(tools.map((t) => t.name));
  const metadataNames = new Set<string>(toolMetadataList.map((m) => m.name));

  const runtimeMissingMetadata = Array.from(runtimeToolNames).filter(
    (name) => !metadataNames.has(name),
  );
  const metadataMissingRuntime = Array.from(metadataNames).filter(
    (name) => !runtimeToolNames.has(name),
  );

  if (runtimeMissingMetadata.length > 0 || metadataMissingRuntime.length > 0) {
    throw new Error(
      `Tool metadata/runtime mismatch. Missing metadata for: [${runtimeMissingMetadata.join(", ")}]. Missing runtime implementations for: [${metadataMissingRuntime.join(", ")}].`,
    );
  }

  const toJSONSchema = (schemaObj: any) => {
    if (!schemaObj) return { type: "object", properties: {} };
    try {
      // Zod v4 helper
      // @ts-ignore
      return z.toJSONSchema(schemaObj);
    } catch {
      const properties = schemaObj?.shape
        ? Object.keys(schemaObj.shape).reduce((acc: any, key) => {
            acc[key] = { type: "any" };
            return acc;
          }, {})
        : {};
      return { type: "object", properties };
    }
  };

  for (const tool of tools) {
    const { name, description } = tool;
    const metadata = toolMetadataByName[name];

    const schemaObj = (tool as any).schema;
    const schema = toJSONSchema(schemaObj);
    const schemaHash = createHash("sha256")
      .update(JSON.stringify(schema))
      .digest("hex");

    const textToEmbed = `Name: ${name}. Description: ${description}. Category: ${metadata.category}. Tags: ${metadata.tags.join(", ")}.`;

    console.log(`[Syncing] "${name}"...`);

    try {
      const embedding = await generateEmbedding(textToEmbed);

      const { error } = await supabase.from("tools_registry").upsert(
        {
          name,
          description,
          schema,
          tool_version: metadata.version,
          schema_hash: schemaHash,
          category: metadata.category,
          tags: metadata.tags,
          runtime_implemented: true,
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

  // Mark stale registry rows that no longer have a runtime implementation.
  const { data: existingRegistry } = await supabase
    .from("tools_registry")
    .select("name");

  const staleToolNames = (existingRegistry || [])
    .map((row: any) => row.name as string)
    .filter((name: string) => !runtimeToolNames.has(name));

  if (staleToolNames.length > 0) {
    const { error } = await supabase
      .from("tools_registry")
      .update({
        runtime_implemented: false,
        updated_at: new Date().toISOString(),
      })
      .in("name", staleToolNames);

    if (error) {
      console.error(
        "  ⚠️ Failed to mark stale registry tools as runtime_implemented=false:",
        error.message,
      );
    } else {
      console.log(
        `  ✅ Marked ${staleToolNames.length} stale registry tools as runtime_implemented=false`,
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
