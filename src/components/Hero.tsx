import { ArrowDown } from "lucide-react";
import { FaEnvelope, FaGithub, FaLinkedin } from "react-icons/fa";
import { profile, socials } from "@/data/portfolio";

const iconMap = {
  github: FaGithub,
  linkedin: FaLinkedin,
  mail: FaEnvelope,
};

export default function Hero() {
  return (
    <section
      id="home"
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
    >
      <p className="mb-4 font-mono text-sm text-emerald-400">
        Hi, my name is
      </p>
      <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
        {profile.name}
      </h1>
      <h2 className="mt-3 text-3xl font-semibold text-zinc-400 sm:text-5xl">
        I&apos;m a {profile.role}.
      </h2>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
        {profile.tagline}
      </p>

      <div className="mt-10 flex items-center gap-4">
        <a
          href="#projects"
          className="rounded-md bg-emerald-500 px-6 py-3 font-medium text-zinc-950 transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/25"
        >
          View My Work
        </a>
        <a
          href="#contact"
          className="rounded-md border border-zinc-700 px-6 py-3 font-medium text-zinc-200 transition-all hover:border-emerald-400 hover:text-emerald-400"
        >
          Get In Touch
        </a>
      </div>

      <div className="mt-12 flex items-center gap-6">
        {socials.map((social) => {
          const Icon = iconMap[social.icon];
          return (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.name}
              className="text-2xl text-zinc-400 transition-colors hover:text-emerald-400"
            >
              {Icon ? <Icon /> : social.name}
            </a>
          );
        })}
      </div>

      <a
        href="#about"
        aria-label="Scroll to about section"
        className="absolute bottom-8 text-zinc-500 transition-colors hover:text-emerald-400"
      >
        <ArrowDown size={28} className="animate-bounce" />
      </a>
    </section>
  );
}
