---
title: "Why Your On-Call Rotation Is Burning Out Your Best Engineers"
description: "The engineers who care the most about your systems are often the ones most likely to leave because of a broken on-call culture. Here's how to fix it before it costs you everything."
pubDate: 2026-01-20
category: "Culture"
readTime: 9
author:
  name: "Valdeci Martins"
  role: "Senior SRE Engineer"
  bio: "Valdeci has spent over a decade keeping production systems alive — and the engineers who run them sane. He writes about on-call culture, reliability engineering, and the human side of distributed systems."
tags: ["on-call", "burnout", "sre", "culture", "incident-management"]
---

## The Problem Nobody Wants to Talk About

Your best engineers are leaving. Not for better salaries. Not for flashier tech stacks. They're leaving because your on-call rotation is slowly destroying them, and nobody in leadership is willing to look at the data.

> The engineers who care most deeply about system reliability are the ones who feel every page as a personal failure. They respond at 3am not because they have to, but because they *need* to. And that same conscientiousness that makes them great is exactly what will burn them out.

This isn't hyperbole. According to Google's own SRE practices documentation, sustainable on-call requires that engineers spend **no more than 25% of their time on operational work** — including on-call response. When that number climbs higher, you're not running operations, you're running an attrition machine.

---

## What Broken On-Call Looks Like

Before we talk about solutions, let's diagnose the disease. Broken on-call has a distinct pattern:

### Alert Fatigue

When your monitoring system pages you 47 times in a night and 40 of those alerts resolve themselves, you've built a system that trains engineers to ignore alerts. The ones who don't burn out start developing a dangerous intuition: *this one's probably fine too*.

```yaml
# Example of an alert that creates fatigue:
- alert: HighMemoryUsage
  expr: node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes < 0.20
  for: 1m  # 1 minute threshold - fires constantly
  labels:
    severity: critical  # Everything is "critical"
  annotations:
    summary: "Memory above 80%"
    # No runbook. No context. Just panic.
```

Compare that to an alert with real signal:

```yaml
# An alert worth waking someone up for:
- alert: MemoryPressureSustained
  expr: |
    (
      node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes < 0.10
      and
      rate(node_memory_pgmajfault_total[5m]) > 10
    )
  for: 10m
  labels:
    severity: page
  annotations:
    summary: "Critical memory pressure with major page faults"
    description: "Node {{ $labels.instance }} has less than 10% available memory AND is experiencing sustained major page faults. System is actively swapping. Immediate action required."
    runbook: "https://wiki.internal/runbooks/memory-pressure"
```

The difference isn't just technical. It's the difference between training engineers to be skeptical of alerts vs. training them to trust the system.

### The Expertise Trap

When your on-call rotation only works because one person *deeply* understands the system, you don't have a rotation — you have a single point of failure with a human face. And that human is carrying the weight of your entire production environment on their shoulders.

> I've seen engineers take their laptops on vacation, check monitoring dashboards from their phones during dinner, and preemptively fix problems before they go to sleep. This isn't dedication. It's a system design failure.

### Response Without Resolution

The most demoralizing form of on-call is responding to the same incident over and over. You fix the symptom at 2am, write a ticket for the root cause, and then the ticket sits in the backlog for six months while the same alert fires every Tuesday at 3am like clockwork.

---

## How to Measure On-Call Health

You can't fix what you don't measure. Start tracking these metrics:

| Metric | Target | Red Flag |
|--------|--------|----------|
| Pages per on-call shift | < 2 actionable | > 5 total |
| Percentage of alerts that required action | > 80% | < 50% |
| Mean time between incidents | Trending up | Trending down |
| Time to resolution (P95) | < 30 min | > 60 min |
| Engineer sentiment score (weekly survey) | > 7/10 | < 6/10 |

That last one matters more than most engineering managers want to admit. A quarterly survey is too slow. By the time the data shows decline, you've already lost two engineers.

---

## The Fix: Sustainable On-Call Design

### 1. Define "Actionable" Ruthlessly

Every alert should answer three questions in its first line:
- What is broken?
- How do I verify it?
- What should I do first?

If an alert can't answer those questions, it shouldn't fire.

### 2. Implement Alert Ownership

Every alert should have an owner — a team responsible for its signal quality. Alerts without owners get silenced; owners without accountability create noise.

```bash
# A simple script to audit alerts without runbooks:
kubectl get prometheusrule -A -o json | \
  jq -r '.items[].spec.groups[].rules[] |
    select(.alert != null) |
    select(.annotations.runbook == null) |
    [.alert, "MISSING RUNBOOK"] |
    @tsv'
```

### 3. Establish Toil Budgets

Track the time your engineers spend on operational work (toil) each week. When any engineer exceeds 25% of their time on toil, stop new feature work and fix the root cause. This isn't punitive — it's a forcing function.

### 4. Make Postmortems Drive Backlog Priority

An incident postmortem that doesn't create action items is a ceremony. An action item that doesn't get prioritized is a lie.

The engineering manager's job is to make sure postmortem action items compete equally with feature work for backlog priority. If reliability work always loses to feature work, you're building technical debt denominated in human suffering.

> The best on-call rotations I've seen have one thing in common: the engineers on rotation actively try to make themselves unnecessary. They automate runbooks, improve alerts, and fix root causes. That's the culture you're trying to build.

---

## A Note on Culture

All the tooling and process in the world won't fix an on-call culture problem if leadership treats production incidents as failures of individuals rather than failures of systems. When an engineer is blamed for an outage, you've created an incentive to hide problems rather than surface them.

Your on-call rotation is a feedback mechanism. When it works, it surfaces the fragility in your systems and gives you the information you need to make them better. When it's broken, it surfaces that fragility in your engineers — and they leave.

The question isn't whether you can afford to fix your on-call rotation. The question is whether you can afford not to.
