export const profile = {
  name: "Your Name",
  role: "Frontend Developer",
  tagline:
    "I build fast, accessible, and delightful web experiences with React and TypeScript.",
  location: "San Francisco, CA",
  email: "you@example.com",
  github: "https://github.com/yourusername",
  linkedin: "https://linkedin.com/in/yourusername",
  resumeUrl: "/resume.pdf",
};

export const about = {
  paragraphs: [
    "I'm a frontend developer with a passion for crafting polished user interfaces. I specialize in React, TypeScript, and modern CSS, turning complex problems into simple, elegant solutions.",
    "When I'm not coding, you'll find me exploring new coffee shops, contributing to open source, or working on side projects that scratch an itch.",
  ],
};

export const skills = [
  { name: "React", level: 95 },
  { name: "TypeScript", level: 90 },
  { name: "Next.js", level: 88 },
  { name: "Tailwind CSS", level: 92 },
  { name: "Node.js", level: 75 },
  { name: "GraphQL", level: 70 },
];

export const projects = [
  {
    title: "Project One",
    description:
      "A full-stack web application that helps teams collaborate in real time. Built with Next.js, WebSockets, and PostgreSQL.",
    tags: ["Next.js", "TypeScript", "PostgreSQL"],
    demoUrl: "#",
    repoUrl: "#",
  },
  {
    title: "Project Two",
    description:
      "An open-source component library with 50+ accessible, themeable UI components. Used by 200+ projects on GitHub.",
    tags: ["React", "TypeScript", "Storybook"],
    demoUrl: "#",
    repoUrl: "#",
  },
  {
    title: "Project Three",
    description:
      "A personal finance dashboard with interactive charts, budget tracking, and CSV import. Fully responsive PWA.",
    tags: ["React", "Recharts", "PWA"],
    demoUrl: "#",
    repoUrl: "#",
  },
];

export const socials = [
  { name: "GitHub", url: profile.github, icon: "github" as const },
  { name: "LinkedIn", url: profile.linkedin, icon: "linkedin" as const },
  { name: "Email", url: `mailto:${profile.email}`, icon: "mail" as const },
];
