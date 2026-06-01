import Reveal from "../Reveal";
import SectionHeading from "../SectionHeading";
import Secret from "../Secret";
import { Icons } from "../icons";

const tags = ["Problem Solver", "Performance Obsessed", "Open Source", "UI Craftsman"];
const Helmet = Icons.helmet;

export default function About() {
  return (
    <section id="about" className="relative mx-auto max-w-[1180px] px-5 py-[clamp(80px,12vh,140px)] sm:px-10">
      <SectionHeading index="01" title="The Pilot" label="Personnel / File" />

      <div className="grid items-start gap-12 md:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <p className="mb-5 text-[1.35rem] leading-snug">
            I&apos;m a full-stack engineer who treats every project like a space mission —
            meticulous planning, robust systems, and a flawless launch.
          </p>
          <p className="mb-4 text-muted">
            From crafting precise interfaces with React and Next.js to engineering resilient
            APIs and databases, I build products that scale across galaxies of users. I care about
            the details no one sees: accessibility, performance budgets, and code future-me will thank me for.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t} className="font-mono text-[0.7rem] uppercase tracking-wider text-accent2 before:mr-1.5 before:text-accent before:content-['//']">
                {t}
              </span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <aside className="ticks overflow-hidden rounded border border-line bg-panel">
            <div className="profile-photo">
              <Helmet className="h-24 w-24 animate-float text-accent" />
              <div className="profile-scan" />
            </div>
            <div className="border-t border-line px-6 py-6">
              <div className="mb-4 flex items-baseline justify-between">
                <h3 className="text-[1.7rem] font-bold tracking-tight">SANDEEP</h3>
                <span className="font-mono text-[0.62rem] tracking-[0.16em] text-accent">CMDR-07</span>
              </div>
              <p className="mb-5 text-[0.9rem] text-muted">
                Mission lead. Ships front-to-back and keeps the system online when everything else is on fire.
              </p>
              <ul className="flex flex-col gap-0 font-mono text-[0.74rem]">
                <li className="flex justify-between border-t border-line py-2"><span className="text-muted">SPECIALTY</span><span>WEB PLATFORM</span></li>
                <li className="flex justify-between border-t border-line py-2"><span className="text-muted">STATUS</span><span className="text-accent3">● ONLINE</span></li>
                <li className="flex justify-between border-t border-line py-2"><span className="text-muted">BASE</span><span>EARTH · SECTOR 7</span></li>
              </ul>
            </div>
          </aside>
        </Reveal>
      </div>

      <Secret id={1} style={{ bottom: "8%", left: "4%" }} />
    </section>
  );
}
