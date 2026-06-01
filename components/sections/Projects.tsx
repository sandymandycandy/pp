import { projects } from "@/lib/data";
import SectionHeading from "../SectionHeading";
import Reveal from "../Reveal";
import TiltCard from "../TiltCard";
import Secret from "../Secret";

export default function Projects() {
  return (
    <section id="projects" className="relative mx-auto max-w-[1180px] px-5 py-[clamp(80px,12vh,140px)] sm:px-10">
      <SectionHeading index="03" title="Missions" label="Deployments / Log" />

      <div className="flex flex-col gap-[70px]">
        {projects.map((p, i) => {
          const reverse = i % 2 === 1;
          return (
            <Reveal key={p.n}>
              <article className="grid items-center gap-10 md:grid-cols-2">
                <div className={reverse ? "md:order-2" : ""}>
                  <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-accent2">{p.tag}</span>
                  <h3 className="my-3 text-[clamp(1.7rem,3.6vw,2.6rem)] font-bold tracking-tight">{p.title}</h3>
                  <p className="mb-5 max-w-[440px] text-muted">{p.blurb}</p>
                  <ul className="mb-6 flex flex-wrap gap-x-3 gap-y-1.5 font-mono text-[0.7rem] text-accent2">
                    {p.chips.map((c) => (
                      <li key={c} className="before:mr-1.5 before:text-accent before:content-['+']">{c}</li>
                    ))}
                  </ul>
                  <div className="flex gap-6 font-mono text-[0.78rem] uppercase tracking-wider">
                    <a href={p.live} className="group inline-flex items-center gap-1.5 text-ink transition-colors hover:text-accent">
                      Live <span className="text-accent transition-transform group-hover:translate-x-0.5">↗</span>
                    </a>
                    <a href={p.code} className="group inline-flex items-center gap-1.5 text-ink transition-colors hover:text-accent">
                      Code <span className="text-accent transition-transform group-hover:translate-x-0.5">↗</span>
                    </a>
                  </div>
                </div>

                <div className={reverse ? "md:order-1" : ""} style={{ perspective: "1000px" }}>
                  <TiltCard max={5} className="group relative flex aspect-[16/10] overflow-hidden rounded-md border border-accent/20 bg-panel/30 shadow-[0_0_40px_rgba(255,90,31,0.05)] backdrop-blur-xl transition-all hover:border-accent/40">
                    {/* Browser top bar */}
                    <div className="absolute inset-x-0 top-0 z-10 flex h-7 items-center gap-1.5 border-b border-line bg-bg/80 px-3 backdrop-blur-md">
                      <span className="h-2 w-2 rounded-full bg-[#ff5f56]" />
                      <span className="h-2 w-2 rounded-full bg-[#ffbd2e]" />
                      <span className="h-2 w-2 rounded-full bg-[#27c93f]" />
                      <span className="ml-2 font-mono text-[0.55rem] uppercase tracking-wider text-muted/60">
                        {p.title}
                      </span>
                    </div>

                    {/* Image / Content container */}
                    <div className="relative mt-7 h-full w-full overflow-hidden">
                      {/* Subtle bottom fade */}
                      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-bg via-transparent to-transparent opacity-40 transition-opacity group-hover:opacity-10" />
                      
                      {/* Image */}
                      {p.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={p.image}
                          alt={p.title}
                          className="h-full w-full object-cover object-top opacity-85 transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-100"
                        />
                      ) : (
                        <div className="absolute inset-0" style={{ background: p.gradient }}>
                          <span className="absolute left-5 top-4 font-mono text-[0.62rem] tracking-[0.2em] text-muted">MSN-{p.n}</span>
                          <span className="absolute inset-0 flex items-center justify-center font-display text-[5rem] font-extrabold text-accent/25">{p.n}</span>
                        </div>
                      )}
                    </div>
                  </TiltCard>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>

      <Secret id={3} style={{ top: "46%", left: "2%" }} />
    </section>
  );
}
