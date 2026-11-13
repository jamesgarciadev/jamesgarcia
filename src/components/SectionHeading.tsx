interface SectionHeadingProps {
  index: string;
  title: string;
}

export default function SectionHeading({ index, title }: SectionHeadingProps) {
  return (
    <div className="mb-12 flex items-center gap-4">
      <span className="font-mono text-lg text-emerald-400">{index}.</span>
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      <div className="ml-4 h-px flex-1 bg-zinc-800" />
    </div>
  );
}
