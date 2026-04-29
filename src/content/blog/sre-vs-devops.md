---
title: "SRE vs DevOps: They're Not the Same Job"
description: "After years of watching teams conflate these two disciplines, it's time to draw clear lines. SRE and DevOps share values but diverge sharply in practice, tooling, and organizational structure."
pubDate: 2024-01-22
category: "Culture"
readTime: 7
author:
  name: "Valdeci Martins"
  role: "Senior SRE Engineer"
  bio: "Valdeci has spent over a decade keeping production systems alive. He writes about on-call culture, reliability engineering, and the human side of distributed systems."
tags: ["sre", "devops", "reliability", "culture"]
---

Se você trabalha com infraestrutura ou desenvolvimento, certamente já ouviu falar de **DevOps** e **SRE** (Site Reliability Engineering). Embora sejam conceitos relacionados, eles têm origens, focos e abordagens distintas.

## O que é SRE?

**Site Reliability Engineering (SRE)** foi criado pelo Google em 2003 por Ben Treynor Sloss. A ideia central é: *"O que acontece quando um engenheiro de software projeta uma função de operações?"*

SRE aplica princípios de engenharia de software a problemas de infraestrutura e operações.

### Conceitos Chave do SRE

- **SLI (Service Level Indicator)** — Métricas que medem a confiabilidade
- **SLO (Service Level Objective)** — Metas de confiabilidade
- **SLA (Service Level Agreement)** — Acordos contratuais
- **Error Budget** — Margem de erros permitida
- **Toil** — Trabalho manual e repetitivo a ser eliminado

## Comparação: SRE vs DevOps

| Aspecto | DevOps | SRE |
|---------|--------|-----|
| Origem | Indústria | Google |
| Foco | Colaboração & velocidade | Confiabilidade |
| Abordagem | Cultural | Engenharia |
| Métricas | Deploy frequency | SLO/SLI/SLA |
| Error Budget | Não definido | Central |

## Como se Complementam

DevOps e SRE não são opostos — são complementares:

- **DevOps** define a filosofia e cultura de colaboração
- **SRE** é uma implementação prescritiva dessa filosofia

Como diz o livro do Google SRE: *"SRE is what you get when you treat operations as if it's a software problem."*

## Quando Usar Cada Abordagem

- **DevOps**: quando o foco é velocidade de entrega e colaboração
- **SRE**: quando a confiabilidade e uptime são críticos (ex: fintech, saúde)
- **Ambos**: a maioria das organizações maduras usa os dois

## Conclusão

A verdade é que SRE e DevOps coexistem harmoniosamente. Enquanto DevOps promove a cultura de colaboração, SRE fornece as ferramentas e métricas para garantir que os sistemas sejam confiáveis.
