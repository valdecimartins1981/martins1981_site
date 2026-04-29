---
title: "Kubernetes for Platform Engineers: Beyond the Basics"
description: "You've deployed pods and written Deployments. Now what? This is the guide for the engineers building platforms on top of Kubernetes — not just running workloads on it."
pubDate: 2026-01-15
category: "Platform"
readTime: 12
author:
  name: "Valdeci Martins"
  role: "Senior SRE Engineer"
  bio: "Valdeci has spent over a decade keeping production systems alive. He writes about on-call culture, reliability engineering, and the human side of distributed systems."
tags: ["kubernetes", "platform-engineering", "k8s", "operators", "helm"]
---

## The Distinction That Matters

There's a meaningful difference between a developer *using* Kubernetes and an engineer *building platforms on top of* Kubernetes. The first group needs to understand Pods, Services, and Deployments. The second group needs to understand admission webhooks, custom controllers, cluster autoscaling economics, and how to build abstractions that make the first group's lives better.

> Platform engineering is the discipline of building and maintaining internal developer platforms — the golden paths that abstract away infrastructure complexity so product engineers can focus on product. Kubernetes is often the substrate, but it's never the destination.

This guide is for the second group.

---

## Building Internal Developer Platforms on Kubernetes

### The Abstraction Problem

Raw Kubernetes is intimidating for most application developers. A simple web service requires a Deployment, a Service, possibly an Ingress, ConfigMaps, Secrets, PodDisruptionBudgets, HorizontalPodAutoscalers, and NetworkPolicies. That's a lot of YAML for a team that just wants to ship features.

Your job as a platform engineer is to create abstractions that hide this complexity while preserving the flexibility that makes Kubernetes powerful.

```yaml
# What your developers should write:
apiVersion: platform.martins1981.dev/v1alpha1
kind: WebService
metadata:
  name: payment-api
  namespace: payments
spec:
  image: payment-api:v2.1.0
  replicas: 3
  port: 8080
  resources:
    tier: standard  # maps to preset CPU/memory limits
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 10
  ingress:
    hostname: payments.internal.example.com
```

```yaml
# What that generates under the hood (simplified):
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-api
  labels:
    app: payment-api
    platform.martins1981.dev/managed: "true"
spec:
  replicas: 3
  selector:
    matchLabels:
      app: payment-api
  template:
    metadata:
      labels:
        app: payment-api
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
    spec:
      securityContext:
        runAsNonRoot: true
        seccompProfile:
          type: RuntimeDefault
      containers:
      - name: payment-api
        image: payment-api:v2.1.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
        readinessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 15
          periodSeconds: 20
```

The developer describes *what* they want. The platform decides *how* to implement it safely.

---

## Operators: The Right Tool for Stateful Complexity

Kubernetes operators are the mechanism for encoding operational knowledge into code. An operator watches custom resources and reconciles the actual state of the cluster to match the desired state.

### When to Write an Operator

Write an operator when:
- You have stateful workloads with complex lifecycle management (databases, message queues, caches)
- You need to automate operational tasks that can't be captured in a simple Helm chart
- You want to enforce organizational policies as code

Don't write an operator when:
- A Helm chart + some scripts would do the job
- You're solving a problem that already has a mature operator in the community (check [OperatorHub.io](https://operatorhub.io) first)

### The Reconciliation Pattern

```go
// The core reconciliation loop pattern
func (r *WebServiceReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    log := log.FromContext(ctx)

    // Fetch the WebService instance
    webService := &platformv1alpha1.WebService{}
    if err := r.Get(ctx, req.NamespacedName, webService); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)
    }

    // Reconcile the Deployment
    if err := r.reconcileDeployment(ctx, webService); err != nil {
        log.Error(err, "Failed to reconcile Deployment")
        return ctrl.Result{RequeueAfter: time.Minute}, err
    }

    // Reconcile the Service
    if err := r.reconcileService(ctx, webService); err != nil {
        log.Error(err, "Failed to reconcile Service")
        return ctrl.Result{RequeueAfter: time.Minute}, err
    }

    // Update status
    webService.Status.Ready = true
    if err := r.Status().Update(ctx, webService); err != nil {
        return ctrl.Result{}, err
    }

    return ctrl.Result{}, nil
}
```

The key insight: operators don't *do* things once. They continuously *reconcile* — bringing the world to the desired state, over and over, idempotently. This is fundamentally different from imperative scripts.

---

## Admission Webhooks: Policy as Code

Admission webhooks are interceptors that sit in the path of every API server request. They can validate (reject requests that violate policy) or mutate (modify requests to add defaults or enforce standards).

> I think of admission webhooks as the bouncer at the club door and the valet parking attendant at the same time. One checks your credentials. The other makes sure your car doesn't block the exit.

### Validating Webhook Example

```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingWebhookConfiguration
metadata:
  name: platform-policies
webhooks:
- name: require-resource-limits.platform.martins1981.dev
  rules:
  - apiGroups: ["apps"]
    apiVersions: ["v1"]
    operations: ["CREATE", "UPDATE"]
    resources: ["deployments"]
  clientConfig:
    service:
      name: platform-webhook
      namespace: platform-system
      path: /validate-resource-limits
  admissionReviewVersions: ["v1"]
  sideEffects: None
  failurePolicy: Fail
```

```bash
# Testing your webhook locally with a real cluster (port-forward trick):
kubectl port-forward -n platform-system svc/platform-webhook 8443:443 &

# Then create a test deployment without resource limits and watch the rejection:
kubectl apply -f test-no-limits.yaml
# Error: admission webhook denied the request:
# containers must have resource limits defined
```

---

## Cluster Autoscaling: The Economics

Cluster autoscaling is one of those features that sounds simple ("automatically add nodes when pods can't schedule") but has deep implications for cost and reliability when you get it wrong.

### The Key Settings That Matter

```yaml
# cluster-autoscaler ConfigMap key settings:
scale-down-utilization-threshold: "0.5"  # Remove nodes below 50% utilization
scale-down-delay-after-add: "10m"        # Wait 10 min after adding a node to scale down
scale-down-unneeded-time: "10m"          # Node must be unneeded for 10 min before removal
max-node-provision-time: "15m"           # Fail if node doesn't become ready in 15 min
```

The `scale-down-utilization-threshold` is the one that will keep you up at night if you set it wrong. Too high: you're paying for underutilized nodes. Too low: pods get evicted during scale-down, causing latency spikes during your peak traffic period.

### Pod Disruption Budgets are Non-Negotiable

Without PodDisruptionBudgets, the cluster autoscaler can evict all your replicas simultaneously when scaling down a node. This is how you get a 100% outage from a cost-optimization feature.

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: payment-api-pdb
spec:
  minAvailable: 2  # Always keep at least 2 replicas running
  selector:
    matchLabels:
      app: payment-api
```

---

## The Platform Contract

The most important thing you can build as a platform engineer isn't a tool or an abstraction. It's a contract with your developers — a clear agreement about what the platform handles and what developers are responsible for.

Your platform should handle:
- Security defaults (non-root containers, read-only root filesystems, network policies)
- Observability plumbing (metrics scraping, log aggregation, distributed tracing)
- Resource optimization (vertical pod autoscaling recommendations, node bin-packing)
- Disaster recovery tooling (backup, restore, runbooks)

Developers should own:
- Application health checks (liveness, readiness, startup probes)
- Application-level SLOs and alerting
- Graceful shutdown handling
- Service dependencies and circuit breakers

> The best platform teams I've worked with treat their developers as customers. They run office hours. They collect feedback. They have a roadmap. And when something on the platform breaks developer workflows, they treat it with the same urgency as a production outage — because it is one.

---

## What to Read Next

Platform engineering is a rapidly evolving discipline. The CNCF's Platform Engineering Maturity Model is a useful framework for understanding where your platform sits. Team Topologies by Matthew Skelton and Manuel Pais provides the organizational theory. And the Kubernetes Enhancement Proposals (KEPs) on [github.com/kubernetes/enhancements](https://github.com/kubernetes/enhancements) give you insight into where the platform is heading.

Build the platform that makes your developers faster. Everything else follows.
