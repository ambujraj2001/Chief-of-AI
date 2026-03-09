import { supabase } from "./src/config/supabase";

async function fixRpc() {
  const sql = `
CREATE OR REPLACE FUNCTION match_tools (
  query_embedding vector(1024),
  query_text text,
  match_threshold float DEFAULT 0.2,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  schema jsonb,
  similarity double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH vector_search AS (
    SELECT 
      tr.id,
      tr.name,
      tr.description,
      tr.schema,
      (1 - (tr.embedding <=> query_embedding)) AS score,
      ROW_NUMBER() OVER (ORDER BY tr.embedding <=> query_embedding) AS rank
    FROM tools_registry tr
    WHERE tr.embedding IS NOT NULL AND 1 - (tr.embedding <=> query_embedding) > match_threshold
  ),
  keyword_search AS (
    SELECT 
      tr.id,
      tr.name,
      tr.description,
      tr.schema,
      ts_rank_cd(tr.fts_vector, websearch_to_tsquery('english', query_text)) AS score,
      ROW_NUMBER() OVER (ORDER BY ts_rank_cd(tr.fts_vector, websearch_to_tsquery('english', query_text)) DESC) AS rank
    FROM tools_registry tr
    WHERE tr.fts_vector @@ websearch_to_tsquery('english', query_text)
  )
  SELECT 
    COALESCE(v.id, k.id) AS id,
    COALESCE(v.name, k.name) AS name,
    COALESCE(v.description, k.description) AS description,
    COALESCE(v.schema, k.schema) AS schema,
    (
      COALESCE(1.0 / (60 + v.rank), 0.0) +
      COALESCE(1.0 / (60 + k.rank), 0.0)
    )::double precision AS similarity
  FROM vector_search v
  FULL OUTER JOIN keyword_search k ON v.id = k.id
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
  `;

  // Note: Regular supabase client doesn't support raw SQL easily unless we use an extension or a specific route.
  // But common supabase setups have a 'sql' RPC or similar.
  // If not, I can just inform the user to run it in the dashboard.
  // Wait, I can use the 'run_command' but I need the connection string.
  
  console.log("Please run the following SQL in your Supabase Dashboard SQL Editor to fix the tool discovery error:");
  console.log(sql);
}

fixRpc();
