import { skills } from "@/lib/data";
import { Icons } from "../icons";
import SectionHeading from "../SectionHeading";
import Reveal from "../Reveal";
import TiltCard from "../TiltCard";
import Secret from "../Secret";

export default function Skills() {
  return (
    <section id="skills" className="relative mx-auto max-w-[1180px] px-5 py-[clamp(80px,12vh,140px)] sm:px-10">
      <SectionHeading index="02" title="The Arsenal" label="SYSTEMS / CAPABILITY" />

      <div className="grid gap-px overflow-hidden rounded border border-line bg-line [perspective:1200px] sm:grid-cols-2 lg:grid-cols-4">
        {skills.map((s, i) => {
          const Icon = Icons[s.icon];
          return (
            <Reveal key={s.title} delay={i * 0.08} className="h-full">
              <TiltCard max={6} className="group relative flex h-full flex-col bg-bg p-7 transition-colors hover:bg-bg-soft">
                <div className="mb-6 flex items-center justify-between">
                  <Icon className="h-8 w-8 text-accent" />
                  <span className="font-mono text-[0.62rem] tracking-[0.18em] text-muted">{s.code}</span>
                </div>
                <h3 className="mb-2.5 text-[1.2rem] font-semibold tracking-tight">{s.title}</h3>
                <p className="mb-5 text-[0.9rem] leading-relaxed text-muted">{s.blurb}</p>
                <ul className="mt-auto flex flex-wrap gap-x-3 gap-y-1.5 font-mono text-[0.68rem] text-accent2">
                  {s.chips.map((c) => (
                    <li key={c} className="before:mr-1.5 before:text-accent before:content-['+']">{c}</li>
                  ))}
                </ul>
              </TiltCard>
            </Reveal>
          );
        })}
      </div>

      <Secret id={2} style={{ top: "18%", right: "4%" }} />
    </section>
  );
}
