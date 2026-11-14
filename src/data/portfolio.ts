export const profile = {
  name: "Jimmy James Garcia",
  role: "Senior Full-Stack Developer",
  tagline:
    "I build distributed systems end to end — TypeScript/Next.js frontends backed by .NET, Node, Go, Rails, or Python services, with real-time APIs over GraphQL, gRPC, and WebSockets on AWS, Azure, and GCP.",
  location: "Mandaluyong, Philippines",
  email: "jamesgarciaph@gmail.com",
  github: "https://github.com/jamesgarciadev",
  linkedin: "https://www.linkedin.com/in/jamesgarciaph/",
  resumeUrl: "/resume.pdf",
};

export const about = {
  paragraphs: [
    "I've spent the last decade building software across the whole stack — TypeScript and Next.js on the front end, with Node.js, Laravel, Rails, Go, C#/.NET, and Python/FastAPI services behind it. Most of my work has been in distributed systems: designing GraphQL and gRPC APIs, keeping WebSockets connections healthy under load, and picking between PostgreSQL, MongoDB, and Redis for each job. I've shipped to AWS, Azure, and GCP, and I'm comfortable owning a system from schema design through production incidents.",
    "Lately my focus has been on LLM tooling — RAG pipelines, vector databases, and the plumbing that makes models useful in real products. Outside of work I run local model stacks with LM Studio and Ollama, experimenting with small models for code search, summarization, and offline workflows.",
  ],
};

export interface Experience {
  company: string;
  role: string;
  period: string;
  location: string;
  summary: string;
  tags?: string[];
}

export const experience: Experience[] = [
  {
    company: "GrooveStudios / Gilder",
    role: "Fullstack Developer",
    period: "Jun 2025 — Jun 2026",
    location: "Remote (USA)",
    summary:
      "Architected and built full-stack web and iOS applications with AI at the core — RAG systems on vector databases for semantic search and knowledge management, high-performance backend APIs, and serverless AWS infrastructure.",
    tags: [
      "Next.js",
      "Swift / iOS",
      "FastAPI",
      "RAG / Vector DBs",
      "AWS Lambda & Fargate",
    ],
  },
  {
    company: "One-off Asia Solution",
    role: "Web Developer",
    period: "Nov 2024 — May 2025",
    location: "BGC, Taguig City · Project-based / on-site",
    summary:
      "Designed and developed web applications for clients in the industrial automation market, customizing UIs for SCADA/PLC environments alongside cross-functional teams.",
    tags: ["Angular", "SCADA", "Ignition", "Oracle"],
  },
  {
    company: "D-Bit / Microsourcing",
    role: "Fullstack Developer",
    period: "Jan 2024 — Jun 2024",
    location: "Pasay City · WFH",
    summary:
      "C# development and support at a payroll company — end-to-end data integrity from backend to frontend, plus SQL integration scripts migrating legacy data into new schemas.",
    tags: ["C#", ".NET", "SQL Server"],
  },
  {
    company: "LCS Group of Companies",
    role: "Project Manager / Programmer",
    period: "Nov 2022 — Apr 2023",
    location: "Mandaluyong City · Hybrid",
    summary:
      "Drove a casino and crypto trading app across both IT and business sides — DevOps, systems analysis, QA, and full-stack development, steering projects end to end.",
    tags: ["Next.js", "Go", "Python", "GCP", "Firebase"],
  },
  {
    company: "Geco Asia",
    role: "SharePoint Admin / Microsoft Cloud Solutions",
    period: "Oct 2021 — Jun 2022",
    location: "Singapore",
    summary:
      "Planned, designed and executed enterprise projects as a SharePoint admin, validating test cases against client requirements alongside senior management.",
    tags: ["SPFx", "Power Platform", "AngularJS"],
  },
  {
    company: "Functional Inc",
    role: "C# Programmer / Client Presenter",
    period: "Jan 2020 — Oct 2021",
    location: "Makati City",
    summary:
      "Scaled an existing banking Web API and cryptography work, presenting delivery progress to clients across the SDLC.",
    tags: ["C#", "ASP.NET", "SQL Server", "Azure"],
  },
  {
    company: "Archetype Party Concepts",
    role: "Family Business · Freelance",
    period: "2017 — Aug 2019",
    location: "Mandaluyong City",
    summary:
      "Career break running the family business, while taking light freelance projects from UI/UX through frontend implementation.",
  },
  {
    company: "Golaspico Projects",
    role: "Full Stack Developer / Client Manager",
    period: "Nov 2013 — Oct 2016",
    location: "Mandaluyong City",
    summary:
      "Web development, HRIS systems and Unity game work for university clients; owned client relationships from requirements to delivery.",
    tags: ["C#", "Unity", "PHP", "MySQL"],
  },
];

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
