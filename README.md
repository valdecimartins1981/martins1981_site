# DevOps & SRE Blog

Blog sobre Tecnologia, DevOps e SRE — conteúdo técnico de qualidade para profissionais de tecnologia.

## 🚀 Stack

- **Framework:** [Astro](https://astro.build) v4+
- **CSS:** [TailwindCSS](https://tailwindcss.com) v3
- **Fonte:** [Raleway](https://fonts.google.com/specimen/Raleway) (Google Fonts)
- **Linguagem:** TypeScript
- **Content:** Astro Content Collections (Markdown)

## 🏗️ Estrutura do Projeto

```
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Header.astro         # Header fixo com nav + hamburger
│   │   ├── Footer.astro         # Footer com links e redes sociais
│   │   ├── HeroSection.astro    # Hero com CTAs
│   │   ├── CategoryCard.astro   # Card de categoria
│   │   ├── PostCard.astro       # Card de post
│   │   └── Newsletter.astro     # Seção de newsletter
│   ├── layouts/
│   │   ├── BaseLayout.astro     # Layout base com Header/Footer
│   │   └── PostLayout.astro     # Layout para posts do blog
│   ├── pages/
│   │   ├── index.astro          # Página inicial
│   │   ├── blog/
│   │   │   ├── index.astro      # Listagem de posts
│   │   │   └── [slug].astro     # Post individual
│   │   ├── devops/
│   │   │   └── index.astro      # Categoria DevOps
│   │   ├── sre/
│   │   │   └── index.astro      # Categoria SRE
│   │   └── sobre.astro          # Página sobre
│   ├── content/
│   │   ├── config.ts            # Configuração das collections
│   │   └── blog/                # Posts em Markdown
│   └── styles/
│       └── global.css           # Estilos globais + Raleway import
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
└── package.json
```

## 🖥️ Como Rodar Localmente

```bash
# Instalar dependências
npm install

# Rodar em modo de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

O site estará disponível em `http://localhost:4321`.

## ✍️ Como Criar um Novo Post

Crie um arquivo `.md` em `src/content/blog/` com o seguinte frontmatter:

```markdown
---
title: "Título do Post"
description: "Descrição curta para SEO e listagens"
pubDate: 2024-02-01
category: "DevOps"  # DevOps | SRE | Kubernetes | Cloud | Linux | Automação
image: "/images/minha-imagem.jpg"  # opcional
author: "Seu Nome"
tags: ["tag1", "tag2"]
---

Conteúdo do post em Markdown...
```

O post será automaticamente disponibilizado em `/blog/nome-do-arquivo`.

## 🎨 Design

- **Paleta:** Fundo escuro `#0f172a` com acentos azul `#3b82f6` / ciano `#06b6d4`
- **Tipografia:** Raleway (Google Fonts) para títulos e corpo
- **Responsivo:** Mobile-first com breakpoints Tailwind

## 📝 Licença

MIT
Este é o meu site
