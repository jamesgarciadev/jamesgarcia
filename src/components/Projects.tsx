import { ExternalLink } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import SectionHeading from "./SectionHeading";
import { projects } from "@/data/portfolio";

export default function Projects() {
  return (
    <section id="projects" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-24">
      <SectionHeading index="03" title="Projects" />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <article
            key={project.title}
            className="group flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10"
          >
            <div className="mb-4 flex items-center justify-between">
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.title} repository`}
                className="text-zinc-500 transition-colors hover:text-emerald-400"
              >
                <FaGithub size={22} />
              </a>
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.title} live demo`}
                className="text-zinc-500 transition-colors hover:text-emerald-400"
              >
                <ExternalLink size={22} />
              </a>
            </div>

            <h3 className="mb-2 text-xl font-semibold text-zinc-100 transition-colors group-hover:text-emerald-400">
              {project.title}
            </h3>
            <p className="flex-1 text-sm leading-relaxed text-zinc-400">
              {project.description}
            </p>

            <ul className="mt-5 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-zinc-800 px-3 py-1 font-mono text-xs text-emerald-400"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <p className="mt-12 text-center">
        <a
          href="#contact"
          className="font-medium text-emerald-400 transition-colors hover:text-emerald-300"
        >
          Want to see more? Let&apos;s talk →
        </a>
      </p>
    </section>
  );
}
