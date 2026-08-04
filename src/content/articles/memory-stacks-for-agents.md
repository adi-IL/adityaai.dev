---
form: Framework
date: 2026-04-16
topics: [agents, memory]
featured: true
---
# Memory Stacks for Agents: A Deep Dive into Episodic, Semantic, and Procedural Architecture

*Memory is the layer below reasoning, and most agent teams build it wrong. A systems architect's field guide to the three kinds of memory your agent actually needs, and how to make them work together.*

---

## The problem nobody names

Walk through the architecture diagrams of any ten agent products in 2026 and you will see the same box: "memory." Sometimes it is labeled "vector DB." Sometimes "conversation history." Sometimes "knowledge base." It is almost never broken down further than that.

But human cognition does not have one memory. It has at least three that cognitive scientists agree on, and the distinction matters for agent design. If you collapse them into one system, your agent either forgets everything fast, recalls too much slowly, or both.

This piece is a systems-architect framing of the three memories your agent needs, how they interact, and how to build each one in production.

---

## The three memories

### Episodic memory: what happened

The record of specific events, interactions, and observations. For an agent, this is the log of every tool call, every user turn, every observed state. Ordered by time. Rich in detail. Expensive to store in full.

**Human analog**: "I remember I called my mom on Tuesday and she mentioned the trip."

**Agent analog**: "I remember user-42 asked me to summarize doc-7 on April 3, and I returned result R, and they followed up with a clarification at 14:03."

### Semantic memory: what I know

Distilled facts and concepts extracted from episodes. What the agent knows about the world, the user, the domain, after integrating over many episodes.

**Human analog**: "I know my mom prefers morning calls. I know the trip is in June."

**Agent analog**: "user-42 consistently asks for one-paragraph summaries, prefers bullet format for lists, works in climate finance."

### Procedural memory: how I do things

Skills, routines, and patterns that have proven effective. Not episodic (not "I did X once") and not semantic (not a fact). Procedural memory is the cached strategy: the tool-calling sequence that tends to work, the prompt template that tends to produce good output, the retry pattern that tends to recover from a specific failure.

**Human analog**: "When I need to resolve a customer complaint, I start with an apology, then fact-find, then offer options."

**Agent analog**: "When the user asks 'summarize X', the effective pattern is: fetch, chunk, summarize-per-chunk, aggregate, verify against the source."

---

## Why collapsing the three is a mistake

Most agent products in 2025 tried to do all three with a single vector database. User turns get embedded and stored. Retrieval is cosine similarity. Memory is "whatever comes back from the top-k query."

This works adequately for a chat product with a short conversation horizon. It fails in three predictable ways for anything beyond that.

### Failure 1: semantic dilution

Episodic memories outnumber semantic memories by 100x or more. If you store both in the same vector space, retrieval at query time pulls back specific episodes instead of stable facts. The agent re-derives "the user likes bullets" every time it recalls, which is slow and inconsistent.

### Failure 2: procedural invisibility

Procedural memory is a graph, not a vector. "When X, try Y" is a conditional, and vectors are bad at conditionals. Collapsing procedures into vector memory means the agent has to re-infer its own best practices every time, which means it never actually gets better at the work.

### Failure 3: episodic bloat

Episodic memory grows linearly with usage. Semantic and procedural memory should grow logarithmically because they compress many episodes into stable distillations. If your memory system has one tier, it grows linearly across the board, and your retrieval latency and cost grow with it.

---

## The three-tier architecture

Here is the reference architecture I now use for any long-running agent. It mirrors the cognitive-science three-memory model, but implemented in boring systems primitives.

```
                   ┌───────────────────────────────────────┐
                   │          Working Context (LLM)         │
                   │  small, hot, selected at each turn     │
                   └─────────────────┬─────────────────────┘
                                     │
            ┌────────────────────────┼────────────────────────┐
            │                        │                        │
            ▼                        ▼                        ▼
    ┌───────────────┐        ┌──────────────┐         ┌───────────────┐
    │  EPISODIC     │        │   SEMANTIC   │         │  PROCEDURAL   │
    │               │        │              │         │               │
    │  Append-only  │        │  Upserted    │         │  Versioned    │
    │  event log    │        │  fact store  │         │  strategy     │
    │               │        │              │         │  graph        │
    │  Postgres +   │        │  KV store +  │         │  SQLite +     │
    │  vector index │        │  vector idx  │         │  graph table  │
    └───────────────┘        └──────────────┘         └───────────────┘
           ▲                        ▲                        ▲
           │                        │                        │
           └────── Consolidation ───┴──── Distillation ──────┘
                   (offline, async, by a background worker)
```

Three stores. Three shapes. One consolidation pipeline that moves information between them on a schedule.

### Episodic store

A Postgres table: `event_id, agent_id, user_id, timestamp, event_type, payload`. Append-only. Every tool call, every user turn, every observation goes here. Add a vector index on the payload for optional semantic retrieval.

Retention: typically 90 days to 2 years depending on use case. Old episodes roll off or get archived to cold storage.

### Semantic store

A key-value store (Postgres works, Redis works, a dedicated KV store works) with an optional vector index. Keys are stable identifiers: `user-42.preferred-summary-format` or `domain.climate-finance.top-journals`. Values are the current best fact. Upserts overwrite.

Retention: indefinite. Semantic memory is small by design, usually under a few hundred facts per agent.

### Procedural store

A SQLite table of `strategy_id, trigger_pattern, action_sequence, success_rate, invocations`. Each row is a pattern the agent has seen work. The agent consults this store at decision time: "given this trigger, what patterns have worked, ranked by success rate?"

Retention: indefinite, with periodic pruning of low-success-rate entries.

---

## The consolidation pipeline

The three stores would drift apart without a process that moves information between them. I run a background worker that does three jobs on a schedule.

### Distillation: episodic to semantic

Every 24 hours, a small LLM reads the last day of episodes for each user and produces updates to the semantic store. Example input: "user-42 asked three times this week for bullet summaries." Example output: upsert `user-42.preferred-format = "bullets"`.

This is a cheap Flash-tier job. Distillation runs overnight and costs pennies per user per day.

### Abstraction: episodic to procedural

Every 7 days, a larger model (Pro or Opus tier) reads the last week's episodes and looks for repeated successful patterns. If the same 4-step tool sequence solved 8 different "summarize X" requests, that becomes a procedural entry: `trigger: summarize request. actions: fetch, chunk, summarize-per-chunk, aggregate`.

This is more expensive but runs weekly, so it is a tiny slice of total cost.

### Reinforcement: procedural success rates

Every time the agent uses a procedural pattern, we log whether the outcome was good (user accepted, task completed, no regret signal). Success rates get updated in a running average. Patterns that decay below a threshold get pruned.

---

## Retrieval at agent-turn time

When the agent receives a new turn, it assembles its working context from all three stores with very different retrieval policies.

| Store | Retrieval policy | Typical size pulled |
|---|---|---|
| Episodic | Semantic search + recency bias on the user's own history | 2-5 relevant episodes |
| Semantic | Targeted key lookups for the current user and domain | 5-20 facts |
| Procedural | Top-k by success rate, filtered on current trigger pattern | 1-3 strategies |

This is the opposite of the default "dump the top-20 vector hits into context" pattern. Each store has a retrieval policy tuned to its shape.

---

## What this costs

A common question: is three stores not more expensive than one? In practice, no.

- **Episodic**: Postgres with a vector index is cheap. Roughly $0.30 per GB per month on any managed provider.
- **Semantic**: KV reads cost microseconds. A few thousand facts per agent is kilobytes.
- **Procedural**: SQLite or a small Postgres table. Kilobytes per agent.
- **Consolidation pipeline**: overnight Flash-tier calls. For a 1000-user agent, under $5/month.

The total storage cost is dominated by episodic memory, which you would have had anyway. The semantic and procedural stores add marginal cost but remove large amounts of retrieval cost from the hot path because queries get smaller, more targeted, and cheaper.

---

## When not to build this

This architecture is overkill for chat products with no persistence. If your agent restarts state every session, you need working context only. Three-tier memory is for agents that **persist across sessions** and improve **per-user** over time.

Rough rule: if your agent has stateful interactions with the same user over more than a week, build all three tiers. If it is single-session, build the episodic log only for debugging.

---

## The research frontier

There are two open problems I am watching in 2026.

### 1. Shared procedural memory across agents

My procedural store today is per-agent. But if 100 agents in a fleet all learn that "chunked summarization with verification" works, they should share that knowledge. A shared procedural store with privacy-preserving aggregation is an unsolved systems problem.

### 2. Forgetting policies

Semantic memory should sometimes forget. If user-42 changed jobs, the old "domain = climate finance" should decay. Most production systems have no principled forgetting policy. The agents that do (mostly in robotics research) use time-decay weighted by confirmation signal. Importing that pattern into LLM agents is a worthwhile research direction.

---

## The architect's bottom line

Do not let your agent have one undifferentiated "memory" box on your architecture diagram. Memory is three things, and the three things have different shapes, different retrieval policies, and different growth curves.

Build three stores. Connect them with a consolidation pipeline. Retrieve them with different policies. Your agent will use less context, run cheaper, and actually get better at its work over time instead of just accumulating logs.

The difference between "agent that has been running for a month" and "agent that has been learning for a month" is whether your memory architecture moves information from episodic to semantic to procedural. Most do not. The ones that will matter in 2027 already do.

---

*One memory is a log. Three memories is a mind.*
