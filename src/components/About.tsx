import { MapPin } from "lucide-react";
import SectionHeading from "./SectionHeading";
import { about, profile } from "@/data/portfolio";

export default function About() {
  return (
    <section id="about" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-24">
      <SectionHeading index="01" title="About Me" />

      <div className="grid gap-12 md:grid-cols-[3fr_2fr]">
        <div className="space-y-5 text-lg leading-relaxed text-zinc-400">
          {about.paragraphs.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
          <p className="flex items-center gap-2 font-mono text-sm text-emerald-400">
            <MapPin size={16} /> {profile.location}
          </p>
        </div>

        <div className="flex flex-col justify-start gap-3 md:items-end">
          <a
            href={profile.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-emerald-500/50 px-6 py-3 font-medium text-emerald-400 transition-all hover:bg-emerald-500/10"
          >
            Download Resume
          </a>
        </div>
      </div>
    </section>
  );
}
