---
form: Architecture
date: 2026-09-02
topics: [agents, architecture, security]
featured: true
---
# The Chat Template Trap: Why Dynamic Agent State Crashes Open-Weight Models

*Multi-agent systems cannot run on static prompts. But the moment you inject volatile state into open-weight inference, Jinja templates throw fatal exceptions. Here is how we engineered asymmetric message transformation in PentestCode to preserve Anthropic prompt caching without breaking local tokenizers.*

---

## The local inference reality check

Most autonomous agent architectures are designed and tested against commercial API providers like Anthropic Claude and OpenAI. In those hosted environments, the API accepts arbitrary arrays of system, user, and assistant messages. The provider handles tokenization behind a black-box HTTP endpoint, silently forgiving unconventional message arrangements.

The moment you redirect that agent harness to an on-premises inference engine (vLLM, Ollama, SGLang, or TGI) running open-weight models like Qwen 2.5, Llama 3, or Mistral, the agent breaks.

Often, it does not fail on Turn 1. It boots, parses its instructions, and runs its initial reconnaissance. Then, on Turn 4 or after its first context compaction pass, the session halts with an unhandled HTTP 500 error:

```text
Error: Jinja
Exception: System message must be at the beginning.
```

This is not a network blip or an out-of-memory crash. It is an architectural collision between how multi-agent state machines inject real-time context and how open-weight tokenizers enforce message schemas.

We ran directly into this wall while engineering [PentestCode](https://github.com/s0ld13rr/pentestcode), our terminal-native multi-agent penetration testing system. Here is what caused it, why naive fixes ruin cloud prompt caching economics, and how we solved it in [PR #12](https://github.com/s0ld13rr/pentestcode/pull/12).

---

## The volatile state problem in multi-agent systems

PentestCode coordinates 13 specialist agents (reconnaissance, network scanners, web exploiters, Active Directory specialists, and false-positive critics) around a shared strategist based on the Hierarchical Planning and Task-Specific Agents (HPTSA) framework.

```
                            ┌───────────────┐
                            │    pentest    │  Strategist / Coordinator
                            │    (lead)     │  Dijkstra Attack Routing
                            └───────┬───────┘
           ┌────────┬────────┬──────┴─┬────────┬────────┬────────┐
           ▼        ▼        ▼        ▼        ▼        ▼        ▼
        ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
        │recon │ │scan- │ │enu-  │ │exploi│ │iden- │ │infra │ │post- │
        │      │ │ner   │ │merator││ter   │ │tity  │ │struc │ │exploit│
        └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘
           │        │        │        │        │        │        │
           └────────┴────────┴───┬────┴────────┴────────┴────────┘
                                 │ Parsed Output Stream
                                 ▼
                    ┌───────────────────────────────┐
                    │  Shared Engagement State      │
                    │  - Entity Graph (Nodes/Edges) │
                    │  - Discovered Credentials     │
                    │  - Active Tunnels / Shells    │
                    └───────────────────────────────┘
```

In a real engagement, the operating environment is never static. An enumerator discovers an open SMB share on host `10.10.10.5`. An exploiter cracks an NTLM hash. A tunnel drops.

If agents had to pass this data back and forth as conversational chat history, attention dilution would degrade decision-making within minutes. Instead, the runtime maintains a structured, persistent **engagement state graph**.

On every inference cycle, the harness compiles this state into an XML payload and injects it into the prompt:

```typescript
// packages/opencode/src/session/llm/request.ts
const system: string[] = [baseSystemPrompt];

if (input.volatileSystem) {
  system.push(input.volatileSystem); // Live engagement state (ports, creds, access)
}

const messages = [
  ...system.map((x) => ({ role: "system", content: x })),
  ...conversationHistory,
];
```

This results in a message array containing multiple contiguous system messages at the front of the session:

```json
[
  { "role": "system", "content": "You are a senior security researcher..." },
  { "role": "system", "content": "<pentest-engagement>\nPhase: exploit\nHosts: 10.10.10.5\n</pentest-engagement>" },
  { "role": "user", "content": "Analyze the SMB service on 10.10.10.5" },
  { "role": "assistant", "content": "Checking for null session..." }
]
```

Furthermore, when long-running sessions exceed their token budget, the compaction subagent summarizes older turns and inserts an updated system status block chronologically into the conversation history to anchor the remaining turns.

In commercial cloud APIs, this is completely permissible. In local open-weight inference, it is fatal.

---

## The Jinja chat template invariant

Open-weight models rely on client-side or server-side Jinja templates defined in their `tokenizer_config.json` to serialize JSON message arrays into raw token streams.

Consider the standard Jinja chat template used by modern open-weight models (Qwen, Llama, Mistral):

```jinja
{%- for message in messages %}
  {%- if message['role'] == 'system' %}
    {%- if not loop.first %}
      {{ raise_exception('System message must be at the beginning.') }}
    {%- endif %}
    {{ '<|im_start|>system\n' + message['content'] + '<|im_end|>\n' }}
  {%- elif message['role'] == 'user' %}
    {{ '<|im_start|>user\n' + message['content'] + '<|im_end|>\n' }}
  {%- elif message['role'] == 'assistant' %}
    {{ '<|im_start|>assistant\n' + message['content'] + '<|im_end|>\n' }}
  {%- endif %}
{%- endfor %}
```

Look closely at lines 3 and 4:

```jinja
{% if not loop.first %}
  {{ raise_exception('System message must be at the beginning.') }}
{% endif %}
```

The template assumes a naive pattern: exactly one system message, located at index `0`.

When the loop evaluates `messages[1]` (the volatile engagement state), `message['role'] == 'system'` is true, but `loop.first` is false. Jinja halts template rendering and raises an unrecoverable exception.

The same failure occurs after auto-compaction: when an updated system summary is placed mid-history to refresh context, `not loop.first` evaluates to true, crashing the session immediately.

---

## The prompt caching conflict

The naive fix is obvious: join all system messages into a single string before sending the request:

```typescript
// The naive fix: collapse everything
const consolidatedSystem = system.join("\n\n");
```

This silences Jinja, but it introduces a severe performance penalty on cloud models like Anthropic Claude.

Anthropic models utilize **prompt caching breakpoints**. Under Anthropic's pricing and architecture, static context prefixes are cached on server-side hardware for five minutes. Reading from the prompt cache costs 90% less than fresh input processing and cuts Time-To-First-Token (TTFT) by up to 80%.

To use prompt caching effectively in a multi-agent system, the base system instructions (which never change across turns) must sit in an isolated, immutable block:

```
[ Block 1: Base Instructions (~8,000 tokens) ] ---> CACHED (Read: $0.375 / 1M)
[ Block 2: Volatile Engagement State (~1,500 tokens) ] ---> DYNAMIC (Write: $3.75 / 1M)
[ Block 3: Conversation History ]                 ---> DYNAMIC
```

If you concatenate Block 1 and Block 2 into a single string, the dynamic engagement state invalidates the cache for the entire 8,000-token base prompt on every single turn. Over an 80-turn engagement, this naive concatenation increases inference costs tenfold and introduces substantial latency overhead.

Architects face an asymmetric requirement:
- **Cloud models (Anthropic):** Require discrete system blocks to preserve prompt caching boundaries.
- **Open-weight models (vLLM / Ollama):** Demand strict single-block monotonicity to avoid tokenizer exceptions.

---

## The solution: asymmetric normalization and role lowering

In [PR #12](https://github.com/s0ld13rr/pentestcode/pull/12), we solved this by implementing an asymmetric message normalization layer inside the provider transport middleware (`packages/opencode/src/provider/transform.ts`).

The transformer operates in two stages: leading consolidation and non-leading role lowering.

```
Incoming Message Stream:
[System: Base] -> [System: Volatile State] -> [User] -> [Assistant] -> [System: Compaction Update] -> [User]

                                        │
                         Provider Detection Gate
                                        │
           ┌────────────────────────────┴────────────────────────────┐
           ▼                                                         ▼
   Anthropic Target                                         OpenAI / Ollama / vLLM
   (Preserve cache boundaries)                              (Strict Jinja compliance)
           │                                                         │
[System: Base]                                              [System: Base + Volatile State]
[System: Volatile State]                                    [User]
[User]                                                      [Assistant]
[Assistant]                                                 [User: <system-update>Compaction</system-update>]
[User: <system-update>Compaction</system-update>]            [User]
[User]
```

### 1. Leading system consolidation
The engine checks the target model provider. If the model runs via an OpenAI-compatible endpoint, Ollama, or vLLM, all contiguous leading system messages are buffered and joined into a single leading `role: "system"` message. If the model is Anthropic, the discrete blocks pass through untouched.

### 2. Role lowering for chronological updates
Any `role: "system"` message appearing after the first non-system message (such as mid-session compaction updates or environmental event logs) cannot remain a system message without crashing Jinja.

Instead of deleting it, the middleware lowers the message into a user-compatible **semantic envelope**:

```json
{
  "role": "user",
  "content": "<system-update>\nHost 10.10.10.5 pawned. Active foothold: NT AUTHORITY\\SYSTEM\n</system-update>"
}
```

The language model still perceives the text as an environmental system update, but the chat template treats it as standard user input. Jinja's `loop.first` rule is never violated.

### Concrete implementation

Here is the production implementation from `packages/opencode/src/provider/transform.ts`:

```typescript
// packages/opencode/src/provider/transform.ts

export function normalizeMessages(
  msgs: ModelMessage[],
  model: ModelInfo,
): ModelMessage[] {
  const isAnthropic =
    model.api.npm === "@ai-sdk/anthropic" ||
    model.api.npm === "@ai-sdk/google-vertex/anthropic";

  const leadingSystem: string[] = [];
  let inLeadingSystem = true;
  const processed: ModelMessage[] = [];

  for (const msg of msgs) {
    if (msg.role === "system") {
      const content = typeof msg.content === "string" ? msg.content : "";
      
      if (inLeadingSystem) {
        if (isAnthropic) {
          // Preserve discrete blocks for Anthropic prompt caching
          processed.push(msg);
        } else {
          // Buffer contiguous leading blocks for OpenAI / local engines
          if (content.trim().length > 0) {
            leadingSystem.push(content);
          }
        }
      } else {
        // Non-leading system message in conversation history:
        // Lower to user-compatible envelope to preserve timeline ordering
        // without violating Jinja chat template invariants.
        processed.push({
          role: "user",
          content: `<system-update>\n${content}\n</system-update>`,
        });
      }
    } else {
      if (inLeadingSystem) {
        inLeadingSystem = false;
        if (!isAnthropic && leadingSystem.length > 0) {
          processed.unshift({
            role: "system",
            content: leadingSystem.join("\n\n"),
          });
        }
      }
      processed.push(msg);
    }
  }

  // Handle sessions containing exclusively system messages
  if (inLeadingSystem && !isAnthropic && leadingSystem.length > 0) {
    processed.unshift({
      role: "system",
      content: leadingSystem.join("\n\n"),
    });
  }

  return processed;
}
```

---

## Unit verification

To ensure regressions do not slip back into production, the provider transform is covered by automated unit tests across both engine categories:

```typescript
// packages/opencode/test/provider/transform.test.ts

describe("ProviderTransform.message - system message consolidation and ordering", () => {
  const localModel = {
    providerID: "ollama",
    api: { id: "qwen3.8-27b", npm: "@ai-sdk/openai-compatible" },
  };

  const anthropicModel = {
    providerID: "anthropic",
    api: { id: "claude-sonnet-4-20250514", npm: "@ai-sdk/anthropic" },
  };

  test("consolidates multiple leading system messages for OpenAI-compatible providers", () => {
    const msgs = [
      { role: "system", content: "Base system instructions." },
      { role: "system", content: "<pentest-engagement>Phase: scan</pentest-engagement>" },
      { role: "user", content: "Run scan" },
    ];

    const result = normalizeMessages(msgs as any, localModel as any);

    expect(result).toHaveLength(2);
    expect(result[0].role).toBe("system");
    expect(result[0].content).toBe(
      "Base system instructions.\n\n<pentest-engagement>Phase: scan</pentest-engagement>"
    );
    expect(result[1].role).toBe("user");
  });

  test("lowers non-leading system messages into user-compatible <system-update> blocks", () => {
    const msgs = [
      { role: "system", content: "Base system instructions." },
      { role: "user", content: "Initial query" },
      { role: "assistant", content: "Initial response" },
      { role: "system", content: "Compaction summary: 3 hosts enumerated." },
      { role: "user", content: "Next step" },
    ];

    const result = normalizeMessages(msgs as any, localModel as any);

    expect(result).toHaveLength(5);
    expect(result[0].role).toBe("system");
    expect(result[3].role).toBe("user");
    expect(result[3].content).toBe(
      "<system-update>\nCompaction summary: 3 hosts enumerated.\n</system-update>"
    );
  });

  test("preserves distinct leading system blocks for Anthropic prompt caching", () => {
    const msgs = [
      { role: "system", content: "Base system instructions." },
      { role: "system", content: "Volatile state payload." },
      { role: "user", content: "Next step" },
    ];

    const result = normalizeMessages(msgs as any, anthropicModel as any);

    expect(result).toHaveLength(3);
    expect(result[0].role).toBe("system");
    expect(result[1].role).toBe("system");
    expect(result[2].role).toBe("user");
  });
});
```

---

## Architecture principles for multi-provider agent runtimes

Building production agent harnesses that run cleanly across both hosted APIs and open-weight self-hosted clusters requires adhering to three principles:

1. **Treat chat templates as rigid external schemas.** Do not assume the model runtime accepts arbitrary message sequences. Jinja templates enforce strict role sequences. Test your message sequences against actual open-weight tokenizers early.
2. **Never sacrifice prompt caching for provider parity.** A one-size-fits-all message normalization pipeline that collapses system messages globally will degrade cloud performance and inflate token costs. Middleware must remain provider-aware.
3. **Use semantic envelopes for chronological state updates.** When environmental telemetry, memory consolidation, or compaction state must be injected mid-session, lower the message into a user-compatible semantic envelope like `<system-update>`. The LLM retains the context; the tokenizer never throws an exception.
