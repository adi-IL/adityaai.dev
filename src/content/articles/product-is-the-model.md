---
form: Principle
date: 2025-11-10
topics: [product, models]
featured: true
---
# The "Product Is the Model" Principle - And How to Actually Apply It

*Boris articulated a philosophy. This is the practitioner's guide to implementing it.*

---

## The Principle

Boris Cherny, Head of Claude Code at Anthropic:

> "The product is the model. The approach is to expose the model as directly as possible, with minimal scaffolding, and allow the model to determine the best approach."

This is counterintuitive for most engineers. Our instinct is to constrain, guide, and control. Build workflows. Define steps. Add guardrails at every level. Boris's approach: **trust the model. Build less scaffolding. Let it decide.**

But when does this work? When does it fail? And how do you implement it practically?

---

## What "Minimal Scaffolding" Actually Means

Most AI applications are 80% scaffolding and 20% model:

```
Typical AI Application:
┌─────────────────────────────────────────┐
│                                          │
│  User input → Preprocessing → Routing →  │
│  Template selection → Context injection → │
│  Model call → Post-processing → Filtering │
│  → Formatting → Validation → Response    │
│                                          │
│  Scaffolding: 80%   Model: 20%           │
└─────────────────────────────────────────┘
```

Boris's approach:

```
Claude Code Architecture:
┌─────────────────────────────────────────┐
│                                          │
│  User input → Model (with tools) → Output│
│                                          │
│  Scaffolding: 20%   Model: 80%           │
└─────────────────────────────────────────┘
```

The 20% scaffolding that remains: tool definitions, safety constraints, output formatting. Everything else is the model's judgment.

---

## When This Principle Works

### Condition 1: The model is capable enough

"The product is the model" only works when the model is genuinely capable of the target tasks. For frontier models (Claude Opus/Sonnet, GPT-4, Gemini Pro) on coding, writing, and analysis tasks - the capability is there.

**Test**: Can the model accomplish the task in a single prompt ~70% of the time? If yes, minimal scaffolding will likely improve performance (by not constraining what the model can do). If no, you need more scaffolding to compensate for capability gaps.

### Condition 2: The failure modes are recoverable

"Trust the model" works when failures are cheap. In Claude Code, the model might write bad code - but the user can see it, the tests catch it, and the model can retry. The failure is visible and recoverable.

**Test**: If the model makes a mistake, can the user detect it and recover without catastrophic consequences? If yes, minimal scaffolding. If no (medical, financial, safety-critical), add more constraints.

### Condition 3: The tools are well-defined

Claude Code gives the model a small set of well-defined tools: read file, write file, run command, search. The model decides which to use. The tools themselves are simple and reliable.

**Test**: Are your tools simple, reliable, and well-documented? If yes, let the model choose. If your tools are complex, unreliable, or poorly documented, the model will misuse them. Add scaffolding to compensate.

---

## When This Principle Fails

### Failure 1: High-stakes decisions with no undo

In medical diagnosis, legal advice, financial trading - a wrong answer has irreversible consequences. "Trust the model's judgment" is irresponsible here.

**Pattern for high-stakes**: Model generates → Validation layer checks → Human reviews → Action taken.

### Failure 2: Domain-specific constraints the model doesn't know

The model doesn't know your company's naming conventions, your regulatory requirements, your specific deployment constraints. If these are critical, encode them in scaffolding.

**Pattern for constraints**: Encode constraints in the system prompt AND in post-processing validation. Don't rely on either alone.

### Failure 3: Low-capability models

If you're using a small, fine-tuned model (7B parameters) for a narrow task, the model doesn't have the breadth of capability to make judgment calls. It needs more scaffolding.

**Pattern for small models**: More constrained prompts, more structured outputs, more validation steps. The scaffolding compensates for the model's narrower capability.

---

## The Practitioner's Guide: 8 Patterns

### Pattern 1: Tool-First Architecture

Instead of building workflow steps, give the model tools and let it compose them:

```python
# ❌ Scaffolding-heavy approach
def handle_user_request(request):
    # Step 1: Classify intent
    intent = classify_intent(request)
    # Step 2: Route to handler
    if intent == "search":
        return search_handler(request)
    elif intent == "code":
        return code_handler(request)
    elif intent == "analyze":
        return analysis_handler(request)

# ✅ "Product is the model" approach
def handle_user_request(request):
    tools = [search_tool, code_tool, analysis_tool, file_tool]
    response = model.generate(
        system=SYSTEM_PROMPT,
        message=request,
        tools=tools,
        # Let the model decide which tools to use and in what order
    )
    return response
```

### Pattern 2: Constraint Prompts, Not Constraint Code

Instead of enforcing constraints in application code, encode them in the system prompt:

```
# ❌ Code-level constraints
def validate_output(output):
    if len(output) > 500:
        truncate(output)
    if contains_pii(output):
        redact(output)
    if not valid_json(output):
        reformat(output)

# ✅ Prompt-level constraints
SYSTEM_PROMPT = """
You are a helpful assistant. Follow these rules:
- Keep responses under 500 words
- Never include personally identifiable information
- Always respond in valid JSON format: {"answer": "...", "confidence": 0.0-1.0}
- If you're unsure, say so explicitly with confidence < 0.5
"""
```

**When to use code-level constraints anyway**: For safety-critical requirements that must be enforced regardless of model behavior. The prompt handles 95% of cases; the code handles the edge cases.

### Pattern 3: Evaluation Over Guardrails

Instead of preventing the model from doing bad things (guardrails), let it try and evaluate the result:

```python
# ❌ Pre-execution guardrails (constraining)
def run_agent(task):
    if is_dangerous(task):
        return "I can't do that."
    if is_too_complex(task):
        return "Please break this into smaller tasks."
    return model.execute(task)

# ✅ Post-execution evaluation (trusting)
def run_agent(task):
    result = model.execute(task, tools=ALL_TOOLS)
    evaluation = evaluate_result(result, task)
    if evaluation.quality < 0.7:
        result = model.execute(
            f"Your previous attempt scored {evaluation.quality}. "
            f"Feedback: {evaluation.feedback}. Try again.",
            tools=ALL_TOOLS
        )
    return result
```

### Pattern 4: Session-Level Autonomy

Give the model autonomy within a session. Let it make multiple tool calls without asking for permission at each step:

```
# ❌ Permission at every step
Model: "I want to search for files matching 'auth'"
System: [asks user for permission]
User: "OK"
Model: [searches]
Model: "I want to read auth.py"
System: [asks user for permission]
User: "OK"

# ✅ Session-level autonomy
Model: [searches for 'auth'] → [reads auth.py] → [reads tests] →
       [writes fix] → [runs tests] → "Done. Here's what I did."
User: [reviews the complete result]
```

### Pattern 5: Model-Selected Output Format

Don't force the model into a fixed output format. Let it choose the most appropriate format for the response:

```
# ❌ Fixed format
"Always respond in JSON: {answer, confidence, sources}"

# ✅ Model-selected format
"Respond in the format that best communicates the answer:
- For factual answers: direct text
- For comparisons: markdown tables
- For procedures: numbered steps
- For code: code blocks with explanations
- For uncertainty: explicitly state what you know and don't know"
```

### Pattern 6: Graceful Degradation Over Hard Failures

When the model fails, let it degrade gracefully rather than crashing:

```python
# ❌ Hard failure
def answer(query):
    result = model.generate(query)
    if not validate(result):
        raise Error("Invalid model output")

# ✅ Graceful degradation
def answer(query):
    result = model.generate(query)
    if not validate(result):
        result = model.generate(
            f"Your previous response wasn't valid. "
            f"Please try again. Error: {validation_error}"
        )
    if not validate(result):
        return "I wasn't able to generate a valid response. "
               "Here's my best attempt: " + result.raw
```

### Pattern 7: Transparency Over Control

Instead of hiding the model's reasoning, expose it:

```
# ❌ Hidden reasoning
Model thinks → Output appears (user doesn't know how)

# ✅ Transparent reasoning
Model thinks → Shows reasoning steps → Shows tool calls →
Shows intermediate results → Final output

→ User can see what the model did
→ User can intervene if the approach is wrong
→ Trust is built through transparency, not control
```

### Pattern 8: "Build for the Model 6 Months From Now"

Boris's corollary principle: architect your system for the model that will exist in 6 months, not the model that exists today.

**Practically**:
- Don't add scaffolding for capability gaps that will be fixed in the next model version
- Build abstraction layers that make it easy to swap models
- Over-invest in evaluation (so you can quickly test when a better model arrives)
- Under-invest in workarounds for specific model weaknesses

---

## The Decision Matrix

| Situation | Apply "Product is the Model"? | Why |
|-----------|------------------------------|-----|
| Frontier model, recoverable failures | **Yes** | Model is capable, failures are cheap |
| Small model, narrow domain | **No** | Model needs scaffolding to compensate |
| Safety-critical application | **Partially** | Trust model + add safety validation |
| Well-defined tools | **Yes** | Model can compose tools effectively |
| Complex, poorly-defined tools | **No** | Model will misuse tools without guidance |
| User-facing product | **Yes, with transparency** | Show reasoning, let user course-correct |
| Fully automated pipeline | **With evaluation gates** | No human to catch errors = need evals |

---

## Conclusion

"The product is the model" is not "let the model do whatever it wants." It's a specific engineering philosophy:

1. **Build tools, not workflows.** Give the model capabilities and let it compose them.
2. **Encode constraints in prompts, not code** (except for safety-critical requirements).
3. **Evaluate outcomes, not intermediate steps.** Let the model choose its path; judge the destination.
4. **Be transparent.** Show the model's reasoning so users can trust and intervene.
5. **Build for future capability.** Don't over-engineer scaffolding for problems the next model version will solve.

Boris built Claude Code this way, and it writes 4% of all GitHub commits. The philosophy works - but knowing *when* to apply it is the real skill.

---

*The product is the model. But the architect decides how much of the product to expose.*
