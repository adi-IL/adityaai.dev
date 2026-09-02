---
form: Framework
date: 2026-07-28
topics: [agents, architecture]
featured: false
---
# Context Circuit Breakers: Preventing Reasoning Collapse in Long-Horizon Agent Loops

*When autonomous agents run past 20 turns, standard context windows do not just fill up. They degrade. Here is an architectural framework for deterministic circuit breakers, tool output quarantine, and state ledgers that stop long-running agents from collapsing.*

---

## The 20-turn wall

Every team deploying autonomous coding or operations agents watches the same failure sequence repeat in production:

1. **Turns 1 to 5:** The agent understands the objective, plans cleanly, and navigates the repository with high precision.
2. **Turns 6 to 15:** A minor tool failure occurs. A shell command times out or a regular expression misses. The agent receives a 2,000-line stack trace in stdout. It logs a mistaken assumption, alters an unrelated file, and invents a secondary problem to solve.
3. **Turns 16 to 25+:** Attention degrades. The agent repeats identical tool calls with trivial parameter variations, contradicts its original system instructions, and burns hundreds of thousands of tokens stuck in an unrecoverable loop.

```
+-----------------------------------------------------------------------------------+
|                           THE DEGRADATION CASCADE                                 |
+-----------------------------------------------------------------------------------+
|  Turns 1 - 5       | Turns 6 - 15                 | Turns 16 - 25+                |
|  Clean Context     | State Contamination          | Terminal Collapse             |
|                    |                              |                               |
|  - High attention  | - Minor tool failure logged  | - Attention dilution          |
|    fidelity        | - Phantom root cause adopted | - Loop stagnation             |
|  - Strict schema   | - Raw stderr pollutes the    | - Governance decay            |
|    adherence       |   KV cache                   | - Runaway token velocity      |
+-----------------------------------------------------------------------------------+
```

Synthetic benchmarks like SWE-bench Verified hide this failure mode because they evaluate short-horizon fixes on pre-indexed repositories. Realistic benchmarks like DeepSWE expose it directly. Real software engineering requires dozens of sequential tool interactions. Without active context governance, long-horizon performance falls off a cliff.

Large context windows do not solve this problem. In fact, raw capacity amplifies it. Attention heads diffuse across long token spans, and intermediate hallucinations become immutable ground truth once written into conversation history.

To build agents that can execute 50 or 100 turns reliably, architects must decouple operational state from prompt history. We need deterministic **context circuit breakers**.

---

## The three mechanics of context failure

Before building the defense, we must understand the three failure modes that corrupt agent contexts:

### 1. Context poisoning

Autoregressive models treat prior turns as ground truth. If an agent at Turn 4 makes an incorrect deduction based on a partial grep result, that mistaken statement sits in its history.

At Turn 5, the model attends to its own prior assertion and plans a fix for a bug that does not exist. The edits fail, generating new errors. By Turn 12, the entire context window consists of the agent reacting to its own compounding mistakes.

### 2. Attention dilution (context rot)

Even in models with 1M+ token windows, retrieval and reasoning accuracy decay as the context expands. In long multi-turn sessions, attention heads concentrate primarily on:
- The initial system instructions.
- The most recent 2 to 3 tool responses.

The critical middle section (the original architecture requirements, early test constraints, and baseline diagnostics) fades. The agent loses track of what it has already attempted and repeats discarded strategies.

### 3. Governance decay (ConstraintRot)

When an agent approaches its token budget, standard harnesses invoke a compaction step: an LLM summarizes the conversation to free up space.

This creates a serious hazard. Compaction models preserve narrative progress, but strip negative constraints. Instructions such as "never touch migration files" or "always run database commands with dry-run flags" get dropped during summarization. By Turn 22, the agent executes destructive operations because its safety rules were deleted during compaction.

---

## The context circuit breaker architecture

A context circuit breaker is an external software gate running outside the model. It monitors agent telemetry and halts execution before runaway loops waste budget or poison repository state.

```
                           +------------------------+
                           |  Task / User Prompt    |
                           +-----------+------------+
                                       |
                                       v
                     +------------------------------------+
                     |    DETERMINISTIC FSM CONTROLLER     |
                     |  (Hard Phase Transitions & Rules)  |
                     +-----------------+------------------+
                                       |
           +---------------------------+---------------------------+
           | Phase 1                   | Phase 2                   | Phase 3
           v                           v                           v
     [EXPLORATION]             [IMPLEMENTATION]             [VERIFICATION]
   - Read-only tools          - Write/Patch tools          - Test/Linter tools
   - JIT Schema Load          - Sandbox isolation          - Deterministic exit
           |                           |                           |
           +---------------------------+---------------------------+
                                       |
                                       v
                    +--------------------------------------+
                    |      CONTEXT CIRCUIT BREAKER GATE    |
                    |  - Edit Distance / Stagnation Check  |
                    |  - Error Frequency Counter (max N)   |
                    |  - Token Burn Velocity Watchdog      |
                    +------------------+-------------------+
                                       |
                                       v
                    +--------------------------------------+
                    |      OUTPUT QUARANTINE ENGINE        |
                    |  - Writes raw stdout/stderr to disk  |
                    |  - Injects diffs & exit codes only   |
                    +------------------+-------------------+
                                       |
                                       v
                    +--------------------------------------+
                    |       O(1) STRUCTURED SCRATCHPAD     |
                    |  - Persistent STATE.md / JSON Schema |
                    |  - Immutable Governance Invariants   |
                    +--------------------------------------+
```

### The four operational breakers

Every production agent harness should enforce these four deterministic triggers:

| Breaker | Metric Tracked | Trip Condition | Recovery Action |
|---|---|---|---|
| **Stagnation Breaker** | SequenceMatcher ratio on consecutive tool inputs | Similarity > 0.85 across 3 turns with non-zero exit codes | Reject call; force strategy pivot prompt |
| **Consecutive Failure Breaker** | Non-zero exit code counter per tool category | 3 consecutive failures from compilers or test runners | Roll back workspace to clean checkpoint |
| **Token Velocity Watchdog** | Tokens burned per file modification or test event | > 40,000 tokens burned with zero state changes | Halt session; request human intervention |
| **Transport Watchdog** | Time elapsed between streamed tokens | 300 seconds of inactivity without socket traffic | Terminate transport; retry from last state |

---

## Tool output quarantine: why raw stdout is toxic

The fastest way to ruin an agent's reasoning loop is to inject raw compiler or test runner output into the conversation. A single failed test run can output 8,000 lines of call stacks, dependency warnings, and memory addresses.

Dumping that text into context causes immediate attention dilution. The model focuses on irrelevant warnings while real errors get lost.

Modern harnesses implement an **output quarantine**:

1. **Disk offloading:** The full output of every command writes directly to a temporary log file on disk (for example, `/tmp/agent/logs/run-482.log`).
2. **Virtualization window:** The harness inspects the exit code. If the command succeeded, stdout is truncated to a one-line confirmation. If the command failed, the harness strips escape codes, isolates the failing assertion and line numbers, and discards passing test logs.
3. **Structured diagnostic injection:** Only the relevant error snippet (under 1,200 characters) enters the prompt, accompanied by the log file path. The agent receives actionable feedback without context bloat.

---

## The O(1) structured scratchpad

Instead of trusting the model to track its progress across a 40-turn chat history, maintain an explicit state ledger on the filesystem (`STATE.md` or a JSON schema).

This file tracks four key elements:
- **Immutable Invariants:** Rules that can never be modified or summarized away.
- **Hypotheses Disproved:** Approaches that failed and must not be retried.
- **Entities Touched:** Files and configurations modified so far.
- **Active Subtask:** The single immediate objective.

```markdown
=== SYSTEM INVARIANTS (IMMUTABLE) ===
- Never modify package.json lockfiles manually.
- All database migrations must include a down script.
- Do not edit files outside src/auth/.

=== EXECUTION STATE ===
Active Phase: IMPLEMENTATION
Current Hypothesis: Token expiration fails due to UTC offset mismatch in JWT verification.
Hypotheses Disproved:
  - Cache invalidation lag in Redis (verified fresh keys).
  - Missing authorization header in gateway proxy (traces show header present).
Files Modified:
  - src/auth/verify.ts
======================
```

Because the harness injects this structured block into the system prompt on every turn, operational state remains **O(1)** relative to session length. Raw conversation history can be truncated aggressively without losing critical direction.

---

## Concrete implementation: the circuit breaker harness

Here is a working implementation showing how the circuit breaker, output quarantine, and state ledger work together:

```python
"""
Production Agent Harness Core: FSM, Circuit Breaker, and Output Quarantine.
"""

from dataclasses import dataclass, field
import difflib
import os
from typing import List

@dataclass
class CircuitBreakerState:
    consecutive_failures: int = 0
    failure_threshold: int = 3
    history: List[str] = field(default_factory=list)
    similarity_threshold: float = 0.85

class ContextCircuitBreaker:
    def __init__(self, failure_threshold: int = 3):
        self.state = CircuitBreakerState(failure_threshold=failure_threshold)

    def check_call(self, tool_name: str, arguments: str) -> None:
        """Halt execution if the agent gets trapped in a repetitive loop."""
        call_signature = f"{tool_name}:{arguments}"
        for past_call in self.state.history[-4:]:
            similarity = difflib.SequenceMatcher(None, call_signature, past_call).ratio()
            if similarity > self.state.similarity_threshold:
                raise RuntimeError(
                    f"Circuit Breaker Tripped: Stagnation loop detected on {tool_name}. "
                    "You are repeating identical commands. Pivot your approach."
                )
        self.state.history.append(call_signature)

    def register_result(self, exit_code: int) -> None:
        """Halt runaway spend on repeated command failures."""
        if exit_code != 0:
            self.state.consecutive_failures += 1
            if self.state.consecutive_failures >= self.state.failure_threshold:
                raise RuntimeError(
                    "Circuit Breaker Tripped: 3 consecutive commands failed. "
                    "Rolling back workspace to last verified checkpoint."
                )
        else:
            self.state.consecutive_failures = 0

class ToolOutputQuarantine:
    MAX_INLINE_CHARS = 1200

    @staticmethod
    def sanitize(raw_stdout: str, raw_stderr: str, exit_code: int, log_path: str) -> str:
        """Isolate verbose terminal outputs from the prompt context."""
        os.makedirs(os.path.dirname(log_path), exist_ok=True)
        with open(log_path, "w", encoding="utf-8") as f:
            f.write(f"=== STDOUT ===\n{raw_stdout}\n=== STDERR ===\n{raw_stderr}")

        if exit_code == 0:
            if len(raw_stdout) <= ToolOutputQuarantine.MAX_INLINE_CHARS:
                return raw_stdout
            return (
                f"{raw_stdout[:300]}\n"
                f"... [Truncated {len(raw_stdout)} chars. Full log: {log_path}] ...\n"
                f"{raw_stdout[-300:]}"
            )

        # On failure, parse out stack traces and assertions only
        lines = (raw_stderr or raw_stdout).splitlines()
        critical = [
            line for line in lines
            if any(term in line.lower() for term in ["error", "exception", "failed", "assert", "panic"])
        ]
        summary = "\n".join(critical[:12]) or "Command failed with non-zero exit code."
        return (
            f"Exit Code {exit_code}\n"
            f"Extracted Diagnostics:\n{summary}\n"
            f"[Full execution details offloaded to {log_path}]"
        )
```

---

## Architectural rules for long-horizon loops

When designing autonomous agent workflows for production, follow these rules:

1. **Never build open-ended ReAct loops.** Free-form loops always degrade. Enforce a state machine with explicit phase gates: Exploration (read-only), Implementation (edits), and Verification (tests and linters).
2. **Never allow an agent to grade its own progress.** Exit conditions must be determined by external software (exit code 0, clean compiler output, all assertions green), never by the model declaring that it is finished.
3. **Quarantine raw terminal streams.** Strip noise before it touches the prompt. Raw stdout belongs on disk, not in the KV cache.
4. **Protect invariants outside the context window.** Do not rely on conversation summarization to preserve rules. Maintain critical constraints in an external ledger and inject them on every step.
