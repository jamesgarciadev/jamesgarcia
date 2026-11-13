import SectionHeading from "./SectionHeading";
import { experience } from "@/data/portfolio";

export default function Experience() {
  return (
    <section id="experience" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-24">
      <SectionHeading index="02" title="Experience" />

      <ol className="relative space-y-12 border-l border-zinc-800 pl-8 sm:pl-10">
        {experience.map((job) => (
          <li key={`${job.company}-${job.period}`} className="relative">
            <span
              aria-hidden
              className="absolute -left-[38px] top-2 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-zinc-950 sm:-left-[46px]"
            />
            <div className="flex flex-wrap items-baseline gap-x-3">
              <h3 className="text-lg font-semibold text-zinc-100">{job.role}</h3>
              <span className="font-medium text-emerald-400">@ {job.company}</span>
            </div>
            <p className="mt-1.5 font-mono text-xs uppercase tracking-wider text-zinc-500">
              {job.period} · {job.location}
            </p>
            <p className="mt-3 max-w-3xl leading-relaxed text-zinc-400">{job.summary}</p>
            {job.tags && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {job.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 font-mono text-xs text-zinc-400"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
