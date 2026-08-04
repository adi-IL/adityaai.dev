---
form: Framework
date: 2026-04-13
topics: [agents, economics]
featured: true
---
# Inference Economics for Agents: A Research Framework for Why Token Cost Is the Wrong Metric

*Every team building agents in 2026 is optimizing the wrong number. Token cost tells you a fraction of the story. Here is a framework for the other four fractions.*

---

## The fixation on tokens

Open any AI engineering Slack in 2026 and you will see the same question asked weekly: "What's the cost per task?" Followed by a calculation that multiplies prompt tokens by the model's per-token price, adds the output tokens, and produces a neat dollar figure.

That calculation is wrong. Not inaccurate, wrong. It answers the question "what does one model call cost" in isolation, which is not what any production agent architect actually cares about.

The real question is: **what does it cost to serve one completed task, at production reliability, at your target latency, on a schedule that will not bankrupt you when the workload grows 10x?** Token cost is one of five terms in that equation, and for most agent workloads it is not the largest.

This piece is an attempt to give architects the other four terms.

---

## The five-term inference economics equation

```
Cost per completed task  =  C_tokens
                         +  C_latency
                         +  C_reliability
                         +  C_eval
                         +  C_churn
```

Each term is measured in dollars or dollar-equivalents. Most teams only track the first. Let us walk through all five.

### Term 1: Token cost

The obvious one. Prompt tokens times input price, plus output tokens times output price. For frontier chat models in Q2 2026 this ranges from $0.50 to $15 per million input tokens.

For a chat product, this term dominates. For an agent product, this term is often 20-40% of total cost.

### Term 2: Latency cost

Latency is a dollar cost in three ways:

1. **User abandonment**: every second of added latency past 3 seconds costs a measurable fraction of active users. For a B2B agent, this is revenue churn.
2. **Parallelism overhead**: low latency lets you pack more agent turns into a user session, which multiplies the effective throughput of your GPUs.
3. **Retry exposure**: slow calls timeout more often, and retries multiply token cost.

A 2x slowdown in time-to-first-token typically raises total cost per task by 30-50% once you account for retry amplification and user churn.

### Term 3: Reliability cost

Every production agent has a **retry budget**. Calls fail. Outputs fail validation. Tools return errors. Each of those triggers a retry, and each retry multiplies the token cost of the task.

In my own production agents, the reliability multiplier ranges from 1.1x (well-behaved tasks) to 3.5x (complex multi-tool agent loops). That is, the "expected tokens per task" is 1.1 to 3.5 times the "happy path tokens per task" once you count retries.

Most teams compute token cost on the happy path and are surprised by their bill at the end of the month. The happy path is a lie.

### Term 4: Evaluation cost

Running a production agent requires running evals. Continuous evals, regression evals, A/B comparison evals. The eval traffic is often 10-30% of production traffic and is billed at the same per-token rate.

If you are spending $50K/month on production inference and you are not also spending roughly $5K-$15K/month on eval inference, you are underspending on quality and overspending on incidents. If you are not budgeting for eval at all, you are ignoring a 10-30% line item.

### Term 5: Churn cost

Models get replaced. Every 3-6 months, a better model ships and the economically rational move is to migrate. But migration costs you:

- **Prompt re-engineering**: prompts tuned for Claude 4.6 Opus rarely work identically on GPT-5.5 High.
- **Eval re-baselining**: your regression suite has to be re-baselined on the new model.
- **Serving surface changes**: API contract shifts, tool calling formats shift, structured output formats shift.

For a mature agent, the churn cost of one model migration is 2-8 engineer-weeks. If you migrate three times per year (a reasonable cadence in 2026), that is 6-24 engineer-weeks per year, which is $50K-$300K of engineering cost attached to inference, not to features.

---

## A worked example: three agent architectures, same task

Let me make this concrete. Consider a competitive intelligence agent that takes a company name and produces a scored SWOT report. Three architectures, all functionally equivalent.

### Architecture A: one big model call

Pass the company name, the 5 SWOT dimensions, and a long prompt to GPT-5.5 High. Wait 90 seconds. Get a report.

### Architecture B: five sequential small calls

Router, Hunter, Scraper, Analyst, Reporter. Each call is a small Flash-tier model with specific instructions. Sentinel, basically.

### Architecture C: one call plus many small parallel calls

One Pro call to plan, then 10 parallel Flash calls for per-dimension scoring, then one Pro call to synthesize.

| Cost term | A: one big call | B: five sequential | C: hybrid parallel |
|---|---|---|---|
| Tokens ($) | $0.48 | $0.12 | $0.18 |
| Latency ($) | $0.34 | $0.15 | $0.09 |
| Reliability ($, retries) | $0.71 | $0.15 | $0.24 |
| Evaluation ($) | $0.10 | $0.04 | $0.06 |
| Churn (amortized per task) | $0.15 | $0.05 | $0.07 |
| **Total** | **$1.78** | **$0.51** | **$0.64** |

Architecture A has the lowest token cost if you squint at just that term, but the highest total. Architecture B wins on total cost but is the slowest wall-clock. Architecture C is the sweet spot for most real workloads because it trades a little token cost for a lot of latency reduction.

**The lesson**: if your team only tracks term 1, architecture A looks cheap and architecture B looks wasteful. The other four terms completely invert the ranking.

---

## How to measure all five terms in production

Most teams cannot compute this equation because they do not log the right fields. Here is the minimum telemetry you need.

```
Per task, log:
  task_id
  happy_path_input_tokens
  happy_path_output_tokens
  actual_input_tokens        (sum across retries)
  actual_output_tokens       (sum across retries)
  retry_count
  wall_clock_ms
  time_to_first_token_ms
  tool_call_count
  tool_retry_count
  eval_replay_tokens         (if this task was replayed for eval)
  model_version              (for churn accounting)
```

With those fields, you can compute each term weekly:

- **C_tokens** = actual_input_tokens and actual_output_tokens priced at model_version rates
- **C_latency** = wall_clock_ms mapped to your per-minute GPU cost and your user abandonment curve
- **C_reliability** = (actual - happy_path) tokens priced the same as C_tokens
- **C_eval** = weekly eval_replay_tokens priced at eval model rates
- **C_churn** = engineering-weeks-on-migration / 12 / average_task_volume

Every team I have seen that instruments this way discovers that one of the non-token terms is bigger than they expected. Usually reliability, sometimes latency-driven retries.

---

## The counter-intuitive conclusion

If you optimize for token cost alone, you systematically pick the wrong architectures. You will prefer big-single-call designs over multi-agent chains. You will under-invest in eval. You will ignore latency until users complain. You will rebuild your agent from scratch every time a new model ships.

The architectures that win in 2026 optimize for **total cost per completed task**, which is token cost plus the four terms most teams ignore. Those architectures look more expensive on the surface. They are not.

---

## A research framework, not a recipe

I call this a research framework because the weights on the five terms change with your workload. A chat product weights token cost highest. An async agent weights reliability highest. A real-time voice product weights latency highest. A long-lived product weights churn highest.

What does not change is that if you only measure one term, you are optimizing blind. Instrument all five. Measure them per task. Put them on a dashboard your engineers see every day.

The cheapest agent per completed task is rarely the cheapest agent per model call. That distinction is worth understanding before you ship, not after the invoice arrives.

---

*The unit is cost per completed task, not cost per model call. Every architecture decision looks different when you switch denominators.*
