import { Mail } from "lucide-react";
import { FaEnvelope, FaGithub, FaLinkedin } from "react-icons/fa";
import SectionHeading from "./SectionHeading";
import { profile, socials } from "@/data/portfolio";

const iconMap = {
  github: FaGithub,
  linkedin: FaLinkedin,
  mail: FaEnvelope,
};

export default function Contact() {
  return (
    <section id="contact" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-24">
      <SectionHeading index="05" title="Get In Touch" />

      <div className="flex flex-col items-center gap-8 text-center">
        <p className="max-w-xl text-lg leading-relaxed text-zinc-400">
          I&apos;m currently open to new opportunities and always happy to chat.
          Whether you have a question or just want to say hi, my inbox is always
          open!
        </p>

        <a
          href={`mailto:${profile.email}`}
          className="flex items-center gap-3 rounded-md bg-emerald-500 px-8 py-4 text-lg font-medium text-zinc-950 transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/25"
        >
          <Mail size={20} />
          {profile.email}
        </a>

        <div className="flex items-center gap-6">
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
      </div>
    </section>
  );
}
