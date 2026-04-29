---
title: "Kubernetes para Iniciantes: Primeiros Passos com K8s"
description: "Aprenda os conceitos fundamentais do Kubernetes, como instalar um cluster local e fazer seu primeiro deploy de uma aplicação containerizada."
pubDate: 2024-01-29
category: "Kubernetes"
image: "/images/kubernetes.jpg"
author: "Valdeci Martins"
tags: ["kubernetes", "k8s", "containers", "docker", "cloud-native"]
---

# Kubernetes para Iniciantes: Primeiros Passos com K8s

**Kubernetes** (ou K8s) é a plataforma de orquestração de containers mais popular do mundo. Desenvolvido originalmente pelo Google e hoje mantido pela CNCF (Cloud Native Computing Foundation), o Kubernetes automatiza o deployment, scaling e gerenciamento de aplicações containerizadas.

## Por que Kubernetes?

Antes do Kubernetes, gerenciar containers em produção era um desafio:
- Como escalar automaticamente?
- Como garantir alta disponibilidade?
- Como fazer rolling updates sem downtime?
- Como gerenciar configurações e secrets?

O Kubernetes resolve todos esses problemas.

## Conceitos Fundamentais

### Pod
A menor unidade deployável no Kubernetes. Um Pod pode conter um ou mais containers que compartilham rede e armazenamento.

### Node
Uma máquina física ou virtual que executa Pods. Pode ser um **Master Node** (control plane) ou **Worker Node**.

### Cluster
Conjunto de Nodes gerenciados pelo Kubernetes.

### Deployment
Recurso que gerencia a criação e atualização de Pods de forma declarativa.

### Service
Abstração que expõe um conjunto de Pods como um serviço de rede.

## Instalando um Cluster Local

### Opção 1: Minikube
```bash
# Instalar Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Iniciar cluster
minikube start
```

### Opção 2: Kind (Kubernetes in Docker)
```bash
# Instalar Kind
go install sigs.k8s.io/kind@v0.20.0

# Criar cluster
kind create cluster --name meu-cluster
```

## Seu Primeiro Deploy

### 1. Criar um Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.21
        ports:
        - containerPort: 80
```

### 2. Aplicar o Manifesto
```bash
kubectl apply -f deployment.yaml
```

### 3. Verificar o Status
```bash
kubectl get pods
kubectl get deployments
```

### 4. Expor como Service
```bash
kubectl expose deployment nginx-deployment --type=NodePort --port=80
kubectl get services
```

## Comandos Essenciais do kubectl

| Comando | Descrição |
|---------|-----------|
| `kubectl get pods` | Lista todos os pods |
| `kubectl describe pod <name>` | Detalhes de um pod |
| `kubectl logs <pod>` | Logs de um pod |
| `kubectl exec -it <pod> -- bash` | Acessa o container |
| `kubectl apply -f file.yaml` | Aplica manifesto |
| `kubectl delete -f file.yaml` | Remove recursos |

## Conclusão

Kubernetes tem uma curva de aprendizado íngreme, mas os benefícios são imensos. Comece com um cluster local (Minikube ou Kind), experimente os recursos básicos e gradualmente avance para tópicos mais avançados como Helm, Ingress Controllers e GitOps.
