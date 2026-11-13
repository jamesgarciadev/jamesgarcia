import SectionHeading from "./SectionHeading";
import { skills } from "@/data/portfolio";

export default function Skills() {
  return (
    <section id="skills" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-24">
      <SectionHeading index="03" title="Skills" />

      <div className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
        {skills.map((skill) => (
          <div key={skill.name}>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-zinc-200">{skill.name}</span>
              <span className="font-mono text-sm text-zinc-500">
                {skill.level}%
              </span>
            </div>
            <div
              role="meter"
              aria-valuenow={skill.level}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${skill.name} proficiency`}
              className="h-2 overflow-hidden rounded-full bg-zinc-800"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                style={{ width: `${skill.level}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
