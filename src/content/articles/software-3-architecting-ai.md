---
form: Architecture
date: 2026-01-15
topics: [architecture]
featured: true
---
# Software 3.0: What It Actually Means to Architect AI Systems

*Karpathy named the era. Here's what it means to build in it.*

---

## Introduction

Andrej Karpathy gave us a clean taxonomy for how software is evolving:

- **Software 1.0** - Explicit, rule-based code written by humans. `if/else`, loops, functions. The code *is* the program.
- **Software 2.0** - Neural networks trained on data. The weights *are* the program. You don't write the logic; you train it.
- **Software 3.0** - LLMs programmed via natural language. The prompt *is* the program. English becomes a programming language.

This framework is elegant and widely cited. But it stops at the naming layer. It tells you *what* the eras are. It doesn't tell you **what it means to be a systems architect in Software 3.0.**

This essay goes one level deeper.

---

## The Fundamental Inversion

In Software 1.0, the architect designs **data flow** - how information moves between modules, databases, and APIs.

In Software 3.0, the architect designs **prompt flow** - how context, instructions, and constraints move between agents, models, and tools.

This sounds like a word substitution. It is not. The change is fundamental because prompts are **non-deterministic**. The same prompt can produce different outputs. The same agent can take different paths. The architect must design for a system where the intermediate steps are probabilistic.

```
Software 1.0 System:
Input → Module A (deterministic) → Module B (deterministic) → Output
                  ↓                           ↓
          Always same path             Always same result

Software 3.0 System:
Input → Agent A (probabilistic) → Agent B (probabilistic) → Output
                  ↓                            ↓
          Different paths possible     Different results possible
          Needs guardrails             Needs evaluation
```

---

## Mental Model 1: Modules Become Agents

In Software 1.0, you decompose a system into **modules** - self-contained units with clear interfaces. A function takes inputs, returns outputs, and behaves predictably.

In Software 3.0, the equivalent unit is an **agent** - a model with a system prompt, a set of tools, and a task. But agents differ from modules in critical ways:

| Property | Module (1.0) | Agent (3.0) |
|----------|-------------|-------------|
| Behavior | Deterministic | Probabilistic |
| Interface | Typed function signature | Natural language spec |
| Error handling | Try/catch | Retry with rephrased prompt |
| Testing | Unit tests | Eval suites |
| Composition | Function calls | Orchestration protocols |
| State | Explicit variables | Context window |

### What this means for the architect

You can't design agent systems the way you designed microservices. The interfaces are fuzzier. The failure modes are different. The testing methodology is fundamentally different.

**The new design patterns:**

1. **Spec-driven agents**: Each agent gets a markdown specification defining its role, constraints, and success criteria. The spec *is* the interface.
2. **Guard-railed outputs**: Instead of type checking, use structured output schemas (JSON mode) combined with validation layers.
3. **Retry with variation**: Instead of retry-with-backoff, retry with a rephrased prompt that includes the error from the previous attempt.

---

## Mental Model 2: CI/CD Becomes Agent Eval Pipelines

In Software 1.0, CI/CD pipelines test code changes against a suite of deterministic tests. Green means ship.

In Software 3.0, you can't unit-test a prompt change. A prompt that works 95% of the time will still fail on the other 5%, and a "passing" eval suite doesn't guarantee production behavior.

### The new testing paradigm

```
Software 1.0 Pipeline:
Code Change → Unit Tests → Integration Tests → Deploy
   Pass/Fail     Pass/Fail       Pass/Fail

Software 3.0 Pipeline:
Prompt Change → Eval Suite → Statistical Analysis → Deploy (with monitoring)
   Score: 0.87     Regression?       Confidence?
                   Compared to          Within
                   baseline            threshold?
```

**Key differences:**

- **Tests become evaluations**: Instead of pass/fail, you measure accuracy, consistency, and quality on a continuous scale
- **Baselines replace expectations**: You don't check if the output is "correct" - you check if it's "better than the previous version"
- **Monitoring replaces confidence**: Even after deployment, you continuously evaluate production outputs against quality metrics

### What the architect must build

1. **Eval dataset management**: Curated sets of inputs with expected outputs, maintained like test fixtures
2. **A/B prompt testing infrastructure**: Deploy two prompt versions simultaneously, measure which performs better
3. **Regression detection**: Automated alerts when a prompt change degrades performance on specific test categories
4. **Human-in-the-loop review**: Escalation paths for outputs that fall below confidence thresholds

---

## Mental Model 3: Data Flow Becomes Context Flow

In Software 1.0, you architect data pipelines. Data moves from source to transformation to storage to presentation. The data is persistent. The pipeline is stateless.

In Software 3.0, you architect **context pipelines**. Context moves from retrieval to compression to injection to generation. The context is ephemeral. The pipeline is stateful (the context window *is* the state).

### The context engineering stack

```
Context Engineering Architecture:

┌─────────────────────────────────────────────────┐
│                 Context Window                   │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ System   │  │ Retrieved│  │ User     │      │
│  │ Prompt   │  │ Context  │  │ Input    │      │
│  │ (fixed)  │  │ (dynamic)│  │ (live)   │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Few-shot │  │ Prior    │  │ Tool     │      │
│  │ Examples │  │ Turns    │  │ Results  │      │
│  │ (curated)│  │ (summary)│  │ (fresh)  │      │
│  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────┘
```

**The architect's decisions:**

| Decision | Options | Trade-off |
|----------|---------|-----------|
| What to include | Full history vs. compressed summary | Completeness vs. token budget |
| Where to place it | Early in context vs. late in context | Primacy bias vs. recency bias |
| How to compress | Extractive summary vs. abstractive summary | Fidelity vs. brevity |
| When to refresh | Every turn vs. on-demand | Freshness vs. cost |

---

## Mental Model 4: Architecture Reviews Become Prompt Reviews

In Software 1.0, senior engineers review architecture decisions: database choices, API designs, scaling strategies.

In Software 3.0, the equivalent review is a **prompt review** - evaluating the quality, clarity, and robustness of the prompts that drive agent behavior.

### What a prompt review looks like

A good prompt review evaluates:

1. **Clarity**: Is the instruction unambiguous? Could a reasonable model interpret it differently?
2. **Completeness**: Are edge cases addressed? What happens when the input is malformed?
3. **Constraints**: Are output format, length, and style constraints explicit?
4. **Context efficiency**: Does the prompt waste tokens on unnecessary instructions?
5. **Robustness**: Does the prompt work across model versions? Is it fragile to minor model updates?

### The prompt as code

The most important mental shift: **prompts are code**. They should be version-controlled, reviewed, tested, and documented like any other critical system component.

```
prompts/
├── agents/
│   ├── spec_writer.md          # System prompt for the spec agent
│   ├── code_generator.md       # System prompt for the code agent
│   └── reviewer.md             # System prompt for the review agent
├── templates/
│   ├── error_retry.md          # Template for retry prompts
│   └── output_format.md        # Template for structured output
└── evals/
    ├── spec_writer_eval.jsonl   # Evaluation dataset
    └── code_generator_eval.jsonl
```

---

## Mental Model 5: Scaling Becomes Agent Orchestration

In Software 1.0, scaling means more servers, more replicas, load balancers. Horizontal scaling.

In Software 3.0, scaling means more agents, more concurrent sessions, orchestration layers. **Cognitive scaling.**

### The orchestration patterns

**Pattern 1: Sequential Pipeline**
```
Task → Agent A (plan) → Agent B (implement) → Agent C (review) → Output
```
Best for: Linear workflows where each step depends on the previous.

**Pattern 2: Parallel Fan-Out**
```
Task → Splitter → [Agent A, Agent B, Agent C] → Merger → Output
```
Best for: Tasks that can be decomposed into independent subtasks.

**Pattern 3: Hierarchical Delegation**
```
Task → Manager Agent → [Worker A, Worker B, Worker C]
                    ↕                ↕
              Sub-manager → [Worker D, Worker E]
```
Best for: Complex projects requiring multi-level decomposition.

**Pattern 4: Competitive Evaluation**
```
Task → [Agent A, Agent B, Agent C] → Evaluator → Best Output
```
Best for: Tasks where quality varies and you want the best output from multiple approaches.

---

## The New Skills for the Software 3.0 Architect

The architect's toolkit has permanently shifted:

| Old Skill | New Skill |
|-----------|-----------|
| Database design | Context architecture |
| API design | Prompt engineering |
| Load testing | Eval suite design |
| Code review | Prompt review |
| Scaling infrastructure | Agent orchestration |
| Error handling | Failure recovery and retry strategies |
| Monitoring | Output quality monitoring |
| Security | Prompt injection defense |

---

## Conclusion

Karpathy named the eras. The "and then what?" is this: Software 3.0 requires a completely new set of architectural mental models.

The systems architect of 2026 doesn't just think about data flow, API design, and scaling. They think about **context flow, prompt design, agent orchestration, and evaluation pipelines.**

The era has a name. Now it needs architects who know how to build in it.

---

*This is the second essay in a series on AI Systems Architecture. Next: "Beyond Standard AI Systems: What Comes After RAG + Agentic Search."*
