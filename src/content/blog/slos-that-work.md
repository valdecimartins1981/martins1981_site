---
title: "SLOs That Actually Work: A Practical Guide"
description: "Most teams set SLOs wrong. They pick percentages from thin air, define them around metrics they already measure, and then wonder why the SLO doesn't actually tell them anything about the user experience."
pubDate: 2026-01-05
category: "SRE"
readTime: 11
author:
  name: "Valdeci Martins"
  role: "Senior SRE Engineer"
  bio: "Valdeci has spent over a decade keeping production systems alive. He writes about on-call culture, reliability engineering, and the human side of distributed systems."
tags: ["slo", "sli", "sre", "reliability", "observability"]
---

## The SLO Problem

Service Level Objectives are one of the most powerful tools in the SRE toolkit. They're also one of the most commonly implemented wrong.

The typical pattern goes like this: someone reads the Google SRE book, gets excited, and decides the team needs SLOs. They look at their existing dashboards, find the metric that's already being graphed (CPU, memory, perhaps p99 latency), and declare "our SLO is 99.9% uptime, defined as mean CPU below 80%."

Then they forget about it.

> An SLO that doesn't change behavior isn't an SLO. It's a number in a doc that makes you feel like you've done SRE.

The problem usually isn't motivation or ambition. It's that the SLO isn't measuring the right thing, defined in the right way, connected to the right decisions.

---

## Start With the User, Not the Metrics

Before you open Prometheus or look at a dashboard, answer this question: *What does it feel like for a user when your service is working correctly?*

For a payment API, working correctly means:
- A payment request submitted returns a success or meaningful error within 3 seconds
- The response accurately reflects whether the payment was processed

For a search service:
- A search query returns relevant results within 1 second
- The results are complete (no silent partial failures)

These user-centric descriptions are your Service Level Indicators (SLIs). Everything flows from them.

---

## Defining Good SLIs

The canonical SLI framework comes from the Google SRE Workbook, and it's worth using:

**Request-based SLIs** (for most services):
```
SLI = good events / total events

Where "good event" is defined by:
- Latency: request completed in < threshold
- Availability: request completed without error
- Quality: request completed with correct results
```

**Window-based SLIs** (for batch or streaming):
```
SLI = time service was in good state / total time

Where "good state" is defined by:
- Freshness: data is less than N minutes old
- Coverage: at least X% of expected data is present
- Throughput: processing rate > threshold
```

### Example: Payment API SLI Definition

```yaml
# SLI: Payment Success Rate
# Numerator: HTTP 2xx responses with latency < 3000ms
# Denominator: All non-health-check requests to /api/payments/*
# Measured over: 28-day rolling window

sli:
  name: payment_success_rate
  description: |
    Ratio of payment requests that complete successfully within 3 seconds.
    Excludes: health check endpoints, admin endpoints, requests from
    synthetic monitors.

  # Prometheus query
  numerator: |
    sum(rate(http_requests_total{
      service="payment-api",
      endpoint!~"/health|/metrics|/admin/.*",
      status_code=~"2..",
      duration_ms<3000
    }[28d]))

  denominator: |
    sum(rate(http_requests_total{
      service="payment-api",
      endpoint!~"/health|/metrics|/admin/.*"
    }[28d]))
```

The exclusions matter. Including health checks in your error rate produces a misleadingly good number. Including synthetic monitor traffic produces a misleadingly bad one.

---

## The Error Budget: Where SLOs Get Real

An error budget is what makes SLOs useful rather than decorative.

```
Error Budget = 1 - SLO target

For 99.9% SLO over 28 days (40,320 minutes):
Error Budget = 0.1% × 40,320 = 40.32 minutes of "bad" time
```

The error budget is the amount of unreliability you can afford to burn before you've violated your SLO. It creates a direct relationship between:
- How fast you can release (each release burns error budget through deployment risk)
- How reliable the service is (incidents burn error budget)
- How ambitious your feature roadmap is

> The error budget is the negotiating currency between product and engineering. When it's full, you can take risks. When it's depleted, reliability work becomes the only work. This is the insight that makes SLOs transformative rather than decorative.

---

## Setting the Right Targets

This is where most teams go wrong. They either:
1. Set impossibly high targets (99.999%) that they immediately start ignoring
2. Set targets based on current performance ("we're at 99.7%, let's make that the SLO")
3. Copy targets from a competitor or the Google SRE book without thinking about their context

The right approach is to ask: **what level of reliability do our users actually need?**

For most B2B SaaS applications, this translates to something like:
- Core user-facing features: 99.9% (43.8 min/month downtime)
- Background processing: 99.5% (3.65 hr/month)
- Analytics/reporting: 99% (7.3 hr/month)

Then check: can you actually *measure* that? If your current measurement gives you 1-minute resolution, you can't detect and respond to failures that last less than 5 minutes. Your SLO target needs to account for your detection and response capabilities.

### A Practical Target-Setting Process

```bash
# Step 1: Measure your current baseline
# What's your actual reliability over the last 90 days?

# Step 2: Identify your pain points
# Where did you have incidents? What's the user-visible impact?

# Step 3: Set a target that represents meaningful improvement
# If you're at 99.5%, target 99.7% — not 99.99%
# Improvement should be achievable within 2 quarters

# Step 4: Define your alerting thresholds
# Alert when error budget is:
# - 50% consumed in 1/4 of the window → "watch carefully"
# - 75% consumed in 1/3 of the window → "freeze new features"
# - 95% consumed → "reliability emergency"
```

---

## Multi-Window, Multi-Burn-Rate Alerting

The standard "alert when SLO is violated" approach has a fundamental problem: by the time you've violated your SLO, it's too late. The error budget is gone.

The solution is multi-window, multi-burn-rate alerting — alerting when you're consuming your error budget faster than sustainable, rather than after you've consumed it.

```yaml
# Burn rate: how fast you're consuming error budget
# 1x burn rate = consuming budget at exactly the rate that would exhaust it
# at end of window
# 14.4x burn rate = consuming in 2 hours what should last 28 days

groups:
- name: payment_api_slo_alerts
  rules:

  # Fast burn — critical, page immediately
  - alert: PaymentAPIHighBurnRate
    expr: |
      (
        sum(rate(payment_errors_total[1h])) / sum(rate(payment_requests_total[1h]))
        > 14.4 * (1 - 0.999)
      )
      and
      (
        sum(rate(payment_errors_total[5m])) / sum(rate(payment_requests_total[5m]))
        > 14.4 * (1 - 0.999)
      )
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "Payment API burning error budget 14.4x faster than sustainable"
      description: "At this rate, the monthly error budget will be exhausted in ~2 hours"
      runbook: "https://wiki.internal/runbooks/payment-slo-burn"

  # Slow burn — warning, investigate during business hours
  - alert: PaymentAPISlowBurnRate
    expr: |
      sum(rate(payment_errors_total[6h])) / sum(rate(payment_requests_total[6h]))
      > 6 * (1 - 0.999)
    for: 60m
    labels:
      severity: warning
    annotations:
      summary: "Payment API burning error budget at 6x sustainable rate"
      description: "The monthly error budget will be exhausted in ~5 days"
```

---

## Making SLOs Drive Decisions

An SLO only has value if it changes behavior. Concretely:

**When error budget is healthy (> 50% remaining):**
- Ship features aggressively
- Run load tests in production
- Try experimental deployments
- Tackle technical debt

**When error budget is at risk (25-50% remaining):**
- Slow feature work
- No risky deployments
- Start reliability work
- Increase deployment testing

**When error budget is depleted (< 10% remaining):**
- Freeze feature releases
- All hands on reliability
- Incident review with leadership
- No changes that increase risk

> This is the mechanism that makes SLOs transformative. When the error budget runs out, it's not one engineer's problem — it's the team's problem. Product stops requesting features. Engineering stops shipping them. The organization's attention turns to reliability. Together.

The SLO is not a metric. It's an agreement — between engineering and the business — about what level of reliability is acceptable and what the consequences are of falling below it.

Write it that way.
