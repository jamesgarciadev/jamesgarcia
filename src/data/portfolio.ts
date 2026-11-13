export const profile = {
  name: "Jimmy James Garcia",
  role: "Senior Full-Stack Developer",
  tagline:
    "I build distributed systems end to end — TypeScript/Next.js frontends, Node, Go, Rails, and Python services, on AWS, Azure, and GCP.",
  location: "Mandaluyong, Philippines",
  email: "jamesgarciaph@gmail.com",
  github: "https://github.com/jamesgarciadev",
  linkedin: "https://www.linkedin.com/in/jamesgarciaph/",
  resumeUrl: "/resume.pdf",
};

export const about = {
  paragraphs: [
    "I've spent the last decade building software across the whole stack — TypeScript and Next.js on the front end, with Node.js, Laravel, Rails, Go, C#, and Python/FastAPI services behind it. Most of my work has been in distributed systems: designing GraphQL and gRPC APIs, keeping WebSockets connections healthy under load, and picking between PostgreSQL, MongoDB, and Redis for each job. I've shipped to AWS, Azure, and GCP, and I'm comfortable owning a system from schema design through production incidents.",
    "Lately my focus has been on LLM tooling — RAG pipelines, vector databases, and the plumbing that makes models useful in real products. Outside of work I run local model stacks with LM Studio and Ollama, experimenting with small models for code search, summarization, and offline workflows.",
  ],
};

export const skills = [
  { name: "TypeScript", level: 96 },
  { name: "Next.js/React", level: 94 },
  { name: "Node.js", level: 93 },
  { name: "Python/FastAPI", level: 88 },
  { name: "Go", level: 87 },
  { name: "Laravel", level: 90 },
  { name: "PostgreSQL", level: 92 },
  { name: "Redis", level: 86 },
  { name: "GraphQL/gRPC", level: 91 },
  { name: "AWS", level: 89 },
];

export const projects = [
  {
    title: "Esports Prediction System",
    description:
      "Schema-first GraphQL API (Laravel + Lighthouse) serving a web app, admin console, and mobile client. Betting engine with transactional row locking to prevent race conditions on wallet operations; real-time scores and odds pushed over WebSockets at sub-second latency to thousands of concurrent clients; multi-tier Redis caching in front of the PandaScore data pipeline; and a cash-out service computing live withdrawal values under shifting odds.",
    tags: ["Laravel", "GraphQL", "WebSockets", "Redis", "Next.js"],
    demoUrl: "#",
    repoUrl: "#",
  },
  {
    title: "Food Delivery System",
    description:
      "Real-time dispatch built on Go and Redis GEO/Streams, using gRPC bidirectional streaming for proximity matching and live GPS tracking. Multi-tenant Node.js/TypeScript backend with cache-aside Redis over PostgreSQL; a Flutter monorepo shipping customer, rider, and seller apps from one shared UI kit; HMAC-signed POS webhooks and a multi-currency payment engine; load-tested to p95 targets with k6.",
    tags: ["Go", "gRPC", "Node.js", "Flutter", "Redis"],
    demoUrl: "#",
    repoUrl: "#",
  },
  {
    title: "E-commerce Platform",
    description:
      "End-to-end checkout pipeline on Ruby on Rails integrating Stripe, managing complex payment state transitions and transaction atomicity. Asynchronous Sidekiq + Redis job architecture offloads transactional emails and inventory sync to background workers; Hotwire (Turbo/Stimulus) storefront with Tailwind delivers an SPA-like experience with minimal page reloads.",
    tags: ["Ruby on Rails", "Hotwire", "Stripe", "Redis"],
    demoUrl: "#",
    repoUrl: "#",
  },
];

export const socials = [
  { name: "GitHub", url: profile.github, icon: "github" as const },
  { name: "LinkedIn", url: profile.linkedin, icon: "linkedin" as const },
  { name: "Email", url: `mailto:${profile.email}`, icon: "mail" as const },
];
