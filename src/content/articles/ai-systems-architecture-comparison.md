---
form: Architecture
date: 2026-03-05
topics: [architecture]
featured: false
---
# The Big AI Systems Architecture Comparison

*Raschka compared LLM architectures across 7 years. This compares AI systems paradigms across 5 years of production deployment.*

---

## Introduction

Sebastian Raschka's "Big LLM Architecture Comparison" is one of the most-cited pieces in AI research. He traces how model architectures evolved from GPT-1 to DeepSeek V3 - what changed, what stayed the same, and why each choice matters.

This essay does the same for the **systems layer**. Not the models themselves, but the architectures we build *around* models to make them work in production.

The evolution of AI systems architecture over the past five years follows a clear trajectory, and understanding it is essential for any engineer building production AI in 2026.

---

## The Timeline: Five Paradigms in Five Years

```
2021          2022          2023          2024          2025-2026
┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────────┐
│Monolith│──▶│Micro-  │──▶│  RAG   │──▶│Agentic │──▶│ Autonomous │
│ML APIs │   │service │   │ Stacks │   │Pipelines│   │Agent Fleets│
│        │   │Inference│   │        │   │        │   │            │
└────────┘   └────────┘   └────────┘   └────────┘   └────────────┘
```

---

## Paradigm 1: Monolith ML APIs (2020-2022)

### Architecture

```
Client → API Gateway → Single ML Service → Database → Response
                           │
                     ┌─────┴─────┐
                     │  Model    │
                     │  (single  │
                     │  endpoint)│
                     └───────────┘
```

### Characteristics

| Property | Description |
|----------|-------------|
| Model serving | Single endpoint, single model, synchronous |
| Scaling | Vertical (bigger GPU) or horizontal (more replicas) |
| State management | Stateless per request |
| Error handling | HTTP error codes, retry logic |
| Typical latency | 100-500ms |
| Typical use case | Sentiment analysis, classification, NER |

### What worked

- Simple to deploy and monitor
- Well-understood scaling patterns (same as traditional web services)
- Low operational overhead

### What broke

- Single model, single task - couldn't compose capabilities
- No context or conversation state
- Models were small and specialized (BERT, RoBERTa)
- No way to incorporate external knowledge at inference time

### Key technology

TensorFlow Serving, TorchServe, FastAPI + model wrapper, AWS SageMaker single-endpoint deployments.

---

## Paradigm 2: Microservice Inference (2022-2023)

### Architecture

```
Client → API Gateway → Orchestrator → ┌─ Classification Service
                           │           ├─ Embedding Service  
                           │           ├─ Generation Service
                           │           └─ Summarization Service
                           ↓
                     Response Aggregator → Client
```

### Characteristics

| Property | Description |
|----------|-------------|
| Model serving | Multiple specialized models, each its own service |
| Scaling | Independent scaling per model/service |
| State management | Shared state via message queues or databases |
| Error handling | Service-level circuit breakers, fallbacks |
| Typical latency | 200ms-2s (multi-hop) |
| Typical use case | Document processing pipelines, multi-model analysis |

### What changed from Paradigm 1

- **Multiple models**: Different models for different subtasks
- **Orchestration**: A central service routes requests to the right model
- **Asynchronous processing**: Message queues enable async workflows
- **Specialization**: Each service optimized for its specific task

### What worked

- Could compose multiple capabilities in one workflow
- Independent scaling and deployment per model
- Familiar microservice patterns for backend engineers

### What broke

- High operational complexity (N models = N services to manage)
- Inter-service latency added up
- No conversational state or context management
- Each model was still isolated - no shared understanding

### Key technology

Kubernetes, Ray Serve, Triton Inference Server, message queues (Kafka, RabbitMQ), service mesh.

---

## Paradigm 3: RAG Stacks (2023-2024)

### Architecture

```
User Query → Embedding Model → Vector Database → Top-K Results
                                                      │
                                                      ↓
User Query + Retrieved Context → LLM → Response
```

### Characteristics

| Property | Description |
|----------|-------------|
| Model serving | LLM + embedding model + vector database |
| Scaling | Vector DB scaling + LLM scaling independently |
| State management | Vector DB stores persistent knowledge |
| Error handling | Retrieval fallbacks, re-ranking, hybrid search |
| Typical latency | 1-5s |
| Typical use case | Knowledge Q&A, document chat, enterprise search |

### What changed from Paradigm 2

- **External knowledge**: Models could access and reason over external data
- **Single powerful model**: One LLM replaced multiple specialized models
- **Context injection**: Retrieved documents injected into the LLM prompt
- **Conversational**: Could maintain multi-turn conversations

### The components of a RAG stack

1. **Ingestion pipeline**: Documents → chunking → embedding → vector DB
2. **Retrieval layer**: Query embedding → similarity search → top-K
3. **Re-ranking** (optional): Cross-encoder re-scoring of top-K results
4. **Prompt construction**: System prompt + retrieved context + user query
5. **Generation**: LLM generates response grounded in retrieved context
6. **Evaluation**: Answer quality metrics, retrieval precision/recall

### What worked

- Grounded LLM responses in actual documents
- Reduced hallucination (when retrieval was accurate)
- Gave LLMs access to private, domain-specific knowledge
- Created a $2B+ vector database market

### What broke

- **Chunking problem**: How you split documents dramatically affects quality
- **Semantic gap**: Embedding similarity ≠ relevance
- **Stale indexes**: Knowledge must be re-embedded when updated
- **Context window waste**: Retrieved chunks often included irrelevant text
- **Evaluation difficulty**: Hard to measure retrieval quality separately from generation quality

### Key technology

Pinecone, Weaviate, Chroma, Milvus, LangChain, LlamaIndex, OpenAI Embeddings.

---

## Paradigm 4: Agentic Pipelines (2024-2025)

### Architecture

```
User Task → Planner Agent → ┌─ Search Tool
                              ├─ Code Executor
                              ├─ File Reader
                              ├─ API Caller
                              └─ Calculator
                     ↓
              Action Loop (iterate until done) → Response
```

### Characteristics

| Property | Description |
|----------|-------------|
| Model serving | Single LLM with tool access (function calling) |
| Scaling | Compute scales with task complexity (variable tokens) |
| State management | Context window = working memory |
| Error handling | Self-correction loops, tool error recovery |
| Typical latency | 5s-5min (depends on task complexity) |
| Typical use case | Code generation, data analysis, multi-step research |

### What changed from Paradigm 3

- **Active retrieval**: The model decides *what* to search for, *when*
- **Tool use**: Models call external tools (search, code execution, APIs)
- **Multi-step reasoning**: Agent plans and executes multi-step workflows
- **Self-correction**: Agent can detect errors and retry
- **Dynamic workflow**: The sequence of operations isn't fixed - the model decides

### The components of an agentic pipeline

1. **System prompt**: Defines the agent's role, capabilities, and constraints
2. **Tool registry**: Available tools with descriptions and schemas
3. **Planning loop**: Model decides next action based on current state
4. **Execution engine**: Runs the tool and captures output
5. **Reflection step**: Model evaluates whether the result is sufficient
6. **Termination condition**: When to stop iterating

### What worked

- Handled complex, multi-step tasks that RAG couldn't
- Self-correcting behavior reduced human intervention
- Dynamic tool selection adapted to the specific task
- Natural integration with existing APIs and tools

### What broke

- **Reliability**: Agents sometimes loop, hallucinate, or take wrong actions
- **Cost**: Multi-step reasoning uses many more tokens than single-shot
- **Observability**: Hard to debug what the agent "was thinking"
- **Context window limits**: Long agent runs exhaust the context window
- **Testing**: Non-deterministic behavior makes testing extremely difficult

### Key technology

OpenAI function calling, Anthropic tool use, LangGraph, CrewAI, AutoGen, Claude Code, Cursor Agent Mode.

---

## Paradigm 5: Autonomous Agent Fleets (2025-2026)

### Architecture

```
User Intent → Orchestrator → ┌─ Spec Agent (plan)
                               ├─ Code Agent (implement)
                               ├─ Test Agent (verify)
                               ├─ Review Agent (evaluate)
                               └─ Deploy Agent (ship)
                     ↓
              Agent Fleet Manager → Cloud VMs (parallel execution)
                     ↓
              Results → Human Review → Approval/Iteration
```

### Characteristics

| Property | Description |
|----------|-------------|
| Model serving | Multiple agents, potentially different models |
| Scaling | Agent parallelism (N agents × M tasks) |
| State management | Shared context via repos, databases, message passing |
| Error handling | Agent-level retry + fleet-level orchestration |
| Typical latency | 1min-24hrs (background processing) |
| Typical use case | Feature development, large-scale migration, research |

### What changed from Paradigm 4

- **Parallel execution**: Multiple agents work simultaneously
- **Specialization**: Each agent has a different role and capability
- **Asynchronous**: Agents run in the background, humans review later
- **Cloud-native**: Agents run in isolated VMs or containers
- **Self-improving**: Agent outputs feed back into agent improvement

### The components of an agent fleet

1. **Intent specification**: Human describes what they want at a high level
2. **Task decomposition**: Orchestrator breaks intent into subtasks
3. **Agent assignment**: Each subtask assigned to a specialized agent
4. **Execution isolation**: Each agent runs in its own environment (VM, container, worktree)
5. **Shared state**: Agents communicate via git, shared databases, or message queues
6. **Conflict resolution**: When agents modify the same resources
7. **Quality gates**: Automated evaluation before outputs reach humans
8. **Human review**: Final approval before changes are merged

### What works

- 10-100x throughput on parallelizable tasks
- Continuous operation (agents work while humans sleep)
- Specialized agents outperform generalist agents on specific tasks
- The orchestration layer enables complex, multi-day workflows

### What's still breaking

- **Coherence**: Parallel agents can produce conflicting outputs
- **Coordination**: Agent-to-agent communication is still primitive
- **Cost management**: Fleet operations can be expensive without throttling
- **Quality variance**: Agent output quality varies significantly
- **Debugging**: When a fleet of agents produces a bug, tracing the root cause is extremely hard

### Key technology

Cursor Background Agents, Claude Code (multi-session), Factory Droids, OpenCode, custom orchestrators.

---

## The Comparison Table

| Property | Monolith API | Microservice | RAG Stack | Agentic Pipeline | Agent Fleet |
|----------|-------------|-------------|-----------|-----------------|-------------|
| **Era** | 2020-22 | 2022-23 | 2023-24 | 2024-25 | 2025-26 |
| **Models** | 1 | N specialized | 1 LLM + embeddings | 1 LLM + tools | N LLMs + tools |
| **State** | Stateless | Message queues | Vector DB | Context window | Git + DB + MQ |
| **Latency** | 100-500ms | 200ms-2s | 1-5s | 5s-5min | 1min-24hrs |
| **Human role** | Integrate | Orchestrate | Configure | Supervise | Review |
| **Key innovation** | Model serving | Composition | Grounding | Tool use | Parallelism |
| **Key challenge** | Single task | Complexity | Chunking | Reliability | Coherence |
| **Cost model** | Per request | Per service | Per query | Per task | Per agent-hour |

---

## The Convergence Pattern

Looking across five years, the trajectory is clear:

1. **More model autonomy at each step**: From "model serves a request" to "model decides what to do"
2. **More complex state management**: From stateless to context windows to shared repositories
3. **Longer time horizons**: From milliseconds to hours to days
4. **Shift in human role**: From implementer to supervisor to reviewer

The next paradigm (my prediction): **Self-improving agent organizations** - fleets that not only execute tasks but evaluate their own performance, identify weaknesses, and improve their own prompts, tools, and workflows without human intervention.

---

## Which Paradigm Should You Use?

| If your task is... | Use this paradigm |
|--------------------|-------------------|
| Simple classification/NER | Monolith API |
| Multi-model analysis pipeline | Microservice Inference |
| Knowledge Q&A over documents | RAG Stack |
| Complex, multi-step tasks | Agentic Pipeline |
| Large-scale, parallelizable work | Agent Fleet |

Most production systems in 2026 use a **hybrid**: RAG for knowledge grounding, agentic pipelines for complex reasoning, and agent fleets for large-scale execution. The skill is knowing which paradigm to apply where.

---

*Updated quarterly. Last update: March 2026.*
