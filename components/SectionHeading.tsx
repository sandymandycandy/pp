import Reveal from "./Reveal";

export default function SectionHeading({
  index,
  title,
  label,
}: {
  index: string;
  title: string;
  label?: string;
}) {
  return (
    <Reveal className="mb-12">
      <div className="mb-4 flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted">
        <span className="text-accent">[{index}]</span>
        {label && <span>{label}</span>}
        <span className="h-px flex-1 bg-line" />
      </div>
      <h2 className="text-[clamp(2.2rem,6vw,3.6rem)] font-extrabold tracking-[-0.03em]">{title}</h2>
    </Reveal>
  );
}
