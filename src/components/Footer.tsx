import { Heart } from "lucide-react";
import { profile } from "@/data/portfolio";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 text-sm text-zinc-500 sm:flex-row sm:justify-between">
        <p>
          © {new Date().getFullYear()} {profile.name}. All rights reserved.
        </p>
        <p className="flex items-center gap-1 font-mono">
          Built with <Heart size={14} className="fill-emerald-500 text-emerald-500" /> using Next.js &amp; Tailwind CSS
        </p>
      </div>
    </footer>
  );
}
