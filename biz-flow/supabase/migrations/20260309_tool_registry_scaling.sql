create extension if not exists vector;
create extension if not exists pgcrypto;

alter table if exists tools_registry
  add column if not exists tool_version text,
  add column if not exists schema_hash text,
  add column if not exists category text,
  add column if not exists tags text[] default '{}',
  add column if not exists runtime_implemented boolean default true;

create index if not exists idx_tools_registry_category
  on tools_registry (category);

create index if not exists idx_tools_registry_tags_gin
  on tools_registry using gin (tags);

create index if not exists idx_tools_registry_runtime_implemented
  on tools_registry (runtime_implemented);

create table if not exists tool_discovery_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  intent text not null,
  query text not null,
  matched_tools text[] not null default '{}',
  selected_tools text[] not null default '{}',
  allowed_tools text[] not null default '{}',
  blocked_tools text[] not null default '{}',
  matched_count int not null default 0,
  selected_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_tool_discovery_events_created_at
  on tool_discovery_events (created_at desc);

create index if not exists idx_tool_discovery_events_intent
  on tool_discovery_events (intent);

create table if not exists tool_execution_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  tool_name text not null,
  intent text not null,
  success boolean not null,
  latency_ms int not null,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_tool_execution_events_created_at
  on tool_execution_events (created_at desc);

create index if not exists idx_tool_execution_events_tool_name
  on tool_execution_events (tool_name);

create or replace view tool_observability_stats_24h as
with discovery as (
  select
    coalesce(nullif(selected_tool, ''), '__none__') as tool_name,
    count(*) as selected_count
  from tool_discovery_events d
  left join lateral unnest(d.selected_tools) as selected_tool on true
  where d.created_at >= now() - interval '24 hours'
  group by 1
),
execs as (
  select
    e.tool_name,
    count(*) as call_count,
    count(*) filter (where not e.success) as failure_count,
    avg(e.latency_ms)::numeric(10,2) as avg_latency_ms
  from tool_execution_events e
  where e.created_at >= now() - interval '24 hours'
  group by 1
)
select
  coalesce(e.tool_name, d.tool_name) as tool_name,
  coalesce(d.selected_count, 0) as selected_count,
  coalesce(e.call_count, 0) as call_count,
  coalesce(e.failure_count, 0) as failure_count,
  case
    when coalesce(e.call_count, 0) = 0 then 0
    else round((e.failure_count::numeric / e.call_count::numeric) * 100, 2)
  end as failure_rate_pct,
  coalesce(e.avg_latency_ms, 0) as avg_latency_ms
from execs e
full outer join discovery d
  on d.tool_name = e.tool_name;

create or replace function match_tools (
  query_embedding vector(1024),
  query_text text,
  match_threshold float default 0.2,
  match_count int default 10,
  allowed_tools text[] default null,
  allowed_categories text[] default null,
  allowed_tags text[] default null
)
returns table (
  id uuid,
  name text,
  description text,
  schema jsonb,
  similarity double precision
)
language plpgsql
as $$
begin
  return query
  with scoped_registry as (
    select tr.*
    from tools_registry tr
    where coalesce(tr.runtime_implemented, true) = true
      and (allowed_tools is null or tr.name = any(allowed_tools))
      and (allowed_categories is null or tr.category = any(allowed_categories))
      and (allowed_tags is null or tr.tags && allowed_tags)
  ),
  vector_search as (
    select
      tr.id,
      tr.name,
      tr.description,
      tr.schema,
      row_number() over (order by tr.embedding <=> query_embedding) as rank
    from scoped_registry tr
    where query_embedding is not null
      and tr.embedding is not null
      and 1 - (tr.embedding <=> query_embedding) > match_threshold
  ),
  keyword_search as (
    select
      tr.id,
      tr.name,
      tr.description,
      tr.schema,
      row_number() over (
        order by ts_rank_cd(tr.fts_vector, websearch_to_tsquery('english', query_text)) desc
      ) as rank
    from scoped_registry tr
    where tr.fts_vector @@ websearch_to_tsquery('english', query_text)
  )
  select
    coalesce(v.id, k.id) as id,
    coalesce(v.name, k.name) as name,
    coalesce(v.description, k.description) as description,
    coalesce(v.schema, k.schema) as schema,
    (
      coalesce(1.0 / (60 + v.rank), 0.0) +
      coalesce(1.0 / (60 + k.rank), 0.0)
    )::double precision as similarity
  from vector_search v
  full outer join keyword_search k on v.id = k.id
  order by similarity desc
  limit match_count;
end;
$$;
